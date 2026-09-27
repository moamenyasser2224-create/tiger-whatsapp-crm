import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middlewares/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyTwoFactorSchema,
  disableTwoFactorSchema,
} from '../validators/auth.validator.js';

const router = Router();
const authController = new AuthController();

router.post('/register', authRateLimiter, validateRequest(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);

router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateRequest(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateRequest(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

router.get('/me', authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

router.post('/2fa/setup', authenticate, (req, res, next) =>
  authController.setup2FA(req, res, next)
);

router.post(
  '/2fa/enable',
  authenticate,
  validateRequest(verifyTwoFactorSchema),
  (req, res, next) => authController.enable2FA(req, res, next)
);

router.post(
  '/2fa/disable',
  authenticate,
  validateRequest(disableTwoFactorSchema),
  (req, res, next) => authController.disable2FA(req, res, next)
);

export default router;
