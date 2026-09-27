# Execution Plan: Feature 2 - Edit Disaster UI Missing (Bug Fix)

## Overview
During the implementation of **Feature 2: Disaster Logging (CRUD)**, the backend Use Case (`UpdateDisasterUseCase`) and API route (`PATCH /disasters/:id`) were fully built. However, the Web UI was never updated to expose this functionality to the user, leaving it impossible to edit a disaster (e.g., to change its status to "Resolved") without manually hitting the API.

## The Fix
We need to add an inline editing form to the `DisasterDetail` React component in the `@drp/web` package.

### 1. State Management
- Introduce an `isEditing` boolean state to toggle between view mode and edit mode.
- Introduce an `editData` object state to track the `description` and `status` inputs.

### 2. UI Implementation (`CommunityReports.tsx` -> `DisasterDetail.tsx`)
- Add an "Edit Disaster" button below the disaster metadata.
- When clicked, swap the metadata view out for an HTML `<form>`.
- The form must contain:
  - A `<textarea>` bound to `editData.description`.
  - A `<select>` dropdown bound to `editData.status` with options: `active`, `resolved`, `closed`.
  - A "Save Changes" submit button and a "Cancel" button to revert to view mode.

### 3. API Integration
- Implement a `handleUpdate` function triggered by form submission.
- Fire an `apiClient.patch('/disasters/:id', editData)` request.
- On success, update the local `disaster` state with the returned object and close the edit form.
- *Architectural Note:* No role restrictions are placed on this UI button. Unlike the "Delete" action (which is strictly Admin-only), Contributors must be able to update incident descriptions and resolve incidents as conditions on the ground change.

## Testing Strategy
- Navigate to a disaster in the Web UI.
- Click "Edit Disaster", alter the status from "active" to "resolved", and click Save.
- Verify the UI immediately reflects the new status.
- Verify the backend `PATCH` route correctly processes the update (and conditionally triggers geocoding if the description's location context was drastically altered).
