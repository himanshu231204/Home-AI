-- Fixes Supabase security advisor lint: function_search_path_mutable.
alter function public.set_updated_at() set search_path = public;
