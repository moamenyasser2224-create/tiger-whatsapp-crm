import { Router } from 'express';
import { OptionController } from '../controllers/option.controller.js';
import { authenticate, requireAdmin } from '../middlewares/authenticate.js';

const router = Router();
const optionController = new OptionController();

router.use(authenticate);

// Public to all authenticated users
router.get('/', (req, res, next) => optionController.getAll(req, res, next));

// Admin-only mutations
router.post('/', requireAdmin, (req, res, next) => optionController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => optionController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => optionController.delete(req, res, next));

export default router;
