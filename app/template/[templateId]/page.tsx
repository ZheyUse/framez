'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTemplate } from '@/lib/storage/templates';
import { Template } from '@/types/template';
import { useEditorStore } from '@/store/useEditorStore';
import { useBatchExport } from '@/hooks/useBatchExport';
import { Navbar } from '@/components/layout/Navbar';
import { TemplatePreview } from '@/components/template/TemplatePreview';
import { ImageGrid } from '@/components/template/ImageGrid';
import { ImageUploadZone } from '@/components/template/ImageUploadZone';
import { ImagePreviewModal } from '@/components/template/ImagePreviewModal';
import { DownloadProgress } from '@/components/template/DownloadProgress';
import { Button } from '@/components/ui/button';
import { UploadedImage } from '@/types/editor';
import { Download } from 'lucide-react';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

export default function TemplateEditorPage({ params }: PageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [templateId, setTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const { images, activeIndex, addImages, removeImage, setActive, clear } = useEditorStore();
  const { progress, start, cancel, reset } = useBatchExport();

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTemplateId(resolvedParams.templateId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!templateId) return;

    const loadTemplate = async () => {
      const tmpl = await getTemplate(templateId);
      if (!tmpl) {
        router.push('/');
        return;
      }
      setTemplate(tmpl);
      setLoading(false);
    };

    loadTemplate();
  }, [templateId, router]);

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  const handleStartExport = () => {
    if (!template || images.length === 0) return;
    start(images, template, { format: 'png', quality: 0.95 });
  };

  const activeImage = images.length > 0 ? images[activeIndex] : null;

  if (loading || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <p className="text-[#a0a0a0]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        rightContent={
          <div className="flex items-center gap-4">
            <span
              className="hidden sm:block truncate max-w-[200px] text-white"
              style={{ fontFamily: 'var(--font-space-mono), monospace' }}
            >
              {template.name}
            </span>
            <Button
              onClick={handleStartExport}
              disabled={images.length === 0}
              className="bg-[#aaff00] text-black hover:bg-[#88cc00] font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All ({images.length})
            </Button>
          </div>
        }
      />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero - Template Name */}
        <div className="mb-8 text-center sm:hidden">
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-space-mono), monospace' }}
          >
            {template.name}
          </h1>
        </div>

        {/* Template Preview */}
        <TemplatePreview
          templateDataURL={template.dataURL}
          templateWidth={template.width}
          templateHeight={template.height}
          activeImage={activeImage}
          total={images.length}
          activeIndex={activeIndex}
          onPrev={() => setActive(Math.max(0, activeIndex - 1))}
          onNext={() => setActive(Math.min(images.length - 1, activeIndex + 1))}
        />

        {/* Uploaded Images Grid */}
        <ImageGrid
          images={images}
          activeIndex={activeIndex}
          onSelect={(i) => {
            setActive(i);
            setPreviewImage(images[i]);
          }}
          onDelete={removeImage}
          onAddMore={() => uploadInputRef.current?.click()}
        />

        {/* Hidden file input for adding more */}
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              const processImages = async () => {
                const validFiles = Array.from(files).filter((f) =>
                  ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
                );
                const processed: UploadedImage[] = [];

                for (const file of validFiles) {
                  const dataURL = await new Promise<string>((res) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.readAsDataURL(file);
                  });

                  const { width, height } = await new Promise<{ width: number; height: number }>((res) => {
                    const img = new Image();
                    img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
                    img.src = dataURL;
                  });

                  const thumbCanvas = document.createElement('canvas');
                  const scale = Math.min(400 / width, 400 / height, 1);
                  thumbCanvas.width = Math.round(width * scale);
                  thumbCanvas.height = Math.round(height * scale);
                  thumbCanvas.getContext('2d')?.drawImage(
                    Object.assign(document.createElement('img'), { src: dataURL }),
                    0, 0, thumbCanvas.width, thumbCanvas.height
                  );

                  processed.push({
                    id: crypto.randomUUID(),
                    file,
                    dataURL,
                    thumb: thumbCanvas.toDataURL('image/jpeg', 0.92),
                    name: file.name,
                    width,
                    height,
                  });
                }

                addImages(processed);
              };
              processImages();
            }
            e.target.value = '';
          }}
        />

        {/* Bulk Upload Zone */}
        <ImageUploadZone onImagesAdded={addImages} />

        {/* Download Progress */}
        <DownloadProgress
          progress={progress}
          templateName={template.name}
          onCancel={cancel}
          onClose={reset}
        />
      </main>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        templateDataURL={template.dataURL}
        templateWidth={template.width}
        templateHeight={template.height}
        open={previewImage !== null}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}