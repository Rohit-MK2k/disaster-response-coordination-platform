import { describe, it, expect, vi } from 'vitest';
import { resolveUserMiddleware, AuthenticatedRequest } from '../../src/middleware/auth';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = 'dev-secret';

describe('API: resolveUserMiddleware', () => {
  it('Should successfully parse a valid token and attach AuthenticatedUser', () => {
    const token = jwt.sign({ id: '1', role: 'admin' }, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
    const res = {} as Response;
    const next: NextFunction = vi.fn();

    resolveUserMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user?.id).toBe('1');
    expect(req.user?.role).toBe('admin');
    expect(next).toHaveBeenCalled();
  });

  it('Should handle a missing Authorization header by returning a 401 Unauthorized response', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next: NextFunction = vi.fn();

    resolveUserMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('Should handle an invalid or expired token gracefully by returning a 401', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } } as AuthenticatedRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next: NextFunction = vi.fn();

    resolveUserMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});
