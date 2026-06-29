-- =============================================================================
-- DunRite SOP — Training & Certification Log
-- Tracks employee training and certifications (OSHA 10/30, competent-person,
-- equipment-specific, first aid/CPR, etc.) with issue and expiration dates so
-- the company can see what is current, expiring, or expired. Company-wide
-- HR record-keeping: managers maintain it, admins can delete.
-- =============================================================================

CREATE TABLE public.certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name text NOT NULL,
  certification text NOT NULL,
  issuing_organization text,
  certificate_number text,
  issued_date date,
  expires_date date,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- An expiration can't precede issuance; allow either date to be unset.
  CONSTRAINT certifications_expires_after_issued CHECK (
    expires_date IS NULL OR issued_date IS NULL OR expires_date >= issued_date
  )
);

CREATE INDEX idx_certifications_employee ON public.certifications(employee_name);
CREATE INDEX idx_certifications_expires ON public.certifications(expires_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT ALL ON public.certifications TO service_role;

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view certifications"
  ON public.certifications FOR SELECT TO authenticated USING (true);

-- Managers maintain the log; created_by comes from the column DEFAULT auth.uid()
-- and the WITH CHECK still pins it to the caller so it cannot be forged.
CREATE POLICY "Managers can insert certifications"
  ON public.certifications FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update certifications"
  ON public.certifications FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'executive'::app_role)
    OR has_role(auth.uid(), 'project_manager'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'executive'::app_role)
    OR has_role(auth.uid(), 'project_manager'::app_role)
  );

CREATE POLICY "Admins can delete certifications"
  ON public.certifications FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_certifications_updated_at BEFORE UPDATE ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
