import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const issuesRouter = Router();
issuesRouter.use(authMiddleware);

issuesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id query parameter required' });
    }
    const issues = await req.taigaClient!.listIssues(project_id as string);
    res.json({ success: true, data: issues, count: issues.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list issues', message: error.message });
  }
});

issuesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const issue = await req.taigaClient!.getIssue(req.params.id);
    res.json({ success: true, data: issue });
  } catch (error: any) {
    res.status(404).json({ error: 'Issue not found', message: error.message });
  }
});

issuesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const issue = await req.taigaClient!.createIssue(req.body);
    res.status(201).json({ success: true, data: issue });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create issue', message: error.message });
  }
});

issuesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const issue = await req.taigaClient!.updateIssue(req.params.id, req.body);
    res.json({ success: true, data: issue });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update issue', message: error.message });
  }
});
