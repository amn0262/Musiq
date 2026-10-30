import React from 'react';
import { useMusic } from '../context/MusicContext';
import { SoundEnhancerPreset, youtubeAudioService } from '../services/youtubeAudioService';
import {
  Sparkles,
  Sliders,
  Check,
  X,
  Volume2,
  Lock,
  Headphones,
  Zap,
  Radio,
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
    isRTL,
    t,
  } = useMusic();

  if (!isOpen) return null;

  const presets: {
    id: SoundEnhancerPreset;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    badgeAr: string;
    badgeEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'studio',
      titleAr: 'ستوديو ماسترينغ الاحترافي',
      titleEn: 'Pro Studio Master',
      descAr: 'معايرة صوتية متوازنة تمنح نقاءً عالي الدقة وتوزيعاً ديناميكياً ناعماً',
      descEn: 'Mastering grade balanced acoustic profile with studio-level clarity',
      badgeAr: 'الأكثر توازناً',
      badgeEn: 'Balanced',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'bass_boost',
      titleAr: 'مضخم البيس والجهير العميق',
      titleEn: 'Deep Bass & Low Punch',
      descAr: 'تعزيز قوي لترددات الساب-بيس (Sub-Bass) مع الحفاظ على صفاء الألحان',
      descEn: 'Enhanced low frequencies (+5.5dB) for punchy kick drums & rich sub-bass',
      badgeAr: 'إيقاع قوي',
      badgeEn: 'Punchy',
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'vocal',
      titleAr: 'وضوح ونقاء الأصوات الطربية',
      titleEn: 'Vocal Clarity Pro',
      descAr: 'إبراز الحناجر الطربية والغناء بوضوح استثنائي لكلمات الأغاني',
      descEn: 'Boosts vocal presence and lyric intelligibility for both Arabic and global hits',
      badgeAr: 'غناء نقي',
      badgeEn: 'Vocal Focus',
      icon: <Headphones className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'surround_3d',
      titleAr: 'صوت محيطي ومسرحي 3D',
      titleEn: 'Spatial 3D Concert',
      descAr: 'توسيع استريو محيطي يحاكي حضور الحفلات المباشرة وقاعات الأوبرا',
      descEn: 'Psychoacoustic soundstage widening creating an immersive concert atmosphere',
      badgeAr: 'محيطي 3D',
      badgeEn: 'Immersive',
      icon: <Radio className="w-5 h-5 text-pink-400" />,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sound Enhancer & Lock Screen Controls"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#14141e] border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-purple-950/60 overflow-hidden space-y-5">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {isRTL ? 'مُحسّن الصوت والـ EQ الذكي' : 'Smart Audio Enhancer & EQ'}
              </h2>
              <p className="text-xs text-gray-400">
                {isRTL
                  ? 'تحسين جودة الصوت والتشغيل عند قفل الشاشة'
                  : 'High-definition mastering & lock-screen playback'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Lock-Screen & Silent Mode Confirmation Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#1a1628] to-[#12121e] border border-purple-500/30 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">
                {isRTL ? 'استمرار التشغيل عند قفل الشاشة نشط' : 'Lock-Screen Playback Active'}
              </p>
              <p className="text-[11px] text-gray-400">
                {isRTL
                  ? 'يواصل التطبيق تشغيل الصوت حتى عند قفل الهاتف أو وضعه بالوضع الصامت'
                  : 'Plays continuously even when the screen is locked or phone is silenced'}
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 flex-shrink-0 ms-2">
            <Check className="w-3 h-3" />
            <span>{isRTL ? 'مفعّل' : 'Active'}</span>
          </span>
        </div>

        {/* Equalizer Waveform Animation & Master Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#101016] border border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-5 px-1">
              <span
                className={`w-1 rounded-full bg-purple-400 transition-all ${
                  isPlaying && soundEnhancerEnabled ? 'animate-bounce h-5' : 'h-2'
                }`}
              />
              <span
                className={`w-1 rounded-full bg-cyan-400 transition-all ${
                  isPlaying && soundEnhancerEnabled ? 'animate-bounce [animation-delay:-0.2s] h-4' : 'h-3'
                }`}
              />
              <span
                className={`w-1 rounded-full bg-indigo-400 transition-all ${
                  isPlaying && soundEnhancerEnabled ? 'animate-bounce [animation-delay:-0.4s] h-5' : 'h-1.5'
                }`}
              />
              <span
                className={`w-1 rounded-full bg-pink-400 transition-all ${
                  isPlaying && soundEnhancerEnabled ? 'animate-bounce [animation-delay:-0.1s] h-3' : 'h-2.5'
                }`}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {isRTL ? 'تفعيل تقنية تحسين الصوت HD' : 'HD Sound Processing'}
              </p>
              <p className="text-[10px] text-gray-400 font-mono">
                {soundEnhancerEnabled ? 'Dynamic Compressor + 3-Band Biquad Active' : 'Bypassed / Flat'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleSoundEnhancer}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              soundEnhancerEnabled
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {soundEnhancerEnabled ? (isRTL ? 'مُفعّل' : 'ON') : (isRTL ? 'معطّل' : 'OFF')}
          </button>
        </div>

        {/* Sound Presets List */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar">
          {presets.map((p) => {
            const isSelected = soundEnhancerPreset === p.id && soundEnhancerEnabled;
            return (
              <button
                key={p.id}
                onClick={() => setSoundEnhancerPreset(p.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/50'
                    : 'bg-[#181824] hover:bg-[#1f1f2e] border-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 ${
                      isSelected ? 'bg-purple-600/30 text-white' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {p.icon}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isSelected ? 'text-purple-300' : 'text-white'
                        }`}
                      >
                        {isRTL ? p.titleAr : p.titleEn}
                      </h4>
                      <span className="text-[10px] font-semibold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">
                        {isRTL ? p.badgeAr : p.badgeEn}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {isRTL ? p.descAr : p.descEn}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/40'
                      : 'border border-white/20'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Done / Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98]"
          >
            {isRTL ? 'حفظ وتطبيق إعدادات الصوت' : 'Apply Sound Enhancements'}
          </button>
        </div>
      </div>
    </div>
  );
};
