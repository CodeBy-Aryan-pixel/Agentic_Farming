import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET =
  process.env.JWT_SECRET || 'future_farming_super_secure_jwt_secret_key_2026_dev';

/**
 * Middleware: Verifies Bearer JWT token and attaches authenticated user to request
 */
export async function protect(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided in Authorization header.',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        message: 'Invalid or malformed authentication token.',
      });
      return;
    }

    // Fetch user without sensitive password hash (with fallbackStore support)
    let user: any = null;
    const { isDatabaseConnected } = require('../config/db');
    const { readStore } = require('../utils/fallbackStore');

    if (isDatabaseConnected()) {
      try {
        user = await User.findById(decoded.id).select('-password');
      } catch (_) {}
    }

    if (!user) {
      const fbUser = readStore().users.find((u: any) => u._id === decoded.id);
      if (fbUser) {
        user = fbUser;
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
      return;
    }

    if (user.isActive === false) {
      res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
}

/**
 * Middleware: Restricts access to Admin role only
 */
export function adminOnly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
    return;
  }

  next();
}

export default { protect, adminOnly };
