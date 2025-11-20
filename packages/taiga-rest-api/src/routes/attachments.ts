import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const attachmentsRouter = Router();
attachmentsRouter.use(authMiddleware);

attachmentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { item_type, item_id } = req.query;
    if (!item_type || !item_id) {
      return res.status(400).json({ error: 'item_type and item_id query parameters required' });
    }
    const attachments = await req.taigaClient!.listAttachments(item_type as string, item_id as string);
    res.json({ success: true, data: attachments, count: attachments.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list attachments', message: error.message });
  }
});

attachmentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { item_type, item_id, file_data, file_name, mime_type, description } = req.body;
    if (!item_type || !item_id || !file_data || !file_name) {
      return res.status(400).json({ error: 'item_type, item_id, file_data, and file_name are required' });
    }
    const attachment = await req.taigaClient!.uploadAttachment(
      item_type, item_id, file_data, file_name, mime_type, description
    );
    res.status(201).json({ success: true, data: attachment });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to upload attachment', message: error.message });
  }
});

attachmentsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await req.taigaClient!.deleteAttachment(req.params.id);
    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete attachment', message: error.message });
  }
});
