import React from 'react';
import { useMusic } from '../context/MusicContext';
import { Music } from 'lucide-react';

export const Header: React.FC = () => {
  const { setActiveTab } = useMusic();

  return (
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
      </div>
    </header>
  );
};
