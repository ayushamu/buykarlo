-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories Policies
CREATE POLICY "Categories are viewable by everyone."
  ON categories FOR SELECT USING (true);

-- Admin rules for categories will be handled via Service Role in Server Actions

-- Listings Policies
CREATE POLICY "Active listings are viewable by everyone."
  ON listings FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own non-active listings."
  ON listings FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Authenticated users can insert listings."
  ON listings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own listings."
  ON listings FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own listings."
  ON listings FOR DELETE USING (auth.uid() = seller_id);

-- Listing Images Policies
CREATE POLICY "Listing images are viewable by everyone."
  ON listing_images FOR SELECT USING (true);

CREATE POLICY "Users can insert images for their own listings."
  ON listing_images FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT seller_id FROM listings WHERE id = listing_id)
  );

CREATE POLICY "Users can delete their own listing images."
  ON listing_images FOR DELETE USING (
    auth.uid() IN (SELECT seller_id FROM listings WHERE id = listing_id)
  );

-- Saved Listings Policies
CREATE POLICY "Users can view their own saved listings."
  ON saved_listings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings."
  ON saved_listings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved listings."
  ON saved_listings FOR DELETE USING (auth.uid() = user_id);

-- Reports Policies
CREATE POLICY "Users can insert reports."
  ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reporter_id);

CREATE POLICY "Users can view their own submitted reports."
  ON reports FOR SELECT USING (auth.uid() = reporter_id);
