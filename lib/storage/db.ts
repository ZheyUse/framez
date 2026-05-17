import Dexie, { Table } from 'dexie';
import { Template } from '@/types/template';
import { TextElement } from '@/types/textElement';

class FrameZDB extends Dexie {
  templates!: Table<Template>;
  textElements!: Table<TextElement>;

  constructor() {
    super('FrameZDB');
    this.version(1).stores({ templates: 'id, name, createdAt' });
    this.version(2).stores({ templates: 'id, name, createdAt', textElements: 'id, templateId, createdAt' });
  }
}

export const db = new FrameZDB();