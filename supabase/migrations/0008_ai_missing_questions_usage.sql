ALTER TABLE public.ai_usage_events
  DROP CONSTRAINT IF EXISTS ai_usage_events_feature_check;

ALTER TABLE public.ai_usage_events
  ADD CONSTRAINT ai_usage_events_feature_check
  CHECK (feature IN ('listing_title_rewrite', 'listing_description_rewrite', 'listing_missing_questions', 'listing_description_generate'));

GRANT SELECT, INSERT ON public.ai_usage_events TO authenticated;
