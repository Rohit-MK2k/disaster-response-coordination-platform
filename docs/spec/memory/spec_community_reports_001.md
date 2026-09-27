# Memory Log: Feature 5 - Community Reports

## Changes Made
- **Shared Types:** Updated the `Report` interface to include the `_matchData` object (containing `location` and `tags`) which is necessary for dynamically linking reports to disasters.
- **Core Layer:**
  - Added `ReportsSourcePort` to abstract the external social feed API.
  - Added `ReportMatcher` utility, a pure function that compares a disaster's tags and location string against a report's `_matchData` using case-insensitive `includes` and `some` checks (time complexity: O(N)).
  - Added `BackgroundReportWorker` which uses Node's `setInterval` to periodically fetch from `ReportsSourcePort`, normalize the data into an array of `Report` objects, and store them directly in the `CachePort` using a global cache key (`'global_reports_feed'`).
  - Added `GetDisasterReportsUseCase` which fetches a specific disaster from the database, loads the *entire* global array of reports from the cache, runs the `ReportMatcher` against it to build the relation dynamically on-the-fly, and slices the resulting array for pagination (`page` and `limit`).
  - Added rigorous unit tests in `get-disaster-reports.test.ts`.
- **API Backend:**
  - Implemented `MockSocialFeedAdapter` simulating network latency (300ms delay), instability (10% error rate), and a massive dataset (120 fake reports).
  - Modified `apps/api/src/index.ts` to instantiate the `BackgroundReportWorker` using a shared instance of `InMemoryCacheAdapter` (started with a 60,000ms polling interval). The worker start logic is disabled during `NODE_ENV === 'test'` to prevent integration test side effects.
  - Added the `GET /disasters/:id/reports` route to `apps/api/src/routes/disasters.ts` (ensuring it is placed *above* the generic `/:id` route).
  - Added integration tests to `apps/api/test/integration/disasters.test.ts` to assert that pagination and matching correctly calculate the `total` and limit the returned array.
- **Web Frontend:**
  - Created the `CommunityReports` React component to render the dynamic chatter feed. It fetches from the API, maps the array into styled cards, and features a functional "Load More" button that increments the `page` query parameter until all matched reports are shown.
  - Integrated `<CommunityReports disasterId={id} />` directly into `DisasterDetail.tsx` beneath the `NearbyResources` component.

## Key Learnings / Decisions
- **Dynamic On-The-Fly Linking:** Decided against storing reports in a SQL database with `disaster_id` foreign keys. Because the external data is noisy and lacks context, the `ReportMatcher` builds the relationship at query time. The time complexity `O(N)` is acceptable because it's a simple array filter operating entirely in-memory.
- **Background Pub-Sub Caching:** Realized that having the API route fetch from an external service (Cache-Aside pattern) was too slow and brittle. Instead, implemented a lightweight Background Worker that polls the external API every 60 seconds and writes to the cache. The `GetDisasterReportsUseCase` is strictly a non-blocking read operation against the cache.
- **Integration Test Side Effects:** During integration testing, the `PATCH` route mutates the global database (e.g., changing the disaster's location to "Los Angeles, CA"). When writing tests for `GET /reports`, the mock cache data must be synced with the state of the database *after* the `PATCH` route runs to ensure the matcher works successfully. Always be mindful of global state mutations in sequential integration tests!
