-- Granting admin today required the account to already exist: user_roles is
-- keyed on auth.users.id, and there is no id until someone signs up. That
-- forced a manual follow-up step that is easy to forget.
--
-- This lets access be granted in advance of the sign-up. The allowlist is a
-- plain table with RLS enabled and no policies, so it is reachable only by
-- SECURITY DEFINER functions (which bypass RLS) — not by anon, authenticated,
-- or even an existing admin through PostgREST. Changing it is a migration, on
-- purpose: who can become admin belongs in reviewed code, not in a runtime
-- table an admin screen could write to.
create table public.admin_email_allowlist (
  email text primary key,
  added_at timestamptz not null default now()
);
alter table public.admin_email_allowlist enable row level security;

insert into public.admin_email_allowlist (email) values
  ('founderid.help@gmail.com'),
  ('samuelrieds@gmail.com')
on conflict do nothing;

-- A second AFTER INSERT trigger on auth.users, kept separate from
-- handle_new_user (which creates the profile row) rather than added to it —
-- one trigger failing must not block the other, and this one is easy to
-- audit in isolation: it does exactly one thing.
--
-- The email match is safe to trust at this point: Supabase only fires this
-- trigger once the row lands in auth.users, and both sign-up paths this app
-- offers (password with email confirmation, Google OAuth) already prove
-- ownership of that address before the row is created.
create or replace function public.auto_grant_admin_by_email()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from public.admin_email_allowlist where email = new.email) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_grant_admin
  after insert on auth.users
  for each row execute function public.auto_grant_admin_by_email();

revoke execute on function public.auto_grant_admin_by_email() from public, anon, authenticated;
