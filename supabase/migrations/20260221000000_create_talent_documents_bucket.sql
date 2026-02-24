INSERT INTO storage.buckets (id, name, public)
VALUES ('talent_documents', 'talent_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allows users to upload into the talent_documents bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to talent_documents" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to talent_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'talent_documents');

-- Allows users to read their own documents (assuming folder structure is user_id/...)
DROP POLICY IF EXISTS "Allow users to read their own documents" ON storage.objects;
CREATE POLICY "Allow users to read their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'talent_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allows admins to read all documents
DROP POLICY IF EXISTS "Allow admins to read all documents" ON storage.objects;
CREATE POLICY "Allow admins to read all documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'talent_documents' AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'operations_admin', 'vetting_admin', 'talent_manager')
  )
);
