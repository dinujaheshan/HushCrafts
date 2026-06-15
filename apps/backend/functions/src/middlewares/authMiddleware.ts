import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebaseAdmin';

// Extend Express Request object to hold verified user properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: string;
        permissions?: string[];
      };
    }
  }
}

/**
 * Validates client request bearer token
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access Denied: Missing Authorization Header'
      }
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken.role as string) || undefined,
      permissions: (decodedToken.permissions as string[]) || []
    };
    
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access Denied: Invalid Authentication Token'
      }
    });
  }
}

/**
 * Verifies if user contains specific capability claims
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access Denied: Unauthenticated Request'
        }
      });
    }

    const permissions = user.permissions || [];
    
    // Super admins bypass all permission checks
    if (user.role === 'super_admin' || permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access Denied: Insufficient Permissions'
      }
    });
  };
}
