import { GeneratedImage, GeneratedVideo, MediaItem } from '../types';

const GALLERY_STORAGE_KEY = 'jarvis_media_gallery_v1';

class MediaGalleryService {
  private items: MediaItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      } else {
        // Sample starter items demonstrating high-fidelity capabilities
        this.items = [
          {
            type: 'image',
            id: 'sample-img-1',
            prompt: 'Blaze Revenant Arc Reactor core schematics holographic blueprint with glowing cyan laser vectors',
            style: 'blueprint',
            aspectRatio: '1:1',
            imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
            createdAt: Date.now() - 3600000,
          },
          {
            type: 'image',
            id: 'sample-img-2',
            prompt: 'Futuristic armored titanium exosuit in flight over a glowing cyberpunk metropolis',
            style: 'cinematic',
            aspectRatio: '16:9',
            imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            createdAt: Date.now() - 7200000,
          },
        ];
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Failed to load gallery items:', e);
      this.items = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.warn('Failed to save gallery items:', e);
    }
  }

  public getItems(): MediaItem[] {
    return [...this.items];
  }

  public addImage(image: Omit<GeneratedImage, 'id' | 'createdAt'>): GeneratedImage {
    const newItem: GeneratedImage & { type: 'image' } = {
      type: 'image',
      id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
      ...image,
    };
    this.items.unshift(newItem);
    this.saveToStorage();
    return newItem;
  }

  public addVideo(video: Omit<GeneratedVideo, 'id' | 'createdAt'>): GeneratedVideo {
    const newItem: GeneratedVideo & { type: 'video' } = {
      type: 'video',
      id: 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
      ...video,
    };
    this.items.unshift(newItem);
    this.saveToStorage();
    return newItem;
  }

  public deleteItem(id: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    if (this.items.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public clearAll() {
    this.items = [];
    this.saveToStorage();
  }
}

export const mediaGalleryService = new MediaGalleryService();
