export type Role = 'admin' | 'contributor';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type AuthenticatedUser = Omit<User, 'name'>;

export interface Disaster { id: string; }
export interface Resource { id: string; }
export interface Report { id: string; }
