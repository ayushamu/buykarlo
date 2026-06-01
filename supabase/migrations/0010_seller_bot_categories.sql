INSERT INTO public.categories (slug, name, icon_name, is_active)
VALUES
  ('sports-equipment', 'Sports Equipment', 'Dumbbell', true),
  ('stationery', 'Stationery', 'PenTool', true),
  ('fashion', 'Fashion', 'Shirt', true),
  ('furniture', 'Furniture', 'Armchair', true),
  ('appliances', 'Appliances', 'Plug', true),
  ('instruments', 'Instruments', 'Music', true),
  ('lab-equipment', 'Lab Equipment', 'FlaskConical', true),
  ('other', 'Other', 'Package', true)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  icon_name = EXCLUDED.icon_name,
  is_active = EXCLUDED.is_active;

ALTER TABLE public.ai_usage_events
  DROP CONSTRAINT IF EXISTS ai_usage_events_feature_check;

DELETE FROM public.ai_usage_events
WHERE feature NOT IN ('seller_bot_turn', 'seller_bot_generate_listing');

ALTER TABLE public.ai_usage_events
  ADD CONSTRAINT ai_usage_events_feature_check
  CHECK (
    feature IN ('seller_bot_turn', 'seller_bot_generate_listing')
  );

GRANT SELECT, INSERT ON public.ai_usage_events TO authenticated;
