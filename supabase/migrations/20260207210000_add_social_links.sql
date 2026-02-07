-- Add social_links JSONB column to profiles table
-- Stores an array of { label: string, url: string } objects (max 5)
ALTER TABLE public.profiles
  ADD COLUMN social_links jsonb NOT NULL DEFAULT '[]'::jsonb;
