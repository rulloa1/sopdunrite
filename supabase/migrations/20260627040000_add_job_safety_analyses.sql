-- =============================================================================
-- DunRite SOP — Job Safety Analysis (JSA)
-- A job-by-job breakdown of the work: the task being analyzed, where and when,
-- who prepared it, the required PPE, and the core JSA columns — the sequence of
-- job steps, the hazards in each step, and the controls that keep crews safe.
-- Supports the IIPP's hazard-assessment requirements. Company-wide operational
-- record-keeping: managers maintain it, admins delete.
-- =============================================================================

CREATE TABLE public.job_safety_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title text NOT NULL,
  jsa_date date NOT NULL DEFAULT now()::date,
  location text,
  prepared_by text,
  required_ppe text,
  job_steps text,
  hazards text,
  controls text,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_safety_analyses_date ON public.job_safety_analyses(jsa_date DESC);
CREATE INDEX idx_job_safety_analyses_job ON public.job_safety_analyses(job_title);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_safety_analyses TO authenticated;
GRANT ALL ON public.job_safety_analyses TO service_role;

ALTER TABLE public.job_safety_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view job safety analyses"
  ON public.job_safety_analyses FOR SELECT TO authenticated USING (true);

-- Managers maintain the log; created_by comes from the column DEFAULT auth.uid()
-- and the WITH CHECK still pins it to the caller so it cannot be forged.
CREATE POLICY "Managers can insert job safety analyses"
  ON public.job_safety_analyses FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update job safety analyses"
  ON public.job_safety_analyses FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete job safety analyses"
  ON public.job_safety_analyses FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_job_safety_analyses_updated_at BEFORE UPDATE ON public.job_safety_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
