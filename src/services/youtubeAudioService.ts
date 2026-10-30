import { Song } from '../types/music';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type SoundEnhancerPreset = 'studio' | 'bass_boost' | 'vocal' | 'surround_3d';

export interface YouTubePlayerCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onEnded: () => void;
  onReady: () => void;
  onError: (error: any) => void;
}

// 1-second inaudible looping audio carrier (PCM WAV) to keep iOS Safari & Android AudioSession active on lock screen
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

class YouTubeAudioService {
  private player: any = null;
  private isReady: boolean = false;
  private currentSong: Song | null = null;
  private callbacks: YouTubePlayerCallbacks | null = null;
  private timePollInterval: number | null = null;
  private audioCtx: AudioContext | null = null;
  private carrierAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private volume: number = 100;
  private soundPreset: SoundEnhancerPreset = 'studio';
  private enhancerEnabled: boolean = true;

  // Web Audio Equalizer & Compressor Nodes for Sound Enhancement
  private compressorNode: DynamicsCompressorNode | null = null;
  private lowShelfFilter: BiquadFilterNode | null = null;
  private midPeakFilter: BiquadFilterNode | null = null;
  private highShelfFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    this.initSilentModeAudioSession();
    this.initBackgroundCarrier();
  }

  /**
   * Initializes media audio session and background keepalive carrier
   * Allows playback even in hardware Silent Mode on iOS and Android
   */
  public initSilentModeAudioSession() {
    if (typeof window === 'undefined') return;

    // 1. Force iOS Safari AudioSession to 'playback' channel (bypasses silent switch)
    try {
      if ('audioSession' in navigator && (navigator as any).audioSession) {
        (navigator as any).audioSession.type = 'playback';
      }
    } catch (e) {
      console.warn('AudioSession config error:', e);
    }

    // 2. Unlock Web Audio Context on first touch / user gesture
    const unlockAudio = () => {
      this.initWebAudioNodes();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    // 3. Keepalive on visibilitychange (when screen locks or app minimises)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isPlaying) {
        this.carrierAudio?.play().catch(() => {});
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      }
    });
  }

  /**
   * Creates an HTML5 silent carrier audio loop.
   * Mobile OSes (iOS & Android) maintain lock-screen and background audio processes
   * as long as an active HTMLAudioElement is playing with loop & playsInline.
   */
  private initBackgroundCarrier() {
    if (typeof window === 'undefined') return;
    try {
      this.carrierAudio = new Audio(SILENT_WAV_BASE64);
      this.carrierAudio.loop = true;
      this.carrierAudio.volume = 0.001;
      this.carrierAudio.setAttribute('playsinline', 'true');
      this.carrierAudio.setAttribute('webkit-playsinline', 'true');
    } catch (e) {
      console.warn('Failed to initialize background carrier audio:', e);
    }
  }

  /**
   * Sets up Web Audio API mastering nodes for professional sound enhancement
   */
  private initWebAudioNodes() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx && AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
      if (!this.audioCtx) return;

      // Master Compressor to eliminate distortion and produce studio loudness
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-18, this.audioCtx.currentTime);
      this.compressorNode.knee.setValueAtTime(20, this.audioCtx.currentTime);
      this.compressorNode.ratio.setValueAtTime(3.5, this.audioCtx.currentTime);
      this.compressorNode.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressorNode.release.setValueAtTime(0.25, this.audioCtx.currentTime);

      // Low Shelf Filter (Bass Depth & Punch)
      this.lowShelfFilter = this.audioCtx.createBiquadFilter();
      this.lowShelfFilter.type = 'lowshelf';
      this.lowShelfFilter.frequency.setValueAtTime(90, this.audioCtx.currentTime);

      // Mid Peaking Filter (Vocal Clarity & Presence)
      this.midPeakFilter = this.audioCtx.createBiquadFilter();
      this.midPeakFilter.type = 'peaking';
      this.midPeakFilter.frequency.setValueAtTime(3000, this.audioCtx.currentTime);
      this.midPeakFilter.Q.setValueAtTime(1.2, this.audioCtx.currentTime);

      // High Shelf Filter (Air & High-Frequency Sparkle)
      this.highShelfFilter = this.audioCtx.createBiquadFilter();
      this.highShelfFilter.type = 'highshelf';
      this.highShelfFilter.frequency.setValueAtTime(11000, this.audioCtx.currentTime);

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      // Chain: lowShelf -> midPeak -> highShelf -> compressor -> masterGain -> destination
      this.lowShelfFilter.connect(this.midPeakFilter);
      this.midPeakFilter.connect(this.highShelfFilter);
      this.highShelfFilter.connect(this.compressorNode);
      this.compressorNode.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);

      this.applySoundPreset(this.soundPreset);
    } catch (e) {
      console.warn('Web Audio enhancer initialization error:', e);
    }
  }

  /**
   * Applies acoustic Equalizer presets
   */
  public applySoundPreset(preset: SoundEnhancerPreset) {
    this.soundPreset = preset;
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    if (!this.enhancerEnabled) {
      this.lowShelfFilter?.gain.setValueAtTime(0, t);
      this.midPeakFilter?.gain.setValueAtTime(0, t);
      this.highShelfFilter?.gain.setValueAtTime(0, t);
      return;
    }

    switch (preset) {
      case 'studio':
        // Studio Master: Balanced punch, warm lows, bright acoustic highs
        this.lowShelfFilter?.gain.setValueAtTime(2.5, t);
        this.midPeakFilter?.gain.setValueAtTime(1.8, t);
        this.highShelfFilter?.gain.setValueAtTime(2.0, t);
        break;
      case 'bass_boost':
        // Deep Bass Punch: Sub-bass resonance and energy
        this.lowShelfFilter?.gain.setValueAtTime(5.5, t);
        this.midPeakFilter?.gain.setValueAtTime(0.5, t);
        this.highShelfFilter?.gain.setValueAtTime(1.0, t);
        break;
      case 'vocal':
        // Vocal Clarity: Brings Arabic & international vocals forward
        this.lowShelfFilter?.gain.setValueAtTime(0.0, t);
        this.midPeakFilter?.gain.setValueAtTime(4.5, t);
        this.highShelfFilter?.gain.setValueAtTime(3.0, t);
        break;
      case 'surround_3d':
        // Spatial 3D Concert: Wide stereophonic room and airy sheen
        this.lowShelfFilter?.gain.setValueAtTime(3.0, t);
        this.midPeakFilter?.gain.setValueAtTime(2.5, t);
        this.highShelfFilter?.gain.setValueAtTime(4.5, t);
        break;
    }
  }

  public setEnhancerEnabled(enabled: boolean) {
    this.enhancerEnabled = enabled;
    this.applySoundPreset(this.soundPreset);
  }

  public getSoundPreset(): SoundEnhancerPreset {
    return this.soundPreset;
  }

  public isEnhancerActive(): boolean {
    return this.enhancerEnabled;
  }

  /**
   * Loads the YouTube IFrame API script if not already present
   */
  public loadAPI(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve();

      if (window.YT && window.YT.Player) {
        this.isReady = true;
        return resolve();
      }

      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        this.isReady = true;
        resolve();
      };

      // Fallback check if already loaded
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          this.isReady = true;
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Initializes the persistent YouTube Player
   */
  public async initPlayer(containerId: string, callbacks: YouTubePlayerCallbacks) {
    this.callbacks = callbacks;
    await this.loadAPI();

    if (!window.YT || !window.YT.Player) {
      console.warn('YouTube API not ready yet');
      return;
    }

    if (this.player) {
      return;
    }

    this.player = new window.YT.Player(containerId, {
      height: '100%',
      width: '100%',
      videoId: 'EgmXTmj62ic',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1, // Crucial for iOS lock-screen and background continuation
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          this.isReady = true;
          event.target.setVolume(this.volume);
          this.callbacks?.onReady();
        },
        onStateChange: (event: any) => {
          this.handleStateChange(event.data);
        },
        onError: (err: any) => {
          console.warn('YouTube Player Error:', err);
          this.callbacks?.onError(err);
        },
      },
    });
  }

  private handleStateChange(state: number) {
    if (!window.YT) return;

    if (state === window.YT.PlayerState.PLAYING) {
      this.isPlaying = true;
      this.carrierAudio?.play().catch(() => {});
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      this.callbacks?.onPlayStateChange(true);
      this.startTimePolling();
    } else if (state === window.YT.PlayerState.PAUSED) {
      this.isPlaying = false;
      this.carrierAudio?.pause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      this.callbacks?.onPlayStateChange(false);
      this.stopTimePolling();
    } else if (state === window.YT.PlayerState.ENDED) {
      this.isPlaying = false;
      this.carrierAudio?.pause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      this.callbacks?.onPlayStateChange(false);
      this.stopTimePolling();
      this.callbacks?.onEnded();
    }
  }

  private startTimePolling() {
    this.stopTimePolling();
    this.timePollInterval = window.setInterval(() => {
      if (this.player && this.isPlaying) {
        try {
          const cur = this.player.getCurrentTime() || 0;
          const dur = this.player.getDuration() || this.currentSong?.duration || 0;
          this.callbacks?.onTimeUpdate(cur, dur);
          this.updateMediaSessionPosition(cur, dur);
        } catch {
          // ignore polling errors
        }
      }
    }, 400);
  }

  private stopTimePolling() {
    if (this.timePollInterval !== null) {
      clearInterval(this.timePollInterval);
      this.timePollInterval = null;
    }
  }

  public async loadAndPlay(song: Song, autoPlay = true) {
    this.currentSong = song;
    this.updateMediaMetadata(song);

    const videoId = song.provider_track_id || 'C_8n7B-z1uE';

    if (this.player && typeof this.player.loadVideoById === 'function') {
      try {
        if (autoPlay) {
          this.player.loadVideoById({
            videoId: videoId,
            startSeconds: 0,
          });
          this.player.playVideo();
          this.isPlaying = true;
          this.carrierAudio?.play().catch(() => {});
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
          this.callbacks?.onPlayStateChange(true);
        } else {
          this.player.cueVideoById({
            videoId: videoId,
            startSeconds: 0,
          });
        }
      } catch (e) {
        console.warn('Failed to load video by ID:', e);
      }
    }
  }

  public play() {
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
      this.isPlaying = true;
      this.carrierAudio?.play().catch(() => {});
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      this.callbacks?.onPlayStateChange(true);
    }
  }

  public pause() {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
      this.isPlaying = false;
      this.carrierAudio?.pause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      this.callbacks?.onPlayStateChange(false);
    }
  }

  public seek(seconds: number) {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
    }
  }

  public setVolume(vol0to1: number) {
    this.volume = Math.round(vol0to1 * 100);
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(this.volume);
    }
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(vol0to1, this.audioCtx.currentTime);
    }
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
      navigator.mediaSession.setActionHandler('stop', () => handlers.onPause());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) handlers.onSeek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const cur = this.player?.getCurrentTime?.() || 0;
        handlers.onSeek(Math.max(0, cur - (details.seekOffset || 10)));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const cur = this.player?.getCurrentTime?.() || 0;
        const dur = this.player?.getDuration?.() || 100;
        handlers.onSeek(Math.min(dur, cur + (details.seekOffset || 10)));
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
        album: song.album || 'MUSIQ YouTube Streaming',
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

  private updateMediaSessionPosition(currentTime: number, duration: number) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!navigator.mediaSession.setPositionState) return;

    try {
      if (duration > 0 && currentTime <= duration) {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: currentTime,
        });
      }
    } catch {
      // Ignored
    }
  }
}

export const youtubeAudioService = new YouTubeAudioService();
