-- Seed data for local development
-- Run with: pnpm supabase:reset (applies migrations + seed)

INSERT INTO public.instruments (name) VALUES
  ('Guitar'),
  ('Piano'),
  ('Drums'),
  ('Bass'),
  ('Violin')
ON CONFLICT DO NOTHING;
