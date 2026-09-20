-- Enable Supabase Storage extension if not already available
-- Usually it's enabled by default, but just in case.

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('store_assets', 'store_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public reading
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store_assets' );

-- Policies for inserting (We allow public insertion since we don't have auth right now)
-- Normally, this should be authenticated or restricted to admin.
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'store_assets' );

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
WITH CHECK ( bucket_id = 'store_assets' );

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'store_assets' );
