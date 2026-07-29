-- Admin moderation flags: featured, verified, archived.
--
-- These live in a side table rather than as columns on `profiles`, and that is
-- not stylistic. `get_public_profile_by_slug` and `list_public_profiles` are
-- both declared RETURNS SETOF profiles with an explicit 12-column SELECT, so
-- adding a 13th column to `profiles` makes them fail at call time with
-- "return type mismatch ... returns too few columns" — verified by trying it
-- inside a rolled-back transaction. That would break the public profile page,
-- Discover, /llms.txt and the edge SEO prerender simultaneously.
--
-- A 1:1 side table keeps that hot path untouched: no existing function
-- signature, policy, or column changes.

create table public.profile_flags (
  profile_id  uuid primary key references public.profiles(id) on delete cascade,
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  -- Soft delete. NULL = active. Deliberately a timestamp, not a boolean:
  -- "when was this archived" is the question you actually ask later.
  archived_at timestamptz,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

alter table public.profile_flags enable row level security;

-- Featured and verified are public badges — they exist to be seen. Archived
-- rows are excluded from the public reads below, so nothing sensitive leaks.
create policy "Anyone reads profile flags"
  on public.profile_flags for select to anon, authenticated
  using (true);

-- Only platform admins set them. No self-service: a founder must not be able
-- to award themselves a verification badge.
create policy "Admins manage profile flags"
  on public.profile_flags for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant select on public.profile_flags to anon, authenticated;
grant insert, update, delete on public.profile_flags to authenticated;

create index profile_flags_featured_idx on public.profile_flags (is_featured) where is_featured;
create index profile_flags_archived_idx on public.profile_flags (archived_at) where archived_at is not null;

/* ------------------------------------------------------------------ */
/* Public reads must hide archived profiles.                           */
/* Body-only changes — the signatures and column lists are identical,  */
/* so nothing that calls these needs to change.                        */
/* ------------------------------------------------------------------ */

create or replace function public.get_public_profile_by_slug(_slug text)
returns setof profiles
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.slug, p.is_published, p.template_id, p.theme, p.identity, p.founder, p.vision,
    CASE
      WHEN auth.uid() IS NULL THEN (p.contact - 'email' - 'phone')
      ELSE p.contact
    END AS contact,
    p.looking_for, p.created_at, p.updated_at
  FROM public.profiles p
  LEFT JOIN public.profile_flags f ON f.profile_id = p.id
  WHERE p.slug = _slug
    AND p.is_published = true
    AND f.archived_at IS NULL
  LIMIT 1;
END;
$function$;

create or replace function public.list_public_profiles()
returns setof profiles
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    p.id, p.slug, p.is_published, p.template_id, p.theme, p.identity,
    p.founder, p.vision,
    (p.contact - 'email' - 'phone') as contact,
    p.looking_for, p.created_at, p.updated_at
  from public.profiles p
  left join public.profile_flags f on f.profile_id = p.id
  where p.is_published = true
    and f.archived_at is null
  -- Featured first, so the directory has an editorial front page.
  order by coalesce(f.is_featured, false) desc, p.updated_at desc;
$$;

/* ------------------------------------------------------------------ */
/* Admin surface                                                       */
/* ------------------------------------------------------------------ */

-- Replaces the 10-column version with the same columns plus the three flags.
-- Callers select by name, so the additions are backwards-compatible.
drop function if exists public.admin_list_profiles();
create function public.admin_list_profiles()
returns table (
  id uuid, slug text, name text, email text, is_published boolean,
  template_id text, views bigint, is_admin boolean,
  is_featured boolean, is_verified boolean, archived_at timestamptz,
  created_at timestamptz, updated_at timestamptz
) language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin role required';
  end if;
  return query select
    p.id, p.slug,
    coalesce(nullif(p.identity->>'name', ''), '—') as name,
    u.email::text, p.is_published, p.template_id,
    (select count(*) from public.profile_views v where v.profile_id = p.id)::bigint,
    public.has_role(p.id, 'admin'),
    coalesce(f.is_featured, false), coalesce(f.is_verified, false), f.archived_at,
    u.created_at, p.updated_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.profile_flags f on f.profile_id = p.id
  order by p.updated_at desc;
end;
$$;

-- One entry point for both badges. `_flag` is validated against a fixed list
-- rather than interpolated, so this can't become a column-injection vector.
create or replace function public.admin_set_profile_flag(
  _profile_id uuid, _flag text, _value boolean
) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin role required';
  end if;
  if _flag not in ('is_featured', 'is_verified') then
    raise exception 'unknown flag %', _flag;
  end if;

  insert into public.profile_flags (profile_id, is_featured, is_verified, updated_by)
  values (
    _profile_id,
    case when _flag = 'is_featured' then _value else false end,
    case when _flag = 'is_verified' then _value else false end,
    auth.uid()
  )
  on conflict (profile_id) do update set
    is_featured = case when _flag = 'is_featured' then _value else public.profile_flags.is_featured end,
    is_verified = case when _flag = 'is_verified' then _value else public.profile_flags.is_verified end,
    updated_at  = now(),
    updated_by  = auth.uid();
end;
$$;

-- Archive is the safe alternative to deletion: the row, its skills,
-- milestones and portfolio all stay intact and it is one call to undo.
-- Nothing here cascades, and no auth.users row is touched.
create or replace function public.admin_set_archived(
  _profile_id uuid, _archived boolean
) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin role required';
  end if;
  -- Archiving your own account would hide the profile of the person holding
  -- the admin role, which is confusing rather than dangerous — but there is
  -- no legitimate reason to do it from this screen.
  if _profile_id = auth.uid() then
    raise exception 'refusing to archive your own profile';
  end if;

  insert into public.profile_flags (profile_id, archived_at, updated_by)
  values (_profile_id, case when _archived then now() else null end, auth.uid())
  on conflict (profile_id) do update set
    archived_at = case when _archived then now() else null end,
    updated_at  = now(),
    updated_by  = auth.uid();

  -- An archived profile must not stay publicly readable. Unpublishing is the
  -- existing, reversible mechanism for that, so reuse it rather than invent a
  -- second notion of "hidden".
  if _archived then
    update public.profiles set is_published = false, updated_at = now()
    where id = _profile_id;
  end if;
end;
$$;

-- Overview gains the moderation counts the dashboard now shows.
drop function if exists public.admin_overview();
create function public.admin_overview()
returns table (
  total_users bigint, total_profiles bigint, published_profiles bigint,
  draft_profiles bigint, total_views bigint, views_7d bigint,
  total_colleges bigint, signups_7d bigint,
  featured_profiles bigint, verified_profiles bigint, archived_profiles bigint
) language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin role required';
  end if;
  return query select
    (select count(*) from auth.users)::bigint,
    (select count(*) from public.profiles)::bigint,
    (select count(*) from public.profiles where is_published)::bigint,
    (select count(*) from public.profiles where not is_published)::bigint,
    (select count(*) from public.profile_views)::bigint,
    (select count(*) from public.profile_views where viewed_at > now() - interval '7 days')::bigint,
    (select count(*) from public.colleges)::bigint,
    (select count(*) from auth.users where created_at > now() - interval '7 days')::bigint,
    (select count(*) from public.profile_flags where is_featured)::bigint,
    (select count(*) from public.profile_flags where is_verified)::bigint,
    (select count(*) from public.profile_flags where archived_at is not null)::bigint;
end;
$$;

revoke execute on function public.admin_overview() from anon;
revoke execute on function public.admin_list_profiles() from anon;
revoke execute on function public.admin_set_profile_flag(uuid, text, boolean) from anon;
revoke execute on function public.admin_set_archived(uuid, boolean) from anon;
