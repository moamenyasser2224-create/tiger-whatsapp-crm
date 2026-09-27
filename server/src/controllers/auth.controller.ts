import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_EXPIRY_DAYS } from '../config/constants.js';

const authService = new AuthService();

function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.SECURE_COOKIE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.SECURE_COOKIE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
  });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register({
        ...req.body,
        ipAddress: req.clientIp || req.ip,
        userAgent: req.headers['user-agent'],
      });

      setRefreshTokenCookie(res, result.refreshToken);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login({
        ...req.body,
        ipAddress: req.clientIp || req.ip,
        userAgent: req.headers['user-agent'],
      });

      if (result.requires2FA) {
        res.status(200).json({
          success: true,
          requires2FA: true,
          userId: result.userId,
          message: 'يرجى إدخال رمز التحقق الثنائي (TOTP)',
        });
        return;
      }

      if (result.refreshToken) {
        setRefreshTokenCookie(res, result.refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
      const result = await authService.refreshToken(rawRefreshToken);

      setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      clearRefreshTokenCookie(res);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
      await authService.logout(rawRefreshToken, req.user?.id);
      clearRefreshTokenCookie(res);

      res.status(200).json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async setup2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.generate2FASetup(req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, secret } = req.body;
      const result = await authService.enable2FA(req.user!.id, code, secret);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;
      const result = await authService.disable2FA(req.user!.id, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.changePassword(req.user!.id, {
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
        ipAddress: req.clientIp || req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
