import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  updateTemplateSchema,
  templateStatusParamSchema,
} from '../validators/template.validator.js';

const router = Router();
const templateController = new TemplateController();

router.use(authenticate);

router.get('/', (req, res, next) =>
  templateController.getAll(req, res, next)
);

router.get('/format', (req, res, next) =>
  templateController.formatMessage(req, res, next)
);

router.get(
  '/:status',
  validateRequest(templateStatusParamSchema, 'params'),
  (req, res, next) => templateController.getByStatus(req, res, next)
);

router.put(
  '/:status',
  validateRequest(templateStatusParamSchema, 'params'),
  validateRequest(updateTemplateSchema),
  (req, res, next) => templateController.update(req, res, next)
);

router.post(
  '/:status/reset',
  validateRequest(templateStatusParamSchema, 'params'),
  (req, res, next) => templateController.resetDefault(req, res, next)
);

export default router;
