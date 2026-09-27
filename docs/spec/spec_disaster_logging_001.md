# Execution Plan: Feature 2 - Disaster Logging (CRUD)

This document outlines the step-by-step implementation plan for **Feature 2**, which introduces the core lifecycle of a disaster record (Create, Read, Update, Delete) while strictly enforcing architectural boundaries and role-based business rules.

## 1. Shared Types (`packages/shared-types`)
Expand the current `Disaster` stub into a full Domain Entity and define the input types required for Use Cases.
- **`Disaster` Entity**: Update the interface to include full details.
- **DTOs**: Define `CreateDisasterInput` and `UpdateDisasterInput`.

```ts
// Example Snippet:
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
  created_at: Date;
  updated_at: Date;
}

export type CreateDisasterInput = Pick<Disaster, 'title' | 'description' | 'location_name' | 'location_lat' | 'location_lng' | 'tags' | 'status'>;
export type UpdateDisasterInput = Partial<CreateDisasterInput>;
```

## 2. Core Architecture (`packages/core/src/disasters`)
Implement the business logic and define the required infrastructure contracts (Ports).
- **Ports**: Define `DisasterRepositoryPort`.
- **Use Cases**:
  - `CreateDisasterUseCase`: Generates ID/timestamps and calls `repository.save()`.
  - `UpdateDisasterUseCase`: Validates existence, applies updates, and calls `repository.update()`.
  - `GetDisasterUseCase` & `ListDisastersUseCase`: Read-only data retrieval.
  - `DeleteDisasterUseCase`: **Business Rule Enforcement**. Throws an `UnauthorizedError` if `user.role !== 'admin'`.

```ts
// Example Snippet:
import { Disaster, AuthenticatedUser } from '@drp/shared-types';
import { UseCase } from '../index';

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export interface DisasterRepositoryPort {
  save(disaster: Disaster): Promise<void>;
  update(id: string, data: Partial<Disaster>): Promise<Disaster>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Disaster | null>;
  findAll(): Promise<Disaster[]>;
}

export class DeleteDisasterUseCase implements UseCase<{ id: string; user: AuthenticatedUser }, void> {
  constructor(private repo: DisasterRepositoryPort) {}

  async execute(input: { id: string; user: AuthenticatedUser }): Promise<void> {
    if (input.user.role !== 'admin') {
      throw new UnauthorizedError('Only admins can delete disasters.');
    }
    const disaster = await this.repo.findById(input.id);
    if (!disaster) {
      throw new NotFoundError('Disaster not found.');
    }
    await this.repo.delete(input.id);
  }
}
```

## 3. API Backend (`apps/api`)
Provide concrete implementations for the Ports and expose the REST endpoints.
- **Repository Adapter**: Implement the `DisasterRepositoryPort` using a persistent JSON file (`data/disasters.json`).
- **Routing (`src/routes/disasters.ts`)**: 
  - Expose CRUD endpoints mapping to Use Cases.
  - Catch `UnauthorizedError` and return a `403 Forbidden` status.

```ts
// Example Snippet:
import { Router } from 'express';
import { resolveUserMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { DeleteDisasterUseCase, UnauthorizedError, NotFoundError } from '@drp/core';

const router = Router();
const repo = new JsonDisasterRepository();
const deleteUseCase = new DeleteDisasterUseCase(repo);

router.delete('/:id', resolveUserMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await deleteUseCase.execute({ id: req.params.id, user: req.user! });
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      res.status(403).json({ error: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});
export default router;
```

## 4. Web Frontend (`apps/web`)
Build the user interface to interact with the API endpoints.
- **DisasterBoard Component**: A list view showing all active disasters with their key details.
- **DisasterDetail Component**: A detailed view for a single disaster.
- **CRUD Operations**: Form to create/update, and a delete button that fails gracefully (showing a permission denied toast/alert) if the active user is a Contributor.

```tsx
// Example Snippet:
import React, { useState } from 'react';
import { apiClient } from '../api';
import { Disaster } from '@drp/shared-types';

export const DisasterDetail = ({ disaster, onDeleted }: { disaster: Disaster, onDeleted: () => void }) => {
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/disasters/${disaster.id}`);
      onDeleted();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Permission Denied: You do not have admin rights to delete this record.');
      }
    }
  };

  return (
    <div>
      <h2>{disaster.title}</h2>
      <p>{disaster.description}</p>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={handleDelete}>Delete Disaster</button>
    </div>
  );
};
```

---

## 5. Testing Strategy
As per the project requirements, we will write a representative few unit tests to verify key behaviors. We will use **Vitest**.

**Test Cases for Feature 2:**
- **Core Architecture: `DeleteDisasterUseCase`**
  - *Test 1 (Success):* Verify that passing a user with role `admin` successfully calls the repository `delete` method.
  - *Test 2 (Failure):* Verify that passing a user with role `contributor` throws an `UnauthorizedError` and does NOT call the repository `delete` method.

- **API: Disasters Router**
  - *Test 1 (Success):* Verify `DELETE /disasters/:id` with an Admin token returns `204 No Content`.
  - *Test 2 (Failure):* Verify `DELETE /disasters/:id` with a Contributor token returns `403 Forbidden`.

---

### Design Principles Checklist for this Feature:
- [x] **SOLID (SRP & OCP)**: Each Use Case handles exactly one business operation.
- [x] **Separation of Concerns**: Authorization (Admin vs Contributor logic) happens in the Core `DeleteDisasterUseCase`, *not* in the Express router middleware. Express just passes the User object along.
