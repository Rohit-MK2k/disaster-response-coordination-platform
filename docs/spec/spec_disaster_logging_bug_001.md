# Bug Fix Specification: Disaster Logging UI Delete Button (Bug 001)

## 1. Description of the Bug
According to the core product documentation (`docs/project_doc.md`), **Contributors** are not allowed to delete disaster records; only **Admins** have this permission. 

Currently, our backend correctly enforces this rule (returning a `403 Forbidden` error if a contributor attempts a deletion). However, there is a **UI bug** in the React frontend: the "Delete Disaster" button is rendered for *all* users. If a contributor clicks it, they receive a permission denied error on the screen. While secure, this is a poor user experience. Contributors should not see actions they are not authorized to perform.

## 2. Goal
Hide the "Delete Disaster" button in the `DisasterDetail` React component when the currently logged-in user has the `contributor` role.

## 3. Proposed Changes

### Web Frontend (`apps/web/src/components/DisasterDetail.tsx`)
Update the component signature to accept a `userRole` property. Use this property to conditionally render the delete button block.

```tsx
// Example Snippet: apps/web/src/components/DisasterDetail.tsx

// 1. Update the props interface to require `userRole`
export const DisasterDetail = ({ id, userRole, onBack }: { id: string; userRole: string; onBack: () => void }) => {
  // ... existing state and logic ...

  return (
    <div>
      <button onClick={onBack}>← Back to Board</button>
      <h2>{disaster.title}</h2>
      {/* ... other details ... */}
      
      {/* 2. Conditionally render the delete button only for admins */}
      {userRole === 'admin' && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleDelete} style={{ background: 'red', color: 'white' }}>Delete Disaster</button>
        </div>
      )}
    </div>
  );
};
```

### Web Frontend (`apps/web/src/App.tsx`)
Update the parent `App` component to pass the authenticated user's role down into the `DisasterDetail` component when rendering it.

```tsx
// Example Snippet: apps/web/src/App.tsx

// ... inside the main return block ...
{activeDisasterId ? (
  <DisasterDetail 
    id={activeDisasterId} 
    userRole={user.role} // <-- Pass the role down
    onBack={() => setActiveDisasterId(null)} 
  />
) : (
  <DisasterBoard onSelect={setActiveDisasterId} />
)}
```

## 4. Verification Plan

- **Automated Verification**: Ensure that `npm run test` continues to pass, confirming that no backend logic or architectural boundaries were inadvertently broken by this UI presentation change.
- **Manual Verification**:
  1. Log in to the application as a `contributor` (e.g., using a contributor token).
  2. Open any existing disaster record to view its details.
  3. Verify that the red "Delete Disaster" button is completely absent from the screen.
  4. Log out and log back in as an `admin`.
  5. Verify that the "Delete Disaster" button is now visible.
