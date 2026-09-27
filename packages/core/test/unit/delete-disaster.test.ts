import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisasterUseCase } from '../../src/disasters/use-cases/DeleteDisasterUseCase';
import { DisasterRepositoryPort } from '../../src/disasters/ports/DisasterRepositoryPort';
import { NotFoundError, UnauthorizedError } from '../../src/errors';
import { AuthenticatedUser, Disaster } from '@drp/shared-types';

describe('DeleteDisasterUseCase', () => {
  let mockRepo: DisasterRepositoryPort;
  let useCase: DeleteDisasterUseCase;

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
    };
    useCase = new DeleteDisasterUseCase(mockRepo);
  });

  it('should delete a disaster successfully if user is admin', async () => {
    const admin: AuthenticatedUser = { id: 'admin1', role: 'admin' };
    vi.mocked(mockRepo.findById).mockResolvedValue({ id: 'd1' } as Disaster);
    vi.mocked(mockRepo.delete).mockResolvedValue();

    await useCase.execute({ id: 'd1', user: admin });

    expect(mockRepo.findById).toHaveBeenCalledWith('d1');
    expect(mockRepo.delete).toHaveBeenCalledWith('d1');
  });

  it('should throw UnauthorizedError and not call delete if user is contributor', async () => {
    const contributor: AuthenticatedUser = { id: 'contributor1', role: 'contributor' };

    await expect(useCase.execute({ id: 'd1', user: contributor })).rejects.toThrowError(UnauthorizedError);

    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError if disaster does not exist', async () => {
    const admin: AuthenticatedUser = { id: 'admin1', role: 'admin' };
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute({ id: 'd1', user: admin })).rejects.toThrowError(NotFoundError);

    expect(mockRepo.findById).toHaveBeenCalledWith('d1');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
