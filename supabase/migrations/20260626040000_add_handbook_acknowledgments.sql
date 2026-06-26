-- =============================================================================
-- DunRite SOP — Handbook Acknowledgments
-- Supplemental forms for the employee handbook (receipt, safety program,
-- drug & alcohol, driver agreement, PPE issuance, corrective action). The
-- printable templates live in the app UI; this table tracks which form each
-- employee has signed, when, and whether the signed original is on file.
-- HR-managed record-keeping: managers maintain it, admins can delete.
-- =============================================================================

CREATE TABLE public.handbook_acknowledgments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name text NOT NULL,
  form_type text NOT NULL DEFAULT 'handbook_receipt'
    CHECK (form_type IN (
      'handbook_receipt',
      'safety_program',
      'drug_alcohol',
      'driver_agreement',
      'ppe_issuance',
      'corrective_action'
    )),
  acknowledged_date date NOT NULL DEFAULT now()::date,
  supervisor text,
  signed_on_file boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_handbook_acknowledgments_employee ON public.handbook_acknowledgments(employee_name);
CREATE INDEX idx_handbook_acknowledgments_date ON public.handbook_acknowledgments(acknowledged_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.handbook_acknowledgments TO authenticated;
GRANT ALL ON public.handbook_acknowledgments TO service_role;

ALTER TABLE public.handbook_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can read the acknowledgment log.
CREATE POLICY "Authenticated can view handbook acknowledgments"
  ON public.handbook_acknowledgments FOR SELECT TO authenticated USING (true);

-- Managers maintain the log. created_by is supplied by the column DEFAULT
-- auth.uid(); the WITH CHECK still pins it to the caller so it cannot be forged.
CREATE POLICY "Managers can insert handbook acknowledgments"
  ON public.handbook_acknowledgments FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update handbook acknowledgments"
  ON public.handbook_acknowledgments FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete handbook acknowledgments"
  ON public.handbook_acknowledgments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_handbook_acknowledgments_updated_at BEFORE UPDATE ON public.handbook_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
