
CREATE TABLE public.handbook_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  form_type TEXT NOT NULL,
  acknowledged_date DATE,
  supervisor TEXT,
  signed_on_file BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.hazardous_chemicals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_name TEXT NOT NULL,
  manufacturer TEXT,
  location TEXT,
  hazards TEXT,
  quantity TEXT,
  sds_on_file BOOLEAN NOT NULL DEFAULT false,
  sds_url TEXT,
  container_labeling TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  equipment_ownership TEXT,
  incident_date DATE,
  incident_time TEXT,
  location TEXT,
  vehicle TEXT,
  people_involved TEXT,
  witnesses TEXT,
  description TEXT NOT NULL,
  injuries BOOLEAN NOT NULL DEFAULT false,
  injury_description TEXT,
  property_damage BOOLEAN NOT NULL DEFAULT false,
  damage_description TEXT,
  action_taken TEXT,
  status TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.job_safety_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title TEXT NOT NULL,
  jsa_date DATE,
  location TEXT,
  prepared_by TEXT,
  required_ppe TEXT,
  job_steps TEXT,
  hazards TEXT,
  controls TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,
  asset_type TEXT,
  service_type TEXT,
  description TEXT NOT NULL,
  reported_date DATE,
  completed_date DATE,
  status TEXT,
  vendor TEXT,
  cost NUMERIC,
  odometer_hours TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subcontractor_prequalifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  trade TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  emr NUMERIC,
  coi_expires DATE,
  osha_citations TEXT,
  status TEXT,
  review_date DATE,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.toolbox_talks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  talk_date DATE,
  presenter TEXT,
  location TEXT,
  attendees TEXT,
  attendee_count INTEGER,
  key_points TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.vehicle_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle TEXT NOT NULL,
  inspection_date DATE,
  inspector_name TEXT,
  odometer NUMERIC,
  status TEXT,
  defects TEXT,
  fluids_ok BOOLEAN NOT NULL DEFAULT true,
  guards_ok BOOLEAN NOT NULL DEFAULT true,
  controls_ok BOOLEAN NOT NULL DEFAULT true,
  tires_ok BOOLEAN NOT NULL DEFAULT true,
  headlights_ok BOOLEAN NOT NULL DEFAULT true,
  running_lights_ok BOOLEAN NOT NULL DEFAULT true,
  brake_lights_ok BOOLEAN NOT NULL DEFAULT true,
  blinkers_ok BOOLEAN NOT NULL DEFAULT true,
  clearance_lights_ok BOOLEAN NOT NULL DEFAULT true,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.trailer_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trailer_type TEXT,
  trailer TEXT NOT NULL,
  inspection_date DATE,
  inspector_name TEXT,
  status TEXT,
  defects TEXT,
  coupler_ok BOOLEAN NOT NULL DEFAULT true,
  safety_chains_ok BOOLEAN NOT NULL DEFAULT true,
  lights_ok BOOLEAN NOT NULL DEFAULT true,
  brakes_ok BOOLEAN NOT NULL DEFAULT true,
  tires_wheels_ok BOOLEAN NOT NULL DEFAULT true,
  suspension_ok BOOLEAN NOT NULL DEFAULT true,
  frame_welds_ok BOOLEAN NOT NULL DEFAULT true,
  deck_floor_ok BOOLEAN NOT NULL DEFAULT true,
  ramps_gates_ok BOOLEAN NOT NULL DEFAULT true,
  tie_downs_ok BOOLEAN NOT NULL DEFAULT true,
  landing_gear_ok BOOLEAN NOT NULL DEFAULT true,
  plate_registration_ok BOOLEAN NOT NULL DEFAULT true,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'handbook_acknowledgments','hazardous_chemicals','incident_reports',
    'job_safety_analyses','maintenance_records','subcontractor_prequalifications',
    'toolbox_talks','vehicle_inspections','trailer_inspections'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    EXECUTE format($p$
      CREATE POLICY "Authenticated can view %1$s" ON public.%1$I
      FOR SELECT TO authenticated USING (true);
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "Managers can insert %1$s" ON public.%1$I
      FOR INSERT TO authenticated
      WITH CHECK (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'executive'::app_role)
        OR has_role(auth.uid(), 'project_manager'::app_role)
      );
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "Managers can update %1$s" ON public.%1$I
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
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "Admins can delete %1$s" ON public.%1$I
      FOR DELETE TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role));
    $p$, t);

    EXECUTE format($p$
      CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    $p$, t);
  END LOOP;
END $$;
