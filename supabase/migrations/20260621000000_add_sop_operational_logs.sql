-- =============================================================================
-- DunRite SOP — Operational Logs
-- Adds the six per-project operational log tables described in the DunRite SOP
-- Integration Guide, adapted to this project's existing schema and conventions:
--   * project_id foreign key to public.projects (cascade delete)
--   * created_by ownership column
--   * created_at / updated_at with the shared update_updated_at_column() trigger
--   * project_id index for filtering performance
--   * Row Level Security mirroring the projects / project_documents policies:
--       - any authenticated user can read
--       - admins, executives and project managers can create / update
--       - only admins can delete
-- Variance (purchasing) and aging (RFI/submittal) are intentionally NOT stored;
-- they are derived in the UI, consistent with the rest of the workbook.
-- =============================================================================

-- ===== Bid Logs =====
CREATE TABLE public.bid_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bid_number text NOT NULL,
  description text,
  contractor text,
  bid_amount numeric(14,2),
  status text NOT NULL DEFAULT 'pending',
  bid_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== RFI Logs =====
CREATE TABLE public.rfi_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rfi_number text NOT NULL,
  description text NOT NULL,
  issue_date date,
  date_required date,
  date_received date,
  cost_impact numeric(14,2),
  closed boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Submittal Logs =====
CREATE TABLE public.submittal_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submittal_number text NOT NULL,
  description text NOT NULL,
  issue_date date,
  date_required date,
  date_received date,
  closed boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Purchasing Logs =====
CREATE TABLE public.purchasing_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cost_code text NOT NULL,
  description text,
  original_budget numeric(14,2),
  contractor text,
  contract_amount numeric(14,2),
  vendor text,
  material_amount numeric(14,2),
  po_number text,
  noci numeric(14,2),
  contract_issued date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== PO Logs =====
CREATE TABLE public.po_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  vendor text,
  description text,
  amount numeric(14,2),
  po_date date,
  delivery_date date,
  status text NOT NULL DEFAULT 'issued',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Schedule Delays =====
CREATE TABLE public.schedule_delays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  delay_description text NOT NULL,
  original_date date,
  revised_date date,
  days_delayed integer,
  reason text,
  impact text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants, indexes, RLS policies and updated_at triggers =====
-- All six tables share the same access pattern, so apply it uniformly.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'bid_logs', 'rfi_logs', 'submittal_logs',
    'purchasing_logs', 'po_logs', 'schedule_delays'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE INDEX idx_%1$s_project_id ON public.%1$I(project_id);', t);

    -- Read: any authenticated user
    EXECUTE format(
      $q$CREATE POLICY "Authenticated can view %1$s"
         ON public.%1$I FOR SELECT TO authenticated USING (true);$q$, t);

    -- Insert: managers only, and they must record themselves as the creator
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

    -- Update: managers only
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

    -- Delete: admins only
    EXECUTE format(
      $q$CREATE POLICY "Admins can delete %1$s"
         ON public.%1$I FOR DELETE TO authenticated
         USING (has_role(auth.uid(), 'admin'::app_role));$q$, t);

    -- Keep updated_at current on every write
    EXECUTE format(
      'CREATE TRIGGER set_%1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t);
  END LOOP;
END $$;
