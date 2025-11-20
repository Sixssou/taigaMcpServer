import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const commentsRouter = Router();
commentsRouter.use(authMiddleware);

commentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { item_type, item_id, comment } = req.body;
    if (!item_type || !item_id || !comment) {
      return res.status(400).json({ error: 'item_type, item_id, and comment are required' });
    }
    const result = await req.taigaClient!.addComment(item_type, item_id, comment);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add comment', message: error.message });
  }
});

commentsRouter.get('/history/:item_type/:item_id', async (req: Request, res: Response) => {
  try {
    const { item_type, item_id } = req.params;
    const history = await req.taigaClient!.getItemHistory(item_type, item_id);
    res.json({ success: true, data: history, count: history.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get history', message: error.message });
  }
});

commentsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({ error: 'comment is required' });
    }
    const result = await req.taigaClient!.editComment(req.params.id, comment);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to edit comment', message: error.message });
  }
});

commentsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await req.taigaClient!.deleteComment(req.params.id);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete comment', message: error.message });
  }
});
