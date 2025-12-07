insert into public.product_analyses (
  product_id, 
  root_topic,           -- We assume the generated_query was the "main idea"
  optimization_query,   -- We'll use the same query for both initially to prevent data loss
  google_search_query,  -- We'll use the same query for both initially
  optimization_analysis, 
  google_overview_analysis, 
  combined_analysis, 
  source_links, 
  processed_sources, 
  created_at
)
select 
  id, 
  generated_query, -- Maps to root_topic
  generated_query, -- Maps to optimization_query (fallback)
  generated_query, -- Maps to google_search_query (fallback)
  optimization_analysis, 
  google_overview_analysis, 
  combined_analysis, 
  source_links, 
  processed_sources, 
  updated_at
from public.products
where generated_query is not null;