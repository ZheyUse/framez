import Dexie, { Table } from 'dexie';
import { Template } from '@/types/template';

class FrameZDB extends Dexie {
  templates!: Table<Template>;

  constructor() {
    super('FrameZDB');
    this.version(1).stores({ templates: 'id, name, createdAt' });
  }
}

export const db = new FrameZDB();