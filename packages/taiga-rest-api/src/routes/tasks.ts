import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const tasksRouter = Router();
tasksRouter.use(authMiddleware);

tasksRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await req.taigaClient!.getTask(req.params.id);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(404).json({ error: 'Task not found', message: error.message });
  }
});

tasksRouter.post('/', async (req: Request, res: Response) => {
  try {
    const task = await req.taigaClient!.createTask(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create task', message: error.message });
  }
});

tasksRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const task = await req.taigaClient!.updateTask(req.params.id, req.body);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update task', message: error.message });
  }
});
