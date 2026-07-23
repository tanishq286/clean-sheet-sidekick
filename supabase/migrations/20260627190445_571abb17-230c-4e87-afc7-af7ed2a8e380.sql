-- Add unique constraint so auto-joins are idempotent
ALTER TABLE public.college_members
ADD CONSTRAINT college_members_user_college_unique UNIQUE (college_id, user_id);

-- Auto-join verified users to colleges by matching email domain
CREATE OR REPLACE FUNCTION public.auto_join_college_by_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.college_members (college_id, user_id, role)
  SELECT c.id, NEW.id, 'student'
  FROM public.colleges c
  WHERE lower(c.domain) = lower(split_part(NEW.email, '@', 2))
  ON CONFLICT (college_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger for users created with an already-verified email
CREATE TRIGGER on_auth_user_created_auto_join_college
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_join_college_by_email();

-- Trigger for users who verify their email later
CREATE TRIGGER on_auth_user_confirmed_auto_join_college
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.auto_join_college_by_email();