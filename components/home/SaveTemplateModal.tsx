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

interface SaveTemplateModalProps {
  file: File | null;
  open: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function SaveTemplateModal({ file, open, onSave, onClose }: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setName(file.name.replace(/\.(png|svg)$/i, ''));
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file]);

  useEffect(() => {
    if (open) {
      setName('');
      setError('');
    }
  }, [open]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }
    onSave(name.trim());
    setName('');
    setError('');
  };

  const handleClose = () => {
    setName('');
    setError('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-md">
        <DialogHeader>
          <DialogTitle
            className="font-mono text-white"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Save Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#111111] rounded-lg p-4 flex items-center justify-center min-h-[120px]">
            <img
              src={previewUrl}
              alt="Template preview"
              className="max-h-48 object-contain"
            />
          </div>

          <div>
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold cursor-pointer"
          >
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}