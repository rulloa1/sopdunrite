-- =============================================================================
-- DunRite SOP — Schedule dates, Milestones & Procurement
-- Follow-up to the operational logs migration. Adds:
--   * projects.contract_completion / projects.current_completion dates
--   * project_milestones  (per-project schedule milestones)
--   * procurement_items   (per-project long-lead buyout tracking)
-- Both new tables follow the same conventions as the operational logs:
-- project_id FK, created_by ownership, updated_at trigger, project_id index,
-- and RLS mirroring the projects table (managers create/edit, admins delete,
-- authenticated read).
-- =============================================================================

-- ===== Project schedule dates =====
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS contract_completion date,
  ADD COLUMN IF NOT EXISTS current_completion date;

-- ===== Milestones =====
CREATE TABLE public.project_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  scheduled date,
  actual date,
  status text NOT NULL DEFAULT 'upcoming',
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Procurement buyout =====
CREATE TABLE public.procurement_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item text NOT NULL,
  committed boolean NOT NULL DEFAULT false,
  purchased boolean NOT NULL DEFAULT false,
  vendor text,
  po_number text,
  expected_delivery text,
  status text NOT NULL DEFAULT 'not-started',
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants, indexes, RLS policies and updated_at triggers =====
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['project_milestones', 'procurement_items'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE INDEX idx_%1$s_project_id ON public.%1$I(project_id);', t);

    EXECUTE format(
      $q$CREATE POLICY "Authenticated can view %1$s"
         ON public.%1$I FOR SELECT TO authenticated USING (true);$q$, t);

    EXECUTE format(
      $q$CREATE POLICY "Managers can insert %1$s"
         ON public.%1$I FOR INSERT TO authenticated
         WITH CHECK (
           created_by = auth.uid()
           AND (
             has_role(auth.uid(), 'admin'::app_role)
             OR has_role(auth.uid(), 'executive'::app_role)
             OR has_role(auth.uid(), 'project_manager'::app_role)
           )
         );$q$, t);

    EXECUTE format(
      $q$CREATE POLICY "Managers can update %1$s"
         ON public.%1$I FOR UPDATE TO authenticated
         USING (
           has_role(auth.uid(), 'admin'::app_role)
           OR has_role(auth.uid(), 'executive'::app_role)
           OR has_role(auth.uid(), 'project_manager'::app_role)
         )
         WITH CHECK (
           has_role(auth.uid(), 'admin'::app_role)
           OR has_role(auth.uid(), 'executive'::app_role)
           OR has_role(auth.uid(), 'project_manager'::app_role)
         );$q$, t);

    EXECUTE format(
      $q$CREATE POLICY "Admins can delete %1$s"
         ON public.%1$I FOR DELETE TO authenticated
         USING (has_role(auth.uid(), 'admin'::app_role));$q$, t);

    EXECUTE format(
      'CREATE TRIGGER set_%1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t);
  END LOOP;
END $$;
