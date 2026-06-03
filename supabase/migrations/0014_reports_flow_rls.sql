-- Tighten report submission and admin review policies.

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert reports." ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own submitted reports." ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

CREATE POLICY "Users can insert own reports."
  ON public.reports
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = reporter_id
    AND status = 'pending'
  );

CREATE POLICY "Users can view own submitted reports."
  ON public.reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports."
  ON public.reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
        AND admin_profile.is_admin = true
    )
  );

CREATE POLICY "Admins can update reports."
  ON public.reports
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
