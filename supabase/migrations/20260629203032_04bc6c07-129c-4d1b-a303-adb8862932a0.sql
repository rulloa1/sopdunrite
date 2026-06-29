
-- Shared policy helper expressions reused below:
--   manage: admin OR executive OR project_manager
--   delete: admin only
--   view:   any authenticated user

-- ===================== Per-project log tables =====================

CREATE TABLE public.bid_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bid_number TEXT,
  status TEXT,
  contractor TEXT,
  bid_amount NUMERIC,
  bid_date DATE,
  description TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rfi_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rfi_number TEXT,
  description TEXT,
  issue_date DATE,
  date_required DATE,
  date_received DATE,
  cost_impact NUMERIC,
  closed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.submittal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submittal_number TEXT,
  description TEXT,
  issue_date DATE,
  date_required DATE,
  date_received DATE,
  closed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.purchasing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cost_code TEXT,
  description TEXT,
  original_budget NUMERIC,
  contractor TEXT,
  contract_amount NUMERIC,
  vendor TEXT,
  material_amount NUMERIC,
  po_number TEXT,
  noci NUMERIC,
  contract_issued DATE,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.po_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  po_number TEXT,
  status TEXT,
  vendor TEXT,
  amount NUMERIC,
  po_date DATE,
  delivery_date DATE,
  description TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.schedule_delays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  delay_description TEXT,
  original_date DATE,
  revised_date DATE,
  days_delayed NUMERIC,
  reason TEXT,
  impact TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheduled DATE,
  actual DATE,
  status TEXT,
  sort_order INTEGER,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.procurement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  committed BOOLEAN NOT NULL DEFAULT false,
  purchased BOOLEAN NOT NULL DEFAULT false,
  vendor TEXT,
  po_number TEXT,
  expected_delivery TEXT,
  status TEXT,
  sort_order INTEGER,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================== Company-wide compliance tables =====================

CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  certification TEXT NOT NULL,
  issuing_organization TEXT,
  certificate_number TEXT,
  issued_date DATE,
  expires_date DATE,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT certifications_dates_chk CHECK (
    issued_date IS NULL OR expires_date IS NULL OR expires_date >= issued_date
  )
);

CREATE TABLE public.driver_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_name TEXT NOT NULL,
  license_number TEXT,
  license_class TEXT,
  endorsements TEXT,
  license_expires DATE,
  medical_card_expires DATE,
  last_mvr_review DATE,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===================== Grants, RLS, policies, triggers =====================

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'bid_logs','rfi_logs','submittal_logs','purchasing_logs','po_logs',
    'schedule_delays','project_milestones','procurement_items',
    'certifications','driver_qualifications'
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
