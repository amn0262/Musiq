import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Playlist, Song } from '../types/music';
import { formatDuration } from '../utils/formatters';
import {
  X,
  Plus,
  Play,
  Shuffle,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  ListMusic,
  ArrowRight,
  Music,
} from 'lucide-react';

export const PlaylistsModal: React.FC = () => {
  const {
    isPlaylistsModalOpen,
    closePlaylistsModal,
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSong,
    playSong,
    findSongById,
  } = useMusic();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlaylistsModalOpen) {
        if (selectedPlaylistId) {
          setSelectedPlaylistId(null);
        } else {
          closePlaylistsModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaylistsModalOpen, selectedPlaylistId, closePlaylistsModal]);

  if (!isPlaylistsModalOpen) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="قوائم التشغيل"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] bg-[#121218] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161620]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {selectedPlaylist ? selectedPlaylist.name : 'قوائم التشغيل'}
              </h2>
              <p className="text-xs text-gray-400">
                {selectedPlaylist
                  ? `${selectedPlaylist.song_ids.length} مقطع صوتي`
                  : `${playlists.length} قائمة متوفرة`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedPlaylist && (
              <button
                onClick={() => setSelectedPlaylistId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                aria-label="الرجوع للقوائم"
              >
                <span>القوائم</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={closePlaylistsModal}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {selectedPlaylist ? (
            /* Selected Playlist View */
            <div className="space-y-4">
              {/* Actions Header */}
              <div className="flex items-center justify-between gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayAll(selectedPlaylist, false)}
                    disabled={selectedPlaylist.song_ids.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-black hover:bg-gray-200 text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تشغيل الكل</span>
                  </button>
                  <button
                    onClick={() => handlePlayAll(selectedPlaylist, true)}
                    disabled={selectedPlaylist.song_ids.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>خلط</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من حذف قائمة "${selectedPlaylist.name}"؟`)) {
                      deletePlaylist(selectedPlaylist.id);
                      setSelectedPlaylistId(null);
                    }
                  }}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="حذف القائمة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Songs in Playlist (Pure typography, no images) */}
              {selectedPlaylist.song_ids.length === 0 ? (
                <div className="py-12 text-center text-gray-500 space-y-2">
                  <Music className="w-10 h-10 mx-auto text-gray-600 opacity-60" />
                  <p className="text-sm font-medium">هذه القائمة فارغة حالياً</p>
                  <p className="text-xs text-gray-500">
                    أضف المقاطع من خلال زر الإضافة (+) بجانب أي مقطع موسيقي
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedPlaylist.song_ids.map((songId, index) => {
                    const song = findSongById(songId);
                    if (!song) return null;

                    return (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-colors group"
                      >
                        <div
                          onClick={() => {
                            const songs = selectedPlaylist.song_ids
                              .map((id) => findSongById(id))
                              .filter((s): s is Song => Boolean(s));
                            playSong(song, songs);
                          }}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        >
                          <span className="w-6 text-xs text-gray-500 font-mono text-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-gray-200">
                              {song.title}
                            </h4>
                            <p className="text-[11px] text-gray-400 truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500 font-mono">
                            {formatDuration(song.duration)}
                          </span>

                          {/* Reorder Buttons */}
                          <div className="flex items-center">
                            <button
                              onClick={() => reorderPlaylistSong(selectedPlaylist.id, index, index - 1)}
                              disabled={index === 0}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                              title="تحريك لأعلى"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => reorderPlaylistSong(selectedPlaylist.id, index, index + 1)}
                              disabled={index === selectedPlaylist.song_ids.length - 1}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer"
                              title="تحريك لأسفل"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeSongFromPlaylist(selectedPlaylist.id, song.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                            title="إزالة من القائمة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Playlist List Overview */
            <div className="space-y-4">
              {/* Create New Playlist Button / Form */}
              {isCreatingNew ? (
                <form
                  onSubmit={handleCreate}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3"
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    إنشاء قائمة تشغيل جديدة
                  </h3>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="اسم القائمة (مثال: طرب الصباح، أغاني السفر...)"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="وصف مختصر (اختياري)"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={!newName.trim()}
                      className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-gray-200 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      حفظ القائمة
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-white/20 hover:border-white/40 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs font-bold bg-white/[0.02] hover:bg-white/[0.05]"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء قائمة تشغيل جديدة</span>
                </button>
              )}

              {/* Playlists Cards */}
              <div className="space-y-2">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedPlaylistId(pl.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                        <ListMusic className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        {editingId === pl.id ? (
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="px-2 py-1 bg-black border border-white/20 rounded text-xs text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (editTitle.trim()) renamePlaylist(pl.id, editTitle.trim());
                                setEditingId(null);
                              }}
                              className="px-2 py-1 bg-white text-black text-xs font-bold rounded"
                            >
                              حفظ
                            </button>
                          </div>
                        ) : (
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {pl.name}
                          </h4>
                        )}
                        <p className="text-[11px] text-gray-400">
                          {pl.song_ids.length} مقطع صوتي
                          {pl.description ? ` • ${pl.description}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handlePlayAll(pl, false)}
                        disabled={pl.song_ids.length === 0}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="تشغيل القائمة"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(pl.id);
                          setEditTitle(pl.name);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="إعادة تسمية"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف قائمة "${pl.name}"؟`)) {
                            deletePlaylist(pl.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف القائمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
