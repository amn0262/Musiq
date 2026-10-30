import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { AppSettings } from '../services/storage';
import { Gender } from '../types/music';
import {
  Globe,
  Sliders,
  Volume2,
  Shield,
  Trash2,
  Info,
  Check,
  UserCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    user,
    updateUser,
    clearHistory,
    openTour,
    isRTL,
    t,
  } = useMusic();

  const [userName, setUserName] = useState(user.name);
  const [userGender, setUserGender] = useState<Gender>(user.gender || 'male');
  const [userEmail, setUserEmail] = useState(user.email);
  const [profileSaved, setProfileSaved] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name: userName.trim(), gender: userGender, email: userEmail.trim() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleClearCache = () => {
    clearHistory();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <div className="space-y-6 pb-32 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{t('settings_title')}</h1>
          <p className="text-xs text-gray-400 mt-1">
            {isRTL ? 'تخصيص تجربة الاستماع والمظهر واللغة والتحية' : 'Personalize your playback, appearance, and audio'}
          </p>
        </div>
        <button
          onClick={openTour}
          className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isRTL ? 'إعادة جولة التطبيق' : 'Replay App Tour'}</span>
        </button>
      </div>

      {/* User Profile Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#161622] border border-white/10 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/50"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">{user.name}</h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30">
                {user.plan}
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">
                {isRTL ? 'الاسم' : 'Display Name'}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-[#101014] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">
                {isRTL ? 'النوع (للتحية)' : 'Gender'}
              </label>
              <select
                value={userGender}
                onChange={(e) => setUserGender(e.target.value as Gender)}
                className="w-full bg-[#101014] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="male">{isRTL ? 'ذكر (عزيزي)' : 'Male'}</option>
                <option value="female">{isRTL ? 'أنثى (عزيزتي)' : 'Female'}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">
                {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-[#101014] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {profileSaved ? <Check className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              <span>{profileSaved ? (isRTL ? 'تم الحفظ!' : 'Saved!') : (isRTL ? 'تحديث الحساب' : 'Update Profile')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Background Playback & Lock-Screen Audio Engine */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#181524] to-[#12121a] border border-purple-500/30 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-xs">
              YT
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isRTL ? 'التشغيل بالخلفية وقفل الشاشة والوضع الصامت' : 'Background, Lock-Screen & Silent Audio Engine'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {isRTL
                  ? 'يواصل التطبيق تشغيل الصوت الرسمي حتى عند قفل شاشة الهاتف أو كتم صوت الرنين'
                  : 'Official background streaming stays active when screen is locked or silenced'}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" />
            <span>{isRTL ? 'مفعّل ونشط' : 'Active'}</span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#101014]/60 border border-white/5 space-y-2 text-xs text-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{isRTL ? 'قناة الصوت المحمية:' : 'Audio Session:'}</span>
            <span className="font-mono text-purple-300 font-bold">Playback Carrier (Continuous on Lock)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{isRTL ? 'أزرار شاشة القفل والبلوتوث:' : 'Lock-Screen & Bluetooth Controls:'}</span>
            <span className="font-mono text-emerald-300 font-bold">MediaSession Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{isRTL ? 'البحث الفوري والاقتراحات:' : 'Instant Auto-Suggest & Play:'}</span>
            <span className="font-mono text-cyan-300 font-bold">Real-time YouTube Streaming API</span>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="p-5 rounded-3xl bg-[#161622] border border-white/10 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>{t('settings_lang')}</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateSettings({ language: 'ar' })}
            className={`p-3.5 rounded-2xl border text-center transition-all ${
              settings.language === 'ar'
                ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-lg shadow-purple-600/30'
                : 'bg-[#101014] border-white/5 text-gray-300 hover:border-white/20'
            }`}
          >
            <p className="text-base font-arabic font-bold">العربية</p>
            <p className="text-[11px] opacity-80 mt-0.5">كامل محاذاة من اليمين (RTL)</p>
          </button>

          <button
            onClick={() => updateSettings({ language: 'en' })}
            className={`p-3.5 rounded-2xl border text-center transition-all ${
              settings.language === 'en'
                ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-lg shadow-purple-600/30'
                : 'bg-[#101014] border-white/5 text-gray-300 hover:border-white/20'
            }`}
          >
            <p className="text-base font-bold">English</p>
            <p className="text-[11px] opacity-80 mt-0.5">Left-to-Right (LTR)</p>
          </button>
        </div>
      </div>

      {/* Audio Playback Quality */}
      <div className="p-5 rounded-3xl bg-[#161622] border border-white/10 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>{t('settings_quality')}</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: '320', label: '320 kbps', sub: isRTL ? 'فائق النقاء (Hi-Fi)' : 'Ultra Hi-Fi' },
            { id: '192', label: '192 kbps', sub: isRTL ? 'عالي الجودة' : 'High Quality' },
            { id: '96', label: '96 kbps', sub: isRTL ? 'توفير البيانات' : 'Data Saver' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => updateSettings({ audioQuality: item.id as AppSettings['audioQuality'] })}
              className={`p-3 rounded-2xl border text-center transition-all ${
                settings.audioQuality === item.id
                  ? 'bg-purple-950/50 border-purple-500 text-purple-200 font-bold ring-1 ring-purple-500'
                  : 'bg-[#101014] border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <p className="text-xs sm:text-sm font-bold">{item.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Equalizer Presets */}
      <div className="p-5 rounded-3xl bg-[#161622] border border-white/10 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>{t('settings_equalizer')}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'tarab_oriental', label: isRTL ? 'طرب ومقام شرقي' : 'Tarab & Oriental Maqam' },
            { id: 'bass_boost', label: isRTL ? 'تعزيز الباس (Bass)' : 'Bass Boost' },
            { id: 'vocal', label: isRTL ? 'وضوح الصوت والكلمات' : 'Vocal Clarity' },
            { id: 'acoustic', label: isRTL ? 'عود وأكوستيك' : 'Acoustic / Strings' },
            { id: 'flat', label: isRTL ? 'قياسي (Flat)' : 'Flat' },
          ].map((eq) => (
            <button
              key={eq.id}
              onClick={() => updateSettings({ equalizer: eq.id as AppSettings['equalizer'] })}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                settings.equalizer === eq.id
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 font-bold'
                  : 'bg-[#101014] border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <p className="text-xs font-semibold">{eq.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Data Management & Cache */}
      <div className="p-5 rounded-3xl bg-[#161622] border border-white/10 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>{t('settings_clear_data')}</span>
        </h3>
        <p className="text-xs text-gray-400">
          {isRTL
            ? 'يقوم هذا الخيار بمسح سجل الأغاني المستمع إليها وسجل البحث المحلي.'
            : 'Removes your recently played listening history and search cache from this device.'}
        </p>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          {cacheCleared ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
          <span>{cacheCleared ? (isRTL ? 'تم المسح بنجاح' : 'Cleared!') : (isRTL ? 'مسح السجل الآن' : 'Clear Cache Now')}</span>
        </button>
      </div>

      {/* About MUSIQ & Compliance */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#161622] to-[#121218] border border-white/10 space-y-2.5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">{t('settings_about')}</h3>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          <strong>MUSIQ</strong> is an authorized smart music streaming application engineered for
          Arabic and international discovery. YouTube discovery features utilize the official YouTube
          Data API v3 and embedded official playback without stream extraction, scraping, or bypassing
          platform restrictions.
        </p>
        <p className="text-[11px] text-gray-500 font-mono">
          MUSIQ Version 2.4.0 • Built with React, TypeScript & Web Audio
        </p>
      </div>
    </div>
  );
};
