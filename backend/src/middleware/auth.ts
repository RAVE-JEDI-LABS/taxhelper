import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../services/firebase.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      // For development, allow unauthenticated access with demo user
      if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEMO_AUTH === 'true') {
        req.user = {
          uid: 'demo-user',
          email: 'demo@example.com',
          role: 'admin',
        };
        return next();
      }

      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role as string | undefined,
      };
      next();
    } catch (tokenError) {
      // For development, allow demo auth if token verification fails
      if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEMO_AUTH === 'true') {
        req.user = {
          uid: 'demo-user',
          email: 'demo@example.com',
          role: 'admin',
        };
        return next();
      }
      throw tokenError;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid authentication token',
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}
