-- ============================================================
-- Prevent clearing full_name or role once they have been set.
-- The handle_new_user trigger inserts profiles with empty values,
-- which is fine — the complete-profile modal forces the user to
-- fill them in. This trigger only blocks UPDATE that would revert
-- a non-empty value back to empty.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_clearing_required_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.full_name <> '' AND NEW.full_name = '' THEN
    RAISE EXCEPTION 'full_name cannot be cleared once set';
  END IF;

  IF OLD.role <> '' AND NEW.role = '' THEN
    RAISE EXCEPTION 'role cannot be cleared once set';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_prevent_clearing_required
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_clearing_required_fields();
