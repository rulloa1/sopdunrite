-- Table to track documents attached to projects
CREATE TABLE public.project_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  content_type text,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_documents_project_id ON public.project_documents(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_documents TO authenticated;
GRANT ALL ON public.project_documents TO service_role;

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can view document records
CREATE POLICY "Authenticated can view project documents"
  ON public.project_documents FOR SELECT
  TO authenticated
  USING (true);

-- Managers & admins can add documents (must record themselves as uploader)
CREATE POLICY "Managers can insert project documents"
  ON public.project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

-- Admins or the original uploader can delete documents
CREATE POLICY "Admins or uploader can delete project documents"
  ON public.project_documents FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR uploaded_by = auth.uid()
  );

-- ===== Storage policies for the private project-documents bucket =====
CREATE POLICY "Authenticated can view project document files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-documents');

CREATE POLICY "Managers can upload project document files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-documents'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Admins or owner can delete project document files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (has_role(auth.uid(), 'admin'::app_role) OR owner = auth.uid())
  );