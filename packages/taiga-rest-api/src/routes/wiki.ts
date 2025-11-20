import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const wikiRouter = Router();
wikiRouter.use(authMiddleware);

wikiRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id query parameter required' });
    }
    const pages = await req.taigaClient!.listWikiPages(project_id as string);
    res.json({ success: true, data: pages, count: pages.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list wiki pages', message: error.message });
  }
});

wikiRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const page = await req.taigaClient!.getWikiPage(req.params.id);
    res.json({ success: true, data: page });
  } catch (error: any) {
    res.status(404).json({ error: 'Wiki page not found', message: error.message });
  }
});

wikiRouter.post('/', async (req: Request, res: Response) => {
  try {
    const page = await req.taigaClient!.createWikiPage(req.body);
    res.status(201).json({ success: true, data: page });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create wiki page', message: error.message });
  }
});

wikiRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const page = await req.taigaClient!.updateWikiPage(req.params.id, req.body);
    res.json({ success: true, data: page });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update wiki page', message: error.message });
  }
});

wikiRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await req.taigaClient!.deleteWikiPage(req.params.id);
    res.json({ success: true, message: 'Wiki page deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete wiki page', message: error.message });
  }
});

wikiRouter.post('/:id/watch', async (req: Request, res: Response) => {
  try {
    const { watch = true } = req.body;
    const result = await req.taigaClient!.watchWikiPage(req.params.id, watch);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to watch/unwatch wiki page', message: error.message });
  }
});
