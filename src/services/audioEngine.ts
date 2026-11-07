import { Song } from '../types/music';
import { youtubeAudioService } from './youtubeAudioService';

export interface AudioEngineCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onError?: (err: string) => void;
}

/**
 * AudioEngine acts as a unified facade that delegates all playback directly
 * to YouTubeAudioService, ensuring 100% authentic YouTube audio streaming
 * with no local mock MP3 fallbacks.
 */
class AudioEngineFacade {
  public setCallbacks(callbacks: AudioEngineCallbacks) {
    // Synchronized with youtubeAudioService in MusicContext
  }

  public setMediaSessionHandlers(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (seconds: number) => void;
  }) {
    youtubeAudioService.setMediaSessionHandlers(handlers);
  }

  public updateMediaMetadata(song: Song) {
    youtubeAudioService.updateMediaMetadata(song);
  }

  public async loadAndPlay(song: Song, autoPlay = true) {
    return youtubeAudioService.loadAndPlay(song, autoPlay);
  }

  public play() {
    youtubeAudioService.play();
  }

  public pause() {
    youtubeAudioService.pause();
  }

  public seek(seconds: number, allowSeekAhead = true) {
    youtubeAudioService.seek(seconds, allowSeekAhead);
  }

  public setVolume(val: number) {
    youtubeAudioService.setVolume(val);
  }

  public getVolume(): number {
    return youtubeAudioService.getVolume();
  }

  public getCurrentTime(): number {
    return youtubeAudioService.getCurrentTime();
  }

  public getDuration(): number {
    return youtubeAudioService.getDuration();
  }

  public getIsPlaying(): boolean {
    return youtubeAudioService.getIsPlaying();
  }
}

export const audioEngine = new AudioEngineFacade();
