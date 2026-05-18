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

  addImages: (imgs) =>
    set((s) => {
      const combined = [...s.images, ...imgs];

      // Sort: numeric filenames first (1, 2, 10), then alphabetical (a, b, c)
      combined.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';

        // Extract numeric parts at start of filename
        const numMatchA = nameA.match(/^(\d+)/);
        const numMatchB = nameB.match(/^(\d+)/);

        if (numMatchA && numMatchB) {
          // Both have leading numbers - compare numerically
          const numA = parseInt(numMatchA[1]);
          const numB = parseInt(numMatchB[1]);
          if (numA !== numB) return numA - numB;
        } else if (numMatchA) {
          // Only A has leading number - A comes first
          return -1;
        } else if (numMatchB) {
          // Only B has leading number - B comes first
          return 1;
        }

        // Neither has leading number - sort alphabetically
        return nameA.localeCompare(nameB);
      });

      return { images: combined };
    }),

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