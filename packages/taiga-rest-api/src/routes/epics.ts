import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const epicsRouter = Router();
epicsRouter.use(authMiddleware);

epicsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id query parameter required' });
    }
    const epics = await req.taigaClient!.listEpics(project_id as string);
    res.json({ success: true, data: epics, count: epics.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list epics', message: error.message });
  }
});

epicsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const epic = await req.taigaClient!.getEpic(req.params.id);
    res.json({ success: true, data: epic });
  } catch (error: any) {
    res.status(404).json({ error: 'Epic not found', message: error.message });
  }
});

epicsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const epic = await req.taigaClient!.createEpic(req.body);
    res.status(201).json({ success: true, data: epic });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create epic', message: error.message });
  }
});

epicsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const epic = await req.taigaClient!.updateEpic(req.params.id, req.body);
    res.json({ success: true, data: epic });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update epic', message: error.message });
  }
});

epicsRouter.post('/:epic_id/link/:story_id', async (req: Request, res: Response) => {
  try {
    const { epic_id, story_id } = req.params;
    const story = await req.taigaClient!.linkStoryToEpic(story_id, epic_id);
    res.json({ success: true, data: story });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to link story to epic', message: error.message });
  }
});

epicsRouter.post('/unlink/:story_id', async (req: Request, res: Response) => {
  try {
    const story = await req.taigaClient!.unlinkStoryFromEpic(req.params.story_id);
    res.json({ success: true, data: story });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to unlink story from epic', message: error.message });
  }
});
