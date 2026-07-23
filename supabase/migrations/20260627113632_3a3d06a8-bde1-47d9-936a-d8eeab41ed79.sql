
CREATE POLICY "Users upload own profile assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own profile assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own profile assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone reads profile assets" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'profile-assets');
