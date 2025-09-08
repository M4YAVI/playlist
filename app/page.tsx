"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AddSongForm } from "@/components/add-song-form"
import { SongLibrary } from "@/components/song-library"
import { getSongs } from "@/app/actions/songs"

export default function HomePage() {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl+A to open add song form
      if (event.ctrlKey && event.key === "a") {
        event.preventDefault()
        setShowAddForm(true)
      }

      // Ctrl+K to open song library
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault()
        setShowLibrary(true)
      }

      if (event.ctrlKey && event.key === "p") {
        event.preventDefault()
        handlePlayAll()
      }

      if (event.ctrlKey && event.key === "r") {
        event.preventDefault()
        handlePlayRandom()
      }

      // Escape to close forms
      if (event.key === "Escape") {
        setShowAddForm(false)
        setShowLibrary(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  async function handlePlayAll() {
    try {
      const songs = await getSongs("all", "")
      if (songs.length > 0) {
        const playlistParam = encodeURIComponent(JSON.stringify(songs))
        router.push(`/player?songs=${playlistParam}&mode=all&index=0`)
      }
    } catch (error) {
      console.error("Error loading songs for play all:", error)
    }
  }

  async function handlePlayRandom() {
    try {
      const songs = await getSongs("all", "")
      if (songs.length > 0) {
        const playlistParam = encodeURIComponent(JSON.stringify(songs))
        router.push(`/player?songs=${playlistParam}&mode=random&index=0`)
      }
    } catch (error) {
      console.error("Error loading songs for random play:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Song Library</h1>
          <div className="space-y-2 text-muted-foreground">
            <p>
              Press <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl+A</kbd> to add a new song
            </p>
            <p>
              Press <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl+K</kbd> to open song library
            </p>
            <p>
              Press <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl+P</kbd> to play all songs
            </p>
            <p>
              Press <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl+R</kbd> to play random
            </p>
          </div>
        </div>

        {/* Placeholder content */}
        <div className="mt-12 text-center text-muted-foreground">
          <p>Your song library will appear here.</p>
          <p className="text-sm mt-2">Start by adding your first song!</p>
        </div>
      </div>

      {showAddForm && <AddSongForm onClose={() => setShowAddForm(false)} />}

      {showLibrary && <SongLibrary onClose={() => setShowLibrary(false)} />}
    </div>
  )
}
