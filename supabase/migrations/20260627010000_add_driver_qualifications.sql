-- =============================================================================
-- DunRite SOP — Driver Qualification Log
-- Tracks driver licensing and DOT qualification: license class/endorsements and
-- expiry, DOT medical-card expiry, and the last motor-vehicle-record (MVR)
-- review date, so the company can keep drivers qualified and roadworthy.
-- Company-wide HR/fleet record-keeping: managers maintain it, admins delete.
-- =============================================================================

CREATE TABLE public.driver_qualifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_name text NOT NULL,
  license_number text,
  license_class text,
  endorsements text,
  license_expires date,
  medical_card_expires date,
  last_mvr_review date,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_qualifications_driver ON public.driver_qualifications(driver_name);
CREATE INDEX idx_driver_qualifications_license_expires ON public.driver_qualifications(license_expires);
CREATE INDEX idx_driver_qualifications_medical_expires ON public.driver_qualifications(medical_card_expires);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_qualifications TO authenticated;
GRANT ALL ON public.driver_qualifications TO service_role;

ALTER TABLE public.driver_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view driver qualifications"
  ON public.driver_qualifications FOR SELECT TO authenticated USING (true);

-- Managers maintain the log; created_by comes from the column DEFAULT auth.uid()
-- and the WITH CHECK still pins it to the caller so it cannot be forged.
CREATE POLICY "Managers can insert driver qualifications"
  ON public.driver_qualifications FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update driver qualifications"
  ON public.driver_qualifications FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete driver qualifications"
  ON public.driver_qualifications FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_driver_qualifications_updated_at BEFORE UPDATE ON public.driver_qualifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
