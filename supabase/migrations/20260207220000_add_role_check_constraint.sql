-- Enforce allowed role values at the database level.
-- Empty string is allowed for users who haven't selected a role yet.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('', 'solo-developer', 'product-manager', 'designer', 'founder', 'student', 'other'));
