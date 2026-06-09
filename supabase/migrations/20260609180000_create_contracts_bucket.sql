-- Migration to create the contracts storage bucket and configure its security policies

-- 1. Insert the contracts bucket into the storage.buckets table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contracts',
    'contracts',
    true, -- Using public for easy email links, can be set to false if signed URLs are strictly preferred
    10485760, -- 10MB limit
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf']::text[];

-- 3. Create policies for the contracts bucket

-- Allow public read access to contracts
-- Since the URL contains a UUID, it's virtually unguessable, making public read relatively safe for signed contracts
CREATE POLICY "Public Read Access for Contracts"
ON storage.objects FOR SELECT
USING ( bucket_id = 'contracts' );

-- Allow authenticated users to upload new contracts
CREATE POLICY "Authenticated users can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'contracts' AND 
    auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own uploads or allow anyone authenticated (based on your security model)
CREATE POLICY "Authenticated users can update contracts"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'contracts' AND 
    auth.role() = 'authenticated'
);

-- Allow authenticated users to delete contracts
CREATE POLICY "Authenticated users can delete contracts"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'contracts' AND 
    auth.role() = 'authenticated'
);
