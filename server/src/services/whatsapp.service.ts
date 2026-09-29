import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { hashPhone } from '../utils/crypto.js';
import { getIO } from '../socket.js';

export interface WhatsAppSendResult {
  success: boolean;
  mode: 'cloud_api' | 'direct_wa_me';
  url?: string;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  /**
   * Checks whether Meta WhatsApp Cloud API credentials are configured
   */
  isCloudApiConfigured(): boolean {
    return !!(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
  }

  /**
   * Verifies incoming Meta Webhook handshake challenge
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ [WhatsApp Webhook] Handshake verified successfully with Meta.');
      return challenge;
    }
    console.warn('❌ [WhatsApp Webhook] Verification token mismatch.');
    return null;
  }

  /**
   * Dispatches WhatsApp message via Meta Cloud API or generates direct wa.me fallback
   */
  async sendMessage(params: {
    userId: string;
    customerId?: string;
    rawPhone: string;
    messageText: string;
    customerName?: string;
  }): Promise<WhatsAppSendResult> {
    const cleanPhone = params.rawPhone.replace(/\D/g, '');
    const formattedText = params.messageText.replace(/\{name\}/g, params.customerName || 'Valued Customer');

    // If Meta Cloud API is configured, send programmatically via Meta Graph API
    if (this.isCloudApiConfigured()) {
      try {
        const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: formattedText,
            },
          }),
        });

        const data: any = await response.json();

        if (!response.ok) {
          console.error('❌ [WhatsApp Cloud API Error]:', data);
          // Fall back to direct wa.me link
          const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedText)}`;
          return {
            success: false,
            mode: 'direct_wa_me',
            url: waMeUrl,
            error: data.error?.message || 'Failed to dispatch via Cloud API; opened in WhatsApp Web',
          };
        }

        const messageId = data.messages?.[0]?.id;

        // Update customer last interaction timestamp if customerId is provided
        if (params.customerId) {
          await prisma.customer.updateMany({
            where: { id: params.customerId },
            data: { last: new Date() },
          });
        }

        return {
          success: true,
          mode: 'cloud_api',
          messageId,
        };
      } catch (err: any) {
        console.error('❌ [WhatsApp Service] Exception:', err.message);
        const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedText)}`;
        return {
          success: true,
          mode: 'direct_wa_me',
          url: waMeUrl,
        };
      }
    }

    // Default mode: Generate deep-link wa.me URL
    const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedText)}`;

    if (params.customerId) {
      await prisma.customer.updateMany({
        where: { id: params.customerId },
        data: { last: new Date() },
      });
    }

    return {
      success: true,
      mode: 'direct_wa_me',
      url: waMeUrl,
    };
  }

  /**
   * Processes inbound Webhook payload from Meta (inbound messages and delivery status events)
   */
  async processWebhookEvent(payload: any): Promise<void> {
    try {
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0]?.value;

      if (!change) return;

      // 1. Process Inbound Messages (Customer replied)
      if (change.messages && change.messages.length > 0) {
        for (const message of change.messages) {
          const fromPhone = message.from; // e.g. "201012345678"
          const messageText = message.text?.body || '[Media/Attachment]';
          const messageId = message.id;

          const phoneHash = hashPhone(fromPhone);

          // Find customer by phoneHash
          const customer = await prisma.customer.findFirst({
            where: {
              phoneHash,
              deletedAt: null,
            },
          });

          if (customer) {
            const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const appendNote = `\n[${timestamp}] رد واتساب وارد: ${messageText}`;
            const currentNotes = customer.notes || '';
            const updatedNotes = currentNotes ? `${currentNotes}${appendNote}` : appendNote.trim();

            await prisma.customer.update({
              where: { id: customer.id },
              data: {
                notes: updatedNotes,
                last: new Date(),
              },
            });

            // Emit live real-time notification to user
            try {
              const io = getIO();
              io.to(`user_${customer.userId}`).emit('whatsapp:inbound_message', {
                customerId: customer.id,
                customerName: customer.name,
                fromPhone,
                messageText,
                timestamp: new Date().toISOString(),
              });
            } catch (ioErr) {
              // Socket might not be initialized in non-server tests
            }
          }

          console.log(`💬 [WhatsApp Inbound] Received message from ${fromPhone}: "${messageText}" (ID: ${messageId})`);
        }
      }

      // 2. Process Delivery Statuses (Sent, Delivered, Read, Failed)
      if (change.statuses && change.statuses.length > 0) {
        for (const status of change.statuses) {
          const recipientPhone = status.recipient_id;
          const statusType = status.status; // 'sent' | 'delivered' | 'read' | 'failed'
          console.log(`📬 [WhatsApp Status Update] Recipient ${recipientPhone}: ${statusType}`);

          try {
            const io = getIO();
            io.emit('whatsapp:status_update', {
              recipientPhone,
              status: statusType,
              timestamp: status.timestamp,
            });
          } catch (ioErr) {
            // Ignore socket error if offline
          }
        }
      }
    } catch (err: any) {
      console.error('❌ [WhatsApp Webhook Processor] Error processing event:', err.message);
    }
  }
}

export const whatsappService = new WhatsAppService();
