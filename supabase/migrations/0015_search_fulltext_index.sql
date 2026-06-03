-- ============================================================
-- Migration: 0015_search_fulltext_index.sql
-- Purpose:   Add PostgreSQL full-text search to listings table
--            for future server-side search scalability.
--
-- When client-side Fuse.js search becomes a bottleneck at
-- large listing counts (1000+), call the `search_listings`
-- function from a Server Action instead.
-- ============================================================

-- 1. Add a regular tsvector column (not generated — PG forbids subqueries
--    inside generated column expressions, and we need one to extract the
--    keywords array from the metadata JSONB field).
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create the function that builds the search vector for a single row.
--    Called both by the trigger (on write) and by the backfill below.
CREATE OR REPLACE FUNCTION listings_search_vector(
  p_title       text,
  p_description text,
  p_metadata    jsonb
) RETURNS tsvector
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
DECLARE
  keywords_str text;
BEGIN
  -- Extract keywords array from metadata JSONB → space-separated string
  SELECT string_agg(kw, ' ')
  INTO keywords_str
  FROM jsonb_array_elements_text(
    CASE
      WHEN p_metadata ? 'keywords'
       AND jsonb_typeof(p_metadata->'keywords') = 'array'
      THEN p_metadata->'keywords'
      ELSE '[]'::jsonb
    END
  ) AS kw;

  RETURN
    setweight(to_tsvector('english', coalesce(p_title,       '')), 'A') ||
    setweight(to_tsvector('english', coalesce(p_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(keywords_str,  '')), 'C');
END;
$$;

-- 3. Trigger function: keeps search_vector in sync on every INSERT / UPDATE.
CREATE OR REPLACE FUNCTION listings_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := listings_search_vector(
    NEW.title,
    NEW.description,
    NEW.metadata
  );
  RETURN NEW;
END;
$$;

-- 4. Attach the trigger to the listings table.
DROP TRIGGER IF EXISTS trig_listings_search_vector ON public.listings;
CREATE TRIGGER trig_listings_search_vector
  BEFORE INSERT OR UPDATE OF title, description, metadata
  ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION listings_search_vector_trigger();

-- 5. Backfill search_vector for all existing rows.
UPDATE public.listings
SET search_vector = listings_search_vector(title, description, metadata);

-- 6. Create a GIN index on the tsvector column for fast full-text lookups.
CREATE INDEX IF NOT EXISTS idx_listings_search_vector
  ON public.listings USING GIN (search_vector);

-- 7. Also index campus + status for combined filter queries.
CREATE INDEX IF NOT EXISTS idx_listings_campus_status
  ON public.listings (campus, status);

-- 8. Create a helper search function that can be called from a Server Action.
--    Returns listings ranked by text-search relevance.
CREATE OR REPLACE FUNCTION search_listings(
  search_query text,
  category_slug text DEFAULT NULL,
  campus_name text DEFAULT NULL,
  result_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  description text,
  price numeric,
  condition text,
  campus text,
  metadata jsonb,
  status text,
  category_id uuid,
  seller_id uuid,
  created_at timestamptz,
  rank real
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tsquery_val tsquery;
  cat_id uuid;
BEGIN
  -- Build a websearch-style tsquery (handles typos, partial words)
  tsquery_val := websearch_to_tsquery('english', search_query);

  -- Resolve category slug to ID if provided
  IF category_slug IS NOT NULL AND category_slug != 'all' THEN
    SELECT c.id INTO cat_id
    FROM public.categories c
    WHERE c.slug = category_slug
    LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.slug,
    l.title,
    l.description,
    l.price,
    l.condition,
    l.campus,
    l.metadata,
    l.status,
    l.category_id,
    l.seller_id,
    l.created_at,
    ts_rank(l.search_vector, tsquery_val) AS rank
  FROM public.listings l
  WHERE
    l.status = 'active'
    AND (campus_name IS NULL OR campus_name = 'all' OR l.campus = campus_name)
    AND (cat_id IS NULL OR l.category_id = cat_id)
    AND (
      -- Full-text match OR simple ILIKE fallback for very short queries
      l.search_vector @@ tsquery_val
      OR l.title ILIKE '%' || search_query || '%'
    )
  ORDER BY rank DESC, l.created_at DESC
  LIMIT result_limit;
END;
$$;

-- 9. Grant execute permission to the anon and authenticated roles
--    so the Supabase JS client can call it directly.
GRANT EXECUTE ON FUNCTION search_listings(text, text, text, int)
  TO anon, authenticated;

COMMENT ON FUNCTION search_listings IS
  'Full-text search for active listings. Ranked by PostgreSQL ts_rank. '
  'Call from a Next.js Server Action when Fuse.js client-side search '
  'is no longer sufficient at scale.';
