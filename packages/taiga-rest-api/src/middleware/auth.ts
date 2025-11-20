import { Request, Response, NextFunction } from 'express';
import { TaigaClient } from '@taiga-monorepo/core';

// Extend Express Request to include taigaClient
declare global {
  namespace Express {
    interface Request {
      taigaClient?: TaigaClient;
    }
  }
}

/**
 * Authentication middleware
 * Expects API key in header: X-API-Key (Base64 encoded username:password)
 * OR credentials in headers: X-Taiga-Username and X-Taiga-Password
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const username = req.headers['x-taiga-username'] as string;
    const password = req.headers['x-taiga-password'] as string;

    let taigaUsername: string;
    let taigaPassword: string;

    if (apiKey) {
      // Decode Base64 API key
      const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
      const [user, pass] = decoded.split(':');

      if (!user || !pass) {
        return res.status(401).json({
          error: 'Invalid API key format',
          message: 'API key must be Base64 encoded username:password',
        });
      }

      taigaUsername = user;
      taigaPassword = pass;
    } else if (username && password) {
      taigaUsername = username;
      taigaPassword = password;
    } else {
      // Try environment variables as fallback
      taigaUsername = process.env.TAIGA_USERNAME || '';
      taigaPassword = process.env.TAIGA_PASSWORD || '';

      if (!taigaUsername || !taigaPassword) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Provide X-API-Key header (Base64 encoded username:password) or X-Taiga-Username and X-Taiga-Password headers',
        });
      }
    }

    // Create Taiga client
    const taigaClient = new TaigaClient({
      apiUrl: process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1',
      username: taigaUsername,
      password: taigaPassword,
    });

    // Authenticate
    await taigaClient.authenticate();

    // Attach client to request
    req.taigaClient = taigaClient;

    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
}

/**
 * Optional auth middleware (doesn't fail if no credentials provided)
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const username = req.headers['x-taiga-username'] as string;
    const password = req.headers['x-taiga-password'] as string;

    if (!apiKey && !username && !password) {
      // No auth provided, skip
      return next();
    }

    // If auth is provided, validate it
    await authMiddleware(req, res, next);
  } catch (error) {
    next();
  }
}
