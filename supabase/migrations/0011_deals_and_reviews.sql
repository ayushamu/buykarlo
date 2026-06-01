-- Migration: Deals and Reviews tables for student P2P transaction tracking and rating

-- 1. Create Deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Nullable for offline/external sales
  price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_deal_reviewer UNIQUE (deal_id, reviewer_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Deals
CREATE POLICY "Users can view deals they are part of"
  ON public.deals FOR SELECT
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Sellers can create deals they own"
  ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- 5. RLS Policies for Reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Deal participants can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.deals 
      WHERE id = deal_id AND (seller_id = auth.uid() OR buyer_id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_seller_id ON public.deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_id ON public.deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deals_listing_id ON public.deals(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_deal_id ON public.reviews(deal_id);
