import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetNearbyResourcesUseCase } from '../../src/resources/use-cases/GetNearbyResourcesUseCase';
import { DisasterRepositoryPort } from '../../src/disasters/ports/DisasterRepositoryPort';
import { ResourceRepositoryPort } from '../../src/resources/ports/ResourceRepositoryPort';
import { haversineDistance } from '../../src/resources/utils/haversine';
import { NotFoundError } from '../../src/errors';
import { Disaster, Resource } from '@drp/shared-types';

describe('haversineDistance', () => {
  it('should calculate distance correctly', () => {
    // NYC: 40.7128, -74.0060 to LA: 34.0522, -118.2437 is roughly 3935 km
    const distance = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });
  
  it('should be 0 for same coordinates', () => {
    const distance = haversineDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(distance).toBe(0);
  });
});

describe('GetNearbyResourcesUseCase', () => {
  let disasterRepo: DisasterRepositoryPort;
  let resourceRepo: ResourceRepositoryPort;
  let useCase: GetNearbyResourcesUseCase;

  const mockDisaster: Disaster = {
    id: 'd1',
    title: 'Flood',
    description: 'A flood in NYC',
    location_name: 'New York, NY',
    location_lat: 40.7128,
    location_lng: -74.0060,
    tags: ['flood'],
    status: 'active',
    created_by: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockResources: Resource[] = [
    { id: 'r1', name: 'NYC Shelter', type: 'shelter', location_lat: 40.7130, location_lng: -74.0070 }, // Very close (~0.1km)
    { id: 'r2', name: 'NJ Hospital', type: 'hospital', location_lat: 40.7300, location_lng: -74.0500 }, // Close (~4km)
    { id: 'r3', name: 'LA Rescue', type: 'rescue', location_lat: 34.0522, location_lng: -118.2437 }, // Far (~3900km)
  ];

  beforeEach(() => {
    disasterRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };
    resourceRepo = {
      findAll: vi.fn()
    };
    useCase = new GetNearbyResourcesUseCase(disasterRepo, resourceRepo);
  });

  it('should throw NotFoundError if disaster is not found', async () => {
    vi.mocked(disasterRepo.findById).mockResolvedValue(null);
    
    await expect(useCase.execute({ disasterId: 'd1', radiusKm: 10 })).rejects.toThrowError(NotFoundError);
  });

  it('should filter resources outside radius and sort by distance', async () => {
    vi.mocked(disasterRepo.findById).mockResolvedValue(mockDisaster);
    vi.mocked(resourceRepo.findAll).mockResolvedValue(mockResources);

    const result = await useCase.execute({ disasterId: 'd1', radiusKm: 10 });
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('r1');
    expect(result[1].id).toBe('r2');
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm);
  });

  it('should correctly override disaster coordinates if lat/lng are provided', async () => {
    vi.mocked(disasterRepo.findById).mockResolvedValue(mockDisaster);
    vi.mocked(resourceRepo.findAll).mockResolvedValue(mockResources);

    // Query from LA instead of NYC (the disaster location)
    const result = await useCase.execute({ 
      disasterId: 'd1', 
      lat: 34.0522, 
      lng: -118.2437, 
      radiusKm: 10 
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r3');
    expect(result[0].distanceKm).toBe(0);
  });

  it('should return empty array for disaster at 0,0 (Null Island) with no nearby resources', async () => {
    const nullIslandDisaster = { ...mockDisaster, location_lat: 0, location_lng: 0 };
    vi.mocked(disasterRepo.findById).mockResolvedValue(nullIslandDisaster);
    vi.mocked(resourceRepo.findAll).mockResolvedValue(mockResources);

    const result = await useCase.execute({ disasterId: 'd1', radiusKm: 100 });
    
    expect(result).toHaveLength(0);
  });
});
