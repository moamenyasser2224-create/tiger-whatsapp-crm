import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { CustomError } from '../middlewares/errorHandler.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export class AIService {
  private client: GoogleGenAI | null = null;
  private cachedKey: string | null = null;

  /**
   * Resolves active Gemini API key from environment or database settings
   */
  async getApiKey(): Promise<string | null> {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()) {
      return env.GEMINI_API_KEY.trim();
    }

    try {
      const settings = await prisma.settings.findFirst();
      if (settings?.geminiApiKey && settings.geminiApiKey.trim()) {
        return settings.geminiApiKey.trim();
      }
    } catch (err) {
      // Fallback if DB query fails during startup
    }

    return null;
  }

  /**
   * Initializes or returns the Google Gen AI client
   */
  private async getClient(): Promise<GoogleGenAI | null> {
    const key = await this.getApiKey();
    if (!key) return null;

    if (!this.client || this.cachedKey !== key) {
      this.client = new GoogleGenAI({ apiKey: key });
      this.cachedKey = key;
    }

    return this.client;
  }

  /**
   * Checks whether Gemini is configured and active
   */
  async getStatus(): Promise<{ configured: boolean; model: string }> {
    const key = await this.getApiKey();
    return {
      configured: !!key,
      model: 'gemini-3.8-flash',
    };
  }

  /**
   * Updates Gemini API key in settings (Admin-only)
   */
  async updateApiKey(adminId: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    const trimmed = (apiKey || '').trim();
    const settings = await prisma.settings.findFirst();

    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { geminiApiKey: trimmed || null },
      });
    }

    this.client = null;
    this.cachedKey = null;

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'GEMINI_API_KEY_UPDATED',
        entity: 'SETTINGS',
        details: JSON.stringify({ configured: !!trimmed }),
      },
    });

    return {
      success: true,
      message: trimmed ? 'Gemini API key saved and activated successfully.' : 'Gemini API key cleared.',
    };
  }

  /**
   * Generates conversational AI response using official gemini-3.8-flash
   */
  async chat(
    userId: string,
    messages: ChatMessage[],
    userContext?: { name: string; role: string }
  ): Promise<{ role: 'assistant'; content: string; model: string; simulated?: boolean }> {
    if (!messages || messages.length === 0) {
      throw new CustomError('Conversation history cannot be empty.', 400);
    }

    const ai = await this.getClient();
    const systemPrompt = `You are "Tiger AI" (مساعد تايجر الذكي), an elite AI workspace assistant integrated into the Tiger Workspace & WhatsApp CRM platform.
Your user is ${userContext?.name || 'an employee'} (Role: ${userContext?.role || 'Staff'}).

Core Capabilities & Guidelines:
1. WhatsApp & Sales: You draft high-converting, professional WhatsApp follow-up messages, objection handling responses, and personalized customer pitches in Arabic and English.
2. Internal Operations: You help staff understand attendance records, shift schedules, company policies, dispute resolution, and daily priorities.
3. Tone & Language: Answer naturally in the language used by the employee (default to Arabic for Egyptian/Arab workplace contexts). Be concise, respectful, professional, and clear.
4. Privacy: Do not request or repeat raw passwords, full secret tokens, or sensitive personal data.`;

    if (ai) {
      try {
        // Map messages to Gemini contents format
        const contents = messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            temperature: 0.7,
          },
        });

        const replyText = response.text || 'عذراً، لم أستطع توليد إجابة في الوقت الحالي. يرجى المحاولة مرة أخرى.';

        return {
          role: 'assistant',
          content: replyText,
          model: 'gemini-3.8-flash',
        };
      } catch (err: any) {
        console.error('❌ [Gemini AI Service Error]:', err.message);
        throw new CustomError(`Gemini API Error: ${err.message}`, 502);
      }
    }

    // Friendly fallback when GEMINI_API_KEY is not yet configured in environment
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const fallbackReply = `مرحباً بك ${userContext?.name || ''}! 👋
أنا **مساعد تايجر الذكي (Tiger AI)** المبني على نموذج **Google Gemini 3.8 Flash**.

النظام جاهز تماماً للعمل. لتفعيل الذكاء الاصطناعي الحي وإجراء المحادثات المتطورة، يمكن للمدير إضافة مفتاح \`GEMINI_API_KEY\` الخاص بـ Google AI Studio داخل صفحة **الإعدادات (Settings)** أو في متغيرات البيئة (.env).

💡 **ما يمكنني مساعدتك به فور التفعيل:**
- صياغة رسائل واتساب احترافية مخصصة للعملاء.
- تلخيص اعتراضات العملاء واقتراح أفضل الردود البيعية.
- شرح وتوضيح سياسات الحضور والورديات والخصومات.
- كتابة نصوص ورسائل بريد إلكتروني داخلية.`;

    return {
      role: 'assistant',
      content: fallbackReply,
      model: 'gemini-3.8-flash (simulated)',
      simulated: true,
    };
  }
}

export const aiService = new AIService();
