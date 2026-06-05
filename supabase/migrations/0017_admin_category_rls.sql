-- Allow admins to insert, update and delete categories.
DROP POLICY IF EXISTS "Admins can insert categories." ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories." ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories." ON public.categories;

CREATE POLICY "Admins can insert categories."
  ON public.categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.is_admin = true
    )
  );

CREATE POLICY "Admins can update categories."
  ON public.categories
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

CREATE POLICY "Admins can delete categories."
  ON public.categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.is_admin = true
    )
  );
