-- Allow admins to inspect and moderate all marketplace listings.

DROP POLICY IF EXISTS "Admins can view all listings." ON public.listings;
DROP POLICY IF EXISTS "Admins can update all listings." ON public.listings;

CREATE POLICY "Admins can view all listings."
  ON public.listings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.is_admin = true
    )
  );

CREATE POLICY "Admins can update all listings."
  ON public.listings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.is_admin = true
    )
  );
