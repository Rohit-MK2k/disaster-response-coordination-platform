# Disaster Response Coordination Platform

## About the Project
The **Disaster Response Coordination Platform** is a full-stack, real-time application designed to help emergency response agencies manage crisis events. It allows both admins and ground contributors to log incoming disaster reports (fires, floods, earthquakes) using natural language, automatically geocodes the incident, finds deployed resources within a 10km radius, and cross-references live community social feeds (like Twitter) to surface on-the-ground intelligence. 

For a complete breakdown of the product features, user roles, and detailed specifications, please read the **[Project Documentation](docs/project_doc.md)**.

---

## Architecture Overview
This project was built from the ground up using **Clean Architecture (Ports & Adapters)** and strictly adheres to SOLID principles. 

The entire domain logic (in `packages/core`) is completely agnostic to external infrastructure. It does not know what a database, Redis, HTTP framework, or WebSocket is. Instead, it defines interfaces ("Ports") for its needs.

For this phase of development, **we deliberately mocked all external infrastructure** using in-memory Adapters inside the `apps/api` layer:
- **Database / Persistence:** In-memory arrays instead of PostgreSQL/MongoDB.
- **Geocoding:** Hardcoded mock coordinates instead of Google Maps/Nominatim APIs.
- **Caching:** In-memory pub-sub caching instead of Redis.
- **Social Feed:** Procedurally generated JSON mock pools instead of the live Twitter/X API.
- **Real-Time Updates:** 3-second stateless HTTP Short Polling instead of complex stateful WebSockets.

This allows the application to be tested and run instantly without needing to configure docker containers, database schemas, or external API quotas.

For deep technical details, dependency rules, and sequence diagrams, please read the **[Architecture Documentation](docs/architecture.md)**.

---

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

---

## Setup & Installation

**1. Clone the repository and install dependencies:**
```bash
npm install
```
*(Because this is an npm workspace monorepo, this single command will install and link dependencies for the core, shared-types, api, and web packages.)*

**2. Configure Environment Variables:**
Navigate into the API workspace and copy the example environment file to create your local `.env`:
```bash
cd apps/api
cp .env.example .env
```
Open the `apps/api/.env` file and ensure the following keys are set:
- `JWT_SECRET`: A secure string used for signing authentication tokens.
- `GEMINI_API_KEY`: A valid Google Gemini API key (Required for the LLM Natural Language Text Extraction feature). 
  - *To get a free key, visit [Google AI Studio](https://aistudio.google.com/app/apikey), sign in with your Google account, and click "Create API key".*

**3. Mock Data Setup (Optional):**
The community reports feature relies on a mock Twitter feed pool. This pool (`apps/api/data/mock-twitter-feed-pool.json`) is already generated and included in the repository. If you ever want to mathematically regenerate a new random pool of 800+ tweets based on the local disaster seed data, you can run:
```bash
node apps/api/data/generate-pool.cjs
```

---

## Running the Application

To start the entire platform locally, run the following command from the root directory:
```bash
npm run dev
```
This utilizes `concurrently` to boot both workspaces simultaneously:
- **Backend API:** Runs on `http://localhost:3000`
- **Frontend Web UI:** Runs on `http://localhost:5173`

Open `http://localhost:5173` in your browser to interact with the platform.

*(Note: The frontend includes a mock login screen. Simply type "admin" to log in with full privileges, or "contributor" for standard access.)*

---

## Running Tests
The project uses **Vitest** for all testing (unit tests for the core logic, and integration tests for the API routes using Supertest).

To run the entire test suite across all workspaces:
```bash
npm run test
```
