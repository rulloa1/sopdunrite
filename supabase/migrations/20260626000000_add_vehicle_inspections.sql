-- =============================================================================
-- DunRite SOP — Pre-Use Vehicle / Equipment Inspections
-- A fleet-wide daily pre-use inspection log (DOT / CDL style). NOT scoped to a
-- construction project: any signed-in user (operator) records their own
-- inspection at the start of a day or whenever they take a vehicle/equipment.
-- =============================================================================

CREATE TABLE public.vehicle_inspections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle text NOT NULL,
  inspection_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  inspector_name text,
  odometer numeric(12,1),
  -- Checklist items: true = OK, false = needs attention. Default OK.
  fluids_ok boolean NOT NULL DEFAULT true,
  guards_ok boolean NOT NULL DEFAULT true,
  controls_ok boolean NOT NULL DEFAULT true,
  tires_ok boolean NOT NULL DEFAULT true,
  headlights_ok boolean NOT NULL DEFAULT true,
  running_lights_ok boolean NOT NULL DEFAULT true,
  brake_lights_ok boolean NOT NULL DEFAULT true,
  blinkers_ok boolean NOT NULL DEFAULT true,
  clearance_lights_ok boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pass'
    CHECK (status IN ('pass', 'needs-attention', 'fail')),
  defects text,
  inspected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_inspections_date ON public.vehicle_inspections(inspection_date DESC);
CREATE INDEX idx_vehicle_inspections_vehicle ON public.vehicle_inspections(vehicle);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_inspections TO authenticated;
GRANT ALL ON public.vehicle_inspections TO service_role;

ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can read inspections.
CREATE POLICY "Authenticated can view vehicle inspections"
  ON public.vehicle_inspections FOR SELECT TO authenticated USING (true);

-- Any signed-in user can log their own inspection (recorded as themselves).
CREATE POLICY "Users can insert their own vehicle inspections"
  ON public.vehicle_inspections FOR INSERT TO authenticated
  WITH CHECK (inspected_by = auth.uid());

-- The original inspector or an admin can edit.
CREATE POLICY "Owner or admin can update vehicle inspections"
  ON public.vehicle_inspections FOR UPDATE TO authenticated
  USING (inspected_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (inspected_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- The original inspector or an admin can delete.
CREATE POLICY "Owner or admin can delete vehicle inspections"
  ON public.vehicle_inspections FOR DELETE TO authenticated
  USING (inspected_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_vehicle_inspections_updated_at BEFORE UPDATE ON public.vehicle_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
