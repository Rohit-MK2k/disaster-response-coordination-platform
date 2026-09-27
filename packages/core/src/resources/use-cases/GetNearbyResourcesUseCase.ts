import { UseCase } from '../../index';
import { Resource } from '@drp/shared-types';
import { DisasterRepositoryPort } from '../../disasters/ports/DisasterRepositoryPort';
import { ResourceRepositoryPort } from '../ports/ResourceRepositoryPort';
import { haversineDistance } from '../utils/haversine';
import { NotFoundError } from '../../errors';

export type NearbyResource = Resource & { distanceKm: number };

export interface GetNearbyResourcesInput {
  disasterId: string;
  lat?: number;
  lng?: number;
  radiusKm: number;
}

export class GetNearbyResourcesUseCase implements UseCase<GetNearbyResourcesInput, NearbyResource[]> {
  constructor(
    private disasterRepo: DisasterRepositoryPort,
    private resourceRepo: ResourceRepositoryPort
  ) {}

  async execute({ disasterId, lat, lng, radiusKm }: GetNearbyResourcesInput): Promise<NearbyResource[]> {
    const disaster = await this.disasterRepo.findById(disasterId);
    if (!disaster) {
      throw new NotFoundError('Disaster not found');
    }

    const queryLat = lat ?? disaster.location_lat;
    const queryLng = lng ?? disaster.location_lng;

    const resources = await this.resourceRepo.findAll();
    
    const nearby = resources.map(res => {
      const distanceKm = haversineDistance(queryLat, queryLng, res.location_lat, res.location_lng);
      return { ...res, distanceKm };
    }).filter(res => res.distanceKm <= radiusKm);

    return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
  }
}
