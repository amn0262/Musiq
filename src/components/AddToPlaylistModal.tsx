import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { X, Plus, Check, Music } from 'lucide-react';

export const AddToPlaylistModal: React.FC = () => {
  const {
    isAddToPlaylistOpen,
    closeAddToPlaylist,
    songForPlaylistModal,
    playlists,
    addSongToPlaylist,
    createPlaylist,
  } = useMusic();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isAddToPlaylistOpen || !songForPlaylistModal) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    const res = addSongToPlaylist(playlistId, songForPlaylistModal.id);
    if (res.success) {
      setFeedback('Song added to playlist');
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
    setFeedback('Playlist created and song added');
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
      <div className="w-full max-w-md bg-[#13131c] border border-[#242434] rounded-2xl p-5 shadow-2xl relative text-white">
        <button
          onClick={closeAddToPlaylist}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-3">
          Add to Playlist
        </h3>

        {/* Selected Song Preview without image */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 mb-4">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-gray-300">
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">
              {songForPlaylistModal.title}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {songForPlaylistModal.artist}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="mb-3 p-2 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold text-white text-center">
            {feedback}
          </div>
        )}

        {/* Create New Playlist Form */}
        <form onSubmit={handleCreateAndAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="New playlist name..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 bg-[#0e0e13] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!newPlaylistName.trim()}
            className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-gray-200 disabled:opacity-40 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </form>

        {/* Existing Playlists List */}
        <div className="max-h-52 overflow-y-auto space-y-1.5 no-scrollbar pr-1">
          {playlists.map((pl) => {
            const isAlreadyAdded = pl.song_ids.includes(songForPlaylistModal.id);

            return (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors text-left cursor-pointer ${
                  isAlreadyAdded
                    ? 'bg-white/5 border-white/10 opacity-60'
                    : 'bg-[#181822] hover:bg-[#20202c] border-[#262638]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Music className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{pl.name}</p>
                    <p className="text-xs text-gray-400">
                      {pl.song_ids.length} songs
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 ms-2">
                  {isAlreadyAdded ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-300 bg-white/10 px-2 py-0.5 rounded">
                      Add
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
