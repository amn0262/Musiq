import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { X, Plus, Check, Music2 } from 'lucide-react';

export const AddToPlaylistModal: React.FC = () => {
  const {
    isAddToPlaylistOpen,
    closeAddToPlaylist,
    songForPlaylistModal,
    playlists,
    addSongToPlaylist,
    createPlaylist,
    isRTL,
    t,
  } = useMusic();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isAddToPlaylistOpen || !songForPlaylistModal) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    const res = addSongToPlaylist(playlistId, songForPlaylistModal.id);
    if (res.success) {
      setFeedback(isRTL ? 'تمت إضافة الأغنية بنجاح!' : 'Song added to playlist!');
      setTimeout(() => {
        setFeedback(null);
        closeAddToPlaylist();
      }, 1000);
    } else {
      setFeedback(res.message || 'Already in playlist');
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl = createPlaylist(newPlaylistName.trim());
    addSongToPlaylist(newPl.id, songForPlaylistModal.id);
    setNewPlaylistName('');
    setFeedback(isRTL ? 'تم إنشاء القائمة وإضافة الأغنية!' : 'Playlist created and song added!');
    setTimeout(() => {
      setFeedback(null);
      closeAddToPlaylist();
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add to playlist modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-[#161622] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-white">
        <button
          onClick={closeAddToPlaylist}
          className="absolute top-5 right-5 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-2">
          {t('player_add_playlist')}
        </h3>

        {/* Selected Song Preview */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-5">
          <img
            src={songForPlaylistModal.artwork_url}
            alt={songForPlaylistModal.title}
            className="w-12 h-12 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">
              {isRTL && songForPlaylistModal.titleAr
                ? songForPlaylistModal.titleAr
                : songForPlaylistModal.title}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {isRTL && songForPlaylistModal.artistAr
                ? songForPlaylistModal.artistAr
                : songForPlaylistModal.artist}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="mb-4 p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-200 text-center animate-in fade-in">
            {feedback}
          </div>
        )}

        {/* Create New Playlist Form */}
        <form onSubmit={handleCreateAndAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={isRTL ? 'اسم قائمة تشغيل جديدة...' : 'New playlist name...'}
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 bg-[#101014] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!newPlaylistName.trim()}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'إنشاء' : 'Create'}</span>
          </button>
        </form>

        {/* Existing Playlists List */}
        <div className="max-h-56 overflow-y-auto space-y-2 no-scrollbar pr-1">
          {playlists.map((pl) => {
            const isAlreadyAdded = pl.song_ids.includes(songForPlaylistModal.id);

            return (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  isAlreadyAdded
                    ? 'bg-purple-950/20 border-purple-500/30 opacity-75'
                    : 'bg-[#101014]/60 hover:bg-[#1f1f2e] border-white/5 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {pl.cover_url ? (
                      <img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover" />
                    ) : (
                      <Music2 className="w-5 h-5 text-purple-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{pl.name}</p>
                    <p className="text-xs text-gray-400">
                      {pl.song_ids.length} {t('playlist_songs_count')}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 ms-2">
                  {isAlreadyAdded ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-300">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'مضافة' : 'Added'}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg">
                      {isRTL ? 'إضافة' : 'Add'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
