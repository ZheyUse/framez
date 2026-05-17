import { create } from 'zustand';
import { Template } from '@/types/template';
import { loadTemplates, saveTemplate, deleteTemplate, updateTemplate } from '@/lib/storage/templates';

interface TemplateStore {
  templates: Template[];
  isLoading: boolean;
  fetch: () => Promise<void>;
  add: (t: Template) => Promise<void>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    const templates = await loadTemplates();
    set({ templates, isLoading: false });
  },

  add: async (t) => {
    await saveTemplate(t);
    set((s) => ({ templates: [t, ...s.templates] }));
  },

  remove: async (id) => {
    await deleteTemplate(id);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
  },

  rename: async (id, name) => {
    await updateTemplate(id, { name });
    set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, name } : t)) }));
  },
}));