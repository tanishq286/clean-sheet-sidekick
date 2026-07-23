
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE FUNCTION public.get_public_profile_by_slug(_slug text)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.slug, p.is_published, p.template_id, p.theme, p.identity, p.founder, p.vision,
    CASE
      WHEN auth.uid() IS NULL THEN (p.contact - 'email')
      ELSE p.contact
    END AS contact,
    p.looking_for, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.slug = _slug AND p.is_published = true
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) TO anon, authenticated;
