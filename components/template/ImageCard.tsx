'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { UploadedImage } from '@/types/editor';

interface ImageCardProps {
  image: UploadedImage;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ImageCard({ image, isActive, onClick, onDelete }: ImageCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      className={`
        aspect-square rounded-lg overflow-hidden cursor-pointer relative
        transition-all duration-200
        ${isActive ? 'ring-2 ring-[#aaff00]' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <img
        src={image.thumb}
        alt={image.name}
        className="w-full h-full object-cover bg-[#111111]"
      />

      {showDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 p-1 bg-[#ff4444] rounded-md text-white hover:bg-[#ff4444]/80 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}