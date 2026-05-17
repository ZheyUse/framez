import { create } from 'zustand';
import { UploadedImage } from '@/types/editor';

interface EditorStore {
  images: UploadedImage[];
  activeIndex: number;
  addImages: (imgs: UploadedImage[]) => void;
  removeImage: (id: string) => void;
  setActive: (i: number) => void;
  clear: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  images: [],
  activeIndex: 0,

  addImages: (imgs) => set((s) => ({ images: [...s.images, ...imgs] })),

  removeImage: (id) =>
    set((s) => {
      const images = s.images.filter((i) => i.id !== id);
      return {
        images,
        activeIndex: Math.min(s.activeIndex, Math.max(0, images.length - 1)),
      };
    }),

  setActive: (i) => set({ activeIndex: i }),
  clear: () => set({ images: [], activeIndex: 0 }),
}));