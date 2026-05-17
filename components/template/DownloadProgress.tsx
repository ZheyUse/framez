'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DownloadProgressProps {
  progress: { done: number; total: number; running: boolean; finished: boolean; cancelled: boolean };
  templateName: string;
  onCancel: () => void;
  onClose: () => void;
}

export function DownloadProgress({ progress, templateName, onCancel, onClose }: DownloadProgressProps) {
  const isOpen = progress.running || progress.finished || progress.cancelled;

  if (!isOpen) {
    return null;
  }

  const percentage = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  if (progress.cancelled) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-md">
          <DialogHeader className="text-center items-center">
            <div className="w-16 h-16 rounded-full bg-[#ff4444]/20 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-[#ff4444]" />
            </div>
            <DialogTitle
              className="text-white text-xl"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Export Cancelled
            </DialogTitle>
            <DialogDescription
              className="text-[#a0a0a0] text-center"
              style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              {progress.done} of {progress.total} images were exported<br />
              before the export was cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={onClose}
              className="bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold w-full cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (progress.finished) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-md">
          <DialogHeader className="text-center items-center">
            <div className="w-16 h-16 rounded-full bg-[#aaff00]/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-[#aaff00]" />
            </div>
            <DialogTitle
              className="text-white text-xl"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              Export Complete!
            </DialogTitle>
            <DialogDescription
              className="text-[#a0a0a0] text-center"
              style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
            >
              {templateName}.zip is downloading<br />
              {progress.total} images exported
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={onClose}
              className="bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold w-full cursor-pointer"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true}>
      <DialogContent
        className="bg-[#1a1a1a] border-[#2a2a2a] max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle
            className="text-white text-center"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Exporting Images
          </DialogTitle>
          <DialogDescription
            className="text-[#a0a0a0] text-center"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Please wait while your images are being processed...
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-center">
            <Download className="w-12 h-12 text-[#aaff00] animate-pulse" />
          </div>

          <Progress
            value={percentage}
            className="h-3 [&>div]:bg-[#aaff00] [&>div]:transition-all"
          />

          <div className="text-center">
            <span
              className="text-[#aaff00] text-lg"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {progress.done} / {progress.total}
            </span>
            <span className="text-[#a0a0a0] ml-2" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
              images · {percentage}%
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onCancel}
            className="bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold w-full cursor-pointer"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}