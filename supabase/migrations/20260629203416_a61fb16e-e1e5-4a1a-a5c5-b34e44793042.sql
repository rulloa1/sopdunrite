
-- ===== Add missing columns =====
ALTER TABLE public.incident_reports ADD COLUMN reported_by UUID DEFAULT auth.uid();
ALTER TABLE public.vehicle_inspections ADD COLUMN inspected_by UUID DEFAULT auth.uid();
ALTER TABLE public.trailer_inspections ADD COLUMN inspected_by UUID DEFAULT auth.uid();
ALTER TABLE public.projects ADD COLUMN contract_completion TEXT;
ALTER TABLE public.projects ADD COLUMN current_completion TEXT;

-- ===== Tighten nullability to match the forms (tables are empty) =====
ALTER TABLE public.handbook_acknowledgments
  ALTER COLUMN acknowledged_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN acknowledged_date SET NOT NULL;

ALTER TABLE public.incident_reports
  ALTER COLUMN equipment_ownership SET DEFAULT '',
  ALTER COLUMN equipment_ownership SET NOT NULL,
  ALTER COLUMN incident_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN incident_date SET NOT NULL,
  ALTER COLUMN status SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.vehicle_inspections
  ALTER COLUMN inspection_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN inspection_date SET NOT NULL,
  ALTER COLUMN status SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.trailer_inspections
  ALTER COLUMN trailer_type SET DEFAULT '',
  ALTER COLUMN trailer_type SET NOT NULL,
  ALTER COLUMN inspection_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN inspection_date SET NOT NULL,
  ALTER COLUMN status SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.maintenance_records
  ALTER COLUMN asset_type SET DEFAULT '',
  ALTER COLUMN asset_type SET NOT NULL,
  ALTER COLUMN service_type SET DEFAULT '',
  ALTER COLUMN service_type SET NOT NULL,
  ALTER COLUMN reported_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN reported_date SET NOT NULL,
  ALTER COLUMN status SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.job_safety_analyses
  ALTER COLUMN jsa_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN jsa_date SET NOT NULL;

ALTER TABLE public.toolbox_talks
  ALTER COLUMN talk_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN talk_date SET NOT NULL;

ALTER TABLE public.subcontractor_prequalifications
  ALTER COLUMN status SET DEFAULT '',
  ALTER COLUMN status SET NOT NULL;

-- ===== OSHA 300 log table =====
CREATE TABLE public.osha300_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT,
  employee_name TEXT NOT NULL,
  job_title TEXT,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT,
  injury_description TEXT,
  classification TEXT NOT NULL DEFAULT '',
  injury_type TEXT NOT NULL DEFAULT '',
  days_away INTEGER NOT NULL DEFAULT 0,
  days_restricted INTEGER NOT NULL DEFAULT 0,
  privacy_case BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.osha300_log TO authenticated;
GRANT ALL ON public.osha300_log TO service_role;
ALTER TABLE public.osha300_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view osha300_log" ON public.osha300_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can insert osha300_log" ON public.osha300_log
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'executive'::app_role)
    OR has_role(auth.uid(), 'project_manager'::app_role)
  );

CREATE POLICY "Managers can update osha300_log" ON public.osha300_log
  FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete osha300_log" ON public.osha300_log
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_osha300_log_updated_at BEFORE UPDATE ON public.osha300_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
