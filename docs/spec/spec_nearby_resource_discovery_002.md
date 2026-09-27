# Execution Plan: Feature 4 Enhancement - UI Geolocation Override (002)

## Overview
While the backend API natively supports overriding the disaster's geographic center with custom `lat` and `lng` parameters, the web frontend currently lacks a mechanism to utilize this. To solve the "vague disaster location" problem (e.g., a disaster covering all of Japan, but a user needing help specifically in Osaka), we will implement a "Use My Current Location" button using the HTML5 Geolocation API.

## 1. Web Frontend (`apps/web`)
Update the `NearbyResources` component to request device coordinates and append them to the API query.

- **State Management**: Introduce `userLat`, `userLng`, and `radius` (defaulting to 25km) state variables.
- **Geolocation API**: Add a function that calls `navigator.geolocation.getCurrentPosition()` to fetch the user's coordinates.
- **Radius Selection**: Add a dropdown (`<select>`) allowing the user to pick between common radii (e.g., 5km, 10km, 25km, 50km, 100km).
- **API Fetching**: Modify the `apiClient.get` call to use the dynamic `radius` state and conditionally append `&lat=${userLat}&lng=${userLng}` if the user has requested a location override.

```tsx
// Example Snippet for NearbyResources.tsx:
import React, { useEffect, useState } from 'react';
import { apiClient } from '../api';
import { Resource } from '@drp/shared-types';

interface NearbyResource extends Resource {
  distanceKm: number;
}

export const NearbyResources = ({ disasterId }: { disasterId: string }) => {
  const [resources, setResources] = useState<NearbyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(25);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    setLoading(true);
    let url = `/disasters/${disasterId}/resources?radius=${radius}`;
    if (userLocation) {
      url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
    }

    apiClient.get(url)
      .then(res => setResources(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [disasterId, userLocation, radius]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGeoError('');
      },
      (error) => {
        setGeoError('Unable to retrieve your location.');
        setLoading(false);
      }
    );
  };

  // ... (render logic for the list)
  return (
    <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3>Nearby Resources</h3>
        <div>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ marginRight: '10px', padding: '5px' }}>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
          <button onClick={handleUseMyLocation} style={{ padding: '5px' }}>
            📍 Use My Location
          </button>
        </div>
      </div>
      {geoError && <p style={{ color: 'red', fontSize: '12px' }}>{geoError}</p>}
      
      {/* ... rendering logic ... */}
    </div>
  );
};
```

## 2. Testing Strategy
Because the React frontend currently relies on manual validation and backend integration tests rather than a JSDOM unit-testing suite, the testing strategy focuses on API contract adherence and UX validation.

- **Component / UX Verification**:
  - Verify that clicking "Use My Location" triggers the browser's native location permission prompt.
  - Verify that denying the permission renders the graceful error state (`Unable to retrieve your location.`).
  - Verify that granting the permission triggers a loading state and correctly updates the `userLocation` state.
  - Verify that changing the radius dropdown updates the `radius` state and triggers a new loading state.
- **Network / Integration Verification**:
  - Open browser DevTools (Network tab). Verify that changing the radius dropdown updates the `radius` query parameter in the outgoing HTTP request (e.g., `GET /disasters/:id/resources?radius=100`).
  - Verify that after granting location access, the outgoing HTTP request successfully appends the `lat` and `lng` query parameters (e.g., `GET /disasters/:id/resources?radius=25&lat=34.69&lng=135.50`).
  - Verify that if both are changed, the API request includes both the new radius and the custom coordinates.
  - Verify the rendered UI list updates to reflect distances calculated from the new device coordinates and filtered by the new radius.
