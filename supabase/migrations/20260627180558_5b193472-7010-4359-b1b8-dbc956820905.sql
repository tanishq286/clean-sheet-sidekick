
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT SELECT ON public.skills TO anon;
GRANT ALL ON public.skills TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_milestones TO authenticated;
GRANT SELECT ON public.journey_milestones TO anon;
GRANT ALL ON public.journey_milestones TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT SELECT ON public.portfolio_items TO anon;
GRANT ALL ON public.portfolio_items TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colleges TO authenticated;
GRANT SELECT ON public.colleges TO anon;
GRANT ALL ON public.colleges TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.college_members TO authenticated;
GRANT ALL ON public.college_members TO service_role;

-- Allow college_admin to see all profiles for their college roster (via has_role gate)
CREATE POLICY "College admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'college_admin') OR has_role(auth.uid(), 'admin'));
