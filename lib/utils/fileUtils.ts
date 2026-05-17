export const generateId = () => crypto.randomUUID();

export const sanitizeName = (s: string) => s.replace(/[^a-zA-Z0-9 _\-]/g, '').trim();

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};