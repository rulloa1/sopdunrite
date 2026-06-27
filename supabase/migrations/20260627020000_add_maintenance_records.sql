-- =============================================================================
-- DunRite SOP — Equipment Maintenance & Repair Log
-- Tracks maintenance and repair work on vehicles, trailers, and equipment,
-- closing the loop on defects flagged during pre-use and trailer inspections:
-- a defect is logged here, worked, and tracked to completion. Company-wide
-- operational record-keeping: managers maintain it, admins delete.
-- =============================================================================

CREATE TABLE public.maintenance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset text NOT NULL,
  asset_type text NOT NULL DEFAULT 'vehicle'
    CHECK (asset_type IN ('vehicle', 'trailer', 'equipment', 'other')),
  service_type text NOT NULL DEFAULT 'repair'
    CHECK (service_type IN ('repair', 'preventive', 'inspection-followup', 'other')),
  description text NOT NULL,
  reported_date date NOT NULL DEFAULT now()::date,
  completed_date date,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in-progress', 'completed')),
  vendor text,
  cost numeric,
  odometer_hours text,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- A completion can't precede the report; allow either date to be unset.
  CONSTRAINT maintenance_completed_after_reported CHECK (
    completed_date IS NULL OR reported_date IS NULL OR completed_date >= reported_date
  )
);

CREATE INDEX idx_maintenance_records_asset ON public.maintenance_records(asset);
CREATE INDEX idx_maintenance_records_status ON public.maintenance_records(status);
CREATE INDEX idx_maintenance_records_reported ON public.maintenance_records(reported_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_records TO authenticated;
GRANT ALL ON public.maintenance_records TO service_role;

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view maintenance records"
  ON public.maintenance_records FOR SELECT TO authenticated USING (true);

-- Managers maintain the log; created_by comes from the column DEFAULT auth.uid()
-- and the WITH CHECK still pins it to the caller so it cannot be forged.
CREATE POLICY "Managers can insert maintenance records"
  ON public.maintenance_records FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update maintenance records"
  ON public.maintenance_records FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete maintenance records"
  ON public.maintenance_records FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_maintenance_records_updated_at BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
