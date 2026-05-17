export interface UploadedImage {
  id: string;
  file: File;
  dataURL: string;
  thumb: string;
  name: string;
  width: number;
  height: number;
}