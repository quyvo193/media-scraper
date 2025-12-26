import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';

/**
 * Basic Authentication Middleware
 * Validates username and password from Authorization header
 */
export const basicAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
      return;
    }

    // Decode Base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials format',
      });
      return;
    }

    // Authenticate user
    const user = await userService.authenticate(username, password);

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password',
      });
      return;
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      username: user.username,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no auth provided
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      // No auth provided, continue without user
      next();
      return;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (username && password) {
      const user = await userService.authenticate(username, password);
      if (user) {
        (req as any).user = {
          id: user.id,
          username: user.username,
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};
