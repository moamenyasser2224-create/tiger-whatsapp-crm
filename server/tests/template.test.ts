import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/tokens.js';
import bcrypt from 'bcrypt';

const app = createApp();

describe('Message Templates Tests', () => {
  let userId: string;
  let token: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'مستخدم القوالب',
        email: `template_test_${Date.now()}@example.com`,
        password: hashedPassword,
      },
    });
    userId = user.id;
    token = generateAccessToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    await prisma.messageTemplate.deleteMany({ where: { userId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('GET /api/templates - should return 5 default templates', async () => {
    const res = await request(app)
      .get('/api/templates')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(5);
  });

  it('PUT /api/templates/:status - should update a template if {name} is present', async () => {
    const updatedBody = 'أهلاً بك يا {name} في خدمتنا المميزة!';
    const res = await request(app)
      .put(`/api/templates/${encodeURIComponent('جديد')}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: updatedBody });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.body).toBe(updatedBody);
  });

  it('PUT /api/templates/:status - should reject if {name} placeholder is missing', async () => {
    const res = await request(app)
      .put(`/api/templates/${encodeURIComponent('جديد')}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'مرحباً بك في شركتنا!' }); // Missing {name}

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/templates/format - should format message with customer name', async () => {
    const res = await request(app)
      .get(`/api/templates/format?status=${encodeURIComponent('جديد')}&name=${encodeURIComponent('خالد')}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.formattedMessage).toContain('خالد');
  });
});
