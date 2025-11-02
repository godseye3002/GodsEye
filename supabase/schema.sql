-- GodsEye Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. Enable necessary extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. Create user_profiles table
-- ============================================
-- This table stores additional user data beyond what Supabase Auth provides
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 2 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  total_products_analyzed INTEGER DEFAULT 0 NOT NULL,
  CONSTRAINT credits_non_negative CHECK (credits >= 0)
);

-- ============================================
-- 3. Create products table
-- ============================================
-- Store user's analyzed products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  product_url TEXT,
  description TEXT,
  specifications JSONB,
  features JSONB,
  targeted_market TEXT,
  problem_product_is_solving TEXT,
  general_product_type TEXT,
  specific_product_type TEXT,
  generated_query TEXT,
  optimization_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- 4. Create analysis_history table
-- ============================================
-- Track all analysis runs for auditing and credits
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  credits_used INTEGER DEFAULT 1 NOT NULL,
  analysis_type TEXT DEFAULT 'full_optimization' NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- 5. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at ON public.analysis_history(created_at DESC);

-- ============================================
-- 6. Create trigger function for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Apply updated_at triggers
-- ============================================
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. Create function to auto-create user profile
-- ============================================
-- Automatically create a user_profiles entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, user_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. Apply trigger for new user creation
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 10. Create function to deduct credits
-- ============================================
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_credits_amount INTEGER,
  p_product_id UUID DEFAULT NULL,
  p_analysis_type TEXT DEFAULT 'full_optimization'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF current_credits < p_credits_amount THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE public.user_profiles
  SET credits = credits - p_credits_amount,
      total_products_analyzed = total_products_analyzed + 1
  WHERE id = p_user_id;

  -- Log the analysis
  INSERT INTO public.analysis_history (user_id, product_id, credits_used, analysis_type)
  VALUES (p_user_id, p_product_id, p_credits_amount, p_analysis_type);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. Create function to add credits (for admin/purchases)
-- ============================================
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_credits_amount INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_profiles
  SET credits = credits + p_credits_amount
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 12. Grant necessary permissions (Service Role Key access)
-- ============================================
-- Since you're using service role key, these are mostly for reference
-- Service role bypasses RLS and has full access

-- For authenticated users (if you want to enable RLS later):
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own profile" ON public.user_profiles
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update own profile" ON public.user_profiles
--   FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "Users can view own products" ON public.products
--   FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own products" ON public.products
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own products" ON public.products
--   FOR UPDATE USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete own products" ON public.products
--   FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 13. Create helper view for user stats
-- ============================================
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  up.id,
  up.user_name,
  up.email,
  up.credits,
  up.subscription_tier,
  up.total_products_analyzed,
  up.created_at,
  up.last_login,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT ah.id) as total_analyses,
  SUM(ah.credits_used) as total_credits_spent
FROM public.user_profiles up
LEFT JOIN public.products p ON up.id = p.user_id
LEFT JOIN public.analysis_history ah ON up.id = ah.user_id
GROUP BY up.id, up.user_name, up.email, up.credits, up.subscription_tier, 
         up.total_products_analyzed, up.created_at, up.last_login;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next steps:
-- 1. Configure Supabase Auth providers (Email, Google) in your Supabase dashboard
-- 2. Add your NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local
-- 3. Install @supabase/supabase-js in your Next.js project
-- 4. Implement auth flows in your application
