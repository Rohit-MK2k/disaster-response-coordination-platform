# Memory Log: Feature 2 - Edit Disaster UI Missing

## Changes Made
- **Web Frontend (`@drp/web`)**:
  - Updated `apps/web/src/components/DisasterDetail.tsx` to include an inline editing mode.
  - Added state hooks for `isEditing` and `editData`.
  - Added an HTML form containing a `textarea` for description updates and a `select` dropdown for status transitions (`active`, `resolved`, `closed`).
  - Added the `handleUpdate` method which fires a `PATCH` request to the backend using Axios and gracefully exits edit mode upon success.

## Architectural Notes
- The backend `UpdateDisasterUseCase` was already built to automatically invoke the `GeocodingPort` if it detects that the updated description no longer contains the original location name. Because we exposed the `description` field in this new UI form, this conditional geocoding logic is now fully accessible to end users.
- Role-Based Access Control (RBAC): The "Edit" button is universally visible to all authenticated roles. This aligns with the operational requirement that normal field contributors must be able to update incident statuses, while destructive actions (Delete) remain restricted to Admins.
