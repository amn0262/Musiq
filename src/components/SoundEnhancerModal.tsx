import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { SoundEnhancerPreset, youtubeAudioService } from '../services/youtubeAudioService';
import {
  Sliders,
  Check,
  X,
  Sparkles,
  Zap,
  Headphones,
  Radio,
  RotateCcw,
} from 'lucide-react';

interface SoundEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundEnhancerModal: React.FC<SoundEnhancerModalProps> = ({ isOpen, onClose }) => {
  const {
    soundEnhancerPreset,
    setSoundEnhancerPreset,
    soundEnhancerEnabled,
    toggleSoundEnhancer,
    isPlaying,
  } = useMusic();

  const [customEQ, setCustomEQState] = useState<{ bass: number; mid: number; treble: number }>(() =>
    youtubeAudioService.getCustomEQ()
  );

  // Synchronize when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomEQState(youtubeAudioService.getCustomEQ());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const presets: {
    id: SoundEnhancerPreset;
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'studio',
      title: 'Studio Master',
      description: 'Balanced studio-grade acoustic profile',
      badge: 'Balanced',
      icon: <Sparkles className="w-4 h-4 text-white" />,
    },
    {
      id: 'bass_boost',
      title: 'Bass Boost',
      description: 'Deep low-end punch & sub-bass warmth',
      badge: '+8.5 dB',
      icon: <Zap className="w-4 h-4 text-white" />,
    },
    {
      id: 'vocal',
      title: 'Vocal Clarity',
      description: 'Crisp vocal definition & lyric presence',
      badge: 'Vocal Focus',
      icon: <Headphones className="w-4 h-4 text-white" />,
    },
    {
      id: 'surround_3d',
      title: 'Spatial 3D',
      description: 'Expansive binaural stereo soundstage',
      badge: 'Immersive',
      icon: <Radio className="w-4 h-4 text-white" />,
    },
  ];

  const handlePresetSelect = (id: SoundEnhancerPreset) => {
    setSoundEnhancerPreset(id);
    setTimeout(() => {
      setCustomEQState(youtubeAudioService.getCustomEQ());
    }, 10);
  };

  const handleSliderChange = (band: 'bass' | 'mid' | 'treble', value: number) => {
    const updated = { ...customEQ, [band]: value };
    setCustomEQState(updated);
    youtubeAudioService.setCustomEQ(updated.bass, updated.mid, updated.treble);
  };

  const handleResetFlat = () => {
    const flat = { bass: 0, mid: 0, treble: 0 };
    setCustomEQState(flat);
    youtubeAudioService.setCustomEQ(0, 0, 0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sound Effects & Equalizer"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#13131c] border border-[#222230] rounded-2xl p-5 sm:p-6 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222230]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md">
              <Sliders className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Sound Effects & EQ
              </h2>
              <p className="text-xs text-gray-400">
                Acoustic mastering & tone shaping
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Power Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e0e14] border border-[#222230]">
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-4 px-1">
              {[1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlaying && soundEnhancerEnabled
                      ? 'bg-white animate-pulse'
                      : 'bg-white/20 h-1.5'
                  }`}
                  style={{
                    height: isPlaying && soundEnhancerEnabled ? `${(bar * 4) + 4}px` : '4px',
                    animationDelay: `${bar * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Sound Processing
              </p>
              <p className="text-[10px] text-gray-400 font-mono">
                {soundEnhancerEnabled ? 'Dynamic Equalizer Active' : 'Bypassed / Flat'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleSoundEnhancer}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              soundEnhancerEnabled
                ? 'bg-white text-black shadow'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {soundEnhancerEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Presets Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Acoustic Presets
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => {
              const isSelected = soundEnhancerPreset === p.id && soundEnhancerEnabled;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#1e1e2c] border-white text-white'
                      : 'bg-[#101016] border-[#222230] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-white text-black' : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      {p.icon}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold truncate">{p.title}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      {p.badge}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual 3-Band Equalizer Sliders */}
        <div className="p-3.5 rounded-xl bg-[#0e0e14] border border-[#222230] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              3-Band Equalizer
            </h3>
            <button
              onClick={handleResetFlat}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Bass */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Bass (Low Shelf 90Hz)</span>
              <span className="font-mono text-gray-400">
                {customEQ.bass > 0 ? `+${customEQ.bass.toFixed(1)}` : customEQ.bass.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={customEQ.bass}
              disabled={!soundEnhancerEnabled}
              onChange={(e) => handleSliderChange('bass', parseFloat(e.target.value))}
              className="w-full h-1 accent-white cursor-pointer disabled:opacity-30"
            />
          </div>

          {/* Mids */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Mids (Vocals 3kHz)</span>
              <span className="font-mono text-gray-400">
                {customEQ.mid > 0 ? `+${customEQ.mid.toFixed(1)}` : customEQ.mid.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={customEQ.mid}
              disabled={!soundEnhancerEnabled}
              onChange={(e) => handleSliderChange('mid', parseFloat(e.target.value))}
              className="w-full h-1 accent-white cursor-pointer disabled:opacity-30"
            />
          </div>

          {/* Treble */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Treble (High Shelf 11kHz)</span>
              <span className="font-mono text-gray-400">
                {customEQ.treble > 0 ? `+${customEQ.treble.toFixed(1)}` : customEQ.treble.toFixed(1)} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={customEQ.treble}
              disabled={!soundEnhancerEnabled}
              onChange={(e) => handleSliderChange('treble', parseFloat(e.target.value))}
              className="w-full h-1 accent-white cursor-pointer disabled:opacity-30"
            />
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-bold transition-colors cursor-pointer shadow-lg"
        >
          Apply & Close
        </button>
      </div>
    </div>
  );
};
