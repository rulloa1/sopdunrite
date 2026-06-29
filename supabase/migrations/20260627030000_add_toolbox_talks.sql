-- =============================================================================
-- DunRite SOP — Toolbox Talk / Safety Meeting Log
-- A record of safety talks and meetings: date, topic, who led it, where, the
-- key points covered, and who attended. Supports the IIPP's training and
-- communication requirements. Company-wide operational record-keeping:
-- managers maintain it, admins delete.
-- =============================================================================

CREATE TABLE public.toolbox_talks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic text NOT NULL,
  talk_date date NOT NULL DEFAULT now()::date,
  presenter text,
  location text,
  attendees text,
  attendee_count integer CHECK (attendee_count IS NULL OR attendee_count >= 0),
  key_points text,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_toolbox_talks_date ON public.toolbox_talks(talk_date DESC);
CREATE INDEX idx_toolbox_talks_topic ON public.toolbox_talks(topic);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.toolbox_talks TO authenticated;
GRANT ALL ON public.toolbox_talks TO service_role;

ALTER TABLE public.toolbox_talks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view toolbox talks"
  ON public.toolbox_talks FOR SELECT TO authenticated USING (true);

-- Managers maintain the log; created_by comes from the column DEFAULT auth.uid()
-- and the WITH CHECK still pins it to the caller so it cannot be forged.
CREATE POLICY "Managers can insert toolbox talks"
  ON public.toolbox_talks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'executive'::app_role)
      OR has_role(auth.uid(), 'project_manager'::app_role)
    )
  );

CREATE POLICY "Managers can update toolbox talks"
  ON public.toolbox_talks FOR UPDATE TO authenticated
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

CREATE POLICY "Admins can delete toolbox talks"
  ON public.toolbox_talks FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_toolbox_talks_updated_at BEFORE UPDATE ON public.toolbox_talks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
