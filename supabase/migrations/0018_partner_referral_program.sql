-- Migration: Partner Referral Program tables and schema updates

-- 1. Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  upi_id TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  reward_per_listing NUMERIC(10,2) DEFAULT 10.00,
  total_paid NUMERIC(10,2) DEFAULT 0.00, -- Tracks accumulated payouts recorded by admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alter profiles table to add referred_by column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- 3. Enable Row Level Security (RLS) on partners
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for partners
CREATE POLICY "Admins can do everything on partners" 
  ON public.partners
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 5. Security Definer function to check referral code (accessible to onboarding/public without exposing sensitive UPI/phone fields)
CREATE OR REPLACE FUNCTION public.get_partner_by_code(code TEXT)
RETURNS TABLE (id UUID, name TEXT, referral_code TEXT, status TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.referral_code, p.status
  FROM public.partners p
  WHERE LOWER(p.referral_code) = LOWER(code) AND p.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to automatically update updated_at on partners table updates
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Database function to query aggregated partner statistics securely
DROP FUNCTION IF EXISTS public.get_partners_stats();
CREATE OR REPLACE FUNCTION public.get_partners_stats()
RETURNS TABLE (
  id UUID,
  name TEXT,
  platform TEXT,
  handle TEXT,
  email TEXT,
  phone TEXT,
  upi_id TEXT,
  referral_code TEXT,
  status TEXT,
  reward_per_listing NUMERIC,
  total_paid NUMERIC,
  created_at TIMESTAMPTZ,
  signups_count BIGINT,
  listings_count BIGINT,
  rewarded_listings_count BIGINT,
  chats_count BIGINT,
  sales_count BIGINT,
  total_earnings NUMERIC,
  pending_earnings NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH referred_profiles AS (
    SELECT p.id, p.referred_by
    FROM public.profiles p
    WHERE p.referred_by IS NOT NULL
  ),
  first_listings AS (
    SELECT DISTINCT ON (l.seller_id) l.seller_id, l.status, l.created_at
    FROM public.listings l
    ORDER BY l.seller_id, l.created_at ASC
  ),
  partner_listings_all AS (
    SELECT l.id, rp.referred_by, l.status
    FROM public.listings l
    JOIN referred_profiles rp ON l.seller_id = rp.id
  ),
  partner_listings_rewarded AS (
    SELECT rp.referred_by, fl.status
    FROM referred_profiles rp
    JOIN first_listings fl ON rp.id = fl.seller_id
    WHERE fl.status IN ('active', 'sold')
  ),
  partner_chats AS (
    SELECT c.id, rp.referred_by
    FROM public.conversations c
    JOIN referred_profiles rp ON (c.seller_id = rp.id OR c.buyer_id = rp.id)
  ),
  partner_sales AS (
    SELECT d.id, rp.referred_by
    FROM public.deals d
    JOIN referred_profiles rp ON d.seller_id = rp.id
    WHERE d.status = 'completed'
  )
  SELECT
    p.id,
    p.name,
    p.platform,
    p.handle,
    p.email,
    p.phone,
    p.upi_id,
    p.referral_code,
    p.status,
    p.reward_per_listing,
    COALESCE(p.total_paid, 0.00) AS total_paid,
    p.created_at,
    COALESCE((SELECT COUNT(*) FROM referred_profiles rp WHERE rp.referred_by = p.id), 0)::BIGINT AS signups_count,
    COALESCE((SELECT COUNT(*) FROM partner_listings_all pla WHERE pla.referred_by = p.id AND pla.status IN ('active', 'sold')), 0)::BIGINT AS listings_count,
    COALESCE((SELECT COUNT(*) FROM partner_listings_rewarded plr WHERE plr.referred_by = p.id), 0)::BIGINT AS rewarded_listings_count,
    COALESCE((SELECT COUNT(DISTINCT pc.id) FROM partner_chats pc WHERE pc.referred_by = p.id), 0)::BIGINT AS chats_count,
    COALESCE((SELECT COUNT(*) FROM partner_sales ps WHERE ps.referred_by = p.id), 0)::BIGINT AS sales_count,
    (COALESCE((SELECT COUNT(*) FROM partner_listings_rewarded plr WHERE plr.referred_by = p.id), 0) * p.reward_per_listing)::NUMERIC AS total_earnings,
    ((COALESCE((SELECT COUNT(*) FROM partner_listings_rewarded plr WHERE plr.referred_by = p.id), 0) * p.reward_per_listing) - COALESCE(p.total_paid, 0.00))::NUMERIC AS pending_earnings
  FROM public.partners p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant table permissions to Supabase API gateway roles
GRANT ALL ON TABLE public.partners TO authenticated, anon, service_role;

-- 9. Secure function for a partner to fetch their own stats based on auth.jwt() email
DROP FUNCTION IF EXISTS public.get_my_partner_stats();
CREATE OR REPLACE FUNCTION public.get_my_partner_stats()
RETURNS TABLE (
  id UUID,
  name TEXT,
  platform TEXT,
  handle TEXT,
  email TEXT,
  upi_id TEXT,
  referral_code TEXT,
  status TEXT,
  reward_per_listing NUMERIC,
  total_paid NUMERIC,
  created_at TIMESTAMPTZ,
  signups_count BIGINT,
  listings_count BIGINT,
  rewarded_listings_count BIGINT,
  chats_count BIGINT,
  sales_count BIGINT,
  total_earnings NUMERIC,
  pending_earnings NUMERIC
) AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := auth.jwt() ->> 'email';
  IF user_email IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    s.id, s.name, s.platform, s.handle, s.email, s.upi_id, s.referral_code, 
    s.status, s.reward_per_listing, s.total_paid, s.created_at,
    s.signups_count, s.listings_count, s.rewarded_listings_count, 
    s.chats_count, s.sales_count, s.total_earnings, s.pending_earnings
  FROM public.get_partners_stats() s
  WHERE LOWER(s.email) = LOWER(user_email) AND s.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Secure function for a partner to fetch their referred users list based on auth.jwt() email
DROP FUNCTION IF EXISTS public.get_my_referred_signups();
CREATE OR REPLACE FUNCTION public.get_my_referred_signups()
RETURNS TABLE (
  full_name TEXT,
  created_at TIMESTAMPTZ,
  has_listing BOOLEAN
) AS $$
DECLARE
  user_email TEXT;
  partner_id UUID;
BEGIN
  user_email := auth.jwt() ->> 'email';
  IF user_email IS NULL THEN
    RETURN;
  END IF;

  SELECT p.id INTO partner_id 
  FROM public.partners p 
  WHERE LOWER(p.email) = LOWER(user_email) AND p.status = 'active';

  IF partner_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    pr.full_name,
    pr.created_at,
    EXISTS (
      SELECT 1 FROM public.listings l 
      WHERE l.seller_id = pr.id AND l.status IN ('active', 'sold')
    ) AS has_listing
  FROM public.profiles pr
  WHERE pr.referred_by = partner_id
  ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_partner_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_referred_signups() TO authenticated;

-- 12. Create partner_payouts table for transaction history ledger
CREATE TABLE IF NOT EXISTS public.partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Enable RLS on partner_payouts
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies for partner_payouts
CREATE POLICY "Admins can do everything on partner_payouts"
  ON public.partner_payouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Partners can read their own payouts"
  ON public.partner_payouts
  FOR SELECT
  USING (
    partner_id IN (
      SELECT p.id FROM public.partners p
      WHERE LOWER(p.email) = LOWER(auth.jwt() ->> 'email')
    )
  );

-- 15. Secure function for a partner to fetch their payouts ledger
DROP FUNCTION IF EXISTS public.get_my_payouts();
CREATE OR REPLACE FUNCTION public.get_my_payouts()
RETURNS TABLE (
  id UUID,
  amount NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  user_email TEXT;
  partner_id UUID;
BEGIN
  user_email := auth.jwt() ->> 'email';
  IF user_email IS NULL THEN
    RETURN;
  END IF;

  SELECT p.id INTO partner_id 
  FROM public.partners p 
  WHERE LOWER(p.email) = LOWER(user_email) AND p.status = 'active';

  IF partner_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    pp.id,
    pp.amount,
    pp.created_at
  FROM public.partner_payouts pp
  WHERE pp.partner_id = partner_id
  ORDER BY pp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Grant execute permissions on get_my_payouts to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_payouts() TO authenticated;
GRANT ALL ON TABLE public.partner_payouts TO authenticated, anon, service_role;
