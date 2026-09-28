CREATE TABLE public.review_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  file_path text NOT NULL,
  original_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  report jsonb,
  error text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX review_jobs_ip_created_idx ON public.review_jobs (ip_hash, created_at);
GRANT ALL ON public.review_jobs TO service_role;
REVOKE ALL ON public.review_jobs FROM anon, authenticated;
ALTER TABLE public.review_jobs ENABLE ROW LEVEL SECURITY;