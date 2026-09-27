import { describe, it, expect, vi } from 'vitest';
import { CreateDisasterUseCase } from '../../src/disasters/use-cases/CreateDisasterUseCase';
import { DisasterRepositoryPort } from '../../src/disasters/ports/DisasterRepositoryPort';
import { TextExtractionPort } from '../../src/disasters/ports/TextExtractionPort';
import { GeocodingPort } from '../../src/disasters/ports/GeocodingPort';
import { CachePort } from '../../src/disasters/ports/CachePort';
import { ValidationError } from '../../src/errors';
import { Disaster } from '@drp/shared-types';

describe('CreateDisasterUseCase', () => {
  const mockRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findAll: vi.fn()
  } as DisasterRepositoryPort;

  const mockExtractor = {
    extract: vi.fn()
  } as TextExtractionPort;

  const mockGeocoder = {
    resolve: vi.fn()
  } as GeocodingPort;

  const mockCache = {
    get: vi.fn(),
    set: vi.fn()
  } as CachePort;

  const useCase = new CreateDisasterUseCase(mockRepo, mockExtractor, mockGeocoder, mockCache);
  const mockUser = { id: 'u1', role: 'contributor' as const };

  it('should throw ValidationError if text is empty', async () => {
    await expect(useCase.execute({ input: { text: '   ' }, user: mockUser }))
      .rejects.toThrow(ValidationError);
  });

  it('should skip geocoding on cache hit and save disaster with created_by', async () => {
    mockExtractor.extract.mockResolvedValue({ title: 'Test', tags: ['a'], locationText: 'NYC' });
    mockCache.get.mockResolvedValue({ name: 'New York', lat: 40, lng: -74 });
    mockGeocoder.resolve.mockClear();
    
    const disaster = await useCase.execute({ input: { text: 'Flood in NYC' }, user: mockUser });
    
    expect(mockCache.get).toHaveBeenCalledWith('geo:NYC');
    expect(mockGeocoder.resolve).not.toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
    expect(disaster.created_by).toBe('u1');
    expect(disaster.location_name).toBe('New York');
  });

  it('should call geocoder on cache miss, save to cache, and save disaster', async () => {
    mockExtractor.extract.mockResolvedValue({ title: 'Test', tags: ['a'], locationText: 'LA' });
    mockCache.get.mockResolvedValue(null); // Cache miss
    mockGeocoder.resolve.mockResolvedValue({ name: 'Los Angeles', lat: 34, lng: -118 });
    mockCache.set.mockClear();
    
    const disaster = await useCase.execute({ input: { text: 'Fire in LA' }, user: mockUser });
    
    expect(mockGeocoder.resolve).toHaveBeenCalledWith('LA');
    expect(mockCache.set).toHaveBeenCalledWith('geo:LA', { name: 'Los Angeles', lat: 34, lng: -118 }, 3600);
    expect(disaster.location_name).toBe('Los Angeles');
  });
});
