import { Disaster } from '@drp/shared-types';

export interface DisasterRepositoryPort {
  save(disaster: Disaster): Promise<void>;
  update(id: string, data: Partial<Disaster>): Promise<Disaster>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Disaster | null>;
  findAll(): Promise<Disaster[]>;
}
