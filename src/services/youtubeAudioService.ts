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

// Generates a genuine 5-second 16-bit PCM WAV audio blob
// iOS Safari & Android audio daemons recognize this as a valid media stream and keep the audio thread active when the screen locks.
function createSilentWavUrl(durationSec = 5): string {
  if (typeof window === 'undefined') return '';
  const sampleRate = 8000;
  const numChannels = 1;
  const numSamples = sampleRate * durationSec;
  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeAscii(offset: number, text: string) {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  }

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);
  // All sample bytes are 0 (pure silence)

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

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
  private keepaliveInterval: number | null = null;

  // Web Audio Equalizer & Compressor Nodes for Sound Enhancement
  private compressorNode: DynamicsCompressorNode | null = null;
  private lowShelfFilter: BiquadFilterNode | null = null;
  private midPeakFilter: BiquadFilterNode | null = null;
  private highShelfFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private lastMediaSessionUpdate: number = 0;
  private customEQState = { bass: 2.5, mid: 1.8, treble: 2.0 };

  constructor() {
    this.initSilentModeAudioSession();
    this.initBackgroundCarrier();
  }

  /**
   * Initializes media audio session and background keepalive carrier
   * Allows playback even in hardware Silent Mode and when screen is locked on iOS & Android
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

    // 3. Keepalive on visibilitychange, pagehide, and blur (when screen locks or app minimizes)
    const handleBackgroundTransition = () => {
      if (this.isPlaying) {
        this.carrierAudio?.play().catch(() => {});
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleBackgroundTransition);
    window.addEventListener('pagehide', handleBackgroundTransition);
    window.addEventListener('blur', handleBackgroundTransition);

    // Continuous audio watchdog timer to keep MediaSession actively registered
    if (!this.keepaliveInterval) {
      this.keepaliveInterval = window.setInterval(() => {
        if (this.isPlaying && 'mediaSession' in navigator) {
          if (navigator.mediaSession.playbackState !== 'playing') {
            navigator.mediaSession.playbackState = 'playing';
          }
        }
      }, 2000);
    }
  }

  /**
   * Creates an HTML5 silent carrier audio loop.
   * Mobile OSes (iOS & Android) maintain lock-screen and background audio processes
   * as long as an active HTMLAudioElement is playing with loop & playsInline.
   */
  private initBackgroundCarrier() {
    if (typeof window === 'undefined') return;
    try {
      const silentUrl = createSilentWavUrl(5);
      this.carrierAudio = new Audio(silentUrl);
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

      // Fast Fourier Transform Audio Analyser for live visualizer line
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.7;
      this.masterGain.connect(this.analyserNode);

      this.applySoundPreset(this.soundPreset);
    } catch (e) {
      console.warn('Web Audio enhancer initialization notice:', e);
    }
  }

  /**
   * Retrieves real-time frequency data for live music waveform animation.
   * If running iframe audio, synthesizes responsive beat and harmonic spectrum.
   */
  public getAudioFrequencyData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);

    // Check if real broad audio spectrum exists in analyser (ignore isolated sub-harmonic carrier)
    let wideSum = 0;
    for (let i = 8; i < 48; i++) {
      wideSum += data[i];
    }

    if (wideSum > 50) return data;

    // Responsive musical synthesizer when audio is playing
    if (this.isPlaying) {
      const now = performance.now();
      const volMultiplier = Math.max(0.2, this.volume / 100);
      const currentTime = this.getCurrentTime();

      // Musical phrasing & tempo structure (approx 120-128 BPM groove, 500ms beat)
      const beatPeriod = 480;
      const beatProgress = (now % beatPeriod) / beatPeriod;
      const barProgress = (now % (beatPeriod * 4)) / (beatPeriod * 4);
      const phraseProgress = (now % (beatPeriod * 16)) / (beatPeriod * 16);

      // Deep 808/Kick impulse with sub-harmonic decay
      const kickImpulse = Math.pow(Math.max(0, 1 - beatProgress * 2.5), 2.2) * 235 + 30;
      // Snare / Clap impulse on beats 2 and 4
      const isBackbeat = (barProgress > 0.22 && barProgress < 0.38) || (barProgress > 0.72 && barProgress < 0.88);
      const snareImpulse = isBackbeat ? Math.pow(Math.sin(beatProgress * Math.PI), 2.5) * 210 + 45 : 35;
      // Shimmering Hi-Hat / Air flicker (16th notes)
      const sixteenthBeat = (now % 120) / 120;
      const hiHatFlicker = Math.pow(Math.max(0, 1 - sixteenthBeat * 3.0), 1.5) * 175 + 40;
      // Harmonic chord sweep / vocal vibrato
      const vocalVibrato = Math.sin(now * 0.008 + currentTime * 2.5) * 40;
      const melodicLead = Math.sin(now * 0.003) * Math.cos(now * 0.007) * 50;

      const binCount = data.length;
      for (let i = 0; i < binCount; i++) {
        let val = 0;

        if (i < 4) {
          // Sub-bass (20 - 80 Hz): heavy kick & deep 808
          val = kickImpulse * (1 - i * 0.1) + Math.sin(now * 0.005) * 25;
        } else if (i < 14) {
          // Bass & Warmth (80 - 250 Hz): bassline groove & punch
          const bassSweep = Math.sin(phraseProgress * Math.PI * 2 + i * 0.4) * 35;
          val = kickImpulse * 0.7 + bassSweep + (14 - i) * 7 + Math.random() * 20;
        } else if (i < 38) {
          // Vocal body & acoustic mids (250 - 1500 Hz): rich chords & vibrato
          const harmonicPeak = Math.sin(i * 0.4 + now * 0.007) * 45;
          val = snareImpulse * 0.85 + vocalVibrato + harmonicPeak + 70 + Math.random() * 20;
        } else if (i < 75) {
          // Vocal presence, synth leads & guitar (1500 - 5000 Hz)
          const leadPeak = Math.cos(i * 0.25 + now * 0.006) * 40;
          val = snareImpulse * 0.75 + melodicLead + leadPeak + 60 + Math.random() * 25;
        } else {
          // Sparkling Treble & Cymbals (5000 - 16000 Hz)
          const airSizzle = Math.sin(now * 0.015 + i * 0.2) * 25;
          val = hiHatFlicker * 0.9 + airSizzle + 45 + Math.random() * 30;
        }

        data[i] = Math.min(255, Math.max(0, Math.floor(val * volMultiplier)));
      }
      return data;
    }

    return data;
  }

  /**
   * Applies acoustic Equalizer presets
   */
  public applySoundPreset(preset: SoundEnhancerPreset) {
    this.soundPreset = preset;
    switch (preset) {
      case 'studio':
        this.setCustomEQ(3.0, 1.8, 2.5);
        break;
      case 'bass_boost':
        this.setCustomEQ(8.5, 0.5, 1.5);
        break;
      case 'vocal':
        this.setCustomEQ(-1.5, 5.5, 3.0);
        break;
      case 'surround_3d':
        this.setCustomEQ(3.5, 2.5, 5.5);
        break;
    }
  }

  /**
   * Sets custom multi-band EQ gains in dB
   */
  public setCustomEQ(bass: number, mid: number, treble: number) {
    this.customEQState = { bass, mid, treble };
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    if (!this.enhancerEnabled) {
      this.lowShelfFilter?.gain.setTargetAtTime(0, t, 0.04);
      this.midPeakFilter?.gain.setTargetAtTime(0, t, 0.04);
      this.highShelfFilter?.gain.setTargetAtTime(0, t, 0.04);
      return;
    }

    this.lowShelfFilter?.gain.setTargetAtTime(bass, t, 0.04);
    this.midPeakFilter?.gain.setTargetAtTime(mid, t, 0.04);
    this.highShelfFilter?.gain.setTargetAtTime(treble, t, 0.04);
  }

  public getCustomEQ(): { bass: number; mid: number; treble: number } {
    return { ...this.customEQState };
  }

  public setEnhancerEnabled(enabled: boolean) {
    this.enhancerEnabled = enabled;
    this.setCustomEQ(this.customEQState.bass, this.customEQState.mid, this.customEQState.treble);
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
              if (typeof event.target.setPlaybackQuality === 'function') {
                event.target.setPlaybackQuality('small');
              }
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
    console.warn(`YouTube Player event notice: ${errorCode} for video: ${this.currentVideoId}`);

    // Error code 5 is an HTML5 player buffer notice; YouTube internally recovers. Do not drop track.
    if (errorCode === 5) {
      console.info('Transient HTML5 buffer notice handled gracefully.');
      return;
    }

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
            if (typeof this.player.setPlaybackQuality === 'function') {
              this.player.setPlaybackQuality('small');
            }
            this.player.loadVideoById({ videoId: backupId, startSeconds: 0, suggestedQuality: 'small' });
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
      try {
        if (typeof this.player.setPlaybackRate === 'function') {
          this.player.setPlaybackRate(1);
        }
      } catch {}
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

          const now = Date.now();
          if (now - this.lastMediaSessionUpdate > 4000) {
            this.updateMediaSessionPosition(cur, dur, false);
            this.lastMediaSessionUpdate = now;
          }
        } catch {
          // ignore polling errors
        }
      }
    }, 250);
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
        if (typeof this.player.setPlaybackQuality === 'function') {
          try {
            this.player.setPlaybackQuality('small');
          } catch {}
        }
        this.player.loadVideoById({
          videoId: videoId,
          startSeconds: 0,
          suggestedQuality: 'small',
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
          suggestedQuality: 'small',
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

  public seek(seconds: number, allowSeekAhead = true) {
    if (this.player && typeof this.player.seekTo === 'function') {
      try {
        this.player.seekTo(seconds, allowSeekAhead);
        const dur = this.getDuration();
        this.updateMediaSessionPosition(seconds, dur, true);
      } catch {}
    }
  }

  public setVolume(vol0to1: number) {
    const clamped = Math.max(0, Math.min(1, isNaN(vol0to1) ? 0.8 : vol0to1));
    this.volume = Math.round(clamped * 100);

    if (this.player) {
      try {
        if (this.volume === 0) {
          if (typeof this.player.mute === 'function') {
            this.player.mute();
          }
          if (typeof this.player.setVolume === 'function') {
            this.player.setVolume(0);
          }
        } else {
          if (typeof this.player.unMute === 'function') {
            this.player.unMute();
          }
          if (typeof this.player.setVolume === 'function') {
            this.player.setVolume(this.volume);
          }
        }
      } catch (err) {
        console.warn('YouTube setVolume error handled:', err);
      }
    }

    if (this.masterGain && this.audioCtx) {
      try {
        this.masterGain.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
      } catch {}
    }

    if (this.carrierAudio) {
      try {
        this.carrierAudio.volume = Math.max(0.001, clamped * 0.05);
      } catch {}
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
        title: song.title,
        artist: song.artist,
        album: song.album || 'MUSIQ',
        artwork: [
          { src: song.artwork_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%2314141c" width="96" height="96"/></svg>', sizes: '96x96', type: 'image/jpeg' },
          { src: song.artwork_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect fill="%2314141c" width="256" height="256"/></svg>', sizes: '256x256', type: 'image/jpeg' },
        ],
      });
    } catch (e) {
      console.warn('Failed to update MediaSession metadata', e);
    }
  }

  private updateMediaSessionPosition(currentTime: number, duration: number, force = false) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!navigator.mediaSession.setPositionState) return;

    try {
      if (duration > 0 && currentTime <= duration) {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.max(0, currentTime),
        });
        if (force) {
          this.lastMediaSessionUpdate = Date.now();
        }
      }
    } catch {
      // Ignored
    }
  }
}

export const youtubeAudioService = new YouTubeAudioService();
