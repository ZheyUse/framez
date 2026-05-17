'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Template } from '@/types/template';
import { RenameTemplateModal } from './RenameTemplateModal';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';

interface TemplateCardProps {
  template: Template;
  onDelete: () => void;
  onRename: (name: string) => void;
}

export function TemplateCard({ template, onDelete, onRename }: TemplateCardProps) {
  const [showRenameModal, setShowRenameModal] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleRename = (name: string) => {
    onRename(name);
    setShowRenameModal(false);
  };

  return (
    <>
      <div className="group bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden transition-all duration-200 hover:border-[#aaff00] hover:-translate-y-0.5 shadow-[0_0_16px_rgba(170,255,0,0.15)]">
        <Link
          href={`/template/${template.id}`}
          className="block aspect-square bg-[#1a1a1a] overflow-hidden"
        >
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className="font-mono text-white truncate"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                {template.name}
              </h3>
              <p
                className="text-[#a0a0a0] text-sm"
                style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
              >
                Added {getRelativeTime(template.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowRenameModal(true)}
                className="p-1.5 rounded-md text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                title="Rename"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-1.5 rounded-md text-[#a0a0a0] hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <RenameTemplateModal
        open={showRenameModal}
        currentName={template.name}
        onSave={handleRename}
        onClose={() => setShowRenameModal(false)}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        itemName={template.name}
        onConfirm={() => {
          setShowDeleteDialog(false);
          onDelete();
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}

import React from 'react';

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}