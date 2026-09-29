import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { authenticate, requireAdmin } from '../middlewares/authenticate.js';

const router = Router();
const aiController = new AIController();

// Require authentication for all AI routes
router.use(authenticate);

// Public to all authenticated employees
router.get('/status', (req, res, next) => aiController.getStatus(req, res, next));
router.post('/chat', (req, res, next) => aiController.chat(req, res, next));
router.get('/auto-reply', (req, res, next) => aiController.getAutoReply(req, res, next));
router.post('/suggest-reply', (req, res, next) => aiController.suggestReplies(req, res, next));

// Admin-only key and configuration management
router.put('/key', requireAdmin, (req, res, next) => aiController.updateKey(req, res, next));
router.put('/auto-reply', requireAdmin, (req, res, next) => aiController.updateAutoReply(req, res, next));

export default router;
