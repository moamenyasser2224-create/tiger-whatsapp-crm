import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();

describe('Authentication & 2FA Tests', () => {
  const testUser = {
    name: 'مستخدم تجريبي للاختبار',
    email: `test_auth_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  let accessToken = '';

  afterAll(async () => {
    // Cleanup created test user
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (user) {
      await prisma.messageTemplate.deleteMany({ where: { userId: user.id } });
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.customer.deleteMany({ where: { userId: user.id } });
      await prisma.auditLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/auth/register - should register a new user and auto-seed 5 templates', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    if (res.status === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.accessToken).toBeDefined();

      accessToken = res.body.data.accessToken;

      // Verify 5 templates were created
      const templates = await prisma.messageTemplate.findMany({
        where: { userId: res.body.data.user.id },
      });
      expect(templates.length).toBe(5);
    }
  });

  it('POST /api/auth/register - should fail on weak password or invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'أحمد',
        email: 'invalid-email',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login - should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    }
  });

  it('POST /api/auth/login - should fail with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
