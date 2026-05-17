import { db } from './db';
import { Template } from '@/types/template';

export const saveTemplate = (t: Template) => db.templates.add(t);

export const loadTemplates = () => db.templates.orderBy('createdAt').reverse().toArray();

export const deleteTemplate = (id: string) => db.templates.delete(id);

export const getTemplate = (id: string) => db.templates.get(id);

export const updateTemplate = (id: string, changes: Partial<Template>) =>
  db.templates.update(id, changes);