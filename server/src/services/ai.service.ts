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
   * Resilient executor for Gemini API with retry and model fallback (handles 503 transient spikes)
   */
  private async executeGeminiCall(
    ai: GoogleGenAI,
    options: { contents: any[]; systemInstruction: string; temperature?: number }
  ): Promise<string> {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: options.contents,
            config: {
              systemInstruction: { parts: [{ text: options.systemInstruction }] },
              temperature: options.temperature ?? 0.7,
            },
          });
          if (res.text) return res.text.trim();
        } catch (err: any) {
          lastError = err;
          if (err.message?.includes('503') || err.message?.includes('429')) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          break; // Try next candidate model
        }
      }
    }
    throw lastError;
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
   * Fetches the Auto-Reply configuration
   */
  async getAutoReplyConfig(): Promise<{
    enabled: boolean;
    businessContext: string;
    delaySeconds: number;
    configured: boolean;
  }> {
    const settings = await prisma.settings.findFirst();
    const key = await this.getApiKey();
    return {
      enabled: settings?.aiAutoReplyEnabled ?? true,
      businessContext:
        settings?.aiBusinessContext ||
        'شركة Tiger: متخصصة في حلول الأتمتة المتقدمة، وأنظمة إدارة علاقات العملاء (CRM)، وحلول دعم الشركات. مواعيد العمل الرسمية: من الأحد إلى الخميس من 9:00 صباحاً حتى 5:00 مساءً بتوقيت القاهرة.',
      delaySeconds: settings?.aiAutoReplyDelaySeconds ?? 2,
      configured: !!key,
    };
  }

  /**
   * Updates Auto-Reply configuration (Admin only)
   */
  async updateAutoReplyConfig(
    adminId: string,
    params: { enabled?: boolean; businessContext?: string; delaySeconds?: number }
  ): Promise<{ success: boolean; message: string }> {
    const settings = await prisma.settings.findFirst();
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: {
          ...(typeof params.enabled === 'boolean' ? { aiAutoReplyEnabled: params.enabled } : {}),
          ...(typeof params.businessContext === 'string' ? { aiBusinessContext: params.businessContext.trim() } : {}),
          ...(typeof params.delaySeconds === 'number' ? { aiAutoReplyDelaySeconds: params.delaySeconds } : {}),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'AI_AUTO_REPLY_CONFIG_UPDATED',
        entity: 'SETTINGS',
        details: JSON.stringify(params),
      },
    });

    return {
      success: true,
      message: 'تم تحديث إعدادات الرد الآلي بالذكاء الاصطناعي بنجاح.',
    };
  }

  /**
   * Generates automated customer response to incoming WhatsApp messages using Gemini 3.8 Flash
   */
  async generateCustomerAutoReply(params: {
    customerName: string;
    customerNotes?: string;
    inboundMessage: string;
    businessContext?: string;
  }): Promise<{ replyText: string; model: string; simulated?: boolean }> {
    const ai = await this.getClient();
    const defaultBusinessContext =
      params.businessContext ||
      'شركة Tiger: متخصصة في حلول الأتمتة المتقدمة، وأنظمة إدارة علاقات العملاء (CRM)، وخدمات دعم الأعمال. مواعيد العمل الرسمية: من الأحد إلى الخميس من 9:00 صباحاً حتى 5:00 مساءً بتوقيت القاهرة.';

    const systemInstruction = `You are "Tiger AI Auto-Responder" (نظام الرد الآلي الذكي لشركة Tiger).
Your job is to respond immediately to incoming WhatsApp messages from customers with extreme courtesy, professionalism, clarity, and sales effectiveness.

Business Knowledge Base:
${defaultBusinessContext}

Rules for Customer Auto-Replies:
1. Greet the customer warmly by name: ${params.customerName}.
2. Language: Reply in the same language as the customer (Arabic if Arabic, English if English).
3. Brevity & WhatsApp style: Keep messages readable on mobile screens (1-3 short paragraphs or clean bullet points). Avoid excessive filler words.
4. Accuracy: Only share facts stated in the business knowledge base. If asked for a custom quote or complex technical request, give a helpful general answer and assure them that an assigned account representative is reviewing their request to provide exact pricing.
5. Action-oriented: End with a polite question or clear call to action (e.g., asking about their specific requirements, or proposing a convenient time for a call).
6. Security & Privacy: Do not share internal employee personal phone numbers, system keys, or internal payroll details.`;

    if (ai) {
      try {
        const reply = await this.executeGeminiCall(ai, {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Customer Name: ${params.customerName}\nCustomer History/Notes: ${params.customerNotes || 'New Inquiry'}\n\nIncoming WhatsApp Message:\n"${params.inboundMessage}"\n\nGenerate the optimal automated WhatsApp reply to this customer now:`,
                },
              ],
            },
          ],
          systemInstruction,
          temperature: 0.6,
        });

        return {
          replyText: reply || `أهلاً بك أستاذ ${params.customerName}، شكراً لتواصلك مع شركة Tiger. تم استلام رسالتك وسيتواصل معك أحد مسؤولي خدمة العملاء في أقرب وقت.`,
          model: 'gemini-3.8-flash',
        };
      } catch (err: any) {
        console.error('❌ [Gemini Customer Auto-Reply Error]:', err.message);
      }
    }

    // Contextual simulated response if GEMINI_API_KEY is not configured
    const msg = params.inboundMessage.toLowerCase();
    let simulatedReply = '';

    if (msg.includes('سعر') || msg.includes('اسعار') || msg.includes('بكام') || msg.includes('cost') || msg.includes('price')) {
      simulatedReply = `أهلاً بك أستاذ ${params.customerName}! يسعدنا اهتمامك بخدمات Tiger.
خطط الأسعار لدينا مرنة ومصممة لتناسب حجم نشاطك واحتياجاتك بدقة.
هل تفضل أن نرسل لك تفاصيل الباقات الأساسية هنا على الواتساب، أم نحدد مكالمة سريعة لمدة 5 دقائق لمناقشة متطلباتك بالتفصيل؟`;
    } else if (msg.includes('مواعيد') || msg.includes('عنوان') || msg.includes('شغالين') || msg.includes('hours') || msg.includes('location')) {
      simulatedReply = `أهلاً بك أستاذ ${params.customerName}! 
مواعيد العمل الرسمية لدينا من الأحد إلى الخميس من الساعة 9:00 صباحاً حتى 5:00 مساءً.
فريقنا دائماً في خدمتك، كيف يمكننا مساعدتك اليوم بخصوص خدماتنا؟`;
    } else if (msg.includes('سلام') || msg.includes('مرحبا') || msg.includes('ازيك') || msg.includes('صباح') || msg.includes('مساء') || msg.includes('hello') || msg.includes('hi')) {
      simulatedReply = `وعليكم السلام ورحمة الله وبركاته، أهلاً بحضرتك يا أستاذ ${params.customerName}! 
أتمنى لك يوماً سعيداً وموفقاً. أنا المساعد الآلي لشركة Tiger، كيف أستطيع خدمتك اليوم؟`;
    } else {
      simulatedReply = `أهلاً بك أستاذ ${params.customerName}! شكراً لتواصلك مع شركة Tiger.
تم استلام رسالتك بخصوص: "${params.inboundMessage}"، وجارٍ متابعتها فوراً.
هل هناك أي استفسار آخر تحب أن نجهزه لك أثناء مراجعة طلبك؟`;
    }

    return {
      replyText: simulatedReply,
      model: 'gemini-3.8-flash (auto-responder)',
      simulated: true,
    };
  }

  /**
   * Generates 3 quick smart reply suggestions for an employee managing a customer
   */
  async suggestReplies(params: {
    customerName: string;
    lastMessage: string;
  }): Promise<{ suggestions: string[]; model: string }> {
    const ai = await this.getClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Customer Name: ${params.customerName}\nLast message: "${params.lastMessage}"\nGenerate exactly 3 distinct, professional, concise WhatsApp quick reply options for our sales agent in Arabic. Return strictly JSON array of 3 strings: ["reply 1", "reply 2", "reply 3"]`,
                },
              ],
            },
          ],
          config: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(response.text || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { suggestions: parsed, model: 'gemini-3.8-flash' };
        }
      } catch (e) {
        // Fallback to static suggestions
      }
    }

    return {
      suggestions: [
        `أهلاً بك أستاذ ${params.customerName}، يسعدنا تواصلك ويسرنا تزويدك بكافة التفاصيل الآن.`,
        `تحياتي أستاذ ${params.customerName}، بخصوص استفسارك تم تجهيز العرض المناسب لحضرتك، هل يناسبك الاتصال الآن؟`,
        `أهلاً بحضرتك يا فندم، هل تحب نحدد موعد لاجتماع تجريبي لشرح النظام عملياً؟`,
      ],
      model: 'gemini-3.8-flash (copilot)',
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

        const replyText = await this.executeGeminiCall(ai, {
          contents,
          systemInstruction: systemPrompt,
          temperature: 0.7,
        });

        return {
          role: 'assistant',
          content: replyText || 'عذراً، لم أستطع توليد إجابة في الوقت الحالي. يرجى المحاولة مرة أخرى.',
          model: 'gemini-3.8-flash',
        };
      } catch (err: any) {
        console.error('❌ [Gemini AI Service Error]:', err.message);
        throw new CustomError(`Gemini API Error: ${err.message}`, 502);
      }
    }

    // Intelligent fallback responder when GEMINI_API_KEY is not yet configured
    const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase().trim();
    let replyContent = '';

    if (lastMsg.includes('whatsapp') || lastMsg.includes('واتساب') || lastMsg.includes('رسالة') || lastMsg.includes('follow') || lastMsg.includes('متابعة')) {
      replyContent = `مرحباً بك ${userContext?.name || ''}! إليك نموذج رسالة متابعة واتساب احترافية ومؤثرة لعميلك:

---
**نص الرسالة المقترحة (عربي):**
> "أهلاً بك أستاذ [اسم العميل]، أتمنى لحضرتك يوماً طيباً وموفقاً.
> بخصوص العرض والحلول التي ناقشناها معاً، كنت أود الاطمئنان إن كان هناك أي استفسار أو تفاصيل إضافية تحب أن نوضحها لحضرتك قبل اتخاذ القرار؟
> 
> نحن على أتم الاستعداد لترتيب مكالمة سريعة لمدة 5 دقائق لتنسيق الخطوات القادمة في الوقت المناسب لك. تحياتي لك، [اسمك] من شركة Tiger."

**English Version (Optional):**
> "Dear [Client Name], hope you're having a productive week. Following up on our recent proposal, I wanted to see if you have any questions or require additional details to help finalize your decision. Happy to hop on a brief 5-minute call whenever convenient."

💡 **نصيحة بيعية:** أرسل الرسالة في فترات النشاط (من 10 صباحاً إلى 2 ظهراً) وتجنب عطلات نهاية الأسبوع لضمان أعلى معدل رد.

*(ملاحظة: هذا الرد عبر المحاكي المدمج. لتوليد رسائل مخصصة تماماً بكل السيناريوهات، يمكنك إضافة مفتاح Gemini API في صفحة الإعدادات).*`;
    } else if (lastMsg.includes('سعر') || lastMsg.includes('غالي') || lastMsg.includes('منافس') || lastMsg.includes('price') || lastMsg.includes('objection')) {
      replyContent = `مرحباً بك ${userContext?.name || ''}! إليك أفضل 3 أساليب بيعية للتعامل مع اعتراض **"السعر غالي أو المنافس أرخص"**:

1. **التركيز على القيمة مقابل التكلفة (Value vs Cost):**
   - *الرد:* "أتفهم نقطة حضرتك تماماً من ناحية الميزانية. ولكن الفارق في السعر عندنا يرجع لـ [الضمان / سرعة التنفيذ / الجودة / الدعم المباشر]، وهو ما يوفر عليك تكاليف صيانة ومشاكل لاحقة قد تكلفك أضعاف هذا الفارق."

2. **عزل الاعتراض والتأكد من ملاءمة الحل (Isolate Objection):**
   - *الرد:* "بخلاف السعر، هل تجد أن مواصفات الخدمة والحل الذي نقدمه يغطي كل احتياجات شركتك بشكل كامل؟" (إذا كانت الإجابة نعم، يمكنك التفاوض على خطة سداد أو شروط دفع ميسرة).

3. **حساب العائد على الاستثمار (ROI Framing):**
   - وضح للعميل بالأرقام كيف أن هذا الاستثمار سيقلل من هدر الوقت أو يزيد من إنتاجية فريقه.

*(ملاحظة: لتوليد ردود مخصصة لعميل محدد أو مجال عمل بعينه، يمكنك تفعيل نموذج Gemini 3.8 Flash عبر صفحة الإعدادات).*`;
    } else if (lastMsg.includes('حضور') || lastMsg.includes('خصم') || lastMsg.includes('تأخير') || lastMsg.includes('attendance') || lastMsg.includes('policy') || lastMsg.includes('بصمة')) {
      replyContent = `أهلاً بك ${userContext?.name || ''}! إليك ملخص قواعد الحضور والانصراف وحساب الخصومات في المنصة:

- **فترة السماح الصباحية:** 15 دقيقة بعد موعد بدء الوردية المعتمدة دون احتساب أي خصم.
- **شرائح التأخير:** التأخير من 16 إلى 30 دقيقة يتم تطبيق خصم ربع يوم، وما زاد عن ذلك يحتسب بنصف يوم أو يوم كامل بحسب لائحة العمل.
- **الغياب غير المبرر:** يتم تطبيق خصم يوم العمل مضافاً إليه الجزاء الإداري التلقائي.
- **التظلمات والاعتراضات:** يحق لأي موظف تقديم طلب تصحيح بصمة أو التظلم على أي خصم خلال **3 أيام عمل** من تاريخه عبر صفحة **Payroll & Deductions**.

إذا كان لديك أي تصحيح لبصمة منسية، يمكنك تقديم طلب تصحيح بصمة من تبويب الحضور وسيقوم المدير بمراجعته.`;
    } else {
      replyContent = `مرحباً بك ${userContext?.name || ''}! 👋
أنا **مساعد تايجر الذكي (Tiger AI)**.

أنا هنا لمساعدتك في أي وقت داخل المنصة في المهام التالية:
1. ✍️ **صياغة رسائل واتساب للعملاء:** اكتب لي مثلاً *"اكتبلي رسالة متابعة لعميل متردد"* وسأقوم بصياغتها فوراً.
2. 💡 **الرد على اعتراضات البيع:** اكتب لي *"العميل بيقول السعر غالي"* وسأعطيك أفضل الاستراتيجيات.
3. 📋 **شرح سياسات العمل:** اسألني عن الحضور، والخصومات، ومواعيد الرواديات.
4. 🤖 **الذكاء الاصطناعي الحي (Gemini 3.8 Flash):** للدردشة المفتوحة الحية مع أقوى نماذج الذكاء الاصطناعي، اطلب من المدير إضافة \`GEMINI_API_KEY\` في صفحة **الإعدادات (Settings)**.

كيف تحب أن أساعدك الآن؟`;
    }

    return {
      role: 'assistant',
      content: replyContent,
      model: 'gemini-3.8-flash (copilot)',
      simulated: true,
    };
  }
}

export const aiService = new AIService();
