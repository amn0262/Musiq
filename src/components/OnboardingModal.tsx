import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Gender } from '../types/music';
import { getTimeGreeting } from '../utils/greeting';
import {
  Sparkles,
  Music,
  User,
  Check,
  Search,
  Timer,
  ListMusic,
  Headphones,
  ArrowRight,
  ArrowLeft,
  Flame,
  Volume2,
  Heart,
} from 'lucide-react';

interface GenreOption {
  id: string;
  nameAr: string;
  nameEn: string;
  subtitleAr: string;
  subtitleEn: string;
  emoji: string;
  color: string;
}

const GENRE_OPTIONS: GenreOption[] = [
  {
    id: 'arabic_tarab',
    nameAr: 'طرب أصيل وزمن الفن الجميل',
    nameEn: 'Authentic Tarab Classics',
    subtitleAr: 'أم كلثوم، عبد الحليم، وردة، عبد الوهاب',
    subtitleEn: 'Umm Kulthum, Abdel Halim, Warda',
    emoji: '🎻',
    color: 'from-amber-600/30 to-amber-950/40 border-amber-500/40',
  },
  {
    id: 'fairuz_classics',
    nameAr: 'فيروزيات وكلاسيكيات هادئة',
    nameEn: 'Fairuz & Serene Mornings',
    subtitleAr: 'فيروز، ماجدة الرومي، وديع الصافي',
    subtitleEn: 'Fairuz, Majida El Roumi, Wadih',
    emoji: '☕',
    color: 'from-sky-600/30 to-sky-950/40 border-sky-500/40',
  },
  {
    id: 'arabic_pop',
    nameAr: 'بوب عربي وموسيقى شبابية',
    nameEn: 'Modern Arabic Pop',
    subtitleAr: 'عمرو دياب، إليسا، تامر حسني، نانسي',
    subtitleEn: 'Amr Diab, Elissa, Tamer Hosny',
    emoji: '✨',
    color: 'from-purple-600/30 to-purple-950/40 border-purple-500/40',
  },
  {
    id: 'khaleeji',
    nameAr: 'خليجي وسامريات راقية',
    nameEn: 'Khaleeji & Royal Melodies',
    subtitleAr: 'محمد عبده، ماجد المهندس، الجسمي',
    subtitleEn: 'Mohamed Abdu, Majid Al Mohandis',
    emoji: '🌙',
    color: 'from-emerald-600/30 to-emerald-950/40 border-emerald-500/40',
  },
  {
    id: 'shaabi_mahraganat',
    nameAr: 'شعبي ومهرجانات حماسية',
    nameEn: 'Shaabi & Energetic Beats',
    subtitleAr: 'أحمد شيبة، حكيم، رضا البحراوي',
    subtitleEn: 'Shaabi, Festive Egyptian Grooves',
    emoji: '🔥',
    color: 'from-rose-600/30 to-rose-950/40 border-rose-500/40',
  },
  {
    id: 'rap_hiphop',
    nameAr: 'راب وهيب هوب عربي وعالمي',
    nameEn: 'Arabic & Global Hip-Hop',
    subtitleAr: 'ويجز، مروان بابلو، إلتينو، ترافيس سكوت',
    subtitleEn: 'Wegz, Marwan Pablo, ElGrandeToto',
    emoji: '🎤',
    color: 'from-red-600/30 to-red-950/40 border-red-500/40',
  },
  {
    id: 'sufi_andalusian',
    nameAr: 'صوفي وموشحات أندلسية',
    nameEn: 'Sufi & Andalusian Poetry',
    subtitleAr: 'النقشبندي، سامي يوسف، مقامات روحانية',
    subtitleEn: 'Sufi Hymns, Andalusian Muwashshahat',
    emoji: '🕊️',
    color: 'from-teal-600/30 to-teal-950/40 border-teal-500/40',
  },
  {
    id: 'relaxing_instrumental',
    nameAr: 'استرخاء وعزف عود وبيانو',
    nameEn: 'Relaxing & Solo Instrumental',
    subtitleAr: 'تقاسيم عود، قانون هادئ، بيانو راقٍ',
    subtitleEn: 'Oud improvisations, Piano ambience',
    emoji: '🎹',
    color: 'from-indigo-600/30 to-indigo-950/40 border-indigo-500/40',
  },
  {
    id: 'international_pop_rock',
    nameAr: 'بوب وروك عالمي',
    nameEn: 'International Pop & Rock',
    subtitleAr: 'The Weeknd, Coldplay, Adele, Billie Eilish',
    subtitleEn: 'Global Top Hits & Rock Ballads',
    emoji: '🌍',
    color: 'from-blue-600/30 to-blue-950/40 border-blue-500/40',
  },
  {
    id: 'turkish_oriental',
    nameAr: 'موسيقى تركية وشرقية',
    nameEn: 'Turkish & Anatolian Melodies',
    subtitleAr: 'إبراهيم تاتليسس، سيزين أكسو، باغلما',
    subtitleEn: 'Ibrahim Tatlises, Sezen Aksu',
    emoji: '🪕',
    color: 'from-orange-600/30 to-orange-950/40 border-orange-500/40',
  },
];

