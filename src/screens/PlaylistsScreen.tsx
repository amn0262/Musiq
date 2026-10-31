import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Playlist, Song } from '../types/music';
import { formatDuration } from '../utils/formatters';
import {
  Plus,
  Play,
  Shuffle,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Music,
  ListMusic,
  ArrowLeft,
  X,
  Check,
} from 'lucide-react';

export const PlaylistsScreen: React.FC = () => {
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSong,
    playSong,
    findSongById,
    isRTL,
    t,
  } = useMusic();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const pl = createPlaylist(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setIsCreatingNew(false);
    setSelectedPlaylistId(pl.id);
  };

  const handleStartRename = (pl: Playlist) => {
    setEditingId(pl.id);
    setEditTitle(pl.name);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renamePlaylist(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handlePlayAll = (pl: Playlist, shuffle = false) => {
    const songs = pl.song_ids
      .map((id) => findSongById(id))
      .filter((s): s is Song => Boolean(s));

    if (songs.length === 0) return;

    if (shuffle) {
      const randomIdx = Math.floor(Math.random() * songs.length);
      playSong(songs[randomIdx], songs);
    } else {
      playSong(songs[0], songs);
    }
  };

  // If a playlist is selected, show its detail view
  if (selectedPlaylist) {
    const playlistSongs = selectedPlaylist.song_ids
      .map((id) => findSongById(id))
      .filter((s): s is Song => Boolean(s));

    const totalDuration = playlistSongs.reduce((acc, s) => acc + s.duration, 0);

    return (
      <div className="space-y-4 pb-32 animate-in fade-in duration-100">
        {/* Back Button */}
        <button
          onClick={() => setSelectedPlaylistId(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{isRTL ? 'الرجوع للقوائم' : 'Back to Playlists'}</span>
        </button>

        {/* Playlist Header (No Images) */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-[#121217] p-5 rounded-2xl border border-[#22222e]">
          <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-gray-300">
            <ListMusic className="w-8 h-8" />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left space-y-1.5">
            {editingId === selectedPlaylist.id ? (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-3 py-1 text-lg font-bold text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveRename(selectedPlaylist.id)}
                  className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {selectedPlaylist.name}
                </h1>
                <button
                  onClick={() => handleStartRename(selectedPlaylist)}
                  className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Rename playlist"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {selectedPlaylist.description && (
              <p className="text-xs text-gray-400">
                {selectedPlaylist.description}
              </p>
            )}

            <p className="text-xs text-gray-500 font-mono">
              {playlistSongs.length} {t('playlist_songs_count')} • {formatDuration(totalDuration)}
            </p>

            {/* Play & Shuffle Action Buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
              <button
                onClick={() => handlePlayAll(selectedPlaylist, false)}
                disabled={playlistSongs.length === 0}
                className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{t('playlist_play_all')}</span>
              </button>

              <button
                onClick={() => handlePlayAll(selectedPlaylist, true)}
                disabled={playlistSongs.length === 0}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>{t('playlist_shuffle')}</span>
              </button>

              <button
                onClick={() => {
                  deletePlaylist(selectedPlaylist.id);
                  setSelectedPlaylistId(null);
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Delete Playlist"
                aria-label="Delete playlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Songs List inside Playlist */}
        <div className="space-y-1.5">
          {playlistSongs.length === 0 ? (
            <div className="text-center py-12 bg-[#121217] rounded-xl border border-[#22222e] space-y-1.5">
              <Music className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs text-gray-400">{t('playlist_empty')}</p>
            </div>
          ) : (
            playlistSongs.map((song, index) => {
              return (
                <div
                  key={`${song.id}-${index}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#121217] hover:bg-[#181822] border border-[#22222e] transition-colors"
                >
                  <button
                    onClick={() => playSong(song, playlistSongs)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className="text-xs text-gray-500 w-5 text-center font-mono">
                      {index + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-gray-300">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {isRTL && song.titleAr ? song.titleAr : song.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {isRTL && song.artistAr ? song.artistAr : song.artist}
                      </p>
                    </div>
                  </button>

                  {/* Actions: Reorder & Remove */}
                  <div className="flex items-center gap-1 ms-2">
                    <span className="text-xs text-gray-500 font-mono me-1 hidden sm:inline">
                      {formatDuration(song.duration)}
                    </span>

                    <button
                      onClick={() => reorderPlaylistSong(selectedPlaylist.id, index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Up"
                      aria-label="Move track up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        reorderPlaylistSong(
                          selectedPlaylist.id,
                          index,
                          Math.min(playlistSongs.length - 1, index + 1)
                        )
                      }
                      disabled={index === playlistSongs.length - 1}
                      className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                      title="Move Down"
                      aria-label="Move track down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => removeSongFromPlaylist(selectedPlaylist.id, song.id)}
                      className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                      title="Remove from playlist"
                      aria-label="Remove from playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Playlists Index View
  return (
    <div className="space-y-4 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">{t('playlists_title')}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {playlists.length} {isRTL ? 'قوائم تشغيل' : 'playlists'}
          </p>
        </div>

        <button
          onClick={() => setIsCreatingNew(true)}
          className="px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('playlist_create_new')}</span>
        </button>
      </div>

      {/* Create New Playlist Card */}
      {isCreatingNew && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-[#14141c] border border-[#242434] space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{t('playlist_create_new')}</h3>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300">
              {t('playlist_name_label')}
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. My Favorites"
              className="w-full bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-400"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300">
              {t('playlist_desc_label')}
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-40 text-xs font-bold cursor-pointer"
            >
              {t('playlist_save')}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Playlists (No Images) */}
      {playlists.length === 0 ? (
        <div className="py-14 px-4 text-center rounded-xl bg-[#121217] border border-[#22222e] space-y-3 max-w-md mx-auto">
          <ListMusic className="w-8 h-8 text-gray-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              {isRTL ? 'قوائم التشغيل فارغة' : 'Playlists are empty'}
            </h3>
            <p className="text-xs text-gray-400">
              {isRTL ? 'أنشئ قوائمك الموسيقية وأضف إليها أي أغنية من البحث.' : 'Create playlists and add any track from YouTube search.'}
            </p>
          </div>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'إنشاء أول قائمة' : 'Create First Playlist'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylistId(pl.id)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#121217] hover:bg-[#181822] border border-[#22222e] cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-gray-300">
                <ListMusic className="w-6 h-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">
                  {pl.name}
                </h3>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {pl.song_ids.length} {t('playlist_songs_count')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
