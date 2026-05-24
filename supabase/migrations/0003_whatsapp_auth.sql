-- Alter profiles table to add phone and phone_verified
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Create index for phone number lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Update handle_new_user function to handle cases where email is not present (e.g. phone signups)
-- and automatically set phone/phone_verified if available
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, phone_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.phone || '@buykarlo.local'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.phone,
    CASE WHEN NEW.phone IS NOT NULL THEN TRUE ELSE FALSE END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
