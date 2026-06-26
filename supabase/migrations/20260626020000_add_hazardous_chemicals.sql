-- =============================================================================
-- DunRite SOP — Hazard Communication (HazCom) chemical inventory
-- The written HazCom program lives in the app UI; this table backs the
-- required list of hazardous chemicals on site (with SDS tracking). Company
-- safety / management maintains the inventory.
-- =============================================================================

CREATE TABLE public.hazardous_chemicals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chemical_name text NOT NULL,
  manufacturer text,
  location text,
  hazards text,
  quantity text,
  sds_on_file boolean NOT NULL DEFAULT false,
  sds_url text,
  container_labeling text,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hazardous_chemicals_name ON public.hazardous_chemicals(chemical_name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hazardous_chemicals TO authenticated;
GRANT ALL ON public.hazardous_chemicals TO service_role;

ALTER TABLE public.hazardous_chemicals ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can read the chemical inventory.
CREATE POLICY "Authenticated can view hazardous chemicals"
  ON public.hazardous_chemicals FOR SELECT TO authenticated USING (true);

-- Managers maintain the inventory (and must record themselves as creator).
CREATE POLICY "Managers can insert hazardous chemicals"
  ON public.hazardous_chemicals FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update hazardous chemicals"
  ON public.hazardous_chemicals FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete hazardous chemicals"
  ON public.hazardous_chemicals FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_hazardous_chemicals_updated_at BEFORE UPDATE ON public.hazardous_chemicals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
