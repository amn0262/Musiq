import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Music, Info, Sliders } from 'lucide-react';
import { DeveloperInfoModal } from './DeveloperInfoModal';

export const Header: React.FC = () => {
  const { setActiveTab, openSoundEnhancer, soundEnhancerEnabled } = useMusic();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#0c0c10] border-b border-[#1f1f2c] px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => setActiveTab('search')}
            className="flex items-center gap-2.5 group text-left transition-transform active:scale-95 cursor-pointer"
            aria-label="MUSIQ"
          >
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-sm">
              <Music className="w-4 h-4 text-black" />
            </div>
            <span className="text-base font-bold tracking-wider text-white">
              MUSIQ
            </span>
          </button>

          {/* Right: Sound Effects & Info Icon Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={openSoundEnhancer}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                soundEnhancerEnabled ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Sound Effects & Equalizer"
              title="Sound Effects & Equalizer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsInfoOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Developer Info"
              title="Developer Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <DeveloperInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </>
  );
};
