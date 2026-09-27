# Execution Plan: Feature 5 - Community Reports Discovery (001)

## Overview
This document outlines the step-by-step implementation plan for **Feature 5**, which pulls in "Community Reports" from external sources (simulated social feeds) so responders can see what people on the ground are saying about a disaster. 

The core challenge of this feature is dealing with external service unreliability and data noise. As dictated by the `get-disaster-reports.mmd` sequence diagram, we must implement caching to prevent rate-limiting, graceful degradation when the external service fails, and a pure-function matcher to filter the noise down to only relevant reports.

## 1. Shared Types (`packages/shared-types`)
Update the `Report` interface to include the data needed for display and matching.

```ts
// Example Snippet:
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
```

## 2. Core Architecture (`packages/core/src/reports`)
Introduce the external port, the pure matcher function, and the Use Case orchestrating the caching and graceful degradation.

- **Ports**: 
  - `ReportsSourcePort`: defines `fetchRawReports(): Promise<any[]>`.
- **Services (Pure Functions)**:
  - `ReportMatcher.ts`: Exports a `matchReports(disaster: Disaster, reports: Report[]): Report[]` function. It checks if the report's `_matchData.location` overlaps with the disaster's `location_name`, or if there's any intersection between their `tags`.
- **Use Cases & Workers**:
  - `BackgroundReportWorker`: A function to be run via `setInterval` that periodically calls `ReportsSourcePort.fetchRawReports()`, normalizes the data, and writes to `CachePort`. If the external service fails, it swallows the error and leaves the cache alone.
  - `GetDisasterReportsUseCase`: Highly optimized read-only use case. 
    1. Fetches Disaster via `DisasterRepositoryPort`.
    2. Reads the global reports array from `CachePort`. (If cache is empty, it assumes `[]`).
    3. Passes the `Report[]` through `ReportMatcher` against the disaster.
    4. Slices the array for pagination.

```ts
// Example Snippet for UseCase:
export class GetDisasterReportsUseCase implements UseCase<string, { reports: Report[], total: number }> {
  constructor(
    private disasterRepo: DisasterRepositoryPort,
    private cache: CachePort
  ) {}

  async execute(disasterId: string, page: number = 1, limit: number = 10): Promise<{ reports: Report[], total: number }> {
    const disaster = await this.disasterRepo.findById(disasterId);
    if (!disaster) throw new NotFoundError('Disaster not found');

    const cacheKey = 'global_reports_feed';
    const cached = await this.cache.get<Report[]>(cacheKey);
    const reports = cached || [];

    const matched = matchReports(disaster, reports);
    const startIndex = (page - 1) * limit;
    const paginated = matched.slice(startIndex, startIndex + limit);

    return { reports: paginated, total: matched.length };
  }
}
```

## 3. API Backend (`apps/api`)
Build the mock external service adapter, wire up the HTTP routes, and bootstrap the worker.

- **Adapters**: `MockSocialFeedAdapter` implementing `ReportsSourcePort`. To prove normalization, error handling, and pagination, this adapter will return a massive, intentionally messy payload of **at least 100 mock reports** from all over the world. It will also occasionally "flake out" (throw an error randomly 10% of the time).
- **Worker Initialization**: In `apps/api/src/index.ts`, instantiate the `BackgroundReportWorker` alongside the Express server. Call `worker.start(60000)` to trigger the background polling interval.
- **Routes**: `GET /disasters/:id/reports?page=1&limit=10`. The controller will parse the query params, pass them to the Use Case, and return `{ reports, total }`.

## 4. Web Frontend (`apps/web`)
Create the UI to display the ground-truth feed with pagination.

- **`CommunityReports` Component**: A feed UI showing the `content`, `user`, and time of the report. 
- **Pagination UI**: Because it's a feed, we will implement a "Load More" button at the bottom. Clicking it increments the `page` state and appends the next chunk of reports to the existing list. If the number of currently loaded reports equals the `total` returned by the backend, the "Load More" button will be hidden.
- **Integration**: Mount it inside `DisasterDetail.tsx`, likely next to or below `<NearbyResources />`.

## 5. Testing Strategy
- **Core Unit Tests**: 
  - `ReportMatcher`:
    - Verify it matches a report if the tags intersect.
    - Verify it matches a report if the location string overlaps.
    - Verify it filters out entirely unrelated reports.
  - `BackgroundReportWorker`:
    - Verify it calls `ReportsSourcePort` and correctly sets the normalized data in `CachePort`.
    - Verify an Error from `ReportsSourcePort` is swallowed and does not crash the worker or overwrite the cache.
  - `GetDisasterReportsUseCase`:
    - Verify it reads correctly from `CachePort` and handles an empty cache gracefully.
    - **Verify Pagination**: Ensure that passing `page=2` and `limit=5` correctly slices a matched array of 12 items, returning only items 5 through 9, and returning `total: 12`.
- **API Tests**: 
  - Add an integration test for `GET /disasters/:id/reports` verifying the 200 OK status and correct JSON shape (`{ reports, total }`).
  - Verify that passing `?page=2&limit=2` in the query string correctly limits the payload size and offsets the data.

### Design Principles Checklist for this Feature:
- [x] **Dependency Inversion**: The UseCase relies entirely on `ReportsSourcePort` and `CachePort`. It doesn't know if it's talking to Twitter, a scraper, or Redis.
- [x] **Graceful Degradation**: External API failures do not crash our application or the UI. The UseCase intentionally swallows the failure and returns an empty list, keeping the rest of the incident board functional.
