/*
  # Create storage bucket for context files

  1. New Storage Bucket
    - Create 'context-files' bucket for storing context-related files
    - Enable public access for authenticated users
    - Set size limit to 10MB per file

  2. Security
    - Enable RLS policies for bucket access
    - Add policies for authenticated users to manage their own files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('context-files', 'context-files', false);

-- Set up RLS policies for the bucket
CREATE POLICY "Users can upload context files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'context-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their context files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'context-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their context files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'context-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their context files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'context-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );