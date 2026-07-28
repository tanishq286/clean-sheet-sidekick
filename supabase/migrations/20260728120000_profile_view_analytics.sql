-- Nothing in the product ever reports back to a founder, so there is no reason
-- to return after publishing. View analytics is that reason.
create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  -- Opaque per-browser value from the client. Never an IP or anything that
  -- identifies a person; it exists only to collapse refreshes into one visit.
  visitor_hash text,
  referrer text
);

create index if not exists profile_views_profile_time_idx
  on public.profile_views (profile_id, viewed_at desc);

alter table public.profile_views enable row level security;

-- No direct writes: rows arrive only through record_profile_view below, so a
-- visitor cannot forge counts for an arbitrary profile.
create policy "Owners read own views"
  on public.profile_views for select to authenticated
  using (profile_id = auth.uid());

create policy "Admins read all views"
  on public.profile_views for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create or replace function public.record_profile_view(
  _slug text, _visitor text default null, _referrer text default null
) returns void language plpgsql security definer set search_path to 'public' as $$
declare _pid uuid;
begin
  select p.id into _pid from public.profiles p
  where p.slug = _slug and p.is_published = true;

  if _pid is null then return; end if;
  if auth.uid() = _pid then return; end if;   -- a founder refreshing is not an audience

  if _visitor is not null and exists (
    select 1 from public.profile_views v
    where v.profile_id = _pid and v.visitor_hash = _visitor
      and v.viewed_at > now() - interval '30 minutes'
  ) then return; end if;

  insert into public.profile_views (profile_id, visitor_hash, referrer)
  values (_pid, _visitor, left(_referrer, 500));
end;
$$;

grant execute on function public.record_profile_view(text, text, text) to anon, authenticated;

create or replace function public.my_profile_view_stats()
returns table (total bigint, last_7d bigint, last_30d bigint)
language sql stable security definer set search_path to 'public' as $$
  select count(*)::bigint,
         count(*) filter (where viewed_at > now() - interval '7 days')::bigint,
         count(*) filter (where viewed_at > now() - interval '30 days')::bigint
  from public.profile_views where profile_id = auth.uid();
$$;

grant execute on function public.my_profile_view_stats() to authenticated;
