-- The static llms.txt build step fetched published profiles over PostgREST with
-- the anon key. `profiles` has no anon SELECT policy (only {authenticated}
-- ones), so RLS silently returned zero rows and no per-profile llms files were
-- ever generated.
--
-- Mirror the existing get_public_profile_by_slug pattern instead: a
-- SECURITY DEFINER function that anon may call, exposing only published rows.
-- The contact email is always stripped here — this output is written to static
-- files we hand directly to AI crawlers, so it must never carry an address that
-- the public profile page itself withholds from anonymous visitors.
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
    (p.contact - 'email') as contact,
    p.looking_for, p.created_at, p.updated_at
  from public.profiles p
  where p.is_published = true
  order by p.updated_at desc;
$$;

comment on function public.list_public_profiles() is
  'Published profiles with the contact email removed. Used by the build-time llms.txt generator; safe for anon.';

grant execute on function public.list_public_profiles() to anon, authenticated;
