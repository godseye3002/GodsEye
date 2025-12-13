-- Add updated_at column to product_analysis_perplexity table
ALTER TABLE public.product_analysis_perplexity 
ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Add updated_at column to product_analysis_google table  
ALTER TABLE public.product_analysis_google 
ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Create indexes for updated_at columns for better query performance
CREATE INDEX IF NOT EXISTS idx_pa_perplexity_updated_at ON public.product_analysis_perplexity(updated_at);
CREATE INDEX IF NOT EXISTS idx_pa_google_updated_at ON public.product_analysis_google(updated_at);
