import { db } from './db';
import { TextElement } from '@/types/textElement';

interface TextElementRecord extends TextElement {
  id: string;
  templateId: string;
}

class TextElementsDB {
  async add(element: TextElement): Promise<string> {
    await db.textElements.add(element);
    return element.id;
  }

  async update(id: string, changes: Partial<TextElement>): Promise<void> {
    await db.textElements.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await db.textElements.delete(id);
  }

  async get(id: string): Promise<TextElement | undefined> {
    return db.textElements.get(id);
  }

  async getByTemplate(templateId: string): Promise<TextElement[]> {
    return db.textElements.where('templateId').equals(templateId).toArray();
  }

  async getByTemplateAndImage(templateId: string, imageIndex: number): Promise<TextElement[]> {
    return db.textElements
      .where('templateId')
      .equals(templateId)
      .filter((el) => el.imageIndex === undefined || el.imageIndex === imageIndex)
      .toArray();
  }

  async getGlobalForTemplate(templateId: string): Promise<TextElement[]> {
    return db.textElements
      .where('templateId')
      .equals(templateId)
      .filter((el) => el.imageIndex === undefined)
      .toArray();
  }

  async putMany(elements: TextElement[]): Promise<void> {
    await db.textElements.bulkPut(elements);
  }

  async deleteByTemplate(templateId: string): Promise<void> {
    await db.textElements.where('templateId').equals(templateId).delete();
  }
}

export const textElementsDB = new TextElementsDB();

// Debounced auto-save (shorter delay for faster persistence)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const saveTemplateTexts = (templateId: string, elements: TextElement[]): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      // Delete existing elements for this template
      await textElementsDB.deleteByTemplate(templateId);

      // Add all current elements (WITHOUT overrides - Script changes are temporary)
      if (elements.length > 0) {
        const elementsToSave = elements.map((el) => {
          const { overrides, ...rest } = el; // Exclude overrides
          return { ...rest, templateId, overrides: {} }; // Include empty overrides
        });
        await textElementsDB.putMany(elementsToSave);
      }
    } catch (e) {
      console.error('Failed to save template texts:', e);
    }
  }, 100);
};

export const loadTemplateTexts = async (templateId: string): Promise<TextElement[]> => {
  try {
    return await textElementsDB.getByTemplate(templateId);
  } catch (e) {
    console.error('Failed to load template texts:', e);
    return [];
  }
};

export const clearTemplateTexts = async (templateId: string): Promise<void> => {
  try {
    await textElementsDB.deleteByTemplate(templateId);
  } catch (e) {
    console.error('Failed to clear template texts:', e);
  }
};