CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL CHECK (feature IN ('listing_title_rewrite', 'listing_description_rewrite', 'listing_missing_questions')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_created_at
  ON public.ai_usage_events(user_id, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.ai_usage_events TO authenticated;

DROP POLICY IF EXISTS "Users can view their own AI usage events." ON public.ai_usage_events;

CREATE POLICY "Users can view their own AI usage events."
  ON public.ai_usage_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI usage events." ON public.ai_usage_events;

CREATE POLICY "Users can insert their own AI usage events."
  ON public.ai_usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
