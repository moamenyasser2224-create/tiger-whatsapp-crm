import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  importCsvSchema,
} from '../validators/customer.validator.js';

const router = Router();
const customerController = new CustomerController();

// All customer routes require authentication
router.use(authenticate);

router.post(
  '/',
  validateRequest(createCustomerSchema),
  (req, res, next) => customerController.create(req, res, next)
);

router.get(
  '/',
  validateRequest(customerQuerySchema, 'query'),
  (req, res, next) => customerController.getAll(req, res, next)
);

router.get('/due-today', (req, res, next) =>
  customerController.getDueToday(req, res, next)
);

router.get('/stats', (req, res, next) =>
  customerController.getStats(req, res, next)
);

router.get('/export', (req, res, next) =>
  customerController.exportCsv(req, res, next)
);

router.post(
  '/import',
  validateRequest(importCsvSchema),
  (req, res, next) => customerController.importCsv(req, res, next)
);

router.get('/:id', (req, res, next) =>
  customerController.getById(req, res, next)
);

router.put(
  '/:id',
  validateRequest(updateCustomerSchema),
  (req, res, next) => customerController.update(req, res, next)
);

router.delete('/:id', (req, res, next) =>
  customerController.delete(req, res, next)
);

export default router;
