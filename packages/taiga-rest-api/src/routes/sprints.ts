import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const sprintsRouter = Router();
sprintsRouter.use(authMiddleware);

sprintsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id query parameter required' });
    }
    const sprints = await req.taigaClient!.listMilestones(project_id as string);
    res.json({ success: true, data: sprints, count: sprints.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list sprints', message: error.message });
  }
});

sprintsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const sprint = await req.taigaClient!.getMilestone(req.params.id);
    res.json({ success: true, data: sprint });
  } catch (error: any) {
    res.status(404).json({ error: 'Sprint not found', message: error.message });
  }
});

sprintsRouter.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await req.taigaClient!.getMilestoneStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get sprint stats', message: error.message });
  }
});

sprintsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const sprint = await req.taigaClient!.createMilestone(req.body);
    res.status(201).json({ success: true, data: sprint });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create sprint', message: error.message });
  }
});

sprintsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const sprint = await req.taigaClient!.updateMilestone(req.params.id, req.body);
    res.json({ success: true, data: sprint });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update sprint', message: error.message });
  }
});

sprintsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await req.taigaClient!.deleteMilestone(req.params.id);
    res.json({ success: true, message: 'Sprint deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete sprint', message: error.message });
  }
});
