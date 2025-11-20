import { Router, Request, Response } from 'express';
import { TaigaClient } from '@taiga-monorepo/core';

export const authRouter = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate with Taiga
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required',
      });
    }

    const client = new TaigaClient({
      apiUrl: process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1',
      username,
      password,
    });

    const token = await client.authenticate();
    const user = await client.getCurrentUser();

    // Create API key for future requests
    const apiKey = Buffer.from(`${username}:${password}`).toString('base64');

    res.json({
      success: true,
      token,
      apiKey,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
      },
      message: 'Use the apiKey in X-API-Key header for subsequent requests',
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: User information
 *       401:
 *         description: Not authenticated
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Provide X-API-Key header',
      });
    }

    const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    const client = new TaigaClient({
      apiUrl: process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1',
      username,
      password,
    });

    await client.authenticate();
    const user = await client.getCurrentUser();

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Get user error:', error.message);
    res.status(401).json({
      error: 'Failed to get user',
      message: error.message,
    });
  }
});
