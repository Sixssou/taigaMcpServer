import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const userStoriesRouter = Router();
userStoriesRouter.use(authMiddleware);

userStoriesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id query parameter required' });
    }
    const stories = await req.taigaClient!.listUserStories(project_id as string);
    res.json({ success: true, data: stories, count: stories.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list user stories', message: error.message });
  }
});

userStoriesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const story = await req.taigaClient!.getUserStory(req.params.id);
    res.json({ success: true, data: story });
  } catch (error: any) {
    res.status(404).json({ error: 'User story not found', message: error.message });
  }
});

userStoriesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const story = await req.taigaClient!.createUserStory(req.body);
    res.status(201).json({ success: true, data: story });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user story', message: error.message });
  }
});

userStoriesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const story = await req.taigaClient!.updateUserStory(req.params.id, req.body);
    res.json({ success: true, data: story });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user story', message: error.message });
  }
});

userStoriesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await req.taigaClient!.deleteUserStory(req.params.id);
    res.json({ success: true, message: 'User story deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user story', message: error.message });
  }
});
