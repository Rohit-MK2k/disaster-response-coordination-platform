import { AuthenticatedUser } from '@drp/shared-types';
import { UseCase } from '../../index';
import { DisasterRepositoryPort } from '../ports/DisasterRepositoryPort';
import { NotFoundError, UnauthorizedError } from '../../errors';

export class DeleteDisasterUseCase implements UseCase<{ id: string; user: AuthenticatedUser }, void> {
  constructor(private repo: DisasterRepositoryPort) {}

  async execute(input: { id: string; user: AuthenticatedUser }): Promise<void> {
    if (input.user.role !== 'admin') {
      throw new UnauthorizedError('Only admins can delete disasters.');
    }
    const disaster = await this.repo.findById(input.id);
    if (!disaster) {
      throw new NotFoundError('Disaster not found.');
    }
    await this.repo.delete(input.id);
  }
}
