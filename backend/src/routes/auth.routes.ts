import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { userService } from '../services';

const router = Router();

/**
 * POST /api/auth/login
 * Login with username and password
 * Returns user information (no token, uses Basic Auth)
 */
router.post(
  '/login',
  validate(schemas.loginRequest, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    // Authenticate user
    const user = await userService.authenticate(username, password);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
      return;
    }

    // Return user info (password excluded by service)
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user info (requires Basic Auth)
 */
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    // Get username from Basic Auth header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username] = credentials.split(':');

    // Find user by username
    const user = await userService.findByUsername(username);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  })
);

export default router;
