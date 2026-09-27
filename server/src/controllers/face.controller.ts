import type { Request, Response, NextFunction } from 'express';
import { FaceService } from '../services/face.service.js';

const faceService = new FaceService();

export class FaceController {
  async getChallenge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const challenge = faceService.getLivenessChallenge();
      res.status(200).json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      next(error);
    }
  }

  async enroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await faceService.enrollFace(req.user!.id, {
        embedding: req.body.embedding,
        biometricConsent: req.body.biometricConsent,
        ipAddress: req.clientIp || req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await faceService.verifyFace({
        userId: req.body.userId || req.user?.id,
        email: req.body.email,
        embedding: req.body.embedding,
        challengeId: req.body.challengeId,
        isKioskAttendance: req.body.isKioskAttendance,
        ipAddress: req.clientIp || req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await faceService.deleteFaceData(
        req.user!.id,
        req.clientIp || req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
