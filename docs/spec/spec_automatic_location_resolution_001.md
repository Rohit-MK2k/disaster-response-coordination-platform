# Execution Plan: Feature 3 - Automatic Location Resolution

This document outlines the step-by-step implementation plan for **Feature 3**, transforming the disaster creation process into a smart, natural-language flow aligning with the Hexagonal Architecture sequence diagrams.

## 1. Shared Types (`packages/shared-types`)
Update the input DTOs to reflect the new natural-language creation flow.
- **DTOs**: `CreateDisasterInput` will now only accept a single `text` field.

```ts
// Example Snippet:
export interface CreateDisasterInput {
  text: string;
}

export type UpdateDisasterInput = Partial<Omit<Disaster, 'id' | 'created_by' | 'created_at' | 'updated_at'>>;
```

## 2. Core Architecture (`packages/core/src/disasters`)
Introduce the new Ports and rewrite the Use Cases to orchestrate the AI extraction and geocoding.
- **Ports**: Define `TextExtractionPort`, `GeocodingPort`, and `CachePort`.
- **Errors**: Introduce a custom `ValidationError` in `packages/core/src/errors.ts` for clean API boundary handling.
- **Use Cases**:
  - `CreateDisasterUseCase`: Coordinates extraction, geocoding (with cache), and persistence.
  - `UpdateDisasterUseCase`: Implements conditional re-geocoding if the location changes.

```ts
// Example Snippet:
export interface TextExtractionPort {
  extract(text: string): Promise<{ title: string; tags: string[]; locationText: string }>;
}

export interface GeocodingPort {
  resolve(locationText: string): Promise<{ name: string; lat: number; lng: number }>;
}

export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

export class CreateDisasterUseCase implements UseCase<{ input: CreateDisasterInput; user: AuthenticatedUser }, Disaster> {
  constructor(
    private repo: DisasterRepositoryPort,
    private extractor: TextExtractionPort,
    private geocoder: GeocodingPort,
    private cache: CachePort
  ) {}

  async execute({ input, user }: { input: CreateDisasterInput; user: AuthenticatedUser }): Promise<Disaster> {
    if (!input.text || input.text.trim().length === 0) throw new ValidationError('Text cannot be empty');
    
    const { title, tags, locationText } = await this.extractor.extract(input.text);
    
    let location = await this.cache.get<{ name: string; lat: number; lng: number }>(`geo:${locationText}`);
    if (!location) {
      location = await this.geocoder.resolve(locationText);
      await this.cache.set(`geo:${locationText}`, location, 3600);
    }

    const disaster: Disaster = {
      id: crypto.randomUUID(), // Assuming crypto is available or passed in
      title,
      description: input.text,
      location_name: location.name,
      location_lat: location.lat,
      location_lng: location.lng,
      tags,
      status: 'active',
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await this.repo.save(disaster);
    return disaster;
  }
}

export class UpdateDisasterUseCase implements UseCase<{ id: string; input: UpdateDisasterInput; user: AuthenticatedUser }, Disaster> {
  constructor(
    private repo: DisasterRepositoryPort,
    private geocoder: GeocodingPort
  ) {}

  async execute({ id, input, user }: { id: string; input: UpdateDisasterInput; user: AuthenticatedUser }): Promise<Disaster> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error('NotFoundError: Disaster not found');

    const updated = { ...existing, ...input, updated_at: new Date().toISOString() };

    // Smart heuristic: conditional re-geocoding
    if (input.description && !input.description.includes(existing.location_name)) {
      // The location name is no longer in the description, we must resolve new coordinates
      const location = await this.geocoder.resolve(input.description);
      updated.location_name = location.name;
      updated.location_lat = location.lat;
      updated.location_lng = location.lng;
    }

    await this.repo.save(updated);
    return updated;
  }
}
```

## 3. API Backend (`apps/api`)
Build concrete Adapters for the new Ports.
- **Adapters**: 
  - `GoogleLlmExtractionAdapter` using `@google/genai`.
  - `MockGeocodingAdapter` using an in-memory gazetteer.
  - `InMemoryCacheAdapter`.

```ts
// Example Snippet:
import { TextExtractionPort } from '@drp/core';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export class GoogleLlmExtractionAdapter implements TextExtractionPort {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async extract(text: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract disaster details from: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            locationText: { type: Type.STRING }
          },
          required: ["title", "tags", "locationText"]
        } as Schema
      }
    });
    return JSON.parse(response.text() || '{}');
  }
}
```

## 4. Web Frontend (`apps/web`)
Create the UI for the natural language input.
- **`ReportDisasterForm` Component**: A simple textarea to replace manual structured fields.

```tsx
// Example Snippet:
import React, { useState } from 'react';
import { apiClient } from '../api';

export const ReportDisasterForm = ({ onCreated }: { onCreated: () => void }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/disasters', { text });
      setText('');
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Report an Incident</h3>
      <textarea 
        value={text} 
        onChange={e => setText(e.target.value)} 
        placeholder="E.g., Huge flood in downtown Manhattan..."
        rows={4}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Analyzing & Reporting...' : 'Report'}
      </button>
    </form>
  );
};
```

---

## 5. Testing Strategy
- **Core Unit Tests**: 
  - `CreateDisasterUseCase`:
    - Verify it calls `CachePort` and skips `GeocodingPort` on a cache hit.
    - Verify it calls `GeocodingPort` on a cache miss and saves the result.
    - Verify it binds the correct `created_by` ID to the entity.
  - `UpdateDisasterUseCase`:
    - Verify it throws `NotFoundError` if the disaster does not exist.
    - Verify it skips `GeocodingPort` if the new description still contains the existing `location_name`.
    - Verify it calls `GeocodingPort` if the new description no longer contains the existing `location_name`.
- **API Tests**: 
  - **Rewrite Old Creation Test (`POST /disasters`)**: Replace structured inputs with `{ "text": "..." }`, mock the AI ports, and assert `res.body.created_by` matches the JWT user ID.
  - **New Update Test (`PATCH /disasters/:id`)**: Add an integration test to verify the router correctly passes updates to the use case.
  - **Preserve Old Security Tests**: The existing unit and integration tests for `DELETE /disasters/:id` will remain untouched to ensure the new AI workflow does not inadvertently break the Admin-only authorization rules.

### Design Principles Checklist for this Feature:
- [x] **Single Responsibility Principle (S in SOLID)**: We have separated the use cases (`CreateDisasterUseCase`, `UpdateDisasterUseCase`) and the adapters (`GoogleLlmExtractionAdapter`, `MockGeocodingAdapter`) into distinct classes. If we need to tweak the AI prompt, we only touch the adapter. If we need to change business rules, we only touch the Use Case. There is no "god class".
- [x] **Open/Closed Principle (O in SOLID)**: The Core Use Cases depend on abstract Ports. If we later want to switch from Google Gemini to OpenAI, or from our mock geocoder to a real Mapbox API, we simply write a new Adapter. The Core Use Case code is *closed* for modification but *open* for extension.
- [x] **Interface Segregation (I in SOLID)**: We use two distinct, narrow ports (`TextExtractionPort` and `GeocodingPort`) instead of one giant "AI Port" because extraction is a language problem and geocoding is a geographic lookup problem.
- [x] **Dependency Inversion (D in SOLID)**: The Core defines `TextExtractionPort` and has zero knowledge of the Google SDK. The outer API layer depends on the inner Core layer, never the other way around.
