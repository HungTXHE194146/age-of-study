-- Migration to add metadata column to profiles table for storing extra teacher data from Excel imports
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
