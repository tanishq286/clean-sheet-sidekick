-- Users could create an account but never remove one, so the only way out was
-- asking an operator. Deleting the auth.users row cascades to profiles (FK is
-- ON DELETE CASCADE), and from there to skills, journey_milestones,
-- portfolio_items and profile_views.
--
-- SECURITY DEFINER because auth.users is not writable by the client role. The
-- function takes no user id on purpose: it can only ever delete the caller,
-- so there is no parameter an attacker could point at someone else.
--
-- Stored files are NOT removed here. Postgres refuses direct deletes from
-- storage.objects ("Use the Storage API instead"), so the client empties the
-- user's folder first; this function is the point of no return after that.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path to 'public' as $$
declare _uid uuid := auth.uid(); _admins int;
begin
  if _uid is null then raise exception 'not signed in'; end if;

  -- Losing the last admin leaves nobody able to grant the role back, which
  -- would permanently strand the admin screens.
  if public.has_role(_uid, 'admin') then
    select count(*) into _admins from public.user_roles where role = 'admin';
    if _admins <= 1 then raise exception 'cannot delete the only admin account'; end if;
  end if;

  delete from auth.users where id = _uid;
end;
$$;

revoke execute on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
