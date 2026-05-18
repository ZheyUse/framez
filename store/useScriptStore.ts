import { create } from 'zustand';

export interface ScriptSet {
  id: string;
  placeholder: string;
  values: string[];
}

interface ScriptStoreState {
  scriptSets: ScriptSet[];
  addScriptSet: () => string;
  updateScriptSet: (id: string, changes: Partial<ScriptSet>) => void;
  removeScriptSet: (id: string) => void;
  clearScriptSets: () => void;
}

const generateId = () => `script_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useScriptStore = create<ScriptStoreState>((set) => ({
  scriptSets: [],

  addScriptSet: () => {
    const id = generateId();
    set((s) => ({
      scriptSets: [...s.scriptSets, { id, placeholder: '', values: [] }],
    }));
    return id;
  },

  updateScriptSet: (id, changes) => {
    set((s) => ({
      scriptSets: s.scriptSets.map((ss) => (ss.id === id ? { ...ss, ...changes } : ss)),
    }));
  },

  removeScriptSet: (id) => {
    set((s) => ({
      scriptSets: s.scriptSets.filter((ss) => ss.id !== id),
    }));
  },

  clearScriptSets: () => set({ scriptSets: [] }),
}));

export function extractPlaceholders(text: string): string[] {
  const matches = text.matchAll(/<([^>]+)>/g);
  return [...matches].map((m) => `<${m[1]}>`);
}