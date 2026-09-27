# Execution Plan: Feature 4 Enhancement - Reset to Disaster Location (003)

## Overview
We introduced the ability for a user to override the search center with their own GPS coordinates via the "Use My Location" button. However, once a user clicks this, they are permanently locked into searching around their own device coordinates for that session. There is currently no UI mechanism to revert the search center back to the original disaster's geographic location. 

To resolve this, we will add a "Reset to Disaster Location" button that appears whenever a custom location is active.

## 1. Web Frontend (`apps/web/src/components/NearbyResources.tsx`)
Introduce a reset function that clears the `userLocation` state and conditionally render a reset button in the UI.

- **State Reset**: Add a `handleResetLocation` function that calls `setUserLocation(null)`.
- **Conditional Rendering**: Render the "Reset to Disaster Location" button only if `userLocation !== null`. When clicked, it will clear the custom coordinates, which automatically triggers the `useEffect` hook to re-fetch resources using the disaster's default location.

```tsx
// Example Snippet for NearbyResources.tsx:
export const NearbyResources = ({ disasterId }: { disasterId: string }) => {
  // ... state variables ...

  const handleUseMyLocation = () => {
    // ... existing geolocation logic ...
  };

  const handleResetLocation = () => {
    setUserLocation(null);
    setGeoError(''); // Clear any pending errors
  };

  return (
    <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3>Nearby Resources</h3>
        <div>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ marginRight: '10px', padding: '5px' }}>
            {/* options */}
          </select>
          
          <button onClick={handleUseMyLocation} style={{ padding: '5px', marginRight: userLocation ? '10px' : '0' }}>
            📍 Use My Location
          </button>
          
          {userLocation && (
            <button onClick={handleResetLocation} style={{ padding: '5px' }}>
              🔄 Reset to Disaster
            </button>
          )}
        </div>
      </div>
      
      {/* ... rendering logic ... */}
    </div>
  );
};
```

## 2. Testing Strategy
- **Component / UX Verification**:
  - Verify that when the component first loads, the "Reset to Disaster" button is strictly hidden.
  - Verify that upon successfully granting "Use My Location" access, the "Reset to Disaster" button appears.
  - Verify that clicking "Reset to Disaster" clears the user's custom location, hides the reset button, and forces the UI into a loading state to re-fetch the default coordinates.
- **Network / Integration Verification**:
  - Open browser DevTools (Network tab).
  - After clicking the reset button, verify the outgoing HTTP request drops the `lat` and `lng` query parameters entirely (e.g., reverting to `GET /disasters/:id/resources?radius=25`).
