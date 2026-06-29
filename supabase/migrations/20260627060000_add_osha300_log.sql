-- =============================================================================
-- DunRite SOP — OSHA 300 Log of Work-Related Injuries & Illnesses
-- The recordable injury/illness log behind OSHA Form 300: one row per case,
-- with the most-serious outcome classification (death / days away / restricted
-- or transfer / other recordable), the injury-vs-illness type, and the day
-- counts that feed the Form 300A annual summary. Privacy-concern cases can hide
-- the employee name on shared/printed copies. Company-wide operational record-
-- keeping: managers maintain it, admins delete.
-- =============================================================================

CREATE TABLE public.osha300_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number text,
  employee_name text NOT NULL,
  job_title text,
  incident_date date NOT NULL DEFAULT now()::date,
  location text,
  injury_description text,
  -- Most serious outcome for the case (Form 300 columns G-J, mutually exclusive).
  classification text NOT NULL DEFAULT 'other'
    CHECK (classification IN ('death', 'days_away', 'restricted', 'other')),
  -- Injury vs. illness type (Form 300 column M).
  injury_type text NOT NULL DEFAULT 'injury'
    CHECK (injury_type IN (
      'injury', 'skin_disorder', 'respiratory', 'poisoning', 'hearing_loss', 'other_illness'
    )),
  days_away integer NOT NULL DEFAULT 0 CHECK (days_away >= 0),
  days_restricted integer NOT NULL DEFAULT 0 CHECK (days_restricted >= 0),
  privacy_case boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_osha300_log_date ON public.osha300_log(incident_date DESC);
CREATE INDEX idx_osha300_log_classification ON public.osha300_log(classification);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.osha300_log TO authenticated;
GRANT ALL ON public.osha300_log TO service_role;

ALTER TABLE public.osha300_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view osha300 log"
  ON public.osha300_log FOR SELECT TO authenticated USING (true);

-- Managers maintain the log; created_by comes from the column DEFAULT auth.uid()
-- and the WITH CHECK still pins it to the caller so it cannot be forged.
CREATE POLICY "Managers can insert osha300 log"
  ON public.osha300_log FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update osha300 log"
  ON public.osha300_log FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete osha300 log"
  ON public.osha300_log FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_osha300_log_updated_at BEFORE UPDATE ON public.osha300_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
