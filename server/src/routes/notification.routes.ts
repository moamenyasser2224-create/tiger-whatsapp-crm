import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { notificationService } from '../services/notification.service.js';

const router = Router();
router.use(authenticate);

// Get current user's notifications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user!.id);
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

// Mark single notification as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user!.id);
    res.json({ success: true, message: 'تم تحديث الإشعار كمقروء' });
  } catch (err) {
    next(err);
  }
});

// Mark all notifications as read
router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'تم تحديث كافة الإشعارات كمقروءة' });
  } catch (err) {
    next(err);
  }
});

export default router;
