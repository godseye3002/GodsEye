-- Migration: Add source links columns to products table
-- Created: 2025-01-25
-- Purpose: Store raw source links and processed third-party sources from AI search results

-- ============================================
-- Add new columns to products table
-- ============================================

-- Add column for raw source links from AI search (all sources)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS source_links JSONB DEFAULT '[]'::jsonb;

-- Add column for processed third-party sources (filtered and categorized)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS processed_sources JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON COLUMN public.products.source_links IS 
'Raw source links returned from AI search engines (Perplexity, Google, etc.). Includes all sources before filtering.';

COMMENT ON COLUMN public.products.processed_sources IS 
'Filtered and categorized third-party sources. Excludes social media, marketplaces, and competitor sites. Each source includes: name, url, description, category.';

-- ============================================
-- Create index for JSONB queries (optional, for performance)
-- ============================================

-- Index for querying source_links array
CREATE INDEX IF NOT EXISTS idx_products_source_links 
ON public.products USING GIN (source_links);

-- Index for querying processed_sources array
CREATE INDEX IF NOT EXISTS idx_products_processed_sources 
ON public.products USING GIN (processed_sources);

-- ============================================
-- Migration Complete
-- ============================================
-- To apply this migration:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 
-- To verify:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name IN ('source_links', 'processed_sources');
