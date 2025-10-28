// Example: How to integrate Supabase auth into your existing auth page
// Replace the TODO sections in app/auth/page.tsx with these implementations

import { useAuth } from '@/lib/auth-context';

// In your AuthPage component, add:
const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

// Replace handleSignUp function:
const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (signUpEmailError || signUpPasswordMismatch) return;

  setIsSubmitting(true);
  try {
    const { error } = await signUpWithEmail(
      signUpEmail,
      signUpPassword,
      signUpName || undefined
    );
    
    if (error) {
      console.error('Sign up error:', error);
      alert(error.message);
      return;
    }
    
    // Success - redirect to products
    router.push("/products");
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    setIsSubmitting(false);
  }
};

// Replace handleSignIn function:
const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setIsSubmitting(true);
  try {
    const { error } = await signInWithEmail(signInEmail, signInPassword);
    
    if (error) {
      console.error('Sign in error:', error);
      alert(error.message);
      return;
    }
    
    // Success - redirect to products
    router.push("/products");
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    setIsSubmitting(false);
  }
};

// Replace handleGoogleAuth function:
const handleGoogleAuth = async () => {
  setIsSubmitting(true);
  try {
    const { error } = await signInWithGoogle();
    
    if (error) {
      console.error('Google auth error:', error);
      alert(error.message);
    }
    // Redirect happens automatically via callback
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    setIsSubmitting(false);
  }
};

// ============================================
// Example: Protect routes with authentication
// ============================================

// Create a middleware or use this pattern in protected pages:
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <div>Protected content</div>;
}

// ============================================
// Example: Display user info and credits
// ============================================

function UserDashboard() {
  const { profile, refreshProfile } = useAuth();

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div>
      <h1>Welcome, {profile.user_name || 'User'}!</h1>
      <p>Email: {profile.email}</p>
      <p>Credits: {profile.credits}</p>
      <p>Subscription: {profile.subscription_tier}</p>
      <p>Products Analyzed: {profile.total_products_analyzed}</p>
      <button onClick={refreshProfile}>Refresh</button>
    </div>
  );
}

// ============================================
// Example: Deduct credits when running analysis
// ============================================

// Create an API route: app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, productId } = await request.json();

    // Deduct credits
    const { data, error } = await supabaseAdmin.rpc('deduct_credits', {
      p_user_id: userId,
      p_credits_amount: 1,
      p_product_id: productId,
      p_analysis_type: 'full_optimization',
    });

    if (error) {
      return NextResponse.json(
        { error: 'Insufficient credits or error deducting' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Proceed with analysis...
    // Your existing analysis logic here

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// Example: Save product to Supabase
// ============================================

// In your optimize page, after analysis completes:
import { supabaseAdmin } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

async function saveProductToDatabase(productData: any, analysisData: any) {
  const { user } = useAuth();
  
  if (!user) return;

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      user_id: user.id,
      product_name: productData.product_name,
      product_url: productData.url,
      description: productData.description,
      specifications: productData.specifications,
      features: productData.features,
      targeted_market: productData.targeted_market,
      problem_product_is_solving: productData.problem_product_is_solving,
      general_product_type: productData.general_product_type,
      specific_product_type: productData.specific_product_type,
      generated_query: productData.generatedQuery,
      optimization_analysis: analysisData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving product:', error);
    return null;
  }

  return data;
}

// ============================================
// Example: Load user's products
// ============================================

async function loadUserProducts(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading products:', error);
    return [];
  }

  return data;
}

// ============================================
// Example: Sign out button
// ============================================

function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
