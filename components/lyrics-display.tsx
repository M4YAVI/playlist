"use client"

import { useEffect, useRef } from "react"
import type { SRTSubtitle } from "@/lib/types"

interface LyricsDisplayProps {
  subtitles: SRTSubtitle[]
  currentSubtitle: SRTSubtitle | null
  currentTime: number
  onSeek: (time: number) => void
}

export function LyricsDisplay({ subtitles, currentSubtitle, currentTime, onSeek }: LyricsDisplayProps) {
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const currentLineRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (currentLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current
      const currentLine = currentLineRef.current

      const containerRect = container.getBoundingClientRect()
      const lineRect = currentLine.getBoundingClientRect()

      // Calculate if the current line is outside the visible area
      const isAbove = lineRect.top < containerRect.top
      const isBelow = lineRect.bottom > containerRect.bottom

      if (isAbove || isBelow) {
        // Scroll to center the current line
        const containerHeight = container.clientHeight
        const scrollTop = currentLine.offsetTop - containerHeight / 2 + currentLine.clientHeight / 2

        container.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        })
      }
    }
  }, [currentSubtitle])

  function getSubtitleContext(currentIndex: number) {
    const current = subtitles.find((s) => s.index === currentIndex)
    const currentIdx = subtitles.findIndex((s) => s.index === currentIndex)

    return {
      previous: currentIdx > 0 ? subtitles[currentIdx - 1] : null,
      current,
      next: currentIdx < subtitles.length - 1 ? subtitles[currentIdx + 1] : null,
      upcoming: subtitles.slice(currentIdx + 1, currentIdx + 3),
    }
  }

  function handleLyricClick(subtitle: SRTSubtitle) {
    onSeek(subtitle.start)
  }

  function getSubtitleState(subtitle: SRTSubtitle): "past" | "current" | "upcoming" | "future" {
    if (!currentSubtitle) {
      return currentTime >= subtitle.start ? "past" : "future"
    }

    if (subtitle.index === currentSubtitle.index) {
      return "current"
    }

    if (subtitle.end < currentTime) {
      return "past"
    }

    if (subtitle.start <= currentTime + 10) {
      // Show upcoming lyrics within 10 seconds
      return "upcoming"
    }

    return "future"
  }

  if (subtitles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-2 opacity-50 bg-muted rounded-full flex items-center justify-center">
            <span className="text-lg">♪</span>
          </div>
          <p>No lyrics available</p>
          <p className="text-xs">Upload an SRT file when adding songs</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={lyricsContainerRef} className="h-full overflow-y-auto scroll-smooth" style={{ scrollbarWidth: "thin" }}>
      <div className="space-y-1 pb-20">
        {" "}
        {/* Extra padding at bottom for better scrolling */}
        {subtitles.map((subtitle) => {
          const state = getSubtitleState(subtitle)
          const isCurrent = currentSubtitle?.index === subtitle.index

          return (
            <p
              key={subtitle.index}
              ref={isCurrent ? currentLineRef : null}
              onClick={() => handleLyricClick(subtitle)}
              className={`
                text-sm leading-relaxed transition-all duration-300 cursor-pointer rounded-md px-2 py-1 -mx-2
                hover:bg-muted/30
                ${
                  state === "current"
                    ? "text-primary font-semibold bg-primary/10 scale-105 shadow-sm"
                    : state === "past"
                      ? "text-muted-foreground/70"
                      : state === "upcoming"
                        ? "text-foreground/80"
                        : "text-muted-foreground/50"
                }
              `}
              title={`Click to seek to ${Math.floor(subtitle.start / 60)}:${Math.floor(subtitle.start % 60)
                .toString()
                .padStart(2, "0")}`}
            >
              {subtitle.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}
