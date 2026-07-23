CREATE OR REPLACE FUNCTION public.is_verified_student(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.college_members WHERE user_id = _uid)
$$;
REVOKE EXECUTE ON FUNCTION public.is_verified_student(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_verified_student(uuid) TO authenticated;