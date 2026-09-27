# Execution Plan: Feature 4 - Nearby Resource Discovery

This document outlines the step-by-step implementation plan for **Feature 4**, which introduces the ability to discover and list emergency resources (shelters, hospitals, food points) near a specific disaster, aligning with the Hexagonal Architecture sequence diagrams.

## 1. Shared Types (`packages/shared-types`)
Update the shared DTOs to include the new `Resource` entity.
- **DTOs**: `Resource` will define the shape of available emergency help.

```ts
// Example Snippet:
export interface Resource {
  id: string;
  name: string;
  type: string; // e.g., 'shelter', 'hospital', 'food', 'water', 'rescue'
  location_lat: number;
  location_lng: number;
}
```

## 2. Core Architecture (`packages/core/src/resources`)
Introduce the new Port, pure utility functions, and the Use Case to orchestrate the distance calculation logic.
- **Ports**: Define `ResourceRepositoryPort`.
- **Services**: Create a pure mathematical function to calculate geographic distance (`haversineDistance`).
- **Use Cases**: `GetNearbyResourcesUseCase` fetches a disaster, fetches all resources, and filters/sorts them locally using the Haversine formula.

```ts
// Example Snippet:
export interface ResourceRepositoryPort {
  findAll(): Promise<Resource[]>;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export class GetNearbyResourcesUseCase implements UseCase<{ disasterId: string; lat?: number; lng?: number; radiusKm: number }, (Resource & { distanceKm: number })[]> {
  constructor(
    private disasterRepo: DisasterRepositoryPort,
    private resourceRepo: ResourceRepositoryPort
  ) {}

  async execute({ disasterId, lat, lng, radiusKm }: { disasterId: string; lat?: number; lng?: number; radiusKm: number }) {
    const disaster = await this.disasterRepo.findById(disasterId);
    if (!disaster) throw new NotFoundError('Disaster not found');

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
```

## 3. API Backend (`apps/api`)
Build a concrete JSON-backed Repository for Resources and wire it to a new Express route.
- **Adapters**: `JsonResourceRepository` reading from a mock `data/resources.json` file.
- **Data**: A seeded JSON file containing realistic mock resources clustered around major cities (NYC, LA, SF).
- **Routes**: `GET /disasters/:id/resources`

```ts
// Example Snippet:
import { GetNearbyResourcesUseCase } from '@drp/core';

// In routes/disasters.ts:
router.get('/:id/resources', resolveUserMiddleware, async (req, res) => {
  try {
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    const resources = await getNearbyResourcesUseCase.execute({ 
      disasterId: req.params.id, 
      lat,
      lng,
      radiusKm: radius 
    });
    res.json(resources);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 4. Web Frontend (`apps/web`)
Create the UI to discover and display these resources inside the `DisasterDetail` view.
- **`NearbyResources` Component**: A list view showing resources, their types, and the distance. This component will be mounted inside `DisasterDetail.tsx` when a specific disaster is selected.

```tsx
// Example Snippet:
import React, { useEffect, useState } from 'react';
import { apiClient } from '../api';
import { Resource } from '@drp/shared-types';

interface NearbyResource extends Resource {
  distanceKm: number;
}

export const NearbyResources = ({ disasterId }: { disasterId: string }) => {
  const [resources, setResources] = useState<NearbyResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/disasters/${disasterId}/resources?radius=25`)
      .then(res => {
        setResources(res.data);
        setLoading(false);
      });
  }, [disasterId]);

  if (loading) return <div>Finding nearby resources...</div>;
  if (resources.length === 0) return <div>No resources found within 25km.</div>;

  return (
    <ul className="resource-list">
      {resources.map(r => (
        <li key={r.id}>
          <strong>{r.name}</strong> ({r.type}) - {r.distanceKm.toFixed(1)}km away
        </li>
      ))}
    </ul>
  );
};
```

---

## 5. Testing Strategy
- **Core Unit Tests**: 
  - `haversineDistance`:
    - Verify distance between known coordinates matches expected real-world values.
  - `GetNearbyResourcesUseCase`:
    - Verify it throws `NotFoundError` if the disaster does not exist.
    - Verify it correctly filters out resources that exceed the `radiusKm`.
    - Verify it returns resources strictly sorted by `distanceKm` ascending.
    - Verify the edge case where a disaster is at `0, 0` (Null Island) returns an empty array if no resources are within the radius.
    - Verify that explicitly providing `lat` and `lng` correctly overrides the disaster's default center coordinates for the distance calculation.
- **API Tests**: 
  - Add an integration test for `GET /disasters/:id/resources` to verify the JSON endpoint returns a 200 status, successfully parses the `radius`, `lat`, and `lng` query parameters, and returns correctly shaped data.

### Design Principles Checklist for this Feature:
- [x] **Single Responsibility Principle (S in SOLID)**: The haversine formula is pulled out into a pure math utility function rather than cluttering the use case. The Use Case itself focuses solely on orchestration.
- [x] **Open/Closed Principle (O in SOLID)**: `GetNearbyResourcesUseCase` relies strictly on `ResourceRepositoryPort`. We can later swap the JSON implementation for PostgreSQL/PostGIS geospatial queries without altering the business logic.
- [x] **Dependency Inversion (D in SOLID)**: The API layer routes depend upon the Use Case from Core, feeding in the JSON adapter. Core remains ignorant of filesystems, JSON parsing, or HTTP queries.
