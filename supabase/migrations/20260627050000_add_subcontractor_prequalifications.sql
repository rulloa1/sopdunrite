-- =============================================================================
-- DunRite SOP — Subcontractor Safety Prequalification
-- Vets subcontractors before they set foot on a job: company and trade, who to
-- contact, their EMR (experience modification rate), certificate-of-insurance
-- expiry, OSHA citation history, and an overall qualification status. Supports
-- the IIPP's multi-employer / controlling-employer responsibilities.
-- Company-wide operational record-keeping: managers maintain it, admins delete.
-- =============================================================================

CREATE TABLE public.subcontractor_prequalifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  trade text,
  contact_name text,
  contact_email text,
  contact_phone text,
  -- Experience Modification Rate: a workers'-comp safety metric (~1.0 average).
  emr numeric(4, 2) CHECK (emr IS NULL OR emr >= 0),
  coi_expires date,
  osha_citations text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'conditional', 'not_approved')),
  review_date date,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subcontractor_prequal_company ON public.subcontractor_prequalifications(company_name);
CREATE INDEX idx_subcontractor_prequal_status ON public.subcontractor_prequalifications(status);
CREATE INDEX idx_subcontractor_prequal_coi ON public.subcontractor_prequalifications(coi_expires);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcontractor_prequalifications TO authenticated;
GRANT ALL ON public.subcontractor_prequalifications TO service_role;

ALTER TABLE public.subcontractor_prequalifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view subcontractor prequalifications"
  ON public.subcontractor_prequalifications FOR SELECT TO authenticated USING (true);

-- Managers maintain the log; created_by comes from the column DEFAULT auth.uid()
-- and the WITH CHECK still pins it to the caller so it cannot be forged.
CREATE POLICY "Managers can insert subcontractor prequalifications"
  ON public.subcontractor_prequalifications FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update subcontractor prequalifications"
  ON public.subcontractor_prequalifications FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete subcontractor prequalifications"
  ON public.subcontractor_prequalifications FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_subcontractor_prequal_updated_at BEFORE UPDATE
  ON public.subcontractor_prequalifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
