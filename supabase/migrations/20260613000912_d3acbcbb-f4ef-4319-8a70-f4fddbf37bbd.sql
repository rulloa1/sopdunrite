-- RLS policies for the private "workbooks" storage bucket.
-- Authenticated users manage files inside their own user-id folder; the server
-- (service role) bypasses RLS to mint signed download links for email recipients.

CREATE POLICY "Users upload own workbooks"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'workbooks'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own workbooks"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'workbooks'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own workbooks"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'workbooks'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'workbooks'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own workbooks"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'workbooks'
  AND (storage.foldername(name))[1] = auth.uid()::text
);