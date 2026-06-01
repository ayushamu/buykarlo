-- Upgrade Profiles table for Frictionless Auth and Trust Score Verifications

-- 1. Alter default trust_score to 50
ALTER TABLE public.profiles ALTER COLUMN trust_score SET DEFAULT 50;

-- 2. Update existing profiles that have a trust score of 0 or NULL to 50
UPDATE public.profiles SET trust_score = 50 WHERE trust_score IS NULL OR trust_score = 0;

-- 3. Add institutional_email and institutional_verified columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institutional_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institutional_verified BOOLEAN DEFAULT false;

-- 4. Add unique constraint to institutional_email (nullable unique)
ALTER TABLE public.profiles ADD CONSTRAINT unique_institutional_email UNIQUE (institutional_email);
