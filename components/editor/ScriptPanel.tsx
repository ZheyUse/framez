'use client';

import { useState, useMemo } from 'react';
import { X, Plus, AlertTriangle, FileText } from 'lucide-react';
import { useTextElementStore } from '@/store/useTextElementStore';
import { useEditorStore } from '@/store/useEditorStore';
import { useScriptStore, ScriptSet } from '@/store/useScriptStore';
import { isGlobalText } from '@/types/textElement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface ScriptPanelProps {
  onClose: () => void;
  isMobile?: boolean;
}

export function ScriptPanel({ onClose, isMobile = false }: ScriptPanelProps) {
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingScriptSets, setPendingScriptSets] = useState<ScriptSet[] | null>(null);

  const updateElement = useTextElementStore((state) => state.updateElement);
  const saveToHistory = useTextElementStore((state) => state.saveToHistory);
  const elements = useTextElementStore((state) => state.elements);
  const { images } = useEditorStore();
  const { scriptSets, addScriptSet, updateScriptSet, removeScriptSet, clearScriptSets } =
    useScriptStore();

  const imageCount = images.length;

  const getValuesCount = (scriptSet: ScriptSet) => {
    return scriptSet.values.filter((v) => v.trim() !== '').length;
  };

  const excessSets = useMemo(() => {
    if (imageCount === 0) return [];
    return scriptSets.filter(
      (set) => set.placeholder.trim() !== '' && getValuesCount(set) > imageCount && imageCount > 0
    );
  }, [scriptSets, imageCount]);

  const missingSets = useMemo(() => {
    if (imageCount === 0) return [];
    return scriptSets.filter(
      (set) => set.placeholder.trim() !== '' && getValuesCount(set) < imageCount && getValuesCount(set) > 0 && imageCount > 0
    );
  }, [scriptSets, imageCount]);

  const parseValues = (input: string): string[] => {
    return input.split('\n').map((line) => line);
  };

  const formatValues = (values: string[]): string => {
    return values.join('\n');
  };

  const applyReplacements = (sets: ScriptSet[]) => {
    const currentElements = useTextElementStore.getState().elements;

    if (imageCount === 0 || currentElements.length === 0) return;

    saveToHistory();

    // Get global elements
    const globalElements = currentElements.filter((el) => isGlobalText(el));

    // Build all overrides for each element in one pass
    globalElements.forEach((element) => {
      const allOverrides: Record<number, { text: string }> = {};

      // Copy existing overrides
      if (element.overrides) {
        Object.keys(element.overrides).forEach(key => {
          const idx = parseInt(key);
          if (!isNaN(idx)) {
            allOverrides[idx] = { text: element.overrides[idx].text || element.text };
          }
        });
      }

      // Calculate new text for each image
      for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
        let newText = element.text;

        sets.forEach((set) => {
          if (set.placeholder.trim() === '') return;
          const value = set.values[imageIndex] || '';
          newText = newText.split(set.placeholder).join(value);
        });

        // Only set override if text actually changed
        if (newText !== element.text) {
          allOverrides[imageIndex] = { text: newText };
        }
      }

      // Single update with all overrides
      updateElement(element.id, { overrides: allOverrides });
    });
  };

  const handleSaveClick = () => {
    if (excessSets.length > 0) {
      setPendingScriptSets(scriptSets);
      setShowWarningDialog(true);
      return;
    }

    if (missingSets.length > 0) {
      setPendingScriptSets(scriptSets);
      setShowWarningDialog(true);
      return;
    }

    applyReplacements(scriptSets);
  };

  const handleProceedAnyway = () => {
    if (pendingScriptSets) {
      applyReplacements(pendingScriptSets);
    }
    setShowWarningDialog(false);
    setPendingScriptSets(null);
  };

  const handleCancelWarning = () => {
    setShowWarningDialog(false);
    setPendingScriptSets(null);
  };

  const existingPlaceholders = useMemo(() => {
    const seen = new Set<string>();
    elements.forEach((el) => {
      const matches = el.text.matchAll(/<([^>]+)>/g);
      for (const match of matches) {
        seen.add(`<${match[1]}>`);
      }
    });
    return Array.from(seen);
  }, [elements]);

  const handleQuickAdd = (placeholder: string) => {
    const existingSet = scriptSets.find((s) => s.placeholder === placeholder);
    if (!existingSet) {
      const newSetId = addScriptSet();
      updateScriptSet(newSetId, { placeholder });
    }
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-3'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-white font-medium"
          style={{ fontFamily: 'var(--font-space-mono), monospace' }}
        >
          Script
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-[#aaff00] mt-0.5 shrink-0" />
          <p
            className="text-[#a0a0a0] text-xs"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Use placeholders like {`<name>`} in your text. Add values for each image to
            bulk-replace.
          </p>
        </div>
      </div>

      {existingPlaceholders.length > 0 && (
        <div className="mb-4">
          <p
            className="text-[#a0a0a0] text-xs mb-2"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Detected placeholders:
          </p>
          <div className="flex flex-wrap gap-1">
            {existingPlaceholders.map((p) => (
              <button
                key={p}
                onClick={() => handleQuickAdd(p)}
                className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#aaff00] text-xs
                           hover:border-[#aaff00]/50 cursor-pointer transition-colors"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
        {scriptSets.length === 0 ? (
          <p className="text-[#a0a0a0] text-xs text-center py-4">
            No script sets. Click "Add Set" to start.
          </p>
        ) : (
          scriptSets.map((set) => (
            <div key={set.id} className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[#a0a0a0] text-xs"
                  style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                  Script Set
                </span>
                <button
                  onClick={() => removeScriptSet(set.id)}
                  className="text-[#a0a0a0] hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="mb-2">
                <label
                  className="block text-[#a0a0a0] text-xs mb-1"
                  style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                >
                  Placeholder
                </label>
                <Input
                  value={set.placeholder}
                  onChange={(e) => updateScriptSet(set.id, { placeholder: e.target.value })}
                  placeholder="<name>"
                  className="h-8 text-sm bg-[#111111] border-[#2a2a2a]"
                  style={{ fontFamily: 'var(--font-space-mono), monospace' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    className="text-[#a0a0a0] text-xs"
                    style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                  >
                    Values (one per line)
                  </label>
                  {set.placeholder.trim() !== '' && imageCount > 0 && (
                    <span
                      className={`text-xs ${
                        getValuesCount(set) === imageCount ? 'text-green-400' : 'text-yellow-400'
                      }`}
                    >
                      {getValuesCount(set)}/{imageCount}
                    </span>
                  )}
                </div>
                <textarea
                  value={formatValues(set.values)}
                  onChange={(e) =>
                    updateScriptSet(set.id, { values: parseValues(e.target.value) })
                  }
                  placeholder={`John${'\n'}Jane${'\n'}Bob`}
                  rows={6}
                  className="w-full px-2.5 py-2 text-sm bg-[#111111] border border-[#2a2a2a] rounded-lg
                             text-white resize-none focus:outline-none focus:border-[#aaff00] transition-colors
                             placeholder:text-[#a0a0a0]/40"
                  style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={addScriptSet}
        variant="outline"
        size="sm"
        className="w-full mb-4 border-[#2a2a2a] text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Set
      </Button>

      {excessSets.length > 0 && (
        <div className="mb-4 p-3 bg-red-400/10 border border-red-400/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-red-400 text-xs">
              {excessSets.length} set(s) have more values than images ({excessSets[0].placeholder})
            </span>
          </div>
        </div>
      )}

      {missingSets.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-yellow-400 text-xs">
              {missingSets.length} set(s) have fewer values than images
            </span>
          </div>
        </div>
      )}

      <Button
        onClick={handleSaveClick}
        className="w-full bg-[#aaff00] text-black hover:bg-[#aaff00]/90"
      >
        Apply Replacements
      </Button>

      <AlertDialog open={showWarningDialog} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {excessSets.length > 0 ? 'Too Many Values' : 'Missing Values'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {excessSets.length > 0 ? (
                <>
                  {excessSets.map((s) => s.placeholder).join(', ')} have more values than your{' '}
                  {imageCount} image(s). Remove the extra values to proceed.
                </>
              ) : (
                <>
                  {missingSets.length} script set(s) {missingSets.length === 1 ? 'has' : 'have'}{' '}
                  fewer values than your {imageCount} image(s). Images beyond the value count
                  will keep the original placeholder text.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelWarning}>
              {excessSets.length > 0 ? 'Fix Values' : 'Cancel'}
            </AlertDialogCancel>
            {excessSets.length === 0 && (
              <AlertDialogAction onClick={handleProceedAnyway}>
                Proceed Anyway
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}