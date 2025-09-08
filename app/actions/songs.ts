'use server';

import { createClient } from '@/lib/supabase/server';
import type { Category, Song } from '@/lib/types';
import * as mm from 'music-metadata';
import { revalidatePath } from 'next/cache';
import { Buffer } from 'node:buffer';

const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LYRICS_SIZE = 1 * 1024 * 1024; // 1MB

export async function addSong(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get('title') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const category = formData.get('category') as string;
  const audioFile = formData.get('audioFile') as File;
  const lyricsFile = formData.get('lyricsFile') as File | null;
  const imageFile = formData.get('imageFile') as File | null;

  if (!title || !category || !audioFile) {
    return {
      success: false,
      error: 'Title, category, and audio file are required',
    };
  }

  if (audioFile.size > MAX_AUDIO_SIZE) {
    return {
      success: false,
      error: `Audio file is too large. Maximum size is ${
        MAX_AUDIO_SIZE / (1024 * 1024)
      }MB`,
    };
  }

  if (imageFile && imageFile.size > MAX_IMAGE_SIZE) {
    return {
      success: false,
      error: `Image file is too large. Maximum size is ${
        MAX_IMAGE_SIZE / (1024 * 1024)
      }MB`,
    };
  }

  if (lyricsFile && lyricsFile.size > MAX_LYRICS_SIZE) {
    return {
      success: false,
      error: `Lyrics file is too large. Maximum size is ${
        MAX_LYRICS_SIZE / (1024 * 1024)
      }MB`,
    };
  }

  try {
    let finalImageUrl = imageUrl;
    let audioUrl = '';
    let lyricsContent = '';
    let duration: number | null = null;

    try {
      // Get audio duration before uploading
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      try {
        const metadata = await mm.parseBuffer(audioBuffer, audioFile.type);
        if (metadata.format.duration) {
          duration = Math.round(metadata.format.duration);
        }
      } catch (metadataError) {
        console.warn('Could not get audio duration:', metadataError);
      }

      const audioFileName = `${Date.now()}-${audioFile.name}`;
      const { data: audioData, error: audioError } = await supabase.storage
        .from('song-audio')
        .upload(audioFileName, audioFile);

      if (audioError) {
        console.error('Audio upload error:', audioError);
        const errorMessage =
          typeof audioError === 'string'
            ? audioError
            : audioError.message || 'Unknown storage error';
        return {
          success: false,
          error: `Failed to upload audio: ${errorMessage}`,
        };
      }

      const { data: audioUrlData } = supabase.storage
        .from('song-audio')
        .getPublicUrl(audioFileName);
      audioUrl = audioUrlData.publicUrl;
    } catch (storageError) {
      console.error('Audio storage error:', storageError);
      return {
        success: false,
        error:
          'Failed to upload audio file. Please try a smaller file or different format.',
      };
    }

    if (imageFile && imageFile.size > 0) {
      try {
        const imageFileName = `${Date.now()}-${imageFile.name}`;
        const { data: imageData, error: imageError } = await supabase.storage
          .from('song-images')
          .upload(imageFileName, imageFile);

        if (imageError) {
          console.error('Image upload error:', imageError);
          const errorMessage =
            typeof imageError === 'string'
              ? imageError
              : imageError.message || 'Unknown storage error';
          return {
            success: false,
            error: `Failed to upload image: ${errorMessage}`,
          };
        }

        const { data: imageUrlData } = supabase.storage
          .from('song-images')
          .getPublicUrl(imageFileName);
        finalImageUrl = imageUrlData.publicUrl;
      } catch (storageError) {
        console.error('Image storage error:', storageError);
        return {
          success: false,
          error:
            'Failed to upload image file. Please try a smaller file or different format.',
        };
      }
    }

    // Process lyrics file if provided
    if (lyricsFile && lyricsFile.size > 0) {
      try {
        lyricsContent = await lyricsFile.text();
      } catch (error) {
        console.error('Lyrics file read error:', error);
        return {
          success: false,
          error:
            "Failed to read lyrics file. Please ensure it's a valid text file.",
        };
      }
    }

    // Insert song into database
    const { data, error } = await supabase
      .from('songs')
      .insert({
        title,
        image_url: finalImageUrl || null,
        audio_url: audioUrl,
        lyrics_content: lyricsContent || null,
        category,
        duration,
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return { success: false, error: `Failed to save song: ${error.message}` };
    }

    revalidatePath('/');
    return { success: true, song: data };
  } catch (error) {
    console.error('Unexpected error adding song:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while adding the song',
    };
  }
}

export async function getSongs(
  category: Category = 'all',
  search = ''
): Promise<Song[]> {
  const supabase = await createClient();

  let query = supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false });

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  if (search.trim()) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching songs:', error);
    return [];
  }

  return data || [];
}

export async function deleteSong(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('songs').delete().eq('id', id);

  if (error) {
    throw error;
  }

  revalidatePath('/');
}
