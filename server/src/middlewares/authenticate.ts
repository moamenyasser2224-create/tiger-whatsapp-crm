import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens.js';
import { prisma, setRlsUserContext } from '../config/prisma.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  photoUrl?: string | null;
  mustChangePassword?: boolean;
  biometricConsent?: boolean;
  hasFaceEnrolled?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'جلسة العمل غير صالحة أو غير موجودة. يرجى تسجيل الدخول.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photoUrl: true,
        mustChangePassword: true,
        biometricConsent: true,
        faceEmbedding: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'المستخدم غير موجود أو تم تعطيل الحساب.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      photoUrl: user.photoUrl,
      mustChangePassword: user.mustChangePassword,
      biometricConsent: user.biometricConsent,
      hasFaceEnrolled: !!user.faceEmbedding,
    };

    // Set Postgres Row-Level Security user context
    await setRlsUserContext(user.id);

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'انتهت صلاحية الجلسة أو الرمز غير صالح.',
    });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'غير مصرح لك بتنفيذ هذا الإجراء، يتطلب صلاحيات المدير (Admin).',
    });
    return;
  }
  next();
}
