import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { chatRateLimiter } from '../middlewares/rateLimiter.js';
import { chatService } from '../services/chat.service.js';

const router = Router();
router.use(authenticate);

// List available channels
router.get('/channels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channels = await chatService.getChannels(req.user!.id);
    res.json({ success: true, data: channels });
  } catch (err) {
    next(err);
  }
});

// Create new channel
router.post('/channels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, departmentId } = req.body;
    const channel = await chatService.createChannel(name, type, departmentId, req.user!.id);
    res.status(201).json({ success: true, data: channel });
  } catch (err) {
    next(err);
  }
});

// Get messages (optional channelId)
router.get('/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channelId = req.query.channelId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const cursor = req.query.cursor as string | undefined;

    const data = await chatService.getMessages(channelId, limit, cursor);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Send message
router.post('/messages', chatRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, channelId, parentId, attachmentUrl, attachmentType, attachmentSize } = req.body;

    const message = await chatService.sendMessage({
      senderId: req.user!.id,
      text,
      channelId,
      parentId,
      attachmentUrl,
      attachmentType,
      attachmentSize,
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
});

export default router;
