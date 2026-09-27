import { Resource } from '@drp/shared-types';

export interface ResourceRepositoryPort {
  findAll(): Promise<Resource[]>;
}
