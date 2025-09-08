'use client';

import { LyricsDisplay } from '@/components/lyrics-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { getCurrentSubtitle, parseSRT } from '@/lib/srt-parser';
import type { Song, SRTSubtitle } from '@/lib/types';
import {
  ArrowLeft,
  Music,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function PlayerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false); // Will be set to true on mount
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Playlist state
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isRandom, setIsRandom] = useState(false);

  // Lyrics state
  const [subtitles, setSubtitles] = useState<SRTSubtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<SRTSubtitle | null>(
    null
  );

  const currentSong = playlist[currentSongIndex];

  // Start playing automatically on load
  useEffect(() => {
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    // Parse URL parameters to get playlist and mode
    const songsParam = searchParams.get('songs');
    const modeParam = searchParams.get('mode');
    const indexParam = searchParams.get('index');

    if (songsParam) {
      try {
        const songs = JSON.parse(decodeURIComponent(songsParam));
        setPlaylist(songs);
        setIsRandom(modeParam === 'random');
        setCurrentSongIndex(indexParam ? Number.parseInt(indexParam) : 0);
      } catch (error) {
        console.error('Error parsing playlist:', error);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (currentSong?.lyrics_content) {
      const parsed = parseSRT(currentSong.lyrics_content);
      setSubtitles(parsed);
    } else {
      setSubtitles([]);
    }
    // Reset lyrics state for new song
    setCurrentSubtitle(null);
  }, [currentSong]);

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;
    if (isRandom) {
      // Avoid playing the same song twice in a row in random mode
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (playlist.length > 1 && nextIndex === currentSongIndex);
      setCurrentSongIndex(nextIndex);
    } else {
      setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    }
  }, [isRandom, playlist.length, currentSongIndex]);

  const handlePrevious = useCallback(() => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
    } else {
      setCurrentSongIndex((prevIndex) =>
        prevIndex === 0 ? playlist.length - 1 : prevIndex - 1
      );
    }
  }, [currentTime, playlist.length]);

  // Sync audio element with isPlaying state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false)); // If play fails, update state
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentSong, isLooping, handleNext]);

  // Effect for updating lyrics based on currentTime
  useEffect(() => {
    if (subtitles.length > 0) {
      const subtitle = getCurrentSubtitle(subtitles, currentTime);
      setCurrentSubtitle(subtitle);
    }
  }, [currentTime, subtitles]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Prevent shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (event.shiftKey) {
            handlePrevious();
          } else {
            const newTime = Math.max(0, currentTime - 10);
            audio.currentTime = newTime;
            setCurrentTime(newTime);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (event.shiftKey) {
            handleNext();
          } else {
            const newTime = Math.min(duration, currentTime + 10);
            audio.currentTime = newTime;
            setCurrentTime(newTime);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          const newVolumeUp = Math.min(1, volume + 0.1);
          audio.volume = newVolumeUp;
          setVolume(newVolumeUp);
          setIsMuted(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          const newVolumeDown = Math.max(0, volume - 0.1);
          audio.volume = newVolumeDown;
          setVolume(newVolumeDown);
          setIsMuted(newVolumeDown === 0);
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          toggleMute();
          break;
        case 'l':
        case 'L':
          event.preventDefault();
          setIsLooping(!isLooping);
          break;
        case 'r':
        case 'R':
          if (!event.ctrlKey) {
            event.preventDefault();
            setIsRandom(!isRandom);
          }
          break;
        case 'Escape':
          event.preventDefault();
          router.push('/');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTime,
    duration,
    volume,
    isLooping,
    isRandom,
    router,
    handleNext,
    handlePrevious,
  ]);

  function togglePlay() {
    setIsPlaying((prev) => !prev);
  }

  function handleSeek(value: number[]) {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleLyricsSeek(time: number) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
  }

  function handleVolumeChange(value: number[]) {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }

  function formatTime(seconds: number) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!currentSong) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading player...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">Now Playing</h1>
          <p className="text-sm text-muted-foreground">
            {currentSongIndex + 1} of {playlist.length} •{' '}
            {isRandom ? 'Random' : 'Sequential'}
          </p>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          <p>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd>{' '}
            Play/Pause
          </p>
          <p>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">←/→</kbd> Seek
          </p>
          <p>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
              Shift+←/→
            </kbd>{' '}
            Prev/Next
          </p>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Player */}
          <div className="space-y-6">
            {/* Song Image */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                  {currentSong.image_url ? (
                    <img
                      src={currentSong.image_url || '/placeholder.svg'}
                      alt={currentSong.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Song Info */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{currentSong.title}</h2>
              <p className="text-muted-foreground capitalize">
                {currentSong.category}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isLooping ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsLooping(!isLooping)}
                title="Loop (L)"
              >
                <Repeat className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                title="Previous (Shift + ←)"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                size="lg"
                onClick={togglePlay}
                className="h-12 w-12 rounded-full"
                title="Play/Pause (Space)"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                title="Next (Shift + →)"
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  title="Mute (M)"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                  title="Volume (↑/↓)"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Lyrics */}
          <div className="space-y-6">
            <Card className="h-96">
              <CardContent className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Lyrics</h3>
                  {subtitles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Click to seek
                    </p>
                  )}
                </div>
                <LyricsDisplay
                  subtitles={subtitles}
                  currentSubtitle={currentSubtitle}
                  currentTime={currentTime}
                  onSeek={handleLyricsSeek}
                />
              </CardContent>
            </Card>

            {/* Playlist */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Playlist</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {playlist.map((song, index) => (
                    <div
                      key={song.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        index === currentSongIndex
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setCurrentSongIndex(index);
                        setCurrentTime(0);
                      }}
                    >
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {song.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        key={currentSong.id}
        ref={audioRef}
        src={currentSong.audio_url}
        preload="metadata"
      />
    </div>
  );
}
