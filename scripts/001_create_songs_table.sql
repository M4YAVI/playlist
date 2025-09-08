-- Create songs table with all required fields
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT NOT NULL,
  lyrics_content TEXT, -- SRT format lyrics content
  category TEXT NOT NULL CHECK (category IN ('anime', 'movies', 'pop', 'music', 'other')),
  duration INTEGER, -- Duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on songs table
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create policies for songs table (public read access, no auth required for this use case)
CREATE POLICY "Allow public read access to songs" 
  ON public.songs FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access to songs" 
  ON public.songs FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access to songs" 
  ON public.songs FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete access to songs" 
  ON public.songs FOR DELETE 
  USING (true);

-- Create index for better performance on category filtering
CREATE INDEX IF NOT EXISTS idx_songs_category ON public.songs(category);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON public.songs(created_at DESC);
