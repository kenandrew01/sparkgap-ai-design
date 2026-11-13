DROP POLICY IF EXISTS "anyone can queue an altium job" ON public.altium_jobs;
CREATE POLICY "anyone can queue a valid pending altium job"
ON public.altium_jobs FOR INSERT TO anon
WITH CHECK (
  status = 'pending'
  AND picked_up_at IS NULL
  AND result_url IS NULL
  AND jsonb_typeof(payload) = 'object'
  AND payload ? 'extracted'
  AND payload ? 'footprint'
  AND pg_column_size(payload) < 200000
);

DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow scoped anonymous pcb uploads"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'pcb-uploads'
  AND owner IS NULL
  AND name ~ '^[0-9]{13}-[^/]{1,200}$'
);