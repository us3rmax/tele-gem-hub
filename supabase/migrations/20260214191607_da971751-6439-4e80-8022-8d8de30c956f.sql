
-- Add RLS policies for group-photos storage bucket
-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload group photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'group-photos'
  AND auth.role() = 'authenticated'
);

-- Allow public read access to group photos
CREATE POLICY "Anyone can view group photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'group-photos');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own group photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'group-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own group photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'group-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
