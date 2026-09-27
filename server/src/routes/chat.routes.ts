import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { chatRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
const chatController = new ChatController();

router.use(authenticate);

router.get('/messages', (req, res, next) => chatController.getMessages(req, res, next));
router.post('/messages', chatRateLimiter, (req, res, next) => chatController.sendMessage(req, res, next));

export default router;
