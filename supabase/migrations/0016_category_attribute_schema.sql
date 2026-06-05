-- Add attribute_schema column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS attribute_schema JSONB DEFAULT '[]'::jsonb;

-- Setup L2 subcategories and schemas in a transaction block
DO $$
DECLARE
  electronics_id UUID;
  books_id UUID;
  cycles_id UUID;
  dorm_decor_id UUID;
BEGIN
  -- Get L1 parent IDs
  SELECT id INTO electronics_id FROM public.categories WHERE slug = 'electronics';
  SELECT id INTO books_id FROM public.categories WHERE slug = 'books';
  SELECT id INTO cycles_id FROM public.categories WHERE slug = 'cycles';
  SELECT id INTO dorm_decor_id FROM public.categories WHERE slug = 'dorm-decor';

  -- 1. Electronics Subcategories (L2) & Attribute Schemas
  INSERT INTO public.categories (slug, name, parent_id, icon_name, attribute_schema)
  VALUES 
    ('laptops', 'Laptops', electronics_id, 'Laptop', '[
      {"key": "brand", "label": "Brand", "type": "select", "options": ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "Other"]},
      {"key": "ram", "label": "RAM Size", "type": "select", "options": ["4GB", "8GB", "16GB", "32GB"]},
      {"key": "storage", "label": "Storage Capacity", "type": "select", "options": ["128GB", "256GB", "512GB", "1TB"]}
    ]'::jsonb),
    ('smartphones', 'Smartphones', electronics_id, 'Smartphone', '[
      {"key": "brand", "label": "Brand", "type": "select", "options": ["Apple", "Samsung", "OnePlus", "Xiaomi", "Realme", "Google", "Other"]},
      {"key": "storage", "label": "Storage", "type": "select", "options": ["64GB", "128GB", "256GB", "512GB"]}
    ]'::jsonb)
  ON CONFLICT (slug) DO UPDATE
  SET parent_id = EXCLUDED.parent_id, icon_name = EXCLUDED.icon_name, attribute_schema = EXCLUDED.attribute_schema;

  -- 2. Books Subcategories (L2) & Attribute Schemas
  INSERT INTO public.categories (slug, name, parent_id, icon_name, attribute_schema)
  VALUES 
    ('textbooks', 'Textbooks', books_id, 'BookOpen', '[
      {"key": "semester", "label": "Semester", "type": "select", "options": ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"]},
      {"key": "department", "label": "Department", "type": "select", "options": ["Computer Engineering", "Electronics Engineering", "Mechanical Engineering", "Civil Engineering", "Physics", "Chemistry", "Mathematics", "Other"]}
    ]'::jsonb),
    ('study-notes', 'Study Notes & PYQs', books_id, 'FileText', '[
      {"key": "semester", "label": "Semester", "type": "select", "options": ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"]},
      {"key": "format", "label": "Format", "type": "select", "options": ["Handwritten", "Printed", "Digital PDF"]}
    ]'::jsonb)
  ON CONFLICT (slug) DO UPDATE
  SET parent_id = EXCLUDED.parent_id, icon_name = EXCLUDED.icon_name, attribute_schema = EXCLUDED.attribute_schema;

  -- 3. Cycles Subcategories (L2) & Attribute Schemas
  INSERT INTO public.categories (slug, name, parent_id, icon_name, attribute_schema)
  VALUES 
    ('gear-cycles', 'Geared Cycles', cycles_id, 'Bike', '[
      {"key": "brand", "label": "Brand", "type": "select", "options": ["Hero", "Hercules", "Btwin", "Atlas", "Firefox", "Other"]},
      {"key": "gear_count", "label": "Number of Gears", "type": "select", "options": ["7 Speed", "18 Speed", "21 Speed", "Other"]}
    ]'::jsonb),
    ('single-speed-cycles', 'Single Speed Cycles', cycles_id, 'Bike', '[
      {"key": "brand", "label": "Brand", "type": "select", "options": ["Hero", "Hercules", "Atlas", "Btwin", "Other"]}
    ]'::jsonb)
  ON CONFLICT (slug) DO UPDATE
  SET parent_id = EXCLUDED.parent_id, icon_name = EXCLUDED.icon_name, attribute_schema = EXCLUDED.attribute_schema;

  -- 4. Dorm Decor Subcategories (L2) & Attribute Schemas
  INSERT INTO public.categories (slug, name, parent_id, icon_name, attribute_schema)
  VALUES 
    ('lamps-lighting', 'Lamps & Lighting', dorm_decor_id, 'Lightbulb', '[]'::jsonb),
    ('wall-decor', 'Wall Decor & Posters', dorm_decor_id, 'Image', '[]'::jsonb),
    ('storage-organizers', 'Storage & Organizers', dorm_decor_id, 'Boxes', '[]'::jsonb)
  ON CONFLICT (slug) DO UPDATE
  SET parent_id = EXCLUDED.parent_id, icon_name = EXCLUDED.icon_name, attribute_schema = EXCLUDED.attribute_schema;

END $$;
