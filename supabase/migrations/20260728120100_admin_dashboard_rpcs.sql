-- Admin screens need to join profiles against auth.users, which is not
-- reachable from the client. These SECURITY DEFINER functions expose exactly
-- the columns the dashboard renders and nothing else, and each re-checks the
-- caller's role rather than trusting the UI to have hidden the page.

create or replace function public.admin_overview()
returns table (
  total_users bigint, total_profiles bigint, published_profiles bigint,
  draft_profiles bigint, total_views bigint, views_7d bigint,
  total_colleges bigint, signups_7d bigint
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
    (select count(*) from auth.users where created_at > now() - interval '7 days')::bigint;
end;
$$;

create or replace function public.admin_list_profiles()
returns table (
  id uuid, slug text, name text, email text, is_published boolean,
  template_id text, views bigint, is_admin boolean,
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
    public.has_role(p.id, 'admin'), u.created_at, p.updated_at
  from public.profiles p join auth.users u on u.id = p.id
  order by p.updated_at desc;
end;
$$;

create or replace function public.admin_set_role(_user_id uuid, _role app_role, _grant boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin role required';
  end if;
  -- Removing your own admin rights locks everyone out of these screens, since
  -- only an admin can grant the role back.
  if _user_id = auth.uid() and _role = 'admin' and not _grant then
    raise exception 'refusing to remove your own admin role';
  end if;
  if _grant then
    insert into public.user_roles (user_id, role) values (_user_id, _role) on conflict do nothing;
  else
    delete from public.user_roles where user_id = _user_id and role = _role;
  end if;
end;
$$;

create or replace function public.admin_set_published(_profile_id uuid, _published boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'admin role required';
  end if;
  update public.profiles set is_published = _published, updated_at = now()
  where id = _profile_id;
end;
$$;

revoke execute on function public.admin_overview() from anon;
revoke execute on function public.admin_list_profiles() from anon;
revoke execute on function public.admin_set_role(uuid, app_role, boolean) from anon;
revoke execute on function public.admin_set_published(uuid, boolean) from anon;
