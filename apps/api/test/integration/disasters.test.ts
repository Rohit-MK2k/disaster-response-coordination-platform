import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { Express } from 'express';

let app: Express;

const mockGenerateContent = vi.fn().mockResolvedValue({
  get text() {
    return JSON.stringify({
      title: 'Mock Fire',
      tags: ['fire'],
      locationText: 'manhattan'
    });
  }
});

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    })),
    Type: { OBJECT: 'object', STRING: 'string', ARRAY: 'array' }
  };
});

const adminToken = jwt.sign({ id: '1', role: 'admin' }, 'test-secret');
const contributorToken = jwt.sign({ id: '2', role: 'contributor' }, 'test-secret');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../data/test-disasters.json');

describe('Disasters API (Integration)', () => {
  let createdDisasterId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const serverModule = await import('../../src/index');
    app = serverModule.app;
    
    // Ensure clean state or just create a test disaster
    try {
      await fs.writeFile(DATA_FILE, '[]', 'utf-8');
    } catch {}
  });

  afterAll(async () => {
    try {
      await fs.writeFile(DATA_FILE, '[]', 'utf-8');
    } catch {}
  });

  it('POST /disasters - Should create a disaster', async () => {
    const res = await request(app)
      .post('/disasters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: 'Massive fire in Manhattan'
      });
    
    if (res.status !== 201) console.error(res.body);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Mock Fire'); // from mock
    expect(res.body.location_name).toBe('Manhattan, NYC'); // from mock geocoder
    expect(res.body.created_by).toBe('1'); // tied to admin token
    createdDisasterId = res.body.id;
  });

  it('POST /disasters - Should return 500 clean error if LLM fails', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API key not valid'));
    
    const res = await request(app)
      .post('/disasters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: 'Massive fire in Manhattan'
      });
    
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to extract disaster details from the provided text.');
    // Ensure raw Google JSON is nowhere in the response
    expect(JSON.stringify(res.body)).not.toContain('API key not valid');
  });

  it('PATCH /disasters/:id - Should update a disaster', async () => {
    const res = await request(app)
      .patch(`/disasters/${createdDisasterId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Actually it is in LA now'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.location_name).toBe('Los Angeles, CA'); // geocoder mock logic
  });

  it('DELETE /disasters/:id - Should return 403 Forbidden for a contributor', async () => {
    const res = await request(app)
      .delete(`/disasters/${createdDisasterId}`)
      .set('Authorization', `Bearer ${contributorToken}`);
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Only admins can delete disasters.');
  });

  it('DELETE /disasters/:id - Should return 204 No Content for an admin', async () => {
    const res = await request(app)
      .delete(`/disasters/${createdDisasterId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    if (res.status !== 204) console.error(res.body);
    expect(res.status).toBe(204);
  });
});
