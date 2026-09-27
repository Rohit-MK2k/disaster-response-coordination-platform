export interface GeocodingPort {
  resolve(locationText: string): Promise<{ name: string; lat: number; lng: number }>;
}
