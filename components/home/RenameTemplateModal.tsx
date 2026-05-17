'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RenameTemplateModalProps {
  open: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function RenameTemplateModal({ open, currentName, onSave, onClose }: RenameTemplateModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError('');
    }
  }, [open, currentName]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }
    onSave(name.trim());
    setName('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-md">
        <DialogHeader>
          <DialogTitle
            className="font-mono text-white"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Rename Template
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Graduation 2024"
            autoFocus
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#aaff00] outline-none font-mono"
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              borderColor: error ? '#ff4444' : '#2a2a2a',
            }}
          />
          {error && (
            <p className="text-[#ff4444] text-sm mt-1" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold cursor-pointer"
          >
            Update Name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}