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
      .catch(err => console.error('Failed to load resources', err))
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

  const handleResetLocation = () => {
    setUserLocation(null);
    setGeoError('');
  };

  if (loading && resources.length === 0) return <div>Finding nearby resources...</div>;

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
          <button onClick={handleUseMyLocation} style={{ padding: '5px', marginRight: userLocation ? '10px' : '0' }}>
            📍 Use My Location
          </button>
          {userLocation && (
            <button onClick={handleResetLocation} style={{ padding: '5px' }}>
              🔄 Reset to Disaster
            </button>
          )}
        </div>
      </div>
      {geoError && <p style={{ color: 'red', fontSize: '12px' }}>{geoError}</p>}

      {resources.length === 0 && !loading ? (
        <div style={{ padding: '20px 0', color: '#666' }}>
          No resources found within {radius}km. Try expanding your search radius.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {resources.map(r => (
            <li key={r.id} style={{ padding: '5px 0', borderBottom: '1px solid #ddd' }}>
              <strong>{r.name}</strong> ({r.type}) - {r.distanceKm.toFixed(1)}km away
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
