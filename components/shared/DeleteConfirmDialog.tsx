'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ open, itemName, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            Delete Template
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#a0a0a0]">
            Delete &ldquo;{itemName}&rdquo;? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="border border-[#2a2a2a] text-white hover:border-[#aaff00] hover:text-[#aaff00] bg-transparent cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-[#ff4444] text-white hover:bg-[#ff4444]/90 cursor-pointer"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}