create table public.product_analysis_perplexity (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  
  -- The Input
  optimization_prompt text not null, -- e.g., "Analyze user sentiment for hair styler apps..."
  
  -- The Output
  optimization_analysis jsonb null, -- The final strategic advice
  citations jsonb null default '[]'::jsonb, -- Sources specific to the AI's answer
  
  -- Optional: Link to a specific Google search that "fed" this analysis?
  related_google_analysis_id uuid null,
  
  created_at timestamp with time zone not null default now(),
  
  constraint pa_perplexity_pkey primary key (id),
  constraint pa_perplexity_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint pa_perplexity_google_link_fkey foreign KEY (related_google_analysis_id) references product_analysis_google (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_pa_perplexity_product_id on public.product_analysis_perplexity using btree (product_id);