import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resource } from '@drp/shared-types';
import { ResourceRepositoryPort } from '@drp/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../data/resources.json');

export class JsonResourceRepository implements ResourceRepositoryPort {
  async findAll(): Promise<Resource[]> {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
