import { AuthenticatedUser, UpdateDisasterInput, Disaster } from '@drp/shared-types';
import { UseCase } from '../../index';
import { DisasterRepositoryPort } from '../ports/DisasterRepositoryPort';
import { NotFoundError } from '../../errors';

export class UpdateDisasterUseCase implements UseCase<{ id: string; input: UpdateDisasterInput; user: AuthenticatedUser }, Disaster> {
  constructor(private repo: DisasterRepositoryPort) {}

  async execute({ id, input, user }: { id: string; input: UpdateDisasterInput; user: AuthenticatedUser }): Promise<Disaster> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Disaster not found.');
    }
    
    // Merge updates
    const updated = await this.repo.update(id, {
      ...input,
      updated_at: new Date().toISOString()
    });

    return updated;
  }
}
