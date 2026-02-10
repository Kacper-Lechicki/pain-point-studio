-- Returns the pending email change info for the current user.
-- Only returns a row when a change is actually in progress.
CREATE OR REPLACE FUNCTION public.get_email_change_status()
  RETURNS TABLE(new_email text, confirm_status smallint)
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = ''
AS $$
  SELECT
    u.email_change::text AS new_email,
    u.email_change_confirm_status AS confirm_status
  FROM auth.users u
  WHERE u.id = auth.uid()
    AND u.email_change IS NOT NULL
    AND u.email_change <> '';
$$;

ALTER FUNCTION public.get_email_change_status() OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.get_email_change_status() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_email_change_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_change_status() TO service_role;
