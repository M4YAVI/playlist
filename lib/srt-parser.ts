import type { SRTSubtitle } from "./types"

export function parseSRT(srtContent: string): SRTSubtitle[] {
  if (!srtContent.trim()) return []

  const subtitles: SRTSubtitle[] = []
  const blocks = srtContent.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split("\n")
    if (lines.length < 3) continue

    const index = Number.parseInt(lines[0])
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/)

    if (!timeMatch) continue

    const startTime = parseTimeToSeconds(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4])
    const endTime = parseTimeToSeconds(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8])
    const text = lines.slice(2).join("\n")

    subtitles.push({
      index,
      start: startTime,
      end: endTime,
      text,
    })
  }

  return subtitles.sort((a, b) => a.start - b.start)
}

function parseTimeToSeconds(hours: string, minutes: string, seconds: string, milliseconds: string): number {
  return (
    Number.parseInt(hours) * 3600 +
    Number.parseInt(minutes) * 60 +
    Number.parseInt(seconds) +
    Number.parseInt(milliseconds) / 1000
  )
}

export function getCurrentSubtitle(subtitles: SRTSubtitle[], currentTime: number): SRTSubtitle | null {
  return subtitles.find((subtitle) => currentTime >= subtitle.start && currentTime <= subtitle.end) || null
}

export function getNextSubtitle(subtitles: SRTSubtitle[], currentTime: number): SRTSubtitle | null {
  return subtitles.find((subtitle) => subtitle.start > currentTime) || null
}

export function formatSubtitleTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
