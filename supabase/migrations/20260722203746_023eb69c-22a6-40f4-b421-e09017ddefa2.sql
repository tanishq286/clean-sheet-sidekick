
-- 1. Restrict SECURITY DEFINER function EXECUTE grants to the minimum needed
REVOKE ALL ON FUNCTION public.find_user_by_email(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_verified_student(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_join_college_by_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_profile_published(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.find_user_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_profile_published(uuid) TO anon, authenticated;

-- 2. Replace overly-permissive storage read policy with published-profile scoping
DROP POLICY IF EXISTS "Anyone reads profile assets" ON storage.objects;

CREATE POLICY "Owner reads own profile assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public reads assets of published profiles"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-assets'
  AND public.is_profile_published(((storage.foldername(name))[1])::uuid)
);

-- 3. Hide contact.email from anonymous public reads of published profiles
DROP POLICY IF EXISTS "Public can read published profiles" ON public.profiles;

-- Signed-in users can still see full published profile contact (allows reciprocal outreach)
CREATE POLICY "Authenticated read published profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_published = true);

-- Public (anon) reads go through a sanitized view that strips contact.email
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id, slug, is_published, template_id, theme, identity, founder, vision,
  (contact - 'email') AS contact,
  looking_for, created_at, updated_at
FROM public.profiles
WHERE is_published = true;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
