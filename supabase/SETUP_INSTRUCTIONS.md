# GodsEye Supabase Setup Instructions

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Install Supabase Client

Run this command in your project root:

```bash
npm install @supabase/supabase-js
```

## Step 2: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - **Name**: GodsEye
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (for client-side auth)
   - **service_role key** (for server-side operations - keep this secret!)

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following variables (replace with your actual values):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Existing keys
GEMINI_API_KEY=your_existing_gemini_key
```

## Step 5: Run the SQL Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" or press `Ctrl+Enter`
6. Wait for all statements to execute successfully

You should see messages like:
- "Success. No rows returned"
- "CREATE TABLE"
- "CREATE FUNCTION"
- etc.

## Step 6: Configure Authentication Providers

### Enable Email Authentication:
1. Go to **Authentication** → **Providers**
2. Find "Email" and ensure it's enabled
3. Configure email templates if desired (optional)

### Enable Google OAuth:
1. Go to **Authentication** → **Providers**
2. Find "Google" and click to configure
3. You'll need to create a Google OAuth app:
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Paste the Client ID and Client Secret into Supabase
5. Save the configuration

## Step 7: Update Your Application Layout

Wrap your app with the AuthProvider in `app/layout.tsx`:

```tsx
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Step 8: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/auth` page
3. Try signing up with email
4. Try signing in with Google
5. Check Supabase dashboard → **Authentication** → **Users** to see registered users

## Step 9: Verify Database

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `user_profiles`
   - `products`
   - `analysis_history`
3. Click on `user_profiles` and verify your test user appears

## Common Issues & Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in project root
- Restart your dev server after adding env variables

### Google OAuth not working
- Verify redirect URI matches exactly in Google Console
- Check that Google provider is enabled in Supabase
- Ensure Client ID and Secret are correct

### User profile not created automatically
- Check the trigger is created: `on_auth_user_created`
- Look at Supabase logs for errors
- Manually verify the trigger function exists in SQL Editor

### Credits not deducting
- Use the `deduct_credits` function via API routes
- Example: `SELECT public.deduct_credits('user-id-here', 1, 'product-id', 'full_optimization');`

## Next Steps

1. Update your auth page (`app/auth/page.tsx`) to use the new Supabase auth
2. Protect routes that require authentication
3. Integrate credit system with your analysis workflow
4. Store products in Supabase instead of local state
5. Implement user dashboard showing credits and usage

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to git
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Use service role key only in API routes (server-side)
- Use anon key for client-side operations
- Consider enabling RLS (Row Level Security) in production for extra security

## Support

For issues:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check Supabase logs in dashboard for errors
