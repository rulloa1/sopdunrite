-- =============================================================================
-- DunRite SOP — Incident / Accident Reports
-- Fleet-wide / site-wide incident, accident and near-miss reporting (DOT/OSHA
-- style), including non-owned equipment & vehicles. Not scoped to a single
-- construction project. Any signed-in user can file a report; the original
-- reporter or an admin can edit/delete.
-- =============================================================================

CREATE TABLE public.incident_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type text NOT NULL DEFAULT 'incident'
    CHECK (report_type IN ('incident', 'accident', 'near-miss')),
  equipment_ownership text NOT NULL DEFAULT 'owned'
    CHECK (equipment_ownership IN ('owned', 'non-owned', 'n/a')),
  incident_date date NOT NULL DEFAULT now()::date,
  incident_time text,
  location text,
  vehicle text,
  people_involved text,
  witnesses text,
  description text NOT NULL,
  injuries boolean NOT NULL DEFAULT false,
  injury_description text,
  property_damage boolean NOT NULL DEFAULT false,
  damage_description text,
  action_taken text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'under-review', 'closed')),
  reported_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_incident_reports_date ON public.incident_reports(incident_date DESC);
CREATE INDEX idx_incident_reports_status ON public.incident_reports(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.incident_reports TO authenticated;
GRANT ALL ON public.incident_reports TO service_role;

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can read incident reports.
CREATE POLICY "Authenticated can view incident reports"
  ON public.incident_reports FOR SELECT TO authenticated USING (true);

-- Any signed-in user can file a report (recorded as themselves).
CREATE POLICY "Users can insert their own incident reports"
  ON public.incident_reports FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- The original reporter or an admin can edit.
CREATE POLICY "Owner or admin can update incident reports"
  ON public.incident_reports FOR UPDATE TO authenticated
  USING (reported_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (reported_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- The original reporter or an admin can delete.
CREATE POLICY "Owner or admin can delete incident reports"
  ON public.incident_reports FOR DELETE TO authenticated
  USING (reported_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_incident_reports_updated_at BEFORE UPDATE ON public.incident_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
