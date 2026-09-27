# Execution Plan: Feature 6 - Live Updates via Short Polling (001)

## Overview
This document outlines the step-by-step implementation plan for **Feature 6**, which introduces near-real-time updates to the platform. To minimize server-side complexity, avoid stateful persistent connections, and adhere to a strict stateless REST architecture, we are implementing **Short Polling** instead of WebSockets.

By setting up a lightweight polling interval on the React frontend, the UI will seamlessly sync with the latest database state without requiring any backend modifications or domain event abstractions.

## 1. Core Architecture (`packages/core`)
**No changes required.**
Because we are relying purely on stateless HTTP requests, the core domain logic remains 100% untouched.

## 2. API Backend (`apps/api`)
**No changes required.**
The existing `GET /disasters` and `GET /disasters/:id` routes are already fully capable of serving the latest data. We do not need to implement any custom adapters or `socket.io` integrations.

*(Note: Although `socket.io` is currently installed in the package, it will be left dormant and unused for this feature.)*

## 3. Web Frontend (`apps/web`)
We will implement the polling logic directly within the React components.

- **`DisasterBoard` Component**: 
  - Wrap the existing `fetchDisasters()` call inside a `setInterval`.
  - Set the interval to fetch data every 3 seconds (3000ms).
  - Crucially, use the `useEffect` cleanup function (`clearInterval`) to prevent memory leaks when the user navigates away from the board.

```tsx
// apps/web/src/components/DisasterBoard.tsx
export const DisasterBoard = () => {
  const [disasters, setDisasters] = useState<Disaster[]>([]);

  const fetchDisasters = async () => {
    try {
      const res = await apiClient.get('/disasters');
      setDisasters(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // 1. Initial HTTP fetch on load
    fetchDisasters();

    // 2. Set an interval to fetch silently in the background every 3 seconds
    const intervalId = setInterval(() => {
      fetchDisasters();
    }, 3000);

    // 3. Clean up the timer when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // ... render the list
}
```

- **`DisasterDetail` Component**: 
  - Apply the exact same `setInterval` pattern to the `fetchDisaster()` function inside `DisasterDetail.tsx`.
  - If the polling request returns a 404 Not Found (meaning an admin deleted the disaster while the user was viewing it), catch the error and invoke the `onBack()` callback to automatically kick the user back to the board.

## 4. Testing Strategy
- **Manual Verification**: 
  - Open the Web App in **two separate browser windows** side-by-side.
  - In Window 1, create a new disaster.
  - In Window 2, wait up to 3 seconds. Verify the new disaster automatically appears in the list without manually refreshing the browser.
  - In Window 2, click "View Details" on the disaster and edit its status.
  - In Window 1, wait up to 3 seconds. Verify the status updates in the list view automatically.
  - In Window 1, delete a disaster. Verify that Window 2 (if viewing the detail page) automatically kicks the user back to the main board within 3 seconds.

### Design Principles Checklist for this Feature:
- [x] **Simplicity**: No complex stateful websockets or pub-sub architecture required.
- [x] **Stateless Backend**: The server remains completely stateless, maintaining infinite horizontal scalability.
