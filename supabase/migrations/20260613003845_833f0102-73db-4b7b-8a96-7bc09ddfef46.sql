ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS extracted_text text,
  ADD COLUMN IF NOT EXISTS extraction_status text NOT NULL DEFAULT 'pending';