export interface Song {
  id: string
  title: string
  image_url?: string
  audio_url: string
  lyrics_content?: string // SRT format
  category: "anime" | "movies" | "pop" | "music" | "other"
  duration?: number // in seconds
  created_at: string
  updated_at: string
}

export interface SRTSubtitle {
  index: number
  start: number // time in seconds
  end: number // time in seconds
  text: string
}

export type Category = "all" | "anime" | "movies" | "pop" | "music" | "other"
