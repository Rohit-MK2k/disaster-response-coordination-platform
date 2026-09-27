# Memory Log: Feature 5 - Community Reports Bug Fix 001

## The Problem
The `MockSocialFeedAdapter` was initially dynamically generating 120 fake reports directly in TypeScript using a `for-loop` and rigid mathematical logic (`index % 3`).
1. **Unrealistic Data:** Real external APIs (like Twitter) don't return neatly structured, procedurally generated flat objects. They return massive, messy JSON structures with nested properties (e.g., `user.screen_name`, `entities.hashtags`).
2. **Hardcoded Limits:** Because the adapter was hardcoded to only generate tags for `"Manhattan, NY"`, the `ReportMatcher` was aggressively filtering out everything else. A user testing the UI by creating a disaster in `"Los Angeles, CA"` would receive `0` matching reports, making the UI appear broken.

## The Solution
We shifted to a **Random Firehose Simulation** using a static data pool to properly enforce the Adapter Design Pattern.

### Changes Made:
- **Created a Massive Data Pool:** 
  - Wrote a Node script (`apps/api/data/generate-pool.cjs`) to procedurally generate a highly diverse `mock-twitter-feed-pool.json` containing 502 fake records. 
  - The schema deliberately mimics a messy Twitter response payload (using `id_str`, `full_text`, `user.screen_name`, `place.full_name`, and `entities.hashtags`).
  - The pool covers over 10 cities and 6 disaster types (fire, flood, outage, earthquake, etc.).
- **Updated the Adapter:**
  - Rewrote `MockSocialFeedAdapter.ts` to drop the hardcoded logic.
  - It now uses `fs.readFile()` to load the massive JSON pool.
  - It shuffles the 500+ records and randomly slices off a sample of 150 items. It then injects a fresh `timestamp: new Date()` into the sample to perfectly simulate a live, constantly updating social media firehose every 60 seconds.
- **Updated the Worker Normalizer:**
  - Rewrote the `normalize()` method inside `BackgroundReportWorker.ts` (`@drp/core`) so that it reaches into the messy nested Twitter JSON and neatly maps the fields (e.g., mapping `raw.place.full_name` to `_matchData.location`) into our clean internal `Report` schema.
- **Testing:**
  - Updated the unit tests in `get-disaster-reports.test.ts` to mock the new messy schema. 
  - Verified that all 36 tests pass, ensuring the integration tests (which rely on Los Angeles fire data) continue to function perfectly.

## Key Takeaways
Always strive to test against unstructured, file-based mock payloads rather than inline procedurally generated objects. Procedural inline objects often inadvertently conform to internal application logic (bypassing strict schema parsers) and limit data diversity, making the UI harder to test manually.
