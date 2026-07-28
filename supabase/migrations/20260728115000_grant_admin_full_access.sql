-- `admin` existed in app_role but barely did anything: it could read profile
-- rows and manage colleges, yet not the skills / milestones / portfolio those
-- profiles own, and not user_roles — so an admin could not even grant a role.
--
-- These are additive PERMISSIVE policies (RLS ORs them with the existing
-- owner and public-read rules), so no current access is narrowed.
--
-- has_role() is SECURITY DEFINER and therefore bypasses RLS when it reads
-- user_roles. That matters for the user_roles policy below: without it, a
-- policy on user_roles that queries user_roles would recurse.

create policy "Admins full access on profiles"
  on public.profiles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins full access on skills"
  on public.skills for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins full access on journey"
  on public.journey_milestones for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins full access on portfolio"
  on public.portfolio_items for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins full access on college members"
  on public.college_members for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Role administration. Without this an admin cannot see who holds which role,
-- nor promote anyone — the one capability an admin most obviously needs.
create policy "Admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
