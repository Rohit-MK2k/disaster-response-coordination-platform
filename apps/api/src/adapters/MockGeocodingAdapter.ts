import { GeocodingPort } from '@drp/core';

export class MockGeocodingAdapter implements GeocodingPort {
  async resolve(locationText: string) {
    const text = locationText.toLowerCase();
    if (text.includes('manhattan') || text.includes('new york') || text.includes('nyc')) {
      return { name: 'Manhattan, NYC', lat: 40.7831, lng: -73.9712 };
    }
    if (text.includes('la') || text.includes('los angeles')) {
      return { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 };
    }
    if (text.includes('san francisco') || text.includes('sf')) {
      return { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 };
    }
    
    // Default fallback
    return { name: locationText || 'Unknown Location', lat: 0, lng: 0 };
  }
}
