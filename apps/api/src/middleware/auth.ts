import { Request, Response, NextFunction } from 'express';
import { Role } from '@drp/shared-types';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required.');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export const resolveUserMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, SECRET) as { id: string; role: Role };
      req.user = { id: decoded.id, role: decoded.role }; 
      return next();
    } catch (e) {
      // Invalid token, fall through to 401
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
};
