import React, { useState } from 'react';
import {
  X,
  Database,
  Plus,
  Trash2,
  Download,
  Upload,
  Edit2,
  Check,
  Search,
  Power,
  ShieldCheck,
} from 'lucide-react';
import { SavedMemory } from '../types';
import { memoryService } from '../services/memoryService';
import { soundEffects } from '../services/audioSynthesizer';

interface MemoryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryDashboard: React.FC<MemoryDashboardProps> = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState<SavedMemory[]>(memoryService.getMemories());
  const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean>(memoryService.isMemoryEnabled());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFactText, setEditFactText] = useState('');
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<SavedMemory['category']>('fact');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshMemories = () => {
    setMemories(memoryService.getMemories());
  };

  const handleToggleMemory = () => {
    const next = !isMemoryEnabled;
    setIsMemoryEnabled(next);
    memoryService.setMemoryEnabled(next);
    soundEffects.playConfirm();
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    memoryService.addMemory(newFact.trim(), newCategory);
    setNewFact('');
    refreshMemories();
    soundEffects.playConfirm();
  };

  const handleDeleteMemory = (id: string) => {
    memoryService.deleteMemory(id);
    refreshMemories();
  };

  const handleStartEdit = (m: SavedMemory) => {
    setEditingId(m.id);
    setEditFactText(m.fact);
  };

  const handleSaveEdit = (id: string) => {
    if (editFactText.trim()) {
      memoryService.updateMemory(id, editFactText.trim());
      refreshMemories();
    }
    setEditingId(null);
  };

  const handleExportJson = () => {
    const jsonStr = memoryService.exportMemoriesJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis-memory-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundEffects.playConfirm();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = memoryService.importMemoriesJson(content);
      if (res.success) {
        setImportStatus(`Successfully restored ${res.count} memories.`);
        refreshMemories();
        soundEffects.playConfirm();
      } else {
        setImportStatus(`Import failure: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (window.confirm('Delete all long-term memories? This action is irreversible.')) {
      memoryService.clearAllMemories();
      refreshMemories();
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch = m.fact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-950 border border-purple-500/40 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_0_30px_rgba(157,78,221,0.2)] hud-bracket overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/30 bg-black/60">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="font-hud text-base font-bold text-purple-300 tracking-wider">
                LONG-TERM NEURAL MEMORY
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Verified Persistent Data Storage
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleMemory}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-hud font-bold border transition-colors ${
                isMemoryEnabled
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title="Toggle Long-Term Memory"
            >
              <Power className="w-3 h-3" />
              <span>{isMemoryEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security / Accuracy notice */}
        <div className="px-4 py-2 bg-purple-950/30 border-b border-purple-500/20 text-xs text-purple-200 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            JARVIS only references verified facts saved here. Tell JARVIS "Remember that..." to commit new facts.
          </span>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAddMemory} className="p-4 border-b border-slate-800 space-y-2 bg-slate-900/40">
          <span className="text-xs font-hud text-slate-400 uppercase tracking-wider block">
            Commit New Verified Memory
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="e.g. User preference, favorite city, project detail..."
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              className="flex-1 w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="w-full sm:w-auto bg-black border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
            >
              <option value="profile">Profile</option>
              <option value="preference">Preference</option>
              <option value="fact">Fact</option>
              <option value="instruction">Instruction</option>
            </select>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-hud font-bold text-xs transition-colors shrink-0 flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Commit</span>
            </button>
          </div>
        </form>

        {/* Search & Category Filter */}
        <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex items-center space-x-1">
            {['all', 'profile', 'preference', 'fact', 'instruction'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded text-[10px] font-hud uppercase transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-500 text-black font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              No matching memories stored. Use the input above or tell JARVIS to remember something.
            </div>
          ) : (
            filteredMemories.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-purple-500/30 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-mono uppercase">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(m.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {editingId === m.id ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        value={editFactText}
                        onChange={(e) => setEditFactText(e.target.value)}
                        className="flex-1 bg-black border border-purple-500 rounded px-2 py-1 text-xs text-slate-100"
                      />
                      <button
                        onClick={() => handleSaveEdit(m.id)}
                        className="p-1 rounded bg-purple-600 text-white"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{m.fact}</p>
                  )}
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(m)}
                    className="p-1.5 text-slate-400 hover:text-purple-300 transition-colors"
                    title="Edit Memory"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Export / Import / Clear */}
        <div className="p-3 border-t border-slate-800 bg-black/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-purple-300 transition-colors"
              title="Export Memories to JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <label className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>

            {importStatus && (
              <span className="text-[10px] text-purple-300 truncate max-w-[150px]">
                {importStatus}
              </span>
            )}
          </div>

          <button
            onClick={handleClearAll}
            className="px-2.5 py-1.5 rounded bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/60 transition-colors text-[11px]"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
