import { useRef, useState } from 'react';
import { runBatchExport, ExportOptions } from '@/lib/canvas/exportPipeline';
import { UploadedImage } from '@/types/editor';
import { Template } from '@/types/template';

interface Progress {
  done: number;
  total: number;
  running: boolean;
  finished: boolean;
  cancelled: boolean;
}

export function useBatchExport() {
  const [progress, setProgress] = useState<Progress>({
    done: 0,
    total: 0,
    running: false,
    finished: false,
    cancelled: false,
  });
  const cancelRef = useRef({ cancelled: false });

  const start = async (images: UploadedImage[], template: Template, options: ExportOptions) => {
    cancelRef.current = { cancelled: false };
    setProgress({ done: 0, total: images.length, running: true, finished: false, cancelled: false });

    await runBatchExport(
      images,
      template,
      options,
      (done, total) => setProgress({ done, total, running: true, finished: false, cancelled: false }),
      cancelRef.current,
    );

    if (!cancelRef.current.cancelled) {
      setProgress((p) => ({ ...p, running: false, finished: true }));
    }
  };

  const cancel = () => {
    cancelRef.current.cancelled = true;
    setProgress((p) => ({ ...p, running: false, cancelled: true }));
  };

  const reset = () => setProgress({ done: 0, total: 0, running: false, finished: false, cancelled: false });

  return { progress, start, cancel, reset };
}