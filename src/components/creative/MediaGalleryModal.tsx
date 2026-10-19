import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Image as ImageIcon,
  Video,
  Download,
  Trash2,
  Maximize2,
  Copy,
  Check,
} from 'lucide-react';
import { MediaItem } from '../../types';
import { mediaGalleryService } from '../../services/mediaGalleryService';
import { soundEffects } from '../../services/audioSynthesizer';

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImageStudio?: () => void;
  onOpenVideoStudio?: () => void;
}

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  isOpen,
  onClose,
  onOpenImageStudio,
  onOpenVideoStudio,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItems(mediaGalleryService.getItems());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshItems = () => {
    setItems(mediaGalleryService.getItems());
  };

  const handleDelete = (id: string) => {
    mediaGalleryService.deleteItem(id);
    refreshItems();
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    soundEffects.playConfirm();
  };

  const handleClearAll = () => {
    if (window.confirm('Delete all saved media items from local gallery?')) {
      mediaGalleryService.clearAll();
      refreshItems();
      setSelectedItem(null);
      soundEffects.playConfirm();
    }
  };

  const handleDownload = (item: MediaItem) => {
    const a = document.createElement('a');
    if (item.type === 'image') {
      a.href = item.imageUrl;
      a.download = `jarvis-render-${item.id}.png`;
    } else if (item.type === 'video' && item.videoUrl) {
      a.href = item.videoUrl;
      a.download = `jarvis-video-${item.id}.mp4`;
    }
    a.click();
    soundEffects.playConfirm();
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    soundEffects.playConfirm();
  };

  const filteredItems = items.filter((it) => {
    if (filter === 'all') return true;
    return it.type === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-950 border border-cyan-500/40 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_35px_rgba(0,240,255,0.25)] hud-bracket overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-hud text-base font-bold text-cyan-300 tracking-wider">
                MEDIA REPOSITORY // ARTIFACT GALLERY
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Stored Generations & Rendered Latents ({items.length})
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenImageStudio && (
              <button
                onClick={onOpenImageStudio}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-hud transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Image</span>
              </button>
            )}
            {onOpenVideoStudio && (
              <button
                onClick={onOpenVideoStudio}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-hud transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Video</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/40 text-xs">
          <div className="flex items-center space-x-1.5">
            {[
              { id: 'all', label: 'All Media' },
              { id: 'image', label: 'Images' },
              { id: 'video', label: 'Videos' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1 rounded font-hud transition-colors ${
                  filter === f.id
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[11px] text-red-400 hover:underline"
            >
              Clear Repository
            </button>
          )}
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-600" />
              <div>No media generated in this category yet.</div>
              <div className="text-[11px] text-slate-500">
                Use the Image Studio or Video Studio to synthesize visual content.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
                >
                  {/* Media Preview Box */}
                  <div
                    className="relative bg-black aspect-video flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                        {item.videoUrl ? (
                          <video
                            src={item.videoUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                          />
                        ) : (
                          <Video className="w-10 h-10 text-cyan-400" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-cyan-500/80 text-black flex items-center justify-center shadow-lg">
                            <Video className="w-5 h-5 fill-current" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Media Type Badge */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-cyan-500/30 text-[9px] font-mono text-cyan-300 uppercase">
                      {item.type === 'image' ? 'IMAGE' : 'VIDEO'}
                    </div>
                  </div>

                  {/* Info and Actions */}
                  <div className="p-2.5 space-y-2">
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCopyPrompt(item.id, item.prompt)}
                          className="p-1 text-slate-400 hover:text-cyan-300"
                          title="Copy Prompt"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="p-1 text-slate-400 hover:text-cyan-300"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Video Modal for Selected Item */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 border border-cyan-500 text-cyan-300"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="max-w-4xl w-full flex flex-col items-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.type === 'image' ? (
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.prompt}
                className="max-w-full max-h-[75vh] object-contain rounded-xl border border-cyan-500/40 shadow-[0_0_40px_rgba(0,240,255,0.3)]"
              />
            ) : (
              <video
                src={selectedItem.videoUrl}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] rounded-xl border border-cyan-500/40 shadow-[0_0_40px_rgba(0,240,255,0.3)]"
              />
            )}

            <div className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-300 truncate max-w-lg font-mono">
                "{selectedItem.prompt}"
              </span>
              <button
                onClick={() => handleDownload(selectedItem)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-hud font-bold text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Device</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
