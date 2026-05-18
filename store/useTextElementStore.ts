import { create } from 'zustand';
import { TextElement, TextElementOverrides, TextElementStyle, isGlobalText, DEFAULT_TEXT_STYLE } from '@/types/textElement';
import { generateId } from '@/lib/utils/fileUtils';

type TextMode = 'all' | 'individual';

const MAX_UNDO_STACK = 50;

interface HistoryEntry {
  elements: TextElement[];
  timestamp: number;
}

interface TextElementStoreState {
  elements: TextElement[];
  selectedId: string | null;
  multiSelectedIds: string[];
  lastSelectedId: string | null;
  activePanel: 'text' | null;
  currentTemplateId: string | null;
  textMode: TextMode;
  currentImageIndex: number;

  // Undo/Redo
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  setElements: (elements: TextElement[]) => void;
  addElement: (element: Partial<TextElement> & { text: string; templateId: string }) => string;
  updateElement: (id: string, changes: Partial<Omit<TextElement, 'style'>> & { style?: Partial<TextElementStyle> }) => void;
  updateStyleForCurrentImage: (id: string, styleChanges: Partial<TextElementStyle>) => void;
  updatePositionForCurrentImage: (id: string, changes: { x?: number; y?: number; width?: number; height?: number }) => void;
  deleteElement: (id: string) => void;
  deleteSelected: () => void;
  selectElement: (id: string | null) => void;
  toggleMultiSelect: (id: string) => void;
  shiftSelect: (id: string, orderedIds?: string[]) => void;
  ctrlShiftSelect: (id: string, orderedIds: string[]) => void;
  selectAll: () => void;
  setMultiSelectedIds: (ids: string[]) => void;
  clearMultiSelection: () => void;
  setActivePanel: (panel: 'text' | null) => void;
  setCurrentTemplateId: (templateId: string) => void;
  setCurrentImageIndex: (index: number) => void;
  setTextMode: (mode: TextMode) => void;
  clearOverrides: (id: string, imageIndex: number) => void;
  clearAllOverridesForImage: (imageIndex: number) => void;
  convertToGlobal: (id: string) => void;
  duplicateElement: (id: string) => string | null;
  clear: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;

  // Computed
  getElementsForCurrentImage: () => TextElement[];
  isLockedForCurrentImage: (id: string) => boolean;
  isGlobalElement: (id: string) => boolean;
}

