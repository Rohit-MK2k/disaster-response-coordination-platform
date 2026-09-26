# Execution Plan: Feature 1 - Foundation & Access Control

This document outlines the step-by-step implementation plan for **Feature 1**, establishing the monorepo foundation, shared domain contracts, and a simple role-based identity pipeline.

## 1. Monorepo Initialization (Workspace Setup)
- Set up a basic Node.js monorepo using npm workspaces (or pnpm/yarn depending on project defaults).
- Create the folder structure:
  - `packages/shared-types`
  - `packages/core`
  - `apps/api`
  - `apps/web`
- Configure base TypeScript settings (`tsconfig.base.json`) to share across packages.

## 2. Shared Types (`packages/shared-types`)
Define the foundational Domain Entities and contracts (following the Repository Design Pattern guidelines).
- **`User`**: `{ id: string, name: string, role: 'admin' | 'contributor' }`
- **Entity Stubs**: Define minimal interfaces for `Disaster`, `Resource`, and `Report` (these will be expanded in later features).
- **Auth Contract**: Define `AuthenticatedUser` to be used across the frontend and backend.

```ts
// Example Snippet:
export type Role = 'admin' | 'contributor';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type AuthenticatedUser = Omit<User, 'name'>; // Minimum required for auth context
export interface Disaster { id: string; } // Stub
export interface Resource { id: string; } // Stub
export interface Report { id: string; } // Stub
```

## 3. Core Architecture (`packages/core`)
Establish the foundational patterns to enforce clean architecture and SOLID principles.
- **`UseCase` Interface**: Define a generic `UseCase<TInput, TOutput>` interface that all future application services will implement. This enforces a consistent execution boundary.
- **Dependency Injection**: Plan a lightweight dependency injection mechanism (e.g., simple factory functions or a minimal DI container) to wire Use Cases with their required Ports (Repositories/Adapters) later.

```ts
// Example Snippet:
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

// Factory example for DI later on:
// export const createSomeUseCase = (repository: SomeRepositoryPort) => new SomeUseCase(repository);
```

## 4. API Backend (`apps/api`)
Initialize the server and implement basic authentication.
- **Setup**: Initialize an Express server with TypeScript. Add basic error handling and CORS.
- **JSON File DB**: Use a flat JSON file (e.g., `data/users.json`) to persist a list of Users reflecting the full DB schema (`id`, `name`, `email`, `password`, `role`) instead of a volatile in-memory list.
- **Login Endpoint (`POST /login`)**: 
  - Accepts `{ email, password }`.
  - Reads from the JSON file and verifies credentials.
  - Returns a simple token (e.g., a basic JWT containing `{ id, role }`). *Note: While real authentication logic happens here, it is strictly an API concern; Core remains unaware of passwords.*
- **Identity Middleware**: Implement `resolveUserMiddleware`.
  - Reads the `Authorization: Bearer <token>` header.
  - Verifies and decodes the token.
  - Creates an `AuthenticatedUser` object and attaches it to the request context (e.g., `req.user`).
- **Health Check**: Add a dummy `/health` route that returns the parsed user context to verify the middleware works.

```ts
// Example Snippet:
import { Request, Response, NextFunction } from 'express';
import { Role } from '@disaster-response/shared-types';
import jwt from 'jsonwebtoken';
import fs from 'fs'; // For reading the JSON file DB

const SECRET = 'dev-secret';

// e.g. const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf-8'));

export const resolveUserMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET) as { id: string; role: Role };
      (req as any).user = { id: decoded.id, role: decoded.role }; 
      return next();
    } catch (e) {
      // Invalid token
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
};
```

## 5. Web Frontend (`apps/web`)
Initialize the UI and API client integration.
- **Setup**: Scaffold a Vite React application with TypeScript.
- **State Management**: Create a simple global state (e.g., React Context) to hold the authenticated user's `token` and decoded `{ id, role }`.
- **UI Component**: Build a basic "Login Form" requesting Email and Password. On submit, call the `POST /login` endpoint and store the resulting token.
- **API Integration**: Configure an Axios instance with a request interceptor. This interceptor will automatically read the token from state/localStorage and append `Authorization: Bearer <token>` to all outgoing backend requests.

```ts
// Example Snippet:
import axios from 'axios';

export const apiClient = axios.create({ baseURL: 'http://localhost:3000' });

apiClient.interceptors.request.use((config) => {
  // Read token from localStorage or global state
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 6. Testing Strategy
As per the project requirements, exhaustive coverage is out of scope, but we will write a representative few unit tests to verify key behaviors. We will use a testing framework **Vitest**.

**Test Cases for Feature 1:**
- **Core Architecture: `Dependency Injection & UseCase Contract`**
  - *Test 1 (Success):* Create a mock class implementing the `UseCase` interface and verify the DI factory/container successfully instantiates it when provided with mocked dependencies (Ports).
  - *Test 2 (Success):* Verify that the instantiated mock UseCase correctly executes its `execute()` method and returns the expected output, confirming the generic contract works.

- **API: `resolveUserMiddleware`**
  - *Test 1 (Success):* Should successfully parse a valid `Authorization: Bearer <token>` and attach an `AuthenticatedUser` object to the request context.
  - *Test 2 (Failure):* Should handle a missing `Authorization` header by returning a 401 Unauthorized response.
  - *Test 3 (Failure):* Should handle an invalid or expired token gracefully by returning a 401 Unauthorized response.

- **Web: API Interceptor** (Optional but recommended)
  - *Test 1:* Verify the Axios/Fetch interceptor correctly appends the `Authorization: Bearer <token>` header to a mocked outgoing request when a token is present in state.

---

### Design Principles Checklist for this Feature:
- [x] **DRY**: Shared types in a central package to ensure frontend and backend use identical contracts.
- [x] **Single Responsibility (SRP)**: Middleware strictly handles user parsing; Use Cases will handle business logic.
- [x] **Dependency Inversion (DIP)**: `UseCase` interface established early to ensure future logic depends on abstractions.
