-- Add reference to the specific analysis
alter table public.analysis_history 
add column analysis_id uuid null;

alter table public.analysis_history
add constraint analysis_history_analysis_id_fkey 
foreign KEY (analysis_id) references product_analyses (id) on delete set null;