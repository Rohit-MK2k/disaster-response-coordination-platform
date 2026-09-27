import { Disaster } from '@drp/shared-types';
import { UseCase } from '../../index';
import { DisasterRepositoryPort } from '../ports/DisasterRepositoryPort';
import { NotFoundError } from '../../errors';

export class GetDisasterUseCase implements UseCase<string, Disaster> {
  constructor(private repo: DisasterRepositoryPort) {}

  async execute(id: string): Promise<Disaster> {
    const disaster = await this.repo.findById(id);
    if (!disaster) {
      throw new NotFoundError('Disaster not found.');
    }
    return disaster;
  }
}

export class ListDisastersUseCase implements UseCase<void, Disaster[]> {
  constructor(private repo: DisasterRepositoryPort) {}

  async execute(): Promise<Disaster[]> {
    return this.repo.findAll();
  }
}
