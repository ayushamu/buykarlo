-- Keep student ID verification review locked to owners and admins.

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own verification requests." ON public.verifications;
DROP POLICY IF EXISTS "Users can view own verification requests." ON public.verifications;
DROP POLICY IF EXISTS "Admins can view verification requests." ON public.verifications;
DROP POLICY IF EXISTS "Admins can update verification requests." ON public.verifications;
DROP POLICY IF EXISTS "Admins can update verification profile fields." ON public.profiles;

CREATE POLICY "Users can create own verification requests."
  ON public.verifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'::public.verification_status
  );

CREATE POLICY "Users can view own verification requests."
  ON public.verifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view verification requests."
  ON public.verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.is_admin = true
    )
  );

CREATE POLICY "Admins can update verification requests."
  ON public.verifications
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

CREATE POLICY "Admins can update verification profile fields."
  ON public.profiles
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