// Helper to push to history
const pushHistory = (history: HistoryEntry[], historyIndex: number, elements: TextElement[]): { history: HistoryEntry[]; historyIndex: number } => {
  const newEntry: HistoryEntry = {
    elements: JSON.parse(JSON.stringify(elements)),
    timestamp: Date.now(),
  };

  // Remove any future states if we're not at the end
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newEntry);

  // Limit history size
  if (newHistory.length > MAX_UNDO_STACK) {
    newHistory.shift();
  }

  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const useTextElementStore = create<TextElementStoreState>((set, get) => ({
  elements: [],
  selectedId: null,
  multiSelectedIds: [],
  lastSelectedId: null,
  activePanel: null,
  currentTemplateId: null,
  textMode: 'all',
  currentImageIndex: 0,
  history: [],
  historyIndex: -1,

  setElements: (elements) => {
    set({ elements, selectedId: null, multiSelectedIds: [], lastSelectedId: null });
    get().saveToHistory();
  },

  saveToHistory: () => {
    const { elements, history, historyIndex } = get();
    const result = pushHistory(history, historyIndex, elements);
    set(result);
  },

  addElement: (element) => {
    get().saveToHistory();
    const id = generateId();
    const now = Date.now();
    const { textMode, currentImageIndex } = get();

    const newElement: TextElement = {
      id,
      text: element.text,
      x: element.x ?? 200,
      y: element.y ?? 200,
      width: element.width ?? 300,
      height: element.height ?? 60,
      angle: element.angle ?? 0,
      style: element.style ?? { ...DEFAULT_TEXT_STYLE },
      templateId: element.templateId,
      imageIndex: textMode === 'individual' ? currentImageIndex : -1,
      overrides: {},
      createdAt: now,
    };

    set((s) => ({ elements: [...s.elements, newElement], selectedId: id }));
    return id;
  },

  updateElement: (id, changes) => {
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id
          ? { ...el, ...changes, style: changes.style ? { ...el.style, ...changes.style } : el.style }
          : el
      ),
    }));
  },

  updateStyleForCurrentImage: (id, styleChanges) => {
    const { elements, currentImageIndex, saveToHistory, textMode } = get();
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    saveToHistory();

    if (isGlobalText(element) && textMode === 'all') {
      set((s) => ({
        elements: s.elements.map((el) =>
          el.id === id ? { ...el, style: { ...el.style, ...styleChanges } } : el
        ),
      }));
      return;
    }

    if (isGlobalText(element)) {
      const currentOverride = element.overrides?.[currentImageIndex] || {};
      const newOverride: TextElementOverrides = {
        ...currentOverride,
        style: { ...element.style, ...currentOverride.style, ...styleChanges },
      };

      set((s) => ({
        elements: s.elements.map((el) =>
          el.id === id
            ? { ...el, overrides: { ...(el.overrides || {}), [currentImageIndex]: newOverride } }
            : el
        ),
      }));
    } else {
      set((s) => ({
        elements: s.elements.map((el) =>
          el.id === id ? { ...el, style: { ...el.style, ...styleChanges } } : el
        ),
      }));
    }
  },

  updatePositionForCurrentImage: (id, changes) => {
    const { elements, currentImageIndex, saveToHistory } = get();
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    saveToHistory();

    if (isGlobalText(element)) {
      const currentOverride = element.overrides?.[currentImageIndex] || {};
      const newOverride: TextElementOverrides = {
        ...currentOverride,
        ...changes,
      };

      set((s) => ({
        elements: s.elements.map((el) =>
          el.id === id
            ? { ...el, overrides: { ...(el.overrides || {}), [currentImageIndex]: newOverride } }
            : el
        ),
      }));
    } else {
      set((s) => ({
        elements: s.elements.map((el) => (el.id === id ? { ...el, ...changes } : el)),
      }));
    }
  },

  deleteElement: (id) => {
    get().saveToHistory();
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      multiSelectedIds: s.multiSelectedIds.filter((selId) => selId !== id),
    }));
  },

  deleteSelected: () => {
    const { multiSelectedIds } = get();
    if (multiSelectedIds.length === 0) return;
    get().saveToHistory();
    set((s) => ({
      elements: s.elements.filter((el) => !s.multiSelectedIds.includes(el.id)),
      selectedId: null,
      multiSelectedIds: [],
    }));
  },

  selectElement: (id) => set({ selectedId: id, multiSelectedIds: [], lastSelectedId: id }),

  toggleMultiSelect: (id) => {
    const { multiSelectedIds } = get();
    if (multiSelectedIds.includes(id)) {
      set({ multiSelectedIds: multiSelectedIds.filter((selId) => selId !== id), lastSelectedId: id });
    } else {
      set({ multiSelectedIds: [...multiSelectedIds, id], selectedId: id, lastSelectedId: id });
    }
  },

  shiftSelect: (id, orderedIds) => {
    const { multiSelectedIds, selectedId } = get();
    const order = orderedIds || get().elements.map((el) => el.id);

    // Use last item of current selection as anchor (like Windows Explorer)
    let anchorId: string | null = null;
    if (multiSelectedIds.length > 0) {
      anchorId = multiSelectedIds.at(-1) ?? null; // Changed from [0] to at(-1)
    } else if (selectedId) {
      // No multi-selection yet, use single selectedId as anchor
      anchorId = selectedId;
    }

    if (!anchorId) {
      // Nothing selected, just select this one item
      set({ selectedId: id, lastSelectedId: id, multiSelectedIds: [id] });
      return;
    }

    // If clicking on an already selected item, deselect everything and just select it
    // (this resets the anchor)
    if (multiSelectedIds.includes(id)) {
      // Clicking on something already in selection - reset to just that item
      set({ selectedId: id, lastSelectedId: id, multiSelectedIds: [id] });
      return;
    }

    const fromIdx = order.indexOf(anchorId);
    const toIdx = order.indexOf(id);

    if (fromIdx === -1 || toIdx === -1) {
      // Anchor or target not in order, fall back to simple selection
      set({ selectedId: id, lastSelectedId: id, multiSelectedIds: [id] });
      return;
    }

    const lo = Math.min(fromIdx, toIdx);
    const hi = Math.max(fromIdx, toIdx);
    const rangeIds = order.slice(lo, hi + 1);

    set({
      multiSelectedIds: rangeIds,
      selectedId: id,
      lastSelectedId: anchorId, // Keep original anchor as lastSelectedId
    });
  },

  // Ctrl+Shift+Click: toggle the range between anchor and clicked item from selection
  // Like Windows Explorer: extends or reduces selection based on range
  ctrlShiftSelect: (id, orderedIds) => {
    const { multiSelectedIds, selectedId } = get();

    // Use last item of current multi-selection as anchor (like Windows Explorer), or single selectedId
    let anchorId: string | null = null;
    if (multiSelectedIds.length > 0) {
      anchorId = multiSelectedIds.at(-1) ?? null; // Changed from [0] to at(-1)
    } else if (selectedId) {
      anchorId = selectedId;
    }

    if (!anchorId) {
      // Nothing selected, just select this one item
      set({ selectedId: id, multiSelectedIds: [id] });
      return;
    }

    const fromIdx = orderedIds.indexOf(anchorId);
    const toIdx = orderedIds.indexOf(id);

    if (fromIdx === -1 || toIdx === -1) return;

    const lo = Math.min(fromIdx, toIdx);
    const hi = Math.max(fromIdx, toIdx);
    const rangeIds = orderedIds.slice(lo, hi + 1);

    // Create a set from current selection
    const currentSelected = new Set(multiSelectedIds);

    // Toggle each item in range: remove if present, add if absent
    rangeIds.forEach((rangeId) => {
      if (currentSelected.has(rangeId)) {
        currentSelected.delete(rangeId);
      } else {
        currentSelected.add(rangeId);
      }
    });

    // Only update if we have items selected
    const newSelection = Array.from(currentSelected);
    set({
      multiSelectedIds: newSelection,
      selectedId: id,
    });
  },

  selectAll: () => {
    const { elements } = get();
    const ids = elements.map((el) => el.id);
    set({ multiSelectedIds: ids, selectedId: ids[ids.length - 1] || null });
  },

  setMultiSelectedIds: (ids) => {
    const { selectedId } = get();
    // If ids contains selectedId, keep it. Otherwise use the last one or null
    const newSelectedId = ids.includes(selectedId || '') ? selectedId : (ids[ids.length - 1] || null);
    set({ multiSelectedIds: ids, selectedId: newSelectedId });
  },

  clearMultiSelection: () => set({ multiSelectedIds: [], lastSelectedId: null }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  setCurrentTemplateId: (templateId) => set({ currentTemplateId: templateId }),

  setCurrentImageIndex: (index) => set({ currentImageIndex: index }),

  setTextMode: (mode) => set({ textMode: mode }),

  clearOverrides: (id, imageIndex) => {
    get().saveToHistory();
    const element = get().elements.find((el) => el.id === id);
    if (!element) return;

    const newOverrides = { ...(element.overrides || {}) };
    delete newOverrides[imageIndex];

    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id ? { ...el, overrides: newOverrides } : el
      ),
    }));
  },

  clearAllOverridesForImage: (imageIndex) => {
    get().saveToHistory();
    set((s) => ({
      elements: s.elements.map((el) => {
        if (isGlobalText(el) && el.overrides && imageIndex in el.overrides) {
          const newOverrides = { ...el.overrides };
          delete newOverrides[imageIndex];
          return { ...el, overrides: newOverrides };
        }
        return el;
      }),
    }));
  },

  convertToGlobal: (id) => {
    get().saveToHistory();
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id ? { ...el, imageIndex: -1 } : el
      ),
    }));
  },

  duplicateElement: (id) => {
    get().saveToHistory();
    const element = get().elements.find((el) => el.id === id);
    if (!element) return null;

    const newId = generateId();
    const now = Date.now();
    const duplicate: TextElement = {
      ...element,
      id: newId,
      x: (element.x || 0) + 30,
      y: (element.y || 0) + 30,
      createdAt: now,
      overrides: {},
    };

    set((s) => ({
      elements: [...s.elements, duplicate],
      selectedId: newId
    }));
    return newId;
  },

  clear: () => set({ elements: [], selectedId: null, multiSelectedIds: [], lastSelectedId: null, activePanel: null, history: [], historyIndex: -1 }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    set({
      elements: JSON.parse(JSON.stringify(entry.elements)),
      historyIndex: newIndex,
      selectedId: null,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    set({
      elements: JSON.parse(JSON.stringify(entry.elements)),
      historyIndex: newIndex,
      selectedId: null,
    });
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  getElementsForCurrentImage: () => {
    const { elements, currentImageIndex, textMode } = get();

    if (textMode === 'all') {
      return elements.filter((el) => isGlobalText(el) || el.imageIndex === currentImageIndex);
    } else {
      return elements.filter((el) => el.imageIndex === currentImageIndex);
    }
  },

  isLockedForCurrentImage: (id) => {
    const { elements, currentImageIndex } = get();
    const element = elements.find((el) => el.id === id);
    if (!element || isGlobalText(element)) return false;
    return element.overrides ? currentImageIndex in element.overrides : false;
  },

  isGlobalElement: (id) => {
    const element = get().elements.find((el) => el.id === id);
    return element ? isGlobalText(element) : false;
  },
}));