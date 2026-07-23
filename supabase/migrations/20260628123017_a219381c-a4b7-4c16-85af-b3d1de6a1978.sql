REVOKE EXECUTE ON FUNCTION public.auto_join_college_by_email() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.find_user_by_email(text) FROM anon;