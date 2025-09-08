"use client"

import { useState, useEffect, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Play, Shuffle, Music, Trash2 } from "lucide-react"
import type { Song, Category } from "@/lib/types"
import { getSongs, deleteSong } from "@/app/actions/songs"

interface SongLibraryProps {
  onClose: () => void
}

export function SongLibrary({ onClose }: SongLibraryProps) {
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())
  const [category, setCategory] = useState<Category>("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSongs()
  }, [category, search])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case "p":
        case "P":
          if (!event.ctrlKey) {
            event.preventDefault()
            handlePlayAll()
          }
          break
        case "r":
        case "R":
          if (!event.ctrlKey) {
            event.preventDefault()
            handlePlayRandom()
          }
          break
        case "Escape":
          event.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [filteredSongs, selectedSongs, onClose])

  async function loadSongs() {
    setLoading(true)
    try {
      const data = await getSongs(category, search)
      setSongs(data)
      setFilteredSongs(data)
    } catch (error) {
      console.error("Error loading songs:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectSong(songId: string, checked: boolean) {
    const newSelected = new Set(selectedSongs)
    if (checked) {
      newSelected.add(songId)
    } else {
      newSelected.delete(songId)
    }
    setSelectedSongs(newSelected)
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedSongs(new Set(filteredSongs.map((song) => song.id)))
    } else {
      setSelectedSongs(new Set())
    }
  }

  function handlePlaySongs(mode: "all" | "random") {
    const songsToPlay =
      selectedSongs.size > 0 ? filteredSongs.filter((song) => selectedSongs.has(song.id)) : filteredSongs

    if (songsToPlay.length === 0) return

    const playlistParam = encodeURIComponent(JSON.stringify(songsToPlay))
    router.push(`/player?songs=${playlistParam}&mode=${mode}&index=0`)
    onClose()
  }

  function handlePlayAll() {
    handlePlaySongs("all")
  }

  function handlePlayRandom() {
    handlePlaySongs("random")
  }

  async function handleDeleteSong(songId: string) {
    if (confirm("Are you sure you want to delete this song?")) {
      try {
        await deleteSong(songId)
        loadSongs()
        setSelectedSongs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(songId)
          return newSet
        })
      } catch (error) {
        console.error("Error deleting song:", error)
      }
    }
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const categories: { value: Category; label: string }[] = [
    { value: "all", label: "All" },
    { value: "anime", label: "Anime" },
    { value: "movies", label: "Movies" },
    { value: "pop", label: "Pop" },
    { value: "music", label: "Music" },
    { value: "other", label: "Other" },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Song Library</h2>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground text-right">
                <p>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">P</kbd> Play All
                </p>
                <p>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">R</kbd> Random
                </p>
                <p>
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> Close
                </p>
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Play Controls */}
            <div className="flex gap-2">
              <Button
                onClick={handlePlayRandom}
                disabled={filteredSongs.length === 0}
                className="flex items-center gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Random (R)
              </Button>
              <Button onClick={handlePlayAll} disabled={filteredSongs.length === 0} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Play All (P)
              </Button>
            </div>
          </div>

          {/* Song List */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading songs...</div>
              </div>
            ) : filteredSongs.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No songs found</p>
                  <p className="text-sm">Try adjusting your search or category filter</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-96">
                {/* Header Row */}
                <div className="flex items-center gap-4 p-3 border-b border-border text-sm font-medium text-muted-foreground">
                  <Checkbox
                    checked={selectedSongs.size === filteredSongs.length && filteredSongs.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <div className="flex-1">Title</div>
                  <div className="w-20 text-center">Duration</div>
                  <div className="w-20 text-center">Actions</div>
                </div>

                {/* Song Rows */}
                {filteredSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedSongs.has(song.id)}
                      onCheckedChange={(checked) => handleSelectSong(song.id, checked as boolean)}
                    />

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {song.image_url ? (
                        <img
                          src={song.image_url || "/placeholder.svg"}
                          alt={song.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{song.title}</div>
                        <div className="text-sm text-muted-foreground capitalize">{song.category}</div>
                      </div>
                    </div>

                    <div className="w-20 text-center text-sm text-muted-foreground">
                      {formatDuration(song.duration)}
                    </div>

                    <div className="w-20 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSong(song.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {filteredSongs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
              {selectedSongs.size > 0 ? (
                <span>
                  {selectedSongs.size} of {filteredSongs.length} songs selected
                </span>
              ) : (
                <span>{filteredSongs.length} songs total</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
