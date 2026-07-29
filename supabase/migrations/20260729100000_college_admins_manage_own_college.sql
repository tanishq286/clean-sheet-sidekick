-- The college page grants its controls to `college_admin` (isCollegeAdmin =
-- admin OR college_admin), but `colleges` only ever had "Admins manage
-- colleges". A college admin therefore saw working-looking Edit and Delete
-- buttons whose writes RLS silently discarded — 0 rows, no error, because a
-- failing USING clause filters rows instead of raising.
--
-- The UI half of that is fixed separately (it now checks rows-affected and
-- says so). This closes the other half: give college admins real authority,
-- but only over the college they created, never over someone else's.
--
-- Deliberately NOT granting blanket write on `colleges` to college_admin:
-- that would let any college admin rename or delete every other institution
-- in the directory. Ownership is the natural boundary and `created_by`
-- already records it.
--
-- Additive PERMISSIVE policies — RLS ORs these with the existing admin and
-- public-read rules, so no current access is narrowed and platform admins
-- keep full reach.

create policy "College admins update their own college"
  on public.colleges for update to authenticated
  using (
    created_by = auth.uid()
    and public.has_role(auth.uid(), 'college_admin')
  )
  with check (
    created_by = auth.uid()
    and public.has_role(auth.uid(), 'college_admin')
  );

create policy "College admins delete their own college"
  on public.colleges for delete to authenticated
  using (
    created_by = auth.uid()
    and public.has_role(auth.uid(), 'college_admin')
  );

-- Creating one is what makes you its owner. WITH CHECK pins created_by to the
-- caller so a college admin cannot insert a row attributed to someone else.
create policy "College admins create colleges they own"
  on public.colleges for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.has_role(auth.uid(), 'college_admin')
  );
