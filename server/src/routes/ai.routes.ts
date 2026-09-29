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

// Admin-only key management
router.put('/key', requireAdmin, (req, res, next) => aiController.updateKey(req, res, next));

export default router;
