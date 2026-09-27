import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.get('/export-data', (req, res, next) =>
  userController.exportData(req, res, next)
);

router.delete('/delete-account', (req, res, next) =>
  userController.deleteAccount(req, res, next)
);

export default router;
