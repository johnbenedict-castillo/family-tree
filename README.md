# Family Tree Website

A beautiful family tree application built with Next.js, Tailwind CSS, and Supabase. Create and manage your family tree with photos, names, and important dates.

## Features

- 🌳 **Interactive Family Tree**: Visualize your family relationships in a tree structure with connecting lines
- 👫 **Spouse Relationships**: Link spouses together with visual connections
- 👨‍👩‍👧‍👦 **Parent-Child Relationships**: Build multi-generational family trees
- 📸 **Photo Upload**: Add circular profile pictures for each family member (similar to Facebook)
- 👤 **Complete Member Details**: 
  - First Name, Middle Name, Last Name
  - Maiden Middle Name (for women's name before marriage)
  - Nick Name
  - Birthdate and Deathdate
- ➕ **Add Members**: Easily add new family members with parent and spouse relationships
- ✏️ **Edit & Delete**: Update member information or remove members
- 🖨️ **Print Functionality**: Print your family tree with a beautiful tree-themed background
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database and file storage
- **Vercel** - Deployment platform

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/001_create_family_members.sql`
3. Go to Storage and create a new bucket named `family-photos` with public access enabled
4. Copy your Supabase URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your family tree!

## Database Schema

The `family_members` table includes:
- `id` - UUID primary key
- `first_name` - Required
- `middle_name` - Optional
- `last_name` - Required
- `maiden_middle_name` - Optional (name before marriage)
- `nick_name` - Optional
- `birthdate` - Optional date
- `deathdate` - Optional date
- `photo_url` - Optional image URL
- `parent_id` - Optional reference to parent member
- `spouse_id` - Optional reference to spouse member
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in Vercel project settings
4. Deploy!

## Usage

1. Click "Add Family Member" to start building your tree
2. Fill in the member's information:
   - First Name, Middle Name, Last Name
   - Maiden Middle Name (for women's name before marriage)
   - Nick Name (optional)
   - Birthdate and Deathdate (optional)
   - Upload a photo (optional)
3. Create relationships:
   - Select a **Parent** to create parent-child relationships
   - Select a **Spouse** to link married couples
4. View your family tree with all members displayed, connected by lines
5. Click "Print Family Tree" to print your tree with a beautiful background
6. Edit or delete members as needed

### Building Your Tree

- Start by adding the oldest generation (grandparents, great-grandparents, etc.)
- Add their children and link them as parents
- Link spouses together to show married couples
- The tree will automatically display with connecting lines showing relationships

Enjoy building your family tree! 🌳
