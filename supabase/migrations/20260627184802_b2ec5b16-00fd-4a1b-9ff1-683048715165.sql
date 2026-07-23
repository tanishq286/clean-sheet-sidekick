GRANT SELECT ON public.skills TO anon;
GRANT SELECT ON public.journey_milestones TO anon;
GRANT SELECT ON public.portfolio_items TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;

GRANT ALL ON public.skills TO service_role;
GRANT ALL ON public.journey_milestones TO service_role;
GRANT ALL ON public.portfolio_items TO service_role;