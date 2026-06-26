-- =============================================================================
-- DunRite SOP — Trailer Inspections
-- A pre-use / periodic inspection checklist for gooseneck and flatbed trailers.
-- Fleet-wide (not project-scoped). Any signed-in user files their own; the
-- original inspector or an admin can edit/delete. Checklist points default OK.
-- =============================================================================

CREATE TABLE public.trailer_inspections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trailer_type text NOT NULL DEFAULT 'gooseneck'
    CHECK (trailer_type IN ('gooseneck', 'flatbed', 'other')),
  trailer text NOT NULL,
  inspection_date date NOT NULL DEFAULT now()::date,
  inspector_name text,
  -- Checklist points: true = OK / serviceable, false = needs attention.
  coupler_ok boolean NOT NULL DEFAULT true,
  safety_chains_ok boolean NOT NULL DEFAULT true,
  lights_ok boolean NOT NULL DEFAULT true,
  brakes_ok boolean NOT NULL DEFAULT true,
  tires_wheels_ok boolean NOT NULL DEFAULT true,
  suspension_ok boolean NOT NULL DEFAULT true,
  frame_welds_ok boolean NOT NULL DEFAULT true,
  deck_floor_ok boolean NOT NULL DEFAULT true,
  ramps_gates_ok boolean NOT NULL DEFAULT true,
  tie_downs_ok boolean NOT NULL DEFAULT true,
  landing_gear_ok boolean NOT NULL DEFAULT true,
  plate_registration_ok boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pass'
    CHECK (status IN ('pass', 'needs-attention', 'fail')),
  defects text,
  inspected_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trailer_inspections_date ON public.trailer_inspections(inspection_date DESC);
CREATE INDEX idx_trailer_inspections_trailer ON public.trailer_inspections(trailer);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trailer_inspections TO authenticated;
GRANT ALL ON public.trailer_inspections TO service_role;

ALTER TABLE public.trailer_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view trailer inspections"
  ON public.trailer_inspections FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own trailer inspections"
  ON public.trailer_inspections FOR INSERT TO authenticated
  WITH CHECK (inspected_by = auth.uid());

CREATE POLICY "Owner or admin can update trailer inspections"
  ON public.trailer_inspections FOR UPDATE TO authenticated
  USING (inspected_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (inspected_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner or admin can delete trailer inspections"
  ON public.trailer_inspections FOR DELETE TO authenticated
  USING (inspected_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_trailer_inspections_updated_at BEFORE UPDATE ON public.trailer_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
