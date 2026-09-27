# Execution Plan: Feature 1 Bug - Missing Integration Test Coverage (Bug 002)

## Overview
During the implementation of Feature 1 (Disaster Logging & CRUD), the `JsonDisasterRepository` and the Express routes for retrieving disasters were created. However, the integration tests for the `GET /disasters` and `GET /disasters/:id` endpoints were completely omitted.

Because upcoming features (like Nearby Resource Discovery) heavily rely on the `DisasterRepositoryPort.findById()` implementation functioning correctly against the filesystem, this technical debt must be resolved to guarantee architectural stability.

## 1. API Integration Tests (`apps/api`)
Update the existing test suite to ensure the read paths of the CRUD operations are thoroughly tested.
- **Target File**: `apps/api/test/integration/disasters.test.ts`
- **Missing Tests to Add**:
  - `GET /disasters`
    - Verify it returns a `200 OK` status.
    - Verify it returns an array of disasters (including the one created in the `POST` test).
  - `GET /disasters/:id`
    - Verify it returns a `200 OK` status and the exact disaster object when provided with a valid ID (from the `POST` test).
    - Verify it returns a `404 Not Found` status when provided with a non-existent disaster ID (e.g., `'invalid-id'`).

```ts
// Example Snippet:
  it('GET /disasters - Should list all disasters', async () => {
    const res = await request(app).get('/disasters');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /disasters/:id - Should return a specific disaster', async () => {
    const res = await request(app).get(`/disasters/${createdDisasterId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdDisasterId);
    expect(res.body.title).toBe('Mock Fire');
  });

  it('GET /disasters/:id - Should return 404 for invalid ID', async () => {
    const res = await request(app).get('/disasters/invalid-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Disaster not found');
  });
```

## 2. Execution Strategy
1. Insert the new `it()` blocks into `apps/api/test/integration/disasters.test.ts` right after the `POST` tests (so that `createdDisasterId` is already populated).
2. Run `npm run test` to verify the missing paths successfully read from the `data/test-disasters.json` file.
3. Once all tests pass, document the completion in `docs/spec/memory/spec_disaster_logging_bug_002.md`.
4. Commit the fix logically under `test(api):`.
