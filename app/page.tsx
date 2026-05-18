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
      templateOnTop: true,
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
        <section className="flex flex-col items-center mb-12">
          <svg
            viewBox="0 0 1080 1080"
            style={{ width: '200px', height: 'auto' }}
            xmlns="http://www.w3.org/2000/svg"
            className="mb-6"
          >
            <path fill="#ffffff" d="M125.26,488.63H86.85v-9.51H67.49v61.25L96.38,524.2v39L67.49,579.12v83.47H28.76V440.4h96.5Z"/>
            <path fill="#ffffff" d="M239.85,439.75v84.12h-38.4v-18.4l-19.38,10.8v146H143.35V439.75h38.72v32.37Z"/>
            <path fill="#ffffff" d="M350.33,662.28H311.59V630.22l-57.76,32.06V551.82l57.76-32.4V478.81h-19v19.35H253.83v-58.1h96.5Zm-38.74-87V558.48l-19,10.8v27.28l19-10.46Z"/>
            <path fill="#ffffff" d="M517.63,662H478.9V500.38l-19.36,10.49V662H420.8V510.87l-19.36-10.49V662H362.72V439.75l77.61,43.17,77.3-43.17Z"/>
            <path fill="#ffffff" d="M630.32,662.59H533.49V440.4h96.83V546.73l-58.09,32.39v44.75h19.36V602.3h38.73ZM591.59,479.12H572.23v60.94l19.36-10.74Z"/>
            <path fill="#aaff00" d="M891.48,556.54h150.24L904.62,662.27H663.5V500.33H793.57l77.86-60.11H663.5V417.41h387.74L914.13,523.15H779.93V642.64Z"/>
          </svg>
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