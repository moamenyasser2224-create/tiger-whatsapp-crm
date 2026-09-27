import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate, requireAdmin } from '../middlewares/authenticate.js';

const router = Router();
const userController = new UserController();

router.use(authenticate);

// Profile photo upload
router.post('/profile-photo', (req, res, next) =>
  userController.updateProfilePhoto(req, res, next)
);

// Admin-only employee management
router.get('/employees', requireAdmin, (req, res, next) =>
  userController.listEmployees(req, res, next)
);

router.post('/employee', requireAdmin, (req, res, next) =>
  userController.createEmployee(req, res, next)
);

// GDPR Data Export & Account Deletion
router.get('/export-data', (req, res, next) =>
  userController.exportData(req, res, next)
);

router.delete('/delete-account', (req, res, next) =>
  userController.deleteAccount(req, res, next)
);

export default router;
