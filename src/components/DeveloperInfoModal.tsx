import React, { useState } from 'react';
import { X, Mail, Code, User, Smartphone, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface DeveloperInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperInfoModal: React.FC<DeveloperInfoModalProps> = ({ isOpen, onClose }) => {
  const [showTips, setShowTips] = useState(false);

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
        className="w-full max-w-sm bg-[#13131a] border border-[#262638] rounded-2xl p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Developer Avatar / Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mb-4 shadow-lg">
            <User className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            Aymen Bakkour
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Software Engineer & Creator of MUSIQ
          </p>

          <div className="w-full h-px bg-white/10 my-4" />

          {/* Details */}
          <div className="w-full space-y-2.5 text-left text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-200 select-all font-mono truncate">
                aymenbakkour@gmail.com
              </span>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
              <Code className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-300">
                MUSIQ Minimalist Audio Platform
              </span>
            </div>

            {/* Mobile Background Playback Guide Button */}
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-300" />
                <span className="text-gray-200 font-medium">
                  Mobile Lock Screen Playback
                </span>
              </div>
              {showTips ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Expandable Tips */}
            {showTips && (
              <div className="p-3 rounded-xl bg-[#0e0e14] border border-[#262638] space-y-2 text-[11px] text-gray-300 animate-in fade-in duration-200">
                <p className="font-semibold text-white">How to keep playing with screen locked:</p>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-white flex-shrink-0 mt-0.5" />
                    <span><strong>Desktop Site:</strong> Enable "Desktop Site" in Chrome/Safari, start playing, then lock screen and hit Play on lock-screen widget.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-white flex-shrink-0 mt-0.5" />
                    <span><strong>Add to Home Screen:</strong> Install as Web App from browser menu for persistent audio prioritization.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-white flex-shrink-0 mt-0.5" />
                    <span><strong>Brave Mobile:</strong> Enable "Background Play" in Brave Settings for uninterrupted automatic background audio.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
