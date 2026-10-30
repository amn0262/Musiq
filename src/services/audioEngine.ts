import { Song } from '../types/music';

export interface AudioEngineCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onError?: (err: string) => void;
}

// High-fidelity fallback audio bank when third-party direct stream is absent
const AUDIO_STREAM_BANK: Record<string, string> = {
  classical: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  arabic: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3',
  pop: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  rap: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  relaxing: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  international: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  trending: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  all: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
};

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 0.85;
  private callbacks: AudioEngineCallbacks | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.setAttribute('playsinline', 'true');
      this.audio.setAttribute('webkit-playsinline', 'true');

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) {
          this.currentTime = this.audio.currentTime;
          this.duration = this.audio.duration || this.currentSong?.duration || 0;
          this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
          this.updateMediaSessionPosition();
        }
      });

      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.callbacks?.onPlayStateChange(false);
        this.callbacks?.onEnded();
      });

      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.callbacks?.onPlayStateChange(true);
      });

      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.callbacks?.onPlayStateChange(false);
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('HTML5 Audio error, trying fallback stream:', e);
        this.tryFallbackStream();
      });
    }
  }

  public setCallbacks(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  public setMediaSessionHandlers(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (seconds: number) => void;
  }) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => handlers.onPlay());
      navigator.mediaSession.setActionHandler('pause', () => handlers.onPause());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlers.onPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => handlers.onNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          handlers.onSeek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        handlers.onSeek(Math.max(0, this.currentTime - skipTime));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        handlers.onSeek(Math.min(this.duration, this.currentTime + skipTime));
      });
    } catch (e) {
      console.warn('MediaSession handler error:', e);
    }
  }

  public updateMediaMetadata(song: Song) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.titleAr ? `${song.title} (${song.titleAr})` : song.title,
        artist: song.artistAr ? `${song.artist} (${song.artistAr})` : song.artist,
        album: song.album || 'MUSIQ Streaming',
        artwork: [
          { src: song.artwork_url, sizes: '96x96', type: 'image/jpeg' },
          { src: song.artwork_url, sizes: '128x128', type: 'image/jpeg' },
          { src: song.artwork_url, sizes: '256x256', type: 'image/jpeg' },
          { src: song.artwork_url, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    } catch (e) {
      console.warn('Failed to update MediaSession metadata', e);
    }
  }

  private updateMediaSessionPosition() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!navigator.mediaSession.setPositionState) return;

    try {
      if (this.duration > 0 && this.currentTime <= this.duration) {
        navigator.mediaSession.setPositionState({
          duration: this.duration,
          playbackRate: 1,
          position: this.currentTime,
        });
      }
    } catch {
      // Ignored
    }
  }

  private resolveSongAudioUrl(song: Song): string {
    if (song.audio_url) return song.audio_url;
    const cat = song.category || 'all';
    return AUDIO_STREAM_BANK[cat] || AUDIO_STREAM_BANK.all;
  }

  public async loadAndPlay(song: Song, autoPlay = true) {
    this.currentSong = song;
    this.duration = song.duration || 180;
    this.currentTime = 0;
    this.updateMediaMetadata(song);

    const streamUrl = this.resolveSongAudioUrl(song);

    if (this.audio) {
      try {
        if (this.audio.src !== streamUrl) {
          this.audio.src = streamUrl;
          this.audio.volume = this.volume;
          this.audio.load();
        }
        if (autoPlay) {
          await this.audio.play();
          this.isPlaying = true;
          this.callbacks?.onPlayStateChange(true);
        }
      } catch (err) {
        console.warn('Audio playback play() error, trying fallback:', err);
        this.tryFallbackStream();
      }
    }
  }

  private tryFallbackStream() {
    if (!this.audio || !this.currentSong) return;
    const fallback = AUDIO_STREAM_BANK.all;
    if (this.audio.src !== fallback) {
      this.audio.src = fallback;
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.callbacks?.onPlayStateChange(true);
      }).catch(() => {});
    }
  }

  public play() {
    if (this.audio) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.callbacks?.onPlayStateChange(true);
      }).catch((e) => {
        console.warn('Play was prevented by browser policy:', e);
      });
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
    }
    this.callbacks?.onPlayStateChange(false);
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.audio && !isNaN(this.audio.duration)) {
      this.audio.currentTime = this.currentTime;
    }
    this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
    this.updateMediaSessionPosition();
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(val, 1));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();
