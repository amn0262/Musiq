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
  Music2,
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
    allSongs,
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
      <div className="space-y-6 pb-32 animate-in fade-in">
        {/* Back Button */}
        <button
          onClick={() => setSelectedPlaylistId(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{isRTL ? 'الرجوع للقوائم' : 'Back to Playlists'}</span>
        </button>

        {/* Playlist Hero Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-purple-950/40 to-[#161622] p-6 rounded-3xl border border-white/10">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
            <img
              src={selectedPlaylist.cover_url}
              alt={selectedPlaylist.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
              PLAYLIST
            </span>

            {editingId === selectedPlaylist.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-black/60 border border-purple-500 rounded-xl px-3 py-1.5 text-xl font-bold text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveRename(selectedPlaylist.id)}
                  className="p-2 bg-purple-600 rounded-xl hover:bg-purple-500 text-white"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {selectedPlaylist.name}
                </h1>
                <button
                  onClick={() => handleStartRename(selectedPlaylist)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  aria-label="Rename playlist"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-xs sm:text-sm text-gray-300">
              {selectedPlaylist.description || (isRTL ? 'قائمة تشغيل مخصصة' : 'Custom playlist')}
            </p>

            <p className="text-xs text-gray-400 font-mono">
              {playlistSongs.length} {t('playlist_songs_count')} • {formatDuration(totalDuration)}
            </p>

            {/* Play & Shuffle Action Buttons */}
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-3">
              <button
                onClick={() => handlePlayAll(selectedPlaylist, false)}
                disabled={playlistSongs.length === 0}
                className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{t('playlist_play_all')}</span>
              </button>

              <button
                onClick={() => handlePlayAll(selectedPlaylist, true)}
                disabled={playlistSongs.length === 0}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all active:scale-95"
              >
                <Shuffle className="w-4 h-4" />
                <span>{t('playlist_shuffle')}</span>
              </button>

              <button
                onClick={() => {
                  deletePlaylist(selectedPlaylist.id);
                  setSelectedPlaylistId(null);
                }}
                className="p-2.5 rounded-full bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors"
                title="Delete Playlist"
                aria-label="Delete playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Songs List inside Playlist */}
        <div className="space-y-2">
          {playlistSongs.length === 0 ? (
            <div className="text-center py-16 bg-[#161622]/40 rounded-3xl border border-white/5 space-y-2">
              <Music2 className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-sm text-gray-400">{t('playlist_empty')}</p>
              <p className="text-xs text-gray-500">
                {isRTL
                  ? 'ابحث عن أي أغنية واضغط على رمز (+) لإضافتها هنا'
                  : 'Search for any song and tap the (+) icon to add it here.'}
              </p>
            </div>
          ) : (
            playlistSongs.map((song, index) => {
              return (
                <div
                  key={`${song.id}-${index}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#161622] hover:bg-[#1d1d2b] border border-white/5 transition-all group"
                >
                  <button
                    onClick={() => playSong(song, playlistSongs)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
                  >
                    <span className="text-xs text-gray-500 w-5 text-center font-mono">
                      {index + 1}
                    </span>
                    <img
                      src={song.artwork_url}
                      alt={song.title}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {isRTL && song.titleAr ? song.titleAr : song.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {isRTL && song.artistAr ? song.artistAr : song.artist}
                      </p>
                    </div>
                  </button>

                  {/* Actions: Reorder & Remove */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 font-mono me-2">
                      {formatDuration(song.duration)}
                    </span>

                    {/* Move Up */}
                    <button
                      onClick={() => reorderPlaylistSong(selectedPlaylist.id, index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                      title="Move Up"
                      aria-label="Move track up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() =>
                        reorderPlaylistSong(
                          selectedPlaylist.id,
                          index,
                          Math.min(playlistSongs.length - 1, index + 1)
                        )
                      }
                      disabled={index === playlistSongs.length - 1}
                      className="p-1.5 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
                      title="Move Down"
                      aria-label="Move track down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Remove From Playlist */}
                    <button
                      onClick={() => removeSongFromPlaylist(selectedPlaylist.id, song.id)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
                      title="Remove from playlist"
                      aria-label="Remove from playlist"
                    >
                      <Trash2 className="w-4 h-4" />
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
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{t('playlists_title')}</h1>
          <p className="text-xs text-gray-400 mt-1">
            {playlists.length} {isRTL ? 'قوائم تشغيل متزامنة' : 'synchronized playlists'}
          </p>
        </div>

        <button
          onClick={() => setIsCreatingNew(true)}
          className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('playlist_create_new')}</span>
        </button>
      </div>

      {/* Create New Playlist Card Modal */}
      {isCreatingNew && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-3xl bg-[#171725] border border-purple-500/40 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{t('playlist_create_new')}</h3>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">
              {t('playlist_name_label')}
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. My Tarab Night"
              className="w-full bg-[#101014] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">
              {t('playlist_desc_label')}
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. Authentic songs for late night contemplation"
              className="w-full bg-[#101014] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold"
            >
              {t('playlist_save')}
            </button>
          </div>
        </form>
      )}

      {/* Grid of Playlists or Empty State */}
      {playlists.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-3xl bg-[#161622]/60 border border-white/5 space-y-4 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
            <ListMusic className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              {isRTL ? 'قوائم التشغيل فارغة' : 'Your Playlists are Empty'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {isRTL
                ? 'لقد تم إفراغ قوائم التشغيل بالكامل حتى تبدأ ببناء وتنظيم مكتبتك ومجموعاتك الموسيقية الخاصة بحرية تامة.'
                : 'All playlists have been emptied so you can organize and create your own customized music mixes.'}
            </p>
          </div>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'إنشاء أول قائمة تشغيل الآن' : 'Create First Playlist Now'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((pl) => {
            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                className="group flex items-center gap-4 p-4 rounded-3xl bg-[#161622] hover:bg-[#1f1f2e] border border-white/5 hover:border-purple-500/40 cursor-pointer transition-all hover:-translate-y-1 shadow-lg"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                  <img
                    src={pl.cover_url}
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                    {pl.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {pl.description || (isRTL ? 'قائمة تشغيل' : 'Playlist')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      {pl.song_ids.length} {t('playlist_songs_count')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
