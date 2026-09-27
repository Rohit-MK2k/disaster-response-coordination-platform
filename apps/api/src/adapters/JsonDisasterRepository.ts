import { DisasterRepositoryPort } from '@drp/core';
import { Disaster } from '@drp/shared-types';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isTest = process.env.NODE_ENV === 'test';
const DATA_FILE = path.resolve(__dirname, `../../data/${isTest ? 'test-disasters.json' : 'disasters.json'}`);

export class JsonDisasterRepository implements DisasterRepositoryPort {
  
  private async readData(): Promise<Disaster[]> {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(DATA_FILE, '[]', 'utf-8');
        return [];
      }
      throw error;
    }
  }

  private async writeData(disasters: Disaster[]): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(disasters, null, 2), 'utf-8');
  }

  async save(disaster: Disaster): Promise<void> {
    const disasters = await this.readData();
    disasters.push(disaster);
    await this.writeData(disasters);
  }

  async update(id: string, data: Partial<Disaster>): Promise<Disaster> {
    const disasters = await this.readData();
    const index = disasters.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Disaster not found');
    
    const updated = { ...disasters[index], ...data };
    disasters[index] = updated;
    await this.writeData(disasters);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const disasters = await this.readData();
    const filtered = disasters.filter(d => d.id !== id);
    await this.writeData(filtered);
  }

  async findById(id: string): Promise<Disaster | null> {
    const disasters = await this.readData();
    return disasters.find(d => d.id === id) || null;
  }

  async findAll(): Promise<Disaster[]> {
    return this.readData();
  }
}
