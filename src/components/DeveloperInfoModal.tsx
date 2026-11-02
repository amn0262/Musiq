import React, { useState } from 'react';
import { X, Mail, Code, User, Smartphone, ChevronDown, ChevronUp, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface DeveloperInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperInfoModal: React.FC<DeveloperInfoModalProps> = ({ isOpen, onClose }) => {
  const [showTips, setShowTips] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Developer Information"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#13131a] border border-[#262638] rounded-2xl p-5 sm:p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-150 my-auto max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Developer Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mb-3.5 shadow-lg">
            <User className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            Aymen Bakkour
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Software Engineer & Creator of MUSIQ
          </p>

          <div className="w-full h-px bg-white/10 my-3.5" />

          {/* Contact Details */}
          <div className="w-full space-y-2 text-left text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-200 select-all font-mono truncate">
                aymenbakkour@gmail.com
              </span>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
              <Code className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-300">
                MUSIQ Minimalist Audio Platform
              </span>
            </div>
          </div>

          {/* Recommended Browser Card (Brave Browser for Background Audio) */}
          <div className="w-full mt-4 p-3.5 rounded-xl bg-gradient-to-b from-[#1a1824] to-[#12111a] border border-orange-500/30 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/30">
                  🦁
                </div>
                <h4 className="text-xs font-bold text-white">
                  Brave Browser (Recommended)
                </h4>
              </div>
              <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                Best Audio
              </span>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              This app works best on <strong>Brave Browser</strong> to allow continuous music playback in the background while your mobile phone screen is locked.
            </p>
            <p className="text-[10px] text-gray-400 leading-normal" dir="rtl">
              يعمل التطبيق على متصفح Brave بشكل أفضل لكي تستمر الموسيقى بالعمل في الخلفية أثناء قفل شاشة الجوال (تم ضبط رابط آيفون لمتجر ألمانيا 🇩🇪).
            </p>

            {/* Direct Download Links */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="https://apps.apple.com/de/app/brave-browser/id1052879175"
                target="_blank"
                rel="noopener noreferrer"
                title="Brave Browser (App Store Deutschland)"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/10 transition-colors"
              >
                <span>iPhone (DE 🇩🇪)</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.brave.browser&hl=de"
                target="_blank"
                rel="noopener noreferrer"
                title="Brave Browser (Google Play Germany)"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/10 transition-colors"
              >
                <span>Android (Play)</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </div>

            {/* Direct fallback / official website link */}
            <a
              href="https://brave.com/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-[10px] font-medium border border-orange-500/20 transition-colors w-full"
            >
              <span>الموقع الرسمي للتحميل المباشر (Brave Universal)</span>
              <ExternalLink className="w-2.5 h-2.5 text-orange-400" />
            </a>

            <div className="pt-1 border-t border-white/5 text-[10px] text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span>Enable: Brave Settings ➔ Media ➔ "Background Play"</span>
            </div>
          </div>

          {/* Quick Lock-Screen Playback Tips */}
          <div className="w-full mt-3">
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-gray-200 text-xs font-medium">
                  Other Mobile Background Methods
                </span>
              </div>
              {showTips ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>

            {showTips && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#0e0e14] border border-[#262638] space-y-2 text-[11px] text-gray-300 text-left animate-in fade-in duration-150">
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-white flex-shrink-0 mt-0.5" />
                  <span><strong>Chrome / Safari:</strong> Enable "Desktop Site" in browser menu, lock screen, then tap Play on the lock-screen widget.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-white flex-shrink-0 mt-0.5" />
                  <span><strong>Add to Home Screen:</strong> Install as Web App (PWA) from the browser menu for standalone audio priority.</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
