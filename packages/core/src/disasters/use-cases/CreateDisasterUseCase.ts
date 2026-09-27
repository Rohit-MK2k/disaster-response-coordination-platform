import { AuthenticatedUser, CreateDisasterInput, Disaster } from '@drp/shared-types';
import { UseCase } from '../../index';
import { DisasterRepositoryPort } from '../ports/DisasterRepositoryPort';
import { TextExtractionPort } from '../ports/TextExtractionPort';
import { GeocodingPort } from '../ports/GeocodingPort';
import { CachePort } from '../ports/CachePort';
import { ValidationError } from '../../errors';
import { randomUUID } from 'crypto';

export class CreateDisasterUseCase implements UseCase<{ input: CreateDisasterInput; user: AuthenticatedUser }, Disaster> {
  constructor(
    private repo: DisasterRepositoryPort,
    private extractor: TextExtractionPort,
    private geocoder: GeocodingPort,
    private cache: CachePort
  ) {}

  async execute({ input, user }: { input: CreateDisasterInput; user: AuthenticatedUser }): Promise<Disaster> {
    if (!input.text || input.text.trim().length === 0) {
      throw new ValidationError('Text cannot be empty');
    }
    
    const { title, tags, locationText } = await this.extractor.extract(input.text);
    
    let location = await this.cache.get<{ name: string; lat: number; lng: number }>(`geo:${locationText}`);
    if (!location) {
      location = await this.geocoder.resolve(locationText);
      await this.cache.set(`geo:${locationText}`, location, 3600);
    }

    const now = new Date().toISOString();
    const disaster: Disaster = {
      id: randomUUID(),
      title,
      description: input.text,
      location_name: location.name,
      location_lat: location.lat,
      location_lng: location.lng,
      tags,
      status: 'active',
      created_by: user.id,
      created_at: now,
      updated_at: now,
    };
    
    await this.repo.save(disaster);
    return disaster;
  }
}
