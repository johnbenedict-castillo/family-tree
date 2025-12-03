# Vercel Deployment Guide

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A Supabase project with the database and storage bucket set up
3. Your Supabase URL and anon key

## Deployment Steps

### 1. Push Your Code to GitHub

Make sure your code is pushed to a GitHub repository.

### 2. Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 3. Configure Environment Variables

**CRITICAL**: You must add these environment variables in Vercel:

1. In your Vercel project settings, go to **Settings** > **Environment Variables**
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Navigate to **Settings** > **API**
- Copy the **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
- Copy the **anon/public** key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 4. Deploy

1. Click **Deploy** in Vercel
2. Wait for the build to complete
3. Your site will be live!

## Troubleshooting

### 404 NOT_FOUND Error

If you see a 404 error after deployment, check:

1. **Environment Variables**: Make sure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel
   - Go to **Settings** > **Environment Variables**
   - Verify both variables are present
   - Make sure there are no extra spaces or quotes

2. **Supabase Setup**: Ensure your Supabase project has:
   - The `family_members` table created (run the migration SQL)
   - The `family-photos` storage bucket created with public access
   - Row Level Security (RLS) policies set up correctly

3. **Redeploy**: After adding/changing environment variables, you need to redeploy:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### Check Logs

1. Go to your Vercel project dashboard
2. Click on the **Deployments** tab
3. Click on a deployment to see build logs
4. Check for any errors during build or runtime

### Verify Environment Variables

You can verify environment variables are set by:
1. Going to **Settings** > **Environment Variables**
2. Make sure both variables are listed
3. Check that the values match your Supabase project

## Post-Deployment

After successful deployment:

1. Test the API endpoints:
   - `https://your-app.vercel.app/api/members` (should return an empty array `[]` if no members)
   
2. If you get errors, check:
   - Browser console for client-side errors
   - Vercel function logs for server-side errors
   - Supabase dashboard for database errors

## Storage Bucket Setup

Make sure your Supabase storage bucket is configured:

1. Go to Supabase Dashboard > **Storage**
2. Create bucket `family-photos` if it doesn't exist
3. Set it to **Public**
4. Add storage policies (see `supabase/migrations/005_fix_rls_policy.sql`)

