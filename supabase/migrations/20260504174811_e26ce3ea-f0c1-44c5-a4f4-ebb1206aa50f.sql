
-- Create storage bucket for PCB design uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('pcb-uploads', 'pcb-uploads', false);

-- Allow anyone to upload files (public upload for now since no auth)
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'pcb-uploads');

-- Allow anyone to read their uploaded files
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'pcb-uploads');
