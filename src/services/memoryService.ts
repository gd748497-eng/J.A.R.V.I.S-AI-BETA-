import { SavedMemory } from '../types';

const MEMORY_STORAGE_KEY = 'jarvis_longterm_memories_v1';
const MEMORY_ENABLED_KEY = 'jarvis_memory_enabled_v1';

class MemoryService {
  private memories: SavedMemory[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (stored) {
        this.memories = JSON.parse(stored);
      } else {
        // Initial sample verified memories to demonstrate capability
        this.memories = [
          {
            id: 'mem-default-1',
            fact: 'User prefers concise, dignified responses with sci-fi HUD terminology.',
            category: 'preference',
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now() - 3600000,
          },
          {
            id: 'mem-default-2',
            fact: 'Assistant name is J.A.R.V.I.S., running on Blaze Revenant protocol.',
            category: 'instruction',
            createdAt: Date.now() - 7200000,
            updatedAt: Date.now() - 7200000,
          },
        ];
        this.saveToStorage();
      }

      const enabledSetting = localStorage.getItem(MEMORY_ENABLED_KEY);
      if (enabledSetting !== null) {
        this.isEnabled = enabledSetting === 'true';
      }
    } catch (e) {
      console.warn('Failed to load memories from localStorage:', e);
      this.memories = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.memories));
    } catch (e) {
      console.warn('Failed to persist memories:', e);
    }
  }

  public getMemories(): SavedMemory[] {
    return [...this.memories];
  }

  public isMemoryEnabled(): boolean {
    return this.isEnabled;
  }

  public setMemoryEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem(MEMORY_ENABLED_KEY, String(enabled));
    } catch (e) {
      // ignore
    }
  }

  public addMemory(fact: string, category: SavedMemory['category'] = 'fact'): SavedMemory {
    const newMemory: SavedMemory = {
      id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      fact: fact.trim(),
      category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.memories.unshift(newMemory);
    this.saveToStorage();
    return newMemory;
  }

  public updateMemory(id: string, newFact: string, category?: SavedMemory['category']): boolean {
    const memory = this.memories.find((m) => m.id === id);
    if (!memory) return false;
    memory.fact = newFact.trim();
    if (category) memory.category = category;
    memory.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  public deleteMemory(id: string): boolean {
    const initialLength = this.memories.length;
    this.memories = this.memories.filter((m) => m.id !== id);
    if (this.memories.length !== initialLength) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public clearAllMemories() {
    this.memories = [];
    this.saveToStorage();
  }

  public exportMemoriesJson(): string {
    return JSON.stringify(this.memories, null, 2);
  }

  public importMemoriesJson(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { success: false, count: 0, error: 'JSON must contain an array of memory objects.' };
      }
      let count = 0;
      for (const item of parsed) {
        if (item.fact && typeof item.fact === 'string') {
          this.memories.push({
            id: item.id || 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            fact: item.fact,
            category: ['profile', 'preference', 'fact', 'instruction'].includes(item.category)
              ? item.category
              : 'fact',
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || Date.now(),
          });
          count++;
        }
      }
      this.saveToStorage();
      return { success: true, count };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Invalid JSON format' };
    }
  }

  public getContextString(): string {
    if (!this.isEnabled || this.memories.length === 0) {
      return '';
    }
    return this.memories
      .map((m, idx) => `[Fact ${idx + 1}] (${m.category}): ${m.fact}`)
      .join('\n');
  }
}

export const memoryService = new MemoryService();
