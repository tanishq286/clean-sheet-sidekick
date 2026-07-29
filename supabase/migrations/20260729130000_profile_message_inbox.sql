-- A real inbox for the contact form.
--
-- Until now the form's only production path was a mailto: fallback: it opened
-- the *visitor's* mail client and hoped they pressed send. That loses every
-- enquiry from someone browsing on a device with no mail client configured,
-- and the founder has no record of anything that was attempted.
--
-- Messages now land in Postgres and show up on the dashboard.

create table public.profile_messages (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  sender_name  text not null,
  sender_email text not null,
  intent       text,
  budget       integer,
  timeline     text,
  body         text not null,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);

create index profile_messages_inbox_idx on public.profile_messages (profile_id, created_at desc);
create index profile_messages_unread_idx on public.profile_messages (profile_id) where read_at is null;

alter table public.profile_messages enable row level security;

-- Read/manage your own inbox, and nobody else's. There is deliberately no
-- INSERT policy: the only way a row is created is the SECURITY DEFINER
-- function below, which validates and throttles first. Without that, an anon
-- INSERT policy would be an open spam funnel into someone's inbox.
create policy "Owners read their own messages"
  on public.profile_messages for select to authenticated
  using (profile_id = auth.uid());

create policy "Owners update their own messages"
  on public.profile_messages for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Owners delete their own messages"
  on public.profile_messages for delete to authenticated
  using (profile_id = auth.uid());

-- Admins can see inboxes for support and abuse handling. Consistent with the
-- other admin policies; every one of them re-checks the role server-side.
create policy "Admins manage messages"
  on public.profile_messages for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant select, update, delete on public.profile_messages to authenticated;

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

-- The single entry point for a visitor sending a message.
--
-- SECURITY DEFINER so it can insert into a table with no INSERT policy, which
-- keeps every write funnelled through the validation and rate limits here.
-- Takes a slug rather than a profile id: the caller is an anonymous visitor
-- who only knows the public URL, and resolving it here means an unpublished
-- or archived profile silently accepts nothing.
create or replace function public.send_profile_message(
  _slug text,
  _name text,
  _email text,
  _body text,
  _intent text default null,
  _budget integer default null,
  _timeline text default null
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _profile_id uuid;
  _recent int;
begin
  select p.id into _profile_id
  from public.profiles p
  left join public.profile_flags f on f.profile_id = p.id
  where p.slug = _slug
    and p.is_published = true
    and f.archived_at is null;

  if _profile_id is null then
    raise exception 'This profile is not accepting messages.';
  end if;

  if length(coalesce(btrim(_name), '')) = 0 then
    raise exception 'Please add your name.';
  end if;
  if coalesce(_email, '') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Please use a valid email address.';
  end if;
  if length(coalesce(btrim(_body), '')) < 10 then
    raise exception 'Please write a little more.';
  end if;
  if length(_body) > 5000 then
    raise exception 'That message is too long.';
  end if;

  -- Two throttles rather than one. The per-profile cap stops a flood filling
  -- someone's inbox; the per-sender cap stops one person monopolising that
  -- allowance and locking everyone else out for the hour.
  select count(*) into _recent
  from public.profile_messages
  where profile_id = _profile_id and created_at > now() - interval '1 hour';
  if _recent >= 20 then
    raise exception 'This profile has received a lot of messages just now. Please try again later.';
  end if;

  select count(*) into _recent
  from public.profile_messages
  where profile_id = _profile_id
    and sender_email = lower(btrim(_email))
    and created_at > now() - interval '1 hour';
  if _recent >= 3 then
    raise exception 'You have already sent a few messages. Please try again later.';
  end if;

  insert into public.profile_messages
    (profile_id, sender_name, sender_email, intent, budget, timeline, body)
  values
    (_profile_id, btrim(_name), lower(btrim(_email)),
     nullif(btrim(coalesce(_intent, '')), ''), _budget,
     nullif(btrim(coalesce(_timeline, '')), ''), btrim(_body));
end;
$$;

-- Unread count for the dashboard badge. A function rather than a client-side
-- count so it stays one cheap round trip.
create or replace function public.my_unread_message_count()
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select count(*)::int
  from public.profile_messages
  where profile_id = auth.uid() and read_at is null;
$$;

revoke execute on function public.my_unread_message_count() from anon;
