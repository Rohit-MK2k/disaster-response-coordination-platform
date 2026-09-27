export type Role = 'admin' | 'contributor';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type AuthenticatedUser = Omit<User, 'name'>;

export interface Disaster {
  id: string;
  title: string;
  description: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  tags: string[];
  status: string; // e.g., 'active', 'resolved'
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CreateDisasterInput = Pick<Disaster, 'title' | 'description' | 'location_name' | 'location_lat' | 'location_lng' | 'tags' | 'status'>;
export type UpdateDisasterInput = Partial<CreateDisasterInput>;

export interface Resource { id: string; }
export interface Report { id: string; }
