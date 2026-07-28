-- get_public_profile_by_slug already withholds contact.email from anonymous
-- callers. A personal phone number is at least as sensitive, and the profile
-- page now emits it as schema.org `telephone` in JSON-LD on a page we
-- deliberately advertise to AI crawlers — so it would be scraped far more
-- readily than an ordinary web page.
--
-- Exposure is irreversible; hiding is one line to undo. Apply the same rule.
create or replace function public.get_public_profile_by_slug(_slug text)
returns setof profiles
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.slug, p.is_published, p.template_id, p.theme, p.identity, p.founder, p.vision,
    CASE
      WHEN auth.uid() IS NULL THEN (p.contact - 'email' - 'phone')
      ELSE p.contact
    END AS contact,
    p.looking_for, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.slug = _slug AND p.is_published = true
  LIMIT 1;
END;
$function$;

-- Same for the static llms.txt generator's source.
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
    (p.contact - 'email' - 'phone') as contact,
    p.looking_for, p.created_at, p.updated_at
  from public.profiles p
  where p.is_published = true
  order by p.updated_at desc;
$$;
