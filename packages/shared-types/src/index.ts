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

export interface CreateDisasterInput {
  text: string;
}

export type UpdateDisasterInput = Partial<Omit<Disaster, 'id' | 'created_by' | 'created_at' | 'updated_at'>>;

export interface Resource {
  id: string;
  name: string;
  type: string;
  location_lat: number;
  location_lng: number;
}
export interface Report {
  id: string;
  content: string;
  user: string;
  created_at: string;
  _matchData: {
    location: string;
    tags: string[];
  };
}
