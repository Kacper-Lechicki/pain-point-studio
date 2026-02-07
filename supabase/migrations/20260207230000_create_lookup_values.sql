-- ============================================================
-- TABLE: roles
-- Available user roles for the profile select.
-- Adding a new role = INSERT row, no code changes needed.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label_key TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles are publicly readable"
  ON public.roles FOR SELECT
  USING (true);

INSERT INTO public.roles (value, label_key, sort_order) VALUES
  ('solo-developer',  'settings.roles.soloDeveloper',  1),
  ('product-manager', 'settings.roles.productManager', 2),
  ('designer',        'settings.roles.designer',       3),
  ('founder',         'settings.roles.founder',        4),
  ('student',         'settings.roles.student',        5),
  ('other',           'settings.roles.other',          6);

-- ============================================================
-- TABLE: social_link_types
-- Available social link types for the profile social links select.
-- Adding a new type = INSERT row, no code changes needed.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_link_types (
  id SERIAL PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label_key TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.social_link_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social link types are publicly readable"
  ON public.social_link_types FOR SELECT
  USING (true);

INSERT INTO public.social_link_types (value, label_key, sort_order) VALUES
  ('website',  'settings.profile.socialLinks.labels.website',  1),
  ('github',   'settings.profile.socialLinks.labels.github',   2),
  ('twitter',  'settings.profile.socialLinks.labels.twitter',  3),
  ('linkedin', 'settings.profile.socialLinks.labels.linkedin', 4),
  ('other',    'settings.profile.socialLinks.labels.other',    5);

-- Drop the old static CHECK constraint (now validated dynamically via lookup tables)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
