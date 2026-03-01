-- Prevent the same user from creating two projects with the same name
-- (case-insensitive comparison).
CREATE UNIQUE INDEX projects_user_id_name_unique
  ON public.projects (user_id, lower(name));
