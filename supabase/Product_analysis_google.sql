create table public.product_analysis_google (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  
  -- The Input
  search_query text not null, -- e.g., "best ai hair styler reviews"
  
  -- The Output
  google_overview_analysis jsonb null, -- The structured insight from Google
  raw_serp_results jsonb null default '[]'::jsonb, -- Store raw rankings here for safety
  
  created_at timestamp with time zone not null default now(),
  
  constraint pa_google_pkey primary key (id),
  constraint pa_google_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

-- Fast lookups by product
create index IF not exists idx_pa_google_product_id on public.product_analysis_google using btree (product_id);