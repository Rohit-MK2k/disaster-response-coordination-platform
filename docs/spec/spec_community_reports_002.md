# Execution Plan: Feature 5 - Community Reports Refresh (002)

## Overview
This document outlines the step-by-step implementation plan for adding a "Refresh Feed" feature to the Community Reports UI. Because our background worker fetches fresh live data from the external source every 60 seconds and updates the cache, the user needs a way to explicitly trigger the UI to fetch the latest cached reports from the backend without having to reload the entire web page.

## 1. Web Frontend (`apps/web`)
We will modify the `CommunityReports` React component to add a manual refresh mechanism.

- **UI Addition**: Add a "Refresh Feed" button to the header area of the `CommunityReports` component.
- **State Reset**: Clicking the refresh button must clear the currently loaded reports and reset the pagination `page` state back to `1`.
- **Data Fetching**: After resetting the state, the component will invoke `fetchReports(1)` to pull the freshest slice of reports from the API.
- **UX Considerations**: 
  - The button should indicate loading state when data is being fetched.
  - The refresh action should seamlessly replace the feed rather than causing disruptive layout shifts.

```tsx
// Example Logic Flow:
const handleRefresh = () => {
  setPage(1);
  fetchReports(1, true); // true indicates a fresh overwrite instead of an append
};
```

## 2. API Backend (`apps/api`)
No changes are required in the API layer. The existing `GET /disasters/:id/reports` route already queries the `GetDisasterReportsUseCase`, which fetches the latest real-time array from the `CachePort`. The UI simply needs to request `page=1` again to get the latest cached state.

## 3. Core Architecture (`packages/core`)
No changes are required in the core layer. The `BackgroundReportWorker` is already running periodically and replacing the cache with fresh data every 60 seconds.

## 4. Testing Strategy
- **Manual Verification**: 
  - Navigate to a disaster in the UI.
  - Wait for a short period (or manually trigger a cache update).
  - Click "Refresh Feed".
  - Verify that the feed reloads and new reports (or newly randomized timestamps from the firehose) appear.
  - Verify that the pagination state correctly resets (e.g., if you previously clicked "Load More" to reach page 3, clicking "Refresh" should return you to a 5-item list for page 1).

### Design Principles Checklist for this Feature:
- [x] **Separation of Concerns**: The frontend drives the refresh action by resetting its local pagination state and calling the existing backend endpoint. The backend remains strictly decoupled from how the UI chooses to refresh its data.
