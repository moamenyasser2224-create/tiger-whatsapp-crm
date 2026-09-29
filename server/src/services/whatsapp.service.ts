import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { hashPhone } from '../utils/crypto.js';
import { getIO } from '../socket.js';
import { aiService } from './ai.service.js';

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

            // Record inbound activity in timeline
            await prisma.customerActivity.create({
              data: {
                customerId: customer.id,
                userId: customer.userId,
                type: 'inbound_message',
                content: messageText,
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

            // 🤖 Check and Execute AI Auto-Responder
            const settings = await prisma.settings.findFirst();
            const isAutoReplyActive =
              (settings?.aiAutoReplyEnabled ?? true) && (customer.aiAutoReplyEnabled ?? true);

            if (isAutoReplyActive) {
              console.log(`🤖 [WhatsApp AI Auto-Responder] Generating auto-reply for "${customer.name}"...`);
              const autoReply = await aiService.generateCustomerAutoReply({
                customerName: customer.name,
                customerNotes: customer.notes || '',
                inboundMessage: messageText,
                businessContext: settings?.aiBusinessContext || undefined,
              });

              if (autoReply && autoReply.replyText) {
                // Configurable simulated delay
                const delayMs = (settings?.aiAutoReplyDelaySeconds ?? 2) * 1000;
                if (delayMs > 0) {
                  await new Promise((r) => setTimeout(r, delayMs));
                }

                // Dispatch auto-reply via WhatsApp
                await this.sendMessage({
                  userId: customer.userId,
                  customerId: customer.id,
                  rawPhone: fromPhone,
                  messageText: autoReply.replyText,
                  customerName: customer.name,
                });

                // Record AI reply activity in timeline
                await prisma.customerActivity.create({
                  data: {
                    customerId: customer.id,
                    userId: customer.userId,
                    type: 'ai_reply',
                    content: autoReply.replyText,
                    metadata: JSON.stringify({ model: autoReply.model, simulated: autoReply.simulated }),
                  },
                });

                // Append to customer notes
                const replyTimestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                const aiNote = `\n[${replyTimestamp}] رد آلي (Tiger AI): ${autoReply.replyText}`;
                await prisma.customer.update({
                  where: { id: customer.id },
                  data: {
                    notes: `${updatedNotes}${aiNote}`,
                    last: new Date(),
                  },
                });

                // Emit live AI reply notification
                try {
                  const io = getIO();
                  io.to(`user_${customer.userId}`).emit('whatsapp:ai_replied', {
                    customerId: customer.id,
                    customerName: customer.name,
                    replyText: autoReply.replyText,
                    model: autoReply.model,
                    timestamp: new Date().toISOString(),
                  });
                } catch (ioErr) {}
              }
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

  /**
   * Simulates an incoming customer message for testing auto-reply end-to-end
   */
  async simulateInboundMessage(params: {
    userId: string;
    customerId?: string;
    messageText: string;
  }): Promise<{
    success: boolean;
    customer: any;
    inboundMessage: string;
    autoReply: { replyText: string; model: string; simulated?: boolean } | null;
  }> {
    let customer = params.customerId
      ? await prisma.customer.findFirst({ where: { id: params.customerId, deletedAt: null } })
      : null;

    if (!customer) {
      customer = await prisma.customer.findFirst({
        where: { userId: params.userId, deletedAt: null },
      });
    }

    if (!customer) {
      // Fallback: any active customer
      customer = await prisma.customer.findFirst({
        where: { deletedAt: null },
      });
    }

    if (!customer) {
      throw new Error('No customer record available for testing. Please create a customer first.');
    }

    const settings = await prisma.settings.findFirst();
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const inboundNote = `\n[${timestamp}] وارد (محاكاة): ${params.messageText}`;
    const updatedNotes = `${customer.notes || ''}${inboundNote}`;

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        notes: updatedNotes,
        last: new Date(),
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: customer.id,
        userId: customer.userId,
        type: 'inbound_message',
        content: params.messageText,
      },
    });

    let autoReplyResult: any = null;
    const isAutoReplyActive =
      (settings?.aiAutoReplyEnabled ?? true) && (customer.aiAutoReplyEnabled ?? true);

    if (isAutoReplyActive) {
      autoReplyResult = await aiService.generateCustomerAutoReply({
        customerName: customer.name,
        customerNotes: customer.notes || '',
        inboundMessage: params.messageText,
        businessContext: settings?.aiBusinessContext || undefined,
      });

      if (autoReplyResult && autoReplyResult.replyText) {
        await prisma.customerActivity.create({
          data: {
            customerId: customer.id,
            userId: customer.userId,
            type: 'ai_reply',
            content: autoReplyResult.replyText,
            metadata: JSON.stringify({ model: autoReplyResult.model, simulated: autoReplyResult.simulated }),
          },
        });

        const replyTimestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        const aiNote = `\n[${replyTimestamp}] رد آلي (Tiger AI): ${autoReplyResult.replyText}`;
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            notes: `${updatedNotes}${aiNote}`,
            last: new Date(),
          },
        });

        try {
          const io = getIO();
          io.to(`user_${customer.userId}`).emit('whatsapp:ai_replied', {
            customerId: customer.id,
            customerName: customer.name,
            replyText: autoReplyResult.replyText,
            model: autoReplyResult.model,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {}
      }
    }

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
      inboundMessage: params.messageText,
      autoReply: autoReplyResult,
    };
  }
}

export const whatsappService = new WhatsAppService();
