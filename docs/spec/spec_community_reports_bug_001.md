# Execution Plan: Feature 5 - Community Reports Bug Fix 001 (Mock Data Simulation)

## Overview
Currently, the `MockSocialFeedAdapter` dynamically generates fake reports using hardcoded JavaScript logic inside the class. This is a poor simulation of an external data source. We need to accurately simulate how a real external API (like the Twitter/X API) returns data—where the payload is structured according to *their* standards, but unstructured and messy for *us*.

## The Fix
We will store a massive, static JSON payload in the `apps/api/data/` directory. The adapter will read this file to simulate an HTTP GET request to an external provider.

### 1. Create `apps/api/data/mock-twitter-feed-pool.json`
Create a massive JSON file containing a highly diverse "pool" of hundreds of fake reports. The schema must mimic a real, messy external API:
- It should use nested structures (e.g., `tweet.user.screen_name` instead of a flat `author` field).
- It should use entity arrays (e.g., `tweet.entities.hashtags`).
- The data pool must be extremely large and random, covering numerous cities, random chatter, and all our local database locations (`"Downtown Riverfront"`, `"Northern Ridge"`, etc.) with their respective tags.
- **Critical:** It must also include entries for `"Los Angeles, CA"` with the tag `"fire"` to ensure our automated integration tests in `disasters.test.ts` do not break.
- *Implementation detail:* A one-off Node utility script (`apps/api/data/generate-pool.cjs`) will be written and executed to procedurally generate these 500+ records, as writing them by hand is unfeasible.

### 2. Update `MockSocialFeedAdapter.ts`
Modify the adapter to act as a realistic "firehose" simulator.
- It will use `fs.readFile()` to load the massive `mock-twitter-feed-pool.json` from the filesystem.
- Instead of returning the whole file, it will **randomly sample** ~100-150 tweets from the pool and dynamically update their timestamps to `new Date().toISOString()`. This perfectly simulates a live, ever-changing social media feed every time the background worker polls!
- It should still simulate network latency (300ms) and a 10% failure rate.

### 3. Update `BackgroundReportWorker.ts`
The worker's `normalize()` method must be updated to parse this new "Twitter-style" raw shape into our clean `Report` interface.
- Map `raw.id_str` -> `Report.id`.
- Map `raw.full_text` -> `Report.content`.
- Map `raw.user.screen_name` -> `Report.user`.
- Map `raw.place.full_name` -> `Report._matchData.location`.
- Extract text from `raw.entities.hashtags[]` -> `Report._matchData.tags`.

## Testing Strategy
- **Unit Tests:** Update the `BackgroundReportWorker` tests to pass the new "Twitter-style" raw mock object into `fetchAndCache`, verifying that the `normalize` function correctly drills into the nested objects and maps them to the `Report` interface.
- **Integration Tests:** Ensure `npm run test` passes without modification to `disasters.test.ts`. This proves the file-based mock data successfully covers the test cases.
- **Design Principles:** This enforces the **Adapter Pattern**. The messy Twitter JSON is entirely isolated. The rest of the application (the Matcher, the UI, the Cache) only ever sees the clean `Report` interface.
