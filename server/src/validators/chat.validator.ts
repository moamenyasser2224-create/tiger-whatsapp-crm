import { z } from 'zod';

export const createChatMessageSchema = z.object({
  text: z
    .string({ required_error: 'نص الرسالة مطلوب' })
    .trim()
    .min(1, 'لا يمكن إرسال رسالة فارغة')
    .max(1000, 'الحد الأقصى للرسالة هو 1000 حرف'),
});

export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>;
