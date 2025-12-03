-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on family_members" ON family_members;

-- Recreate policy to allow all operations (for public family tree)
CREATE POLICY "Allow all operations on family_members"
  ON family_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also ensure RLS is enabled
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Fix storage bucket policies for family-photos
-- Note: These policies need to be created after the bucket exists
-- If the bucket doesn't exist, create it first in the Supabase dashboard

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Create policy to allow public uploads to family-photos bucket
CREATE POLICY "Allow public uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'family-photos');

-- Create policy to allow public reads from family-photos bucket
CREATE POLICY "Allow public reads"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'family-photos');

-- Create policy to allow public deletes from family-photos bucket
CREATE POLICY "Allow public deletes"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'family-photos');

-- Create policy to allow public updates to family-photos bucket
CREATE POLICY "Allow public updates"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'family-photos');

