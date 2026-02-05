-- Initial schema for Pain Point Studio
-- This migration matches the generated types in src/lib/supabase/types.ts

-- ============================================================
-- TABLE: instruments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.instruments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (adjust as needed)
CREATE POLICY "Allow anonymous read access"
  ON public.instruments
  FOR SELECT
  USING (true);
