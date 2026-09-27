import { AuthenticatedUser, CreateDisasterInput, Disaster } from '@drp/shared-types';
import { UseCase } from '../../index';
import { DisasterRepositoryPort } from '../ports/DisasterRepositoryPort';
import { randomUUID } from 'crypto';

export class CreateDisasterUseCase implements UseCase<{ input: CreateDisasterInput; user: AuthenticatedUser }, Disaster> {
  constructor(private repo: DisasterRepositoryPort) {}

  async execute({ input, user }: { input: CreateDisasterInput; user: AuthenticatedUser }): Promise<Disaster> {
    const now = new Date().toISOString();
    const disaster: Disaster = {
      id: randomUUID(),
      ...input,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    };
    
    await this.repo.save(disaster);
    return disaster;
  }
}
