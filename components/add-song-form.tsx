"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, ImageIcon, FileText, X, Play, Pause } from "lucide-react"
import { addSong } from "@/app/actions/songs"

interface AddSongFormProps {
  onClose: () => void
}

interface FilePreview {
  file: File
  url: string
  type: "image" | "audio" | "lyrics"
}

export function AddSongForm({ onClose }: AddSongFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    category: "",
  })

  const handleFileSelect = (file: File, type: "image" | "audio" | "lyrics") => {
    // Remove existing preview of the same type
    setFilePreviews((prev) => prev.filter((p) => p.type !== type))

    if (file) {
      const url = URL.createObjectURL(file)
      setFilePreviews((prev) => [...prev, { file, url, type }])
    }
  }

  const removeFilePreview = (type: "image" | "audio" | "lyrics") => {
    const preview = filePreviews.find((p) => p.type === type)
    if (preview) {
      URL.revokeObjectURL(preview.url)
      setFilePreviews((prev) => prev.filter((p) => p.type !== type))

      // Stop audio if removing audio preview
      if (type === "audio" && audioElement) {
        audioElement.pause()
        setIsPlaying(false)
        setAudioElement(null)
      }
    }
  }

  const toggleAudioPlayback = () => {
    const audioPreview = filePreviews.find((p) => p.type === "audio")
    if (!audioPreview) return

    if (!audioElement) {
      const audio = new Audio(audioPreview.url)
      audio.addEventListener("ended", () => setIsPlaying(false))
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError("Title is required")
        setIsSubmitting(false)
        return
      }

      if (!formData.category) {
        setError("Category is required")
        setIsSubmitting(false)
        return
      }

      const audioFile = filePreviews.find((p) => p.type === "audio")?.file
      if (!audioFile) {
        setError("Audio file is required")
        setIsSubmitting(false)
        return
      }

      // Create FormData with all the form fields and files
      const submitFormData = new FormData()
      submitFormData.append("title", formData.title.trim())
      submitFormData.append("category", formData.category)

      if (formData.imageUrl.trim()) {
        submitFormData.append("imageUrl", formData.imageUrl.trim())
      }

      // Add files to FormData
      const imageFile = filePreviews.find((p) => p.type === "image")?.file
      if (imageFile) {
        submitFormData.append("imageFile", imageFile)
      }

      submitFormData.append("audioFile", audioFile)

      const lyricsFile = filePreviews.find((p) => p.type === "lyrics")?.file
      if (lyricsFile) {
        submitFormData.append("lyricsFile", lyricsFile)
      }

      console.log("[v0] Submitting form with data:", {
        title: formData.title,
        category: formData.category,
        imageUrl: formData.imageUrl,
        hasImageFile: !!imageFile,
        hasAudioFile: !!audioFile,
        hasLyricsFile: !!lyricsFile,
      })

      const result = await addSong(submitFormData)

      if (result.success) {
        console.log("[v0] Song added successfully")
        filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
        onClose()
      } else {
        console.log("[v0] Error adding song:", result.error)
        setError(result.error || "An error occurred")
      }
    } catch (error) {
      console.error("[v0] Form submission error:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    if (audioElement) {
      audioElement.pause()
      setAudioElement(null)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Song</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter song title"
                required
                className="w-full"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Image Section */}
            <div className="space-y-4">
              <Label>Song Image</Label>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-sm text-muted-foreground">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              {/* OR divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {/* Local Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="imageFile" className="text-sm text-muted-foreground">
                  Upload Local Image
                </Label>

                {filePreviews.find((p) => p.type === "image") ? (
                  <div className="relative border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <img
                        src={filePreviews.find((p) => p.type === "image")?.url || "/placeholder.svg"}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{filePreviews.find((p) => p.type === "image")?.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((filePreviews.find((p) => p.type === "image")?.file.size || 0) / 1024)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilePreview("image")}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <Label htmlFor="imageFile" className="cursor-pointer text-sm text-center">
                        Click to upload image or drag and drop
                        <br />
                        <span className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</span>
                      </Label>
                      <Input
                        id="imageFile"
                        name="imageFile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(file, "image")
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Upload */}
            <div className="space-y-2">
              <Label htmlFor="audioFile">Audio File *</Label>

              {filePreviews.find((p) => p.type === "audio") ? (
                <div className="relative border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded">
                      <Music className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{filePreviews.find((p) => p.type === "audio")?.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((filePreviews.find((p) => p.type === "audio")?.file.size || 0) / (1024 * 1024))} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAudioPlayback}
                      className="h-8 w-8 p-0"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilePreview("audio")}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="flex flex-col items-center gap-2">
                    <Music className="h-8 w-8 text-muted-foreground" />
                    <Label htmlFor="audioFile" className="cursor-pointer text-sm text-center">
                      Click to upload audio file or drag and drop
                      <br />
                      <span className="text-xs text-muted-foreground">MP3, WAV, OGG up to 50MB</span>
                    </Label>
                    <Input
                      id="audioFile"
                      name="audioFile"
                      type="file"
                      accept="audio/*"
                      required
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file, "audio")
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lyrics Upload */}
            <div className="space-y-2">
              <Label htmlFor="lyricsFile">Lyrics (SRT Format) - Optional</Label>

              {filePreviews.find((p) => p.type === "lyrics") ? (
                <div className="relative border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded">
                      <FileText className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{filePreviews.find((p) => p.type === "lyrics")?.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((filePreviews.find((p) => p.type === "lyrics")?.file.size || 0) / 1024)} KB • SRT
                        Format
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilePreview("lyrics")}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <Label htmlFor="lyricsFile" className="cursor-pointer text-sm text-center">
                      Click to upload SRT file or drag and drop
                      <br />
                      <span className="text-xs text-muted-foreground">SRT format only</span>
                    </Label>
                    <Input
                      id="lyricsFile"
                      name="lyricsFile"
                      type="file"
                      accept=".srt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file, "lyrics")
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                name="category"
                required
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="movies">Movies</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-transparent"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Song"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
