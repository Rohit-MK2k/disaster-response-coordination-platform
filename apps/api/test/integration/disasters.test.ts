import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const SECRET = 'dev-secret';

const adminToken = jwt.sign({ id: '1', role: 'admin' }, SECRET);
const contributorToken = jwt.sign({ id: '2', role: 'contributor' }, SECRET);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../data/test-disasters.json');

describe('Disasters API (Integration)', () => {
  let createdDisasterId: string;

  beforeAll(async () => {
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
        title: 'Test Fire',
        description: 'Fire in the building',
        location_name: 'Main St',
        location_lat: 40,
        location_lng: -74,
        tags: ['fire'],
        status: 'active'
      });
    
    if (res.status !== 201) console.error(res.body);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Fire');
    createdDisasterId = res.body.id;
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
