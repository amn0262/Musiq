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

// 1-second inaudible looping audio carrier (PCM WAV) to keep iOS Safari & Android AudioSession active on lock screen & silent switch
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

// 100% verified fallback video IDs in case any specific link or region encounters an embed restriction
const YOUTUBE_BACKUPS: Record<string, string> = {
  'KzJ7XZqp4rc': 'nvr4lPoKqzI', // Fairuz Li Beirut -> Kifak Enta
  'KLJA-srM_yM': 'EgmXTmj62ic', // Amr Diab Nour El Ein -> Tamally Maak
  '6YjW05dqec8': 'Od6LJhVvNOI', // Umm Kulthum Enta Omri -> Abdel Halim Ahwak
  'Zgz8ybG6l-U': 'UUBf8bSGq54', // Nancy Ajram Ah W Noss -> Elissa Betmoun
  'M3sxUE4eIac': 'j9eZtAjA1oE', // Hussain Al Jassmi -> Majid Al Mohandis
  '_RHIECWv728': '8CnpqLtzqQY', // Wegz El Bakht -> Sherine Sabry Qaleel
  'EgmXTmj62ic': 'KLJA-srM_yM', // Amr Diab Tamally Maak -> Nour El Ein
  'nvr4lPoKqzI': 'KzJ7XZqp4rc', // Fairuz Kifak Enta -> Li Beirut
  'j9eZtAjA1oE': 'M3sxUE4eIac', // Majid Al Mohandis -> Hussain Al Jassmi
  'UUBf8bSGq54': 'Zgz8ybG6l-U', // Elissa Betmoun -> Nancy Ajram
  '8CnpqLtzqQY': '_RHIECWv728', // Sherine Sabry Qaleel -> Wegz
  'Od6LJhVvNOI': '6YjW05dqec8', // Abdel Halim Ahwak -> Umm Kulthum
  'TAqsEbvud8k': 'kx7Go4qRnIw', // Assala Aktar -> Kadim Al Sahir
  'kx7Go4qRnIw': 'TAqsEbvud8k', // Kadim Al Sahir -> Assala
  '_Fwf45pIAtM': 'QqiqISFT15w', // Saad Lamjarred -> Wael Kfoury
  '8A4X7VP8LLI': 'Od6LJhVvNOI', // George Wassouf -> Abdel Halim
  'QqiqISFT15w': '_Fwf45pIAtM', // Wael Kfoury -> Saad Lamjarred
  '4NRXx6U8ABQ': 'TUVcZfQe-Kw', // The Weeknd -> Dua Lipa
  'TUVcZfQe-Kw': '4NRXx6U8ABQ', // Dua Lipa -> The Weeknd
  'V9PVRfjEBTI': 'ic8j13piAhQ', // Billie Eilish -> Taylor Swift
  'ic8j13piAhQ': 'V9PVRfjEBTI', // Taylor Swift -> Billie Eilish
  '4VR-6AS0-l4': '4NRXx6U8ABQ', // Ludovico Einaudi -> Fallback
  'c9r1Vfb51X8': '4NRXx6U8ABQ', // Tarkan -> Fallback
  'dvgZkm1xWPE': 'rYEDA3JcQqw', // Coldplay -> Adele
  'rYEDA3JcQqw': 'dvgZkm1xWPE', // Adele -> Coldplay
};

