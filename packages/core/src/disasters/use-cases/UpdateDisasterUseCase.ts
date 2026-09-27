import { AuthenticatedUser, UpdateDisasterInput, Disaster } from '@drp/shared-types';
import { UseCase } from '../../index';
import { DisasterRepositoryPort } from '../ports/DisasterRepositoryPort';
import { GeocodingPort } from '../ports/GeocodingPort';
import { NotFoundError } from '../../errors';

export class UpdateDisasterUseCase implements UseCase<{ id: string; input: UpdateDisasterInput; user: AuthenticatedUser }, Disaster> {
  constructor(
    private repo: DisasterRepositoryPort,
    private geocoder: GeocodingPort
  ) {}

  async execute({ id, input, user }: { id: string; input: UpdateDisasterInput; user: AuthenticatedUser }): Promise<Disaster> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Disaster not found.');
    }
    
    const changes: Partial<Disaster> = { ...input };

    if (input.description && !input.description.includes(existing.location_name)) {
      const location = await this.geocoder.resolve(input.description);
      changes.location_name = location.name;
      changes.location_lat = location.lat;
      changes.location_lng = location.lng;
    }

    const updated = await this.repo.update(id, {
      ...changes,
      updated_at: new Date().toISOString()
    });

    return updated;
  }
}
