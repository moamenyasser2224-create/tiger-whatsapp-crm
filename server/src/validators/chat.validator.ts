import { z } from 'zod';

export const createChatMessageSchema = z.object({
  text: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must not exceed 1000 characters'),
});

export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>;