export const OnboardingModal: React.FC = () => {
  const { user, completeOnboarding, isTourOpen, closeTour, isRTL } = useMusic();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(user.name !== 'صديق MUSIQ' ? user.name : '');
  const [gender, setGender] = useState<Gender>(user.gender || 'male');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    user.preferredGenres && user.preferredGenres.length > 0
      ? user.preferredGenres
      : ['arabic_tarab', 'fairuz_classics', 'arabic_pop']
  );
  const [currentTourSlide, setCurrentTourSlide] = useState(0);

  // If user completed onboarding and tour is not manually requested, do not render
  if (user.onboardingCompleted && !isTourOpen) {
    return null;
  }

  const liveGreeting = getTimeGreeting(name || (isRTL ? 'ضيفنا العزيز' : 'Guest'), gender, new Date(), isRTL ? 'ar' : 'en');

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        // keep at least 1
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  const handleFinish = () => {
    completeOnboarding(
      name.trim() || (isRTL ? 'عاشق الموسيقى' : 'Music Lover'),
      gender,
      selectedGenres
    );
  };

  const tourSlides = [
    {
      title: isRTL ? 'البحث الذكي الفوري من يوتيوب' : 'Instant YouTube Smart Discovery',
      badge: isRTL ? 'بحث واقتراحات لحظية' : 'Live Suggestions & Playback',
      description: isRTL
        ? 'اكتب أي أغنية أو فنان أو ألبوم بالعربية أو الإنجليزية، وستظهر لك اقتراحات فورية واكتشف ملايين المقاطع والأغاني مع تشغيل صوتي نقي ومباشر.'
        : 'Search for any song, artist, or album in Arabic or English with instant suggestions and direct high-fidelity playback.',
      icon: Search,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      title: isRTL ? 'اقتراحات تتجدد كل 3 دقائق مع زر المفضلة' : 'Auto-Refreshed Suggestions Every 3 Minutes',
      badge: isRTL ? 'مخصصة لذوقك' : 'Tailored to your taste',
      description: isRTL
        ? 'بناءً على أنواع الموسيقى التي اخترتها، تقوم الصفحة الرئيسية بتجديد باقة أغاني عشوائية مميزة كل 3 دقائق، مع زر قلب لإضافة أي أغنية لمفضلتك فوراً بنقرة واحدة.'
        : 'Every 3 minutes, the Home screen rotates a fresh selection of songs tailored to your selected genres, with instant one-tap Add to Favorites.',
      icon: Timer,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      title: isRTL ? 'قوائم تشغيل خاصة بك بالكامل' : '100% Personal & Custom Playlists',
      badge: isRTL ? 'قوائم فارغة جاهزة لإبداعك' : 'Empty slate for your custom mixes',
      description: isRTL
        ? 'أفرغنا قوائم التشغيل تماماً لتكون لك حرية صناعة قوائمك من الصفر؛ سمّ قائمتك، وأضف أغانيك المفضلة، ورتّبها واستمع إليها في أي وقت.'
        : 'Playlists are completely yours to curate from scratch. Create, rename, reorder, and shuffle your own personal collections without restrictions.',
      icon: ListMusic,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: isRTL ? 'تشغيل مستمر عند قفل الشاشة والوضع الصامت' : 'Uninterrupted Background & Lock-Screen Playback',
      badge: isRTL ? 'صوت لا ينقطع أبداً' : 'MediaSession & Silent Mode ready',
      description: isRTL
        ? 'استمتع بأغانيك حتى عند إغلاق شاشة الموبايل أو تفعيل وضع الهاتف الصامت؛ مع تحكم كامل من شاشة القفل، سماعات البلوتوث، ومعادل صوت استوديو احترافي.'
        : 'Keep listening seamlessly when your screen is locked or silenced, with native lock-screen remote controls and studio mastering audio enhancement.',
      icon: Headphones,
      color: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#14141e] border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-950/60 overflow-hidden text-white">
        
        {/* Top Progress & Step Bar */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide">
                {step === 1 && (isRTL ? 'الخطوة 1: مرحباً بك في MUSIQ' : 'Step 1: Welcome to MUSIQ')}
                {step === 2 && (isRTL ? 'الخطوة 2: ذوقك الموسيقي المفضل' : 'Step 2: Your Preferred Genres')}
                {step === 3 && (isRTL ? 'الخطوة 3: جولة سريعة في التطبيق' : 'Step 3: Quick App Tour')}
              </h2>
              <p className="text-xs text-gray-400">
                {step === 1 && (isRTL ? 'أدخل اسمك وجنسك لتخصيص التحية' : 'Enter your name and gender for customized greetings')}
                {step === 2 && (isRTL ? 'اختر تصنيفاتك المفضلة للاقتراحات' : 'Choose genres for 3-minute recommendations')}
                {step === 3 && (isRTL ? 'تعرف على أهم مزايا مشغل الموسيقى' : 'Discover the most powerful features')}
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s
                    ? 'w-6 bg-gradient-to-r from-purple-500 to-cyan-400'
                    : step > s
                    ? 'w-2 bg-purple-600'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 no-scrollbar">

          {/* STEP 1: Name and Gender */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Dynamic Live Greeting Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 via-[#1c182c] to-[#12121c] border border-purple-500/30 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center flex-shrink-0 text-xl">
                  {liveGreeting.icon === 'sun' && '☀️'}
                  {liveGreeting.icon === 'cloud-sun' && '🌤️'}
                  {liveGreeting.icon === 'moon' && '🌙'}
                  {liveGreeting.icon === 'sparkles' && '✨'}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                    {isRTL ? 'تحية التطبيق اللحظية لك حسب التوقيت' : 'Live Personalized Time Greeting'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5 truncate">
                    {liveGreeting.greeting}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {liveGreeting.subGreeting}
                  </p>
                </div>
              </div>

              {/* Name Input Field */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-gray-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>{isRTL ? 'ما هو اسمك الكريم؟' : 'What is your display name?'}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRTL ? 'مثال: أحمد، سارة، مروان، نور...' : 'e.g. Alex, Sarah, Omar...'}
                  className="w-full bg-[#0d0d14] border-2 border-white/10 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none transition-all placeholder:text-gray-500"
                  autoFocus
                />
              </div>

              {/* Gender Radio Selector */}
              <div className="space-y-2.5">
                <label className="text-xs sm:text-sm font-bold text-gray-200 block">
                  {isRTL ? 'النوع (لتخصيص صيغة التحية الودية باللغة العربية):' : 'Gender (for personalized Arabic phrasing):'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-start ${
                      gender === 'male'
                        ? 'bg-purple-950/50 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                        : 'bg-[#0e0e16] border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl">👨</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">
                        {isRTL ? 'ذكر' : 'Male'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isRTL ? 'صيغة: عزيزي [الاسم]' : 'Addressed as Dear Sir'}
                      </p>
                    </div>
                    {gender === 'male' && (
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-start ${
                      gender === 'female'
                        ? 'bg-pink-950/50 border-pink-500 text-white shadow-lg shadow-pink-900/30'
                        : 'bg-[#0e0e16] border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl">👩</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">
                        {isRTL ? 'أنثى' : 'Female'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isRTL ? 'صيغة: عزيزتي [الاسم]' : 'Addressed as Dear Madam'}
                      </p>
                    </div>
                    {gender === 'female' && (
                      <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white flex-shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preferred Music Genres Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-cyan-400" />
                    <span>{isRTL ? 'ما هي ألوانك الموسيقية المفضلة؟' : 'Select your favorite genres'}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isRTL
                      ? 'سنقوم بتوليد اقتراحات الصفحة الرئيسية وتحديثها كل ٣ دقائق بناءً على هذه الاختيارات'
                      : 'We rotate recommendations every 3 minutes tailored to these preferences'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  {selectedGenres.length} {isRTL ? 'مختارة' : 'selected'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto pr-1">
                {GENRE_OPTIONS.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-start relative overflow-hidden group ${
                        isSelected
                          ? `bg-gradient-to-r ${genre.color} text-white shadow-md ring-1 ring-purple-400/50`
                          : 'bg-[#101018] border-white/5 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        {genre.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">
                          {isRTL ? genre.nameAr : genre.nameEn}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {isRTL ? genre.subtitleAr : genre.subtitleEn}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'border-white/20 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Guided App Tour */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Tour Slides Carousel */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#181826] to-[#0f0f16] border border-white/10 p-6 sm:p-7 space-y-4 shadow-xl">
                {tourSlides.map((slide, idx) => {
                  if (idx !== currentTourSlide) return null;
                  const Icon = slide.icon;

                  return (
                    <div key={idx} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center text-white shadow-lg`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold border border-white/10">
                          {slide.badge}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-lg sm:text-xl font-black text-white">
                          {slide.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                          {slide.description}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Tour Indicators & Navigation buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    {tourSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentTourSlide(i)}
                        className={`h-2 rounded-full transition-all ${
                          currentTourSlide === i ? 'w-6 bg-cyan-400' : 'w-2 bg-white/20'
                        }`}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentTourSlide === 0}
                      onClick={() => setCurrentTourSlide((prev) => Math.max(0, prev - 1))}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300 transition-colors"
                      aria-label="Previous slide"
                    >
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    </button>
                    <button
                      type="button"
                      disabled={currentTourSlide === tourSlides.length - 1}
                      onClick={() => setCurrentTourSlide((prev) => Math.min(tourSlides.length - 1, prev + 1))}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300 transition-colors"
                      aria-label="Next slide"
                    >
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Highlights Feature Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-[#11111a] border border-white/5">
                  <Search className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="font-bold text-gray-200">{isRTL ? 'بحث لحظي' : 'Instant Search'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#11111a] border border-white/5">
                  <Timer className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <span className="font-bold text-gray-200">{isRTL ? 'تجدد كل ٣ دقائق' : '3-Min Refresh'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#11111a] border border-white/5">
                  <ListMusic className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="font-bold text-gray-200">{isRTL ? 'قوائمك الحصرية' : 'Custom Lists'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#11111a] border border-white/5">
                  <Headphones className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                  <span className="font-bold text-gray-200">{isRTL ? 'قفل الشاشة' : 'Lock-Screen'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-5 sm:p-6 border-t border-white/5 bg-[#101018] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isRTL ? 'السابق' : 'Back'}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95 ms-auto"
            >
              <span>{isRTL ? 'التالي' : 'Next'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-sm sm:text-base font-black shadow-xl shadow-purple-600/40 flex items-center gap-2 transition-all active:scale-95 ms-auto"
            >
              <Sparkles className="w-5 h-5 text-cyan-200 animate-pulse" />
              <span>{isRTL ? 'ابدأ الاستماع الآن واستمتع' : 'Start Listening Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
