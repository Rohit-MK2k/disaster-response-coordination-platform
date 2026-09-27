# Execution Plan: Nearby Resource Discovery Bug 001 - Trapped UI State

## Overview
A critical UX bug was identified in the `NearbyResources` React component. Currently, if a disaster has no resources within the default search radius, the component performs an early return (`if (resources.length === 0 && !loading) return <div>...</div>;`). 

Because this early return happens before the main UI card is rendered, it completely hides the radius `<select>` dropdown and the "Use My Location" button. This creates a "trapped state" where the user cannot expand their search radius to find help because the controls to do so have vanished.

## 1. Web Frontend (`apps/web/src/components/NearbyResources.tsx`)
Restructure the component's JSX so that the wrapper card and the controls are **always** rendered, regardless of whether the resources array is empty. The empty state message should be rendered *inside* the card body instead of replacing the entire component.

- **Remove**: The early return statement for the empty array.
- **Conditional Rendering**: Move the "No resources found" check down into the body of the card, replacing the `<ul>` list when the array is empty.

```tsx
// Corrected JSX Structure Snippet:
export const NearbyResources = ({ disasterId }: { disasterId: string }) => {
  // ... state and useEffect logic remains unchanged ...

  if (loading && resources.length === 0) return <div>Finding nearby resources...</div>;

  return (
    <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3>Nearby Resources</h3>
        <div>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ marginRight: '10px', padding: '5px' }}>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
          <button onClick={handleUseMyLocation} style={{ padding: '5px' }}>
            📍 Use My Location
          </button>
        </div>
      </div>
      
      {geoError && <p style={{ color: 'red', fontSize: '12px' }}>{geoError}</p>}

      {/* Conditionally render the empty state OR the list inside the card */}
      {resources.length === 0 && !loading ? (
        <div style={{ padding: '20px 0', color: '#666' }}>
          No resources found within {radius}km. Try expanding your search radius.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {resources.map(r => (
            <li key={r.id} style={{ padding: '5px 0', borderBottom: '1px solid #ddd' }}>
              <strong>{r.name}</strong> ({r.type}) - {r.distanceKm.toFixed(1)}km away
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

## 2. Testing Strategy
Because we lack a JSDOM testing suite in the web workspace, this will be validated via manual UX verification in the browser.

- **Component / UX Verification**:
  - Load a disaster that is known to have no resources within 5km.
  - Verify that the outer card, the radius dropdown, and the location button are still visible on the screen.
  - Verify that the "No resources found" text is displayed neatly inside the card.
  - Change the radius dropdown to 100km. Verify that the UI successfully escapes the empty state and renders the newly found resources.
