import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const projectsRouter = Router();

// All routes require authentication
projectsRouter.use(authMiddleware);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */
projectsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await req.taigaClient!.listProjects();
    res.json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error: any) {
    console.error('List projects error:', error.message);
    res.status(500).json({
      error: 'Failed to list projects',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID or slug
 *     tags: [Projects]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 */
projectsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await req.taigaClient!.getProject(id);
    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    console.error('Get project error:', error.message);
    res.status(404).json({
      error: 'Project not found',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}/members:
 *   get:
 *     summary: Get project members
 *     tags: [Projects]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of project members
 */
projectsRouter.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const members = await req.taigaClient!.getProjectMembers(id);
    res.json({
      success: true,
      data: members,
      count: members.length,
    });
  } catch (error: any) {
    console.error('Get members error:', error.message);
    res.status(500).json({
      error: 'Failed to get members',
      message: error.message,
    });
  }
});
