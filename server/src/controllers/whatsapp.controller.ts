import type { Request, Response, NextFunction } from 'express';
import { whatsappService } from '../services/whatsapp.service.js';
import { env } from '../config/env.js';

export class WhatsAppController {
  /**
   * Meta Webhook Handshake Verification (GET)
   */
  verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const result = whatsappService.verifyWebhook(mode, token, challenge);
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(403).send('Forbidden: Token mismatch');
    }
  }

  /**
   * Meta Webhook Inbound Message / Status Event (POST)
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    // Meta requires immediate 200 OK acknowledgment to prevent repeated delivery
    res.status(200).send('EVENT_RECEIVED');

    // Process payload asynchronously
    await whatsappService.processWebhookEvent(req.body);
  }

  /**
   * Dispatches WhatsApp message via configured channel (Meta Cloud API or wa.me fallback)
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, phone, messageText, customerName } = req.body;

      if (!phone || !messageText) {
        res.status(400).json({
          success: false,
          error: 'Phone number and message text are required',
        });
        return;
      }

      const result = await whatsappService.sendMessage({
        userId: req.user!.id,
        customerId,
        rawPhone: phone,
        messageText,
        customerName,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns current WhatsApp integration status and configured mode
   */
  getStatus(_req: Request, res: Response): void {
    const isCloudConfigured = whatsappService.isCloudApiConfigured();
    res.status(200).json({
      success: true,
      mode: isCloudConfigured ? 'cloud_api' : 'direct_wa_me',
      isCloudConfigured,
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID ? '***configured***' : null,
      wabaId: env.WHATSAPP_WABA_ID || null,
      webhookVerifyToken: env.WHATSAPP_VERIFY_TOKEN,
      webhookEndpoint: `${env.FRONTEND_URL.replace(/:\d+$/, ':5000')}/api/whatsapp/webhook`,
    });
  }
}
