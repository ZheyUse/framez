'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { TemplateUploadZone } from '@/components/home/TemplateUploadZone';
import { SaveTemplateModal } from '@/components/home/SaveTemplateModal';
import { TemplateCard } from '@/components/home/TemplateCard';
import { TemplateGrid } from '@/components/home/TemplateGrid';
import { EmptyTemplates } from '@/components/home/EmptyTemplates';
import { useTemplateStore } from '@/store/useTemplateStore';
import { Template } from '@/types/template';
import { fileToDataURL, getImageDimensions, createThumbnail } from '@/lib/utils/imageUtils';
import { generateId, sanitizeName } from '@/lib/utils/fileUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { templates, isLoading, fetch, add, remove, rename } = useTemplateStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setShowSaveModal(true);
  };

  const handleSaveTemplate = async (name: string) => {
    if (!selectedFile) return;

    const dataURL = await fileToDataURL(selectedFile);
    const { width, height } = await getImageDimensions(dataURL);
    const thumbnail = await createThumbnail(dataURL, 400);

    const template: Template = {
      id: generateId(),
      name: sanitizeName(name),
      dataURL,
      thumbnail,
      fileType: selectedFile.type === 'image/svg+xml' ? 'svg' : 'png',
      width,
      height,
      createdAt: Date.now(),
    };

    await add(template);
    toast.success('Template saved!');
    setShowSaveModal(false);
    setSelectedFile(null);
  };

  const handleDelete = async (id: string, name: string) => {
    await remove(id);
    toast.success('Template deleted');
  };

  const handleRename = async (id: string, name: string) => {
    await rename(id, name);
    toast.success('Template renamed!');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1
            className="text-5xl sm:text-6xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            <span className="text-white">Frame</span>
            <span className="text-[#aaff00]">Z</span>
          </h1>
          <p
            className="text-[#a0a0a0] text-lg"
            style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
          >
            Batch photos. One frame. Zero effort.
          </p>
        </section>

        {/* Upload Section */}
        <section className="mb-12">
          <h2
            className="text-sm uppercase tracking-wider text-[#a0a0a0] mb-4"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            Upload Template
          </h2>
          <TemplateUploadZone onFileSelected={handleFileSelected} />
        </section>

        {/* Templates Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2
              className="text-sm uppercase tracking-wider text-[#a0a0a0]"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              My Templates
            </h2>
            {templates.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaff00]"
                style={{ fontFamily: 'var(--font-space-mono), monospace' }}
              >
                {templates.length}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden"
                >
                  <Skeleton className="aspect-square bg-[#1a1a1a]" />
                  <div className="p-3">
                    <Skeleton className="h-4 w-3/4 bg-[#1a1a1a] mb-2" />
                    <Skeleton className="h-3 w-1/2 bg-[#1a1a1a]" />
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length > 0 ? (
            <TemplateGrid>
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onDelete={() => handleDelete(template.id, template.name)}
                  onRename={(name) => handleRename(template.id, name)}
                />
              ))}
            </TemplateGrid>
          ) : (
            <EmptyTemplates />
          )}
        </section>
      </main>

      <SaveTemplateModal
        file={selectedFile}
        open={showSaveModal}
        onSave={handleSaveTemplate}
        onClose={() => {
          setShowSaveModal(false);
          setSelectedFile(null);
        }}
      />
    </div>
  );
}