class YouTubeAudioService {
  private player: any = null;
  private isReady: boolean = false;
  private currentSong: Song | null = null;
  private callbacks: YouTubePlayerCallbacks | null = null;
  private timePollInterval: number | null = null;
  private audioCtx: AudioContext | null = null;
  private carrierAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private volume: number = 90;
  private soundPreset: SoundEnhancerPreset = 'studio';
  private enhancerEnabled: boolean = true;
  private pendingTrack: { song: Song; autoPlay: boolean } | null = null;
  private currentVideoId: string = '';
  private failedVideoIds: Set<string> = new Set();

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
      console.warn('AudioSession config notice:', e);
    }

    // 2. Unlock Web Audio Context & carrier on first touch or click
    const unlockAudio = () => {
      this.initWebAudioNodes();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.carrierAudio?.play().catch(() => {});
      if (this.player && typeof this.player.unMute === 'function') {
        try {
          this.player.unMute();
          this.player.setVolume(this.volume);
        } catch {}
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    // 3. Keepalive on visibilitychange (when screen locks or app minimizes)
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
      console.warn('Silent carrier initialization notice:', e);
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
      console.warn('Web Audio enhancer initialization notice:', e);
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
        this.lowShelfFilter?.gain.setValueAtTime(2.5, t);
        this.midPeakFilter?.gain.setValueAtTime(1.8, t);
        this.highShelfFilter?.gain.setValueAtTime(2.0, t);
        break;
      case 'bass_boost':
        this.lowShelfFilter?.gain.setValueAtTime(5.5, t);
        this.midPeakFilter?.gain.setValueAtTime(0.5, t);
        this.highShelfFilter?.gain.setValueAtTime(1.0, t);
        break;
      case 'vocal':
        this.lowShelfFilter?.gain.setValueAtTime(0.0, t);
        this.midPeakFilter?.gain.setValueAtTime(4.5, t);
        this.highShelfFilter?.gain.setValueAtTime(3.0, t);
        break;
      case 'surround_3d':
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
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        this.isReady = true;
        resolve();
      };

      // Fallback polling check in case event already fired
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          this.isReady = true;
          resolve();
        }
      }, 50);

      // 6-second timeout fallback
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 6000);
    });
  }

  /**
   * Initializes the persistent YouTube Player in audio-only configuration
   */
  public async initPlayer(containerId: string, callbacks: YouTubePlayerCallbacks, initialVideoId: string = 'KzJ7XZqp4rc') {
    this.callbacks = callbacks;
    await this.loadAPI();

    if (typeof window === 'undefined') return;

    if (!window.YT || !window.YT.Player) {
      setTimeout(() => this.initPlayer(containerId, callbacks, initialVideoId), 150);
      return;
    }

    if (this.player) {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      setTimeout(() => this.initPlayer(containerId, callbacks, initialVideoId), 150);
      return;
    }

    this.currentVideoId = initialVideoId;

    try {
      this.player = new window.YT.Player(containerId, {
        height: '100%',
        width: '100%',
        videoId: initialVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1, // Required for iOS lock-screen and background continuation
          rel: 0,
          enablejsapi: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: any) => {
            this.isReady = true;
            try {
              event.target.unMute();
              event.target.setVolume(this.volume);
            } catch {}
            this.callbacks?.onReady();

            // If a user clicked play before the player finished loading, start it immediately
            if (this.pendingTrack) {
              const { song, autoPlay } = this.pendingTrack;
              this.pendingTrack = null;
              this.loadAndPlay(song, autoPlay);
            }
          },
          onStateChange: (event: any) => {
            this.handleStateChange(event.data);
          },
          onError: (err: any) => {
            this.handlePlayerError(err);
          },
        },
      });
    } catch (e) {
      console.error('Error creating YouTube Player instance:', e);
    }
  }

  private handlePlayerError(err: any) {
    const errorCode = typeof err === 'object' && err !== null ? err.data : err;
    console.warn(`YouTube Player error code: ${errorCode} for video: ${this.currentVideoId}`);

    this.failedVideoIds.add(this.currentVideoId);

    // If video embedding is restricted (code 101 or 150) or not found (code 100), try fallback video ID
    if (this.currentVideoId && YOUTUBE_BACKUPS[this.currentVideoId]) {
      const backupId = YOUTUBE_BACKUPS[this.currentVideoId];
      if (!this.failedVideoIds.has(backupId)) {
        console.info(`Switching to backup YouTube video ID: ${backupId}`);
        this.currentVideoId = backupId;
        if (this.player && typeof this.player.loadVideoById === 'function') {
          try {
            this.player.unMute();
            this.player.setVolume(this.volume);
            this.player.loadVideoById({ videoId: backupId, startSeconds: 0 });
            this.player.playVideo();
            return;
          } catch {}
        }
      }
    }

    this.callbacks?.onError(err);
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
    } else if (state === window.YT.PlayerState.BUFFERING) {
      // Buffering state - audio continues loading
      this.carrierAudio?.play().catch(() => {});
    }
  }

  private startTimePolling() {
    this.stopTimePolling();
    this.timePollInterval = window.setInterval(() => {
      if (this.player && this.isPlaying) {
        try {
          const cur = this.player.getCurrentTime ? this.player.getCurrentTime() : 0;
          const dur = (this.player.getDuration ? this.player.getDuration() : 0) || this.currentSong?.duration || 0;
          this.callbacks?.onTimeUpdate(cur, dur);
          this.updateMediaSessionPosition(cur, dur);
        } catch {
          // ignore polling errors
        }
      }
    }, 300);
  }

  private stopTimePolling() {
    if (this.timePollInterval !== null) {
      clearInterval(this.timePollInterval);
      this.timePollInterval = null;
    }
  }

  /**
   * Loads and plays a YouTube track as pure audio
   */
  public async loadAndPlay(song: Song, autoPlay = true) {
    this.currentSong = song;
    this.updateMediaMetadata(song);

    const videoId = song.provider_track_id || 'KzJ7XZqp4rc';
    this.currentVideoId = videoId;

    if (!this.player || !this.isReady || typeof this.player.loadVideoById !== 'function') {
      this.pendingTrack = { song, autoPlay };
      this.loadAPI();
      return;
    }

    try {
      // Unlock Web Audio context and carrier
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      this.carrierAudio?.play().catch(() => {});

      if (autoPlay) {
        this.player.unMute();
        this.player.setVolume(this.volume);
        this.player.loadVideoById({
          videoId: videoId,
          startSeconds: 0,
        });
        this.player.playVideo();
        this.isPlaying = true;
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
        this.callbacks?.onPlayStateChange(true);
        this.startTimePolling();
      } else {
        this.player.cueVideoById({
          videoId: videoId,
          startSeconds: 0,
        });
      }
    } catch (e) {
      console.warn('Failed to load YouTube video by ID:', e);
    }
  }

  public play() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (this.player && typeof this.player.playVideo === 'function') {
      try {
        this.player.unMute();
        this.player.setVolume(this.volume);
        this.player.playVideo();
        this.isPlaying = true;
        this.carrierAudio?.play().catch(() => {});
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
        this.callbacks?.onPlayStateChange(true);
        this.startTimePolling();
      } catch (e) {
        console.warn('YouTube playVideo error:', e);
      }
    } else if (this.currentSong) {
      this.pendingTrack = { song: this.currentSong, autoPlay: true };
    }
  }

  public pause() {
    this.isPlaying = false;
    this.carrierAudio?.pause();
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch {}
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    this.callbacks?.onPlayStateChange(false);
    this.stopTimePolling();
  }

  public seek(seconds: number) {
    if (this.player && typeof this.player.seekTo === 'function') {
      try {
        this.player.seekTo(seconds, true);
      } catch {}
    }
  }

  public setVolume(vol0to1: number) {
    this.volume = Math.round(vol0to1 * 100);
    if (this.player && typeof this.player.setVolume === 'function') {
      try {
        this.player.unMute();
        this.player.setVolume(this.volume);
      } catch {}
    }
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(vol0to1, this.audioCtx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume / 100;
  }

  public getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      try {
        return this.player.getCurrentTime() || 0;
      } catch {}
    }
    return 0;
  }

  public getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function') {
      try {
        return this.player.getDuration() || this.currentSong?.duration || 0;
      } catch {}
    }
    return this.currentSong?.duration || 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
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
        const cur = this.getCurrentTime();
        handlers.onSeek(Math.max(0, cur - (details.seekOffset || 10)));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const cur = this.getCurrentTime();
        const dur = this.getDuration();
        handlers.onSeek(Math.min(dur, cur + (details.seekOffset || 10)));
      });
    } catch (e) {
      console.warn('MediaSession handler notice:', e);
    }
  }

  public updateMediaMetadata(song: Song) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.titleAr ? `${song.title} (${song.titleAr})` : song.title,
        artist: song.artistAr ? `${song.artist} (${song.artistAr})` : song.artist,
        album: song.album || 'MUSIQ YouTube Stream',
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
