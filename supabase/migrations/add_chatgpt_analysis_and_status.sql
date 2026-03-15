-- Migration: Add ChatGPT support to queries and create analysis table

-- 1. Add chatgpt_status to queries table
ALTER TABLE public.queries 
ADD COLUMN IF NOT EXISTS chatgpt_status TEXT DEFAULT 'not_applicable' 
CHECK (chatgpt_status IN ('pending', 'completed', 'failed', 'not_applicable'));

-- 2. Create product_analysis_chatgpt table
CREATE TABLE IF NOT EXISTS public.product_analysis_chatgpt (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  product_id UUID NOT NULL,
  
  -- The Input
  optimization_prompt TEXT NOT NULL,
  
  -- The Output
  optimization_analysis JSONB NULL,
  citations JSONB NULL DEFAULT '[]'::JSONB,
  
  -- Optional: Link to a specific Google search that "fed" this analysis?
  related_google_analysis_id UUID NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT pa_chatgpt_pkey PRIMARY KEY (id),
  CONSTRAINT pa_chatgpt_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT pa_chatgpt_google_link_fkey FOREIGN KEY (related_google_analysis_id) REFERENCES public.product_analysis_google (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Fast lookups by product
CREATE INDEX IF NOT EXISTS idx_pa_chatgpt_product_id ON public.product_analysis_chatgpt USING btree (product_id);
