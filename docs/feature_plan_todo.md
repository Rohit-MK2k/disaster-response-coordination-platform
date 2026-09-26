# End-to-End Implementation Plan

> **Note:** As per architecture constraints, we will build and use in-memory mock adapters for all persistence and external integrations first to prove the boundaries and logic. We will not set up real infrastructure (like MongoDB) during this phase.

## Feature 1: Foundation & Access Control
Establishes the monorepo boundaries, shared contracts, and user identity pipeline.

*   **Core (`packages/shared-types` & `packages/core`)**
    *   **Domain Entities:** Define narrow interfaces for `User` (`{ id, name, role }`), `Disaster`, `Resource`, and `Report`. 
    *   **Architecture:** Define base `UseCase` interfaces enforcing dependency injection.
*   **API (`apps/api`)**
    *   **Endpoints/Routing:** Initialize Express/Fastify server.
    *   **Middleware:** Implement `resolveUserMiddleware` to parse an `Authorization` header (e.g., `Role admin`) into an `AuthenticatedUser` object. Attach this object to the request context. No authorization logic happens here.
*   **Web (`apps/web`)**
    *   **UI:** Initialize a Vite (React/Vue) app. Add a "Role Switcher" dropdown to the header.
    *   **Integration:** Configure the base HTTP client (Axios/Fetch) to append the selected role to headers of all outgoing requests.

---

## Feature 2: Disaster Logging (CRUD)
Manages the core lifecycle of a disaster record, enforcing business rules on who can do what.

*   **Core**
    *   **Ports:** Define `DisasterRepositoryPort` (`save`, `update`, `delete`, `findById`, `findAll`).
    *   **Use Cases:** Implement `ListDisastersUseCase`, `GetDisasterUseCase`, `CreateDisasterUseCase`, `UpdateDisasterUseCase`, and `DeleteDisasterUseCase`.
    *   **Business Rules:** `DeleteDisasterUseCase` throws an `UnauthorizedError` if `user.role !== 'admin'`.
*   **API**
    *   **Adapters:** Implement `InMemoryDisasterRepositoryAdapter`.
    *   **Endpoints:** Map `GET /disasters`, `GET /disasters/:id`, `POST /disasters`, `PATCH /disasters/:id`, and `DELETE /disasters/:id` to their respective use cases, passing in the `AuthenticatedUser`.
*   **Web**
    *   **UI:** Create a `DisasterBoard` component (list view) and a `DisasterDetail` component. Add edit controls and a delete button.
    *   **Integration:** Hook up UI to the REST endpoints. The delete button should visually remain but fail gracefully if the active role is Contributor.

---

## Feature 3: Automatic Location Resolution
Extracts structured data from a natural-language description and resolves it to map coordinates.

*   **Core**
    *   **Ports:** Define `TextExtractionPort` (returns title, tags, location string) and `GeocodingPort` (returns lat/lng).
    *   **Use Cases:** 
        *   Modify `CreateDisasterUseCase` to accept raw text. Flow: `TextExtractionPort` → `GeocodingPort` → generate `Disaster` entity → `DisasterRepositoryPort`.
        *   Modify `UpdateDisasterUseCase` to implement conditional geocoding: check if the existing location string is still a substring of the updated description. If not, call `GeocodingPort`.
*   **External Integration (Adapters)**
    *   **Extraction:** Implement `GoogleAIExtractionAdapter` (wraps Google AI SDK / Gemini). Prompts the model to extract `title`, `tags`, and `location` as strict JSON from the text.
    *   **Geocoding:** Implement `GoogleMapsGeocodingAdapter` (or Mapbox/OSM). Takes the location string and calls the external API for coordinates.
*   **API**
    *   Inject the concrete adapters into the Use Cases during application bootstrap.
*   **Web**
    *   **UI:** Implement the "Report Incident" form as a *single text area* (no separate title/location fields).
    *   **Integration:** On submit, display a loading state while the backend runs the LLM and Geocoding APIs, then render the structured result (tags, title, lat/lng).

---

## Feature 4: Nearby Resource Discovery
Finds actionable help geographically close to an incident.

*   **Core**
    *   **Ports:** Define `ResourceRepositoryPort`.
    *   **Use Cases:** Implement `GetNearbyResourcesUseCase`. It retrieves the disaster coordinates, fetches resources, calculates the Haversine distance for each, filters out those beyond a requested radius, and sorts by proximity.
*   **API**
    *   **Adapters:** Implement `InMemoryResourceRepositoryAdapter` pre-seeded with dummy data (e.g., hospitals, water points).
    *   **Endpoints:** Create `GET /disasters/:id/resources?radius=10`.
*   **Web**
    *   **UI:** Add a "Nearby Resources" panel to the `DisasterDetail` view.
    *   **Integration:** Fetch from the resources endpoint and display items with their calculated distance from the disaster.

---

## Feature 5: Community Reports
Aggregates ground-level chatter, ensuring resilience against third-party API instability.

*   **Core**
    *   **Ports:** Define `ReportsSourcePort` and `CachePort`.
    *   **Use Cases:** Implement `GetDisasterReportsUseCase`. Flow: Check `CachePort`. If miss, call `ReportsSourcePort`, normalize the raw data into `Report` entities, filter by the disaster's tags/location, save to `CachePort` with a TTL, and return.
*   **External Integration (Adapters)**
    *   **Source:** Implement `SocialFeedAdapter` (wraps a mock external API or real Twitter/Reddit API). Must include timeout handling and failure fallbacks.
    *   **Cache:** Implement `InMemoryCacheAdapter` (swappable for Redis later).
*   **API**
    *   **Endpoints:** Create `GET /disasters/:id/reports`.
*   **Web**
    *   **UI:** Add a "Community Chatter" feed to the `DisasterDetail` view.
    *   **Integration:** Fetch from the reports endpoint. Display loading skeletons to handle potential upstream latency gracefully.

---

## Feature 6: Live Updates
Pushes state changes to active users in real-time.

*   **Core**
    *   **Ports:** Define `EventPublisherPort` (`publish(eventName, payload)`).
    *   **Use Cases:** Inject `EventPublisherPort` into `Create`, `Update`, and `Delete` use cases. Call `publish` immediately after the repository save/delete succeeds.
*   **API / External Integration**
    *   **Adapters:** Implement `SocketIoPublisherAdapter`.
    *   **Infrastructure:** Attach a Socket.io server to the Express/Fastify instance. When the adapter's `publish` method is called, broadcast the event to all connected clients.
*   **Web**
    *   **Integration:** Initialize a Socket.io client in the root context. 
    *   **UI:** Listen for `disaster_created`, `disaster_updated`, and `disaster_deleted` events. Update local React/Vue state automatically (e.g., adding the new record to the list, updating tags, removing a deleted row) without requiring the user to refresh the page.
