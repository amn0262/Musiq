import { Song } from '../types/music';

export interface AudioEngineCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onError?: (err: string) => void;
}

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private synthInterval: number | null = null;
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 0.85;
  private callbacks: AudioEngineCallbacks | null = null;
  private synthGainNode: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'auto';

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

      this.audio.addEventListener('error', () => {
        // Fallback to Web Audio Synth if external audio stream is blocked or unavailable
        console.warn('HTML5 Audio encountered an error, falling back to Web Audio Engine');
        this.startSynthPlayback();
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
      navigator.mediaSession.setActionHandler('play', () => {
        handlers.onPlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        handlers.onPause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlers.onPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handlers.onNext();
      });
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
      // Ignored if position update fails during seek
    }
  }

  public async loadAndPlay(song: Song, autoPlay = true) {
    this.stopSynth();
    this.currentSong = song;
    this.duration = song.duration || 180;
    this.currentTime = 0;
    this.updateMediaMetadata(song);

    if (song.audio_url && this.audio) {
      try {
        this.audio.src = song.audio_url;
        this.audio.volume = this.volume;
        if (autoPlay) {
          await this.audio.play();
          this.isPlaying = true;
          this.callbacks?.onPlayStateChange(true);
        }
        return;
      } catch (err) {
        console.warn('Could not play direct audio url, switching to Web Audio musical synth:', err);
      }
    }

    // High quality Web Audio ambient/melodic generation fallback for instant musical feedback
    if (autoPlay) {
      this.startSynthPlayback();
    }
  }

  public play() {
    if (this.currentSong && this.audio && this.audio.src && this.audio.src !== window.location.href) {
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.callbacks?.onPlayStateChange(true);
      }).catch(() => {
        this.startSynthPlayback();
      });
    } else if (this.currentSong) {
      this.startSynthPlayback();
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.audio) {
      this.audio.pause();
    }
    this.stopSynth();
    this.callbacks?.onPlayStateChange(false);
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.audio && this.audio.src && !isNaN(this.audio.duration)) {
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
    if (this.synthGainNode && this.audioCtx) {
      this.synthGainNode.gain.setValueAtTime(this.volume * 0.15, this.audioCtx.currentTime);
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

  /**
   * Generates pleasing melodic tones (Arabic Maqam / warm pop acoustic chords)
   * using Web Audio API when third-party CDN audio is not provided.
   */
  private startSynthPlayback() {
    this.stopSynth();
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.synthGainNode = this.audioCtx.createGain();
      this.synthGainNode.gain.setValueAtTime(this.volume * 0.12, this.audioCtx.currentTime);
      this.synthGainNode.connect(this.audioCtx.destination);

      // Oriental and Modern musical note frequencies (Hz)
      const isArabic = this.currentSong?.category === 'arabic' || this.currentSong?.category === 'classical';
      // Rast / Bayati inspired frequencies vs Lofi Minor
      const notes = isArabic
        ? [220, 247.5, 261.63, 293.66, 329.63, 349.23, 392, 440]
        : [261.63, 329.63, 392.00, 440.00, 523.25, 587.33];

      let step = 0;
      this.isPlaying = true;
      this.callbacks?.onPlayStateChange(true);

      const playNote = () => {
        if (!this.isPlaying || !this.audioCtx || !this.synthGainNode) return;
        
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        
        const noteFreq = notes[step % notes.length];
        step++;

        osc.type = isArabic ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(noteFreq, this.audioCtx.currentTime);

        noteGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.18, this.audioCtx.currentTime + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

        osc.connect(noteGain);
        noteGain.connect(this.synthGainNode);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.3);
      };

      playNote();
      this.synthInterval = window.setInterval(() => {
        if (!this.isPlaying) return;
        
        this.currentTime += 0.5;
        if (this.currentTime >= this.duration) {
          this.currentTime = 0;
          this.callbacks?.onEnded();
        } else {
          this.callbacks?.onTimeUpdate(this.currentTime, this.duration);
          this.updateMediaSessionPosition();
        }

        if (Math.floor(this.currentTime * 2) % 2 === 0) {
          playNote();
        }
      }, 500);

    } catch (e) {
      console.warn('Audio synth failed:', e);
      this.isPlaying = true;
      this.callbacks?.onPlayStateChange(true);
    }
  }

  private stopSynth() {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

export const audioEngine = new AudioEngine();
