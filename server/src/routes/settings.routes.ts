import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { authenticate, requireAdmin } from '../middlewares/authenticate.js';

const router = Router();
const settingsController = new SettingsController();

router.use(authenticate);

// Public to all authenticated users
router.get('/', (req, res, next) => settingsController.get(req, res, next));

// Admin-only mutation
router.put('/', requireAdmin, (req, res, next) => settingsController.update(req, res, next));

export default router;
