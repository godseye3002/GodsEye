-- Remove the old single-reference column
alter table public.analysis_history 
drop column if exists analysis_id;

-- Add dual references (One history entry can link to one OR both)
alter table public.analysis_history 
add column google_analysis_id uuid null references product_analysis_google(id) on delete set null,
add column perplexity_analysis_id uuid null references product_analysis_perplexity(id) on delete set null;