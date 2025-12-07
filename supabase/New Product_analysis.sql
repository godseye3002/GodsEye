create table public.product_analyses (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  
  -- 1. The Glue (User's original input)
  root_topic text null, 
  
  -- 2. The Perplexity/LLM Side (Complex)
  optimization_query text null,       -- The actual prompt used
  optimization_analysis jsonb null,   -- The result
  
  -- 3. The Google Side (Keywords)
  google_search_query text null,      -- The specific keyword string used
  google_overview_analysis jsonb null,-- The result
  
  -- Combined Result
  combined_analysis jsonb null,
  
  -- Sources (Creative Tip: Keep this JSONB, but structure it like {"google": [], "perplexity": []} inside)
  source_links jsonb null default '{"google": [], "perplexity": []}'::jsonb, 
  processed_sources jsonb null default '[]'::jsonb,
  
  created_at timestamp with time zone not null default now(),
  
  constraint product_analyses_pkey primary key (id),
  constraint product_analyses_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_product_analyses_product_id on public.product_analyses using btree (product_id);