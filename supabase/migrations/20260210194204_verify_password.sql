-- Verifies the current user's password without creating a new session.
-- Returns TRUE if the supplied plain-text password matches the stored hash.
CREATE OR REPLACE FUNCTION public.verify_password(current_plain_password text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  STABLE
  SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND encrypted_password IS NOT NULL
      AND encrypted_password <> ''
      AND encrypted_password = crypt(current_plain_password, encrypted_password)
  );
END;
$$;

ALTER FUNCTION public.verify_password(text) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.verify_password(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_password(text) TO service_role;
