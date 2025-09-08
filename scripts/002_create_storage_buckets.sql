-- Create storage buckets for audio files and images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('song-audio', 'song-audio', true),
  ('song-images', 'song-images', true),
  ('song-lyrics', 'song-lyrics', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'song-audio');
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'song-images');  
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'song-lyrics');

CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'song-audio');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'song-images');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'song-lyrics');

CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'song-audio');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'song-images');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'song-lyrics');

CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'song-audio');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'song-images');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'song-lyrics');
