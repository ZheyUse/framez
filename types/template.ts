export interface Template {
  id: string;
  name: string;
  dataURL: string;
  thumbnail: string;
  fileType: 'png' | 'svg';
  width: number;
  height: number;
  createdAt: number;
}