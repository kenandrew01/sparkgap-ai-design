CREATE TABLE public.altium_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  picked_up_at timestamptz,
  result_url text
);

GRANT INSERT ON public.altium_jobs TO anon;
GRANT ALL ON public.altium_jobs TO service_role;

ALTER TABLE public.altium_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can queue an altium job"
ON public.altium_jobs FOR INSERT TO anon
WITH CHECK (true);