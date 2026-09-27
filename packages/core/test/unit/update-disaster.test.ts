import { describe, it, expect, vi } from 'vitest';
import { UpdateDisasterUseCase } from '../../src/disasters/use-cases/UpdateDisasterUseCase';
import { DisasterRepositoryPort } from '../../src/disasters/ports/DisasterRepositoryPort';
import { GeocodingPort } from '../../src/disasters/ports/GeocodingPort';
import { NotFoundError } from '../../src/errors';
import { Disaster } from '@drp/shared-types';

describe('UpdateDisasterUseCase', () => {
  const mockRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findAll: vi.fn()
  } as DisasterRepositoryPort;

  const mockGeocoder = {
    resolve: vi.fn()
  } as GeocodingPort;

  const useCase = new UpdateDisasterUseCase(mockRepo, mockGeocoder);
  const mockUser = { id: 'u1', role: 'admin' as const };
  const existingDisaster: Disaster = {
    id: 'd1', title: 'Test', description: 'Fire in Manhattan', location_name: 'Manhattan', location_lat: 40, location_lng: -74, tags: [], status: 'active', created_by: 'u1', created_at: '', updated_at: ''
  };

  it('should throw NotFoundError if disaster does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute({ id: 'bad', input: { status: 'resolved' }, user: mockUser }))
      .rejects.toThrow(NotFoundError);
  });

  it('should skip geocoding if location_name is still in the new description', async () => {
    mockRepo.findById.mockResolvedValue(existingDisaster);
    mockRepo.update.mockResolvedValue({ ...existingDisaster, description: 'Fire in Manhattan is worse' });
    mockGeocoder.resolve.mockClear();

    await useCase.execute({ id: 'd1', input: { description: 'Fire in Manhattan is worse' }, user: mockUser });
    
    expect(mockGeocoder.resolve).not.toHaveBeenCalled();
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('should call geocoder if location_name is no longer in the new description', async () => {
    mockRepo.findById.mockResolvedValue(existingDisaster);
    mockGeocoder.resolve.mockResolvedValue({ name: 'Brooklyn', lat: 40.6, lng: -73.9 });
    mockRepo.update.mockResolvedValue({ ...existingDisaster, description: 'Actually in Brooklyn', location_name: 'Brooklyn' });
    mockGeocoder.resolve.mockClear();

    await useCase.execute({ id: 'd1', input: { description: 'Actually in Brooklyn' }, user: mockUser });
    
    expect(mockGeocoder.resolve).toHaveBeenCalledWith('Actually in Brooklyn');
    expect(mockRepo.update).toHaveBeenCalledWith('d1', expect.objectContaining({ location_name: 'Brooklyn', location_lat: 40.6 }));
  });
});
