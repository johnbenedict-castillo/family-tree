# Setup Guide for Family Tree Website

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

#### Run Database Migration
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase/migrations/001_create_family_members.sql`
4. Click **Run** to execute the migration
5. Verify the `family_members` table was created with all columns in the **Table Editor**

#### Set Up Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it: `family-photos`
4. Make it **Public** (toggle the public setting)
5. Click **Create bucket**

#### Get Your API Keys
1. Go to **Settings** > **API**
2. Copy your **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
3. Copy your **anon/public** key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Replace the values with your actual Supabase credentials.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New Project**
4. Import your GitHub repository
5. Add your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**

Your family tree website will be live! 🎉

## Troubleshooting

### Images not loading?
- Make sure your Supabase storage bucket `family-photos` is set to **Public**
- Check that your `NEXT_PUBLIC_SUPABASE_URL` is correct

### Database errors?
- Verify the migration was run successfully
- Check that the `family_members` table exists in your Supabase dashboard

### Build errors?
- Make sure all environment variables are set
- Check that you're using Node.js 18 or higher

