import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../src/utils/tokens.js';

const app = createApp();

describe('Chat API Endpoints & Protection', () => {
  let user: any;
  let token: string;

  beforeAll(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'chat_test@example.com' } });

    const password = await bcrypt.hash('Password@123', 10);
    user = await prisma.user.create({
      data: {
        email: 'chat_test@example.com',
        password,
        name: 'عضو الفريق التجريبي',
      },
    });

    token = generateAccessToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({ where: { senderId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it('should reject empty message', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('لا يمكن إرسال رسالة فارغة');
  });

  it('should reject message longer than 1000 characters', async () => {
    const longText = 'أ'.repeat(1001);
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: longText });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('الحد الأقصى للرسالة هو 1000 حرف');
  });

  it('should sanitize XSS script tags from message text', async () => {
    const maliciousText = '<script>alert("xss")</script>مرحباً بالفريق';
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: maliciousText });

    expect(res.status).toBe(201);
    expect(res.body.data.text).not.toContain('<script>');
    expect(res.body.data.text).toContain('مرحباً بالفريق');
  });

  it('should retrieve list of chat messages', async () => {
    const res = await request(app)
      .get('/api/chat/messages')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].sender.name).toBe(user.name);
  });

  it('should enforce strict rate limiting after 10 messages within 1 minute', async () => {
    // Create dedicated user for rate limit test
    const rlPassword = await bcrypt.hash('Password@123', 10);
    const rlUser = await prisma.user.create({
      data: {
        email: 'chat_rl_test@example.com',
        password: rlPassword,
        name: 'مستخدم فحص التكرار',
      },
    });
    const rlToken = generateAccessToken({ userId: rlUser.id, email: rlUser.email });

    // Send 10 messages successfully
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${rlToken}`)
        .send({ text: `رسالة اختبار رقم ${i + 1}` });

      expect(res.status).toBe(201);
    }

    // 11th message within the same minute must be blocked (429)
    const blockedRes = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${rlToken}`)
      .send({ text: 'رسالة زائدة عن الحد' });

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toContain('تم تجاوز الحد المسموح لإرسال الرسائل');

    // Cleanup
    await prisma.chatMessage.deleteMany({ where: { senderId: rlUser.id } });
    await prisma.user.deleteMany({ where: { id: rlUser.id } });
  });
});
