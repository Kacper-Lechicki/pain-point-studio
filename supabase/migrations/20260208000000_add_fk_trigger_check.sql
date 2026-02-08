-- ============================================================
-- 1. FK: profiles.role → roles.value
-- Ensures every profile role is a valid entry in the roles table.
-- Empty string '' is allowed for new users (inserted as inactive row).
-- ============================================================

-- Insert '' as inactive row so FK accepts empty role
INSERT INTO public.roles (value, label_key, sort_order, is_active)
  VALUES ('', '', 0, false)
  ON CONFLICT (value) DO NOTHING;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_fk
  FOREIGN KEY (role) REFERENCES public.roles(value)
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- ============================================================
-- 2. Trigger: auto-set updated_at on profiles UPDATE
-- Removes the need to manually set updated_at in application code.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. CHECK: social_links must be a JSON array
-- Prevents storing non-array JSONB values in the column.
-- ============================================================

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_social_links_is_array
  CHECK (jsonb_typeof(social_links) = 'array');
