# Implementation Memory: Bug 001 - Security and Error Handling

## Overview
Successfully implemented the strict security configurations and error abstractions outlined in `docs/spec/spec_automatic_location_resolution_bug_001.md`.

## What Was Done

1. **Strict Environment Variables for JWT (`apps/api`)**
   - **`middleware/auth.ts` & `routes/auth.ts`:** Removed the hardcoded `dev-secret` fallback. Added strict validation that `process.env.JWT_SECRET` is defined, immediately throwing a `FATAL` error to crash the application startup if missing.
   - **`package.json`:** Updated the `dev` script to `tsx --env-file=.env src/index.ts` to natively guarantee that environment variables are strictly loaded when the API spins up, regardless of npm workspace directory routing.
   - **`index.ts`:** Explicitly integrated `dotenv` into the module lifecycle as a failsafe so that environment variables correctly override the environment prior to any route importing.

2. **Core Domain Errors (`packages/core`)**
   - **`errors.ts`:** Added the `ExtractionError` class to safely define boundaries for external LLM parsing failures.

3. **LLM Error Abstraction (`apps/api`)**
   - **`GoogleLlmExtractionAdapter.ts`:** Wrapped the `generateContent` call in a `try/catch`. All raw exceptions thrown by the Google SDK (e.g. Invalid API keys, network timeouts) are now strictly logged to the local Node.js console for debugging, while an `ExtractionError` is generated.
   - **`routes/disasters.ts`:** Mapped `ExtractionError` instances to a clean `500 Internal Server Error` containing the generic text: `Failed to extract disaster details from the provided text.`

4. **Testing Coverage**
   - **`auth.test.ts`:** Refactored tests to rely on dynamic loading via ES Module imports after dynamically injecting `process.env.JWT_SECRET`, proving the strict startup rules.
   - **`disasters.test.ts`:** Refactored integration testing setup to also utilize dynamic loading for the app. Added a new explicit test case checking that when `@google/genai` is forced to throw an exception, the HTTP client successfully receives the clean 500 error mapped by our extraction adapter rather than leaking internal details. All 19 tests in the repository are fully passing.

## Status
- **Complete**: All criteria for Bug 001 have been met.
- **Tested**: All 19 test cases passing.
- **Server**: Both local development services start seamlessly, successfully reading from `.env`, crashing when they lack required variables, and cleanly surfacing errors when invalid upstream keys are used.
