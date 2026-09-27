# Execution Plan: Feature 3 - Automatic Location Resolution (Bug 001)

This document outlines the steps to resolve security configuration and error handling leaks discovered after the implementation of Feature 3.

## 1. Strict Environment Variables for JWT
Currently, the JWT secret is hardcoded or falls back to a development string. This is a severe security risk that must be eliminated.
- **Requirement:** `JWT_SECRET` must be read *exclusively* from `process.env.JWT_SECRET`. The use of fallback OR operators (`|| 'dev-secret'`) is strictly prohibited.
- **Fail-Fast:** If `process.env.JWT_SECRET` is missing or undefined when the server starts or when auth modules load, the application must immediately throw an error and crash (`throw new Error('FATAL: JWT_SECRET environment variable is required.')`). This forces the environment to be configured correctly before running.
- **Affected Files:**
  - `apps/api/src/middleware/auth.ts`
  - `apps/api/src/routes/auth.ts`
  - Test files must explicitly configure `process.env.JWT_SECRET` in their `beforeAll` blocks or inject it rather than relying on a hardcoded constant.

## 2. Abstraction of External Errors (LLM Adapter)
Currently, if the Google Gemini API fails (e.g., due to an invalid or unconfigured API key), the `GoogleLlmExtractionAdapter` allows the raw, highly-detailed Google HTTP error payload to bubble up through the Use Case, out the Express Router, and directly into the frontend UI.
- **Requirement:** External infrastructure errors must never leak to the client. The `GoogleLlmExtractionAdapter` must catch and handle all exceptions thrown by the `@google/genai` SDK.
- **Implementation:** 
  - Wrap the `ai.models.generateContent` call in a `try/catch` block.
  - Inside the `catch` block, the raw error should be logged to the backend console for developer debugging.
  - The adapter must then throw a new, clean custom domain error: `ExtractionError('Failed to extract disaster details from the provided text.')`.
  - This guarantees the UI only ever receives a clean, generic failure message.

## 3. Core Domain Errors
- **Action:** Add a new `ExtractionError` class to `packages/core/src/errors.ts`.
- **Router Update:** Update `apps/api/src/routes/disasters.ts` to gracefully catch the `ExtractionError` and map it to a standard `500 Internal Server Error` (or `503 Service Unavailable`) returning only the clean error message.

## 4. Testing Strategy
- **JWT Environment Validation:** 
  - Update `auth.test.ts` to dynamically set `process.env.JWT_SECRET` before running tests to ensure it passes.
- **LLM Error Abstraction (Integration Test):**
  - Update `disasters.test.ts` to include a new test for `POST /disasters`.
  - In this specific test, configure the `vi.mock` for `@google/genai` to simulate a rejection (e.g., mimicking an invalid API key).
  - Assert that the API responds with a clean `500` status code and the generic error message (`Failed to extract disaster details from the provided text.`), explicitly ensuring that no raw Google JSON payload leaks into the test's `res.body`.
