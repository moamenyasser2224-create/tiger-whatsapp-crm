import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/tokens.js';
import bcrypt from 'bcrypt';

const app = createApp();

describe('IDOR & Multi-tenant Data Isolation Tests', () => {
  let userAId: string;
  let tokenA: string;
  let customerAId: string;

  let userBId: string;
  let tokenB: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create User A
    const userA = await prisma.user.create({
      data: {
        name: 'مستخدم أ (User A)',
        email: `user_a_${Date.now()}@example.com`,
        password: hashedPassword,
      },
    });
    userAId = userA.id;
    tokenA = generateAccessToken({ userId: userA.id, email: userA.email });

    // Create User B
    const userB = await prisma.user.create({
      data: {
        name: 'مستخدم ب (User B)',
        email: `user_b_${Date.now()}@example.com`,
        password: hashedPassword,
      },
    });
    userBId = userB.id;
    tokenB = generateAccessToken({ userId: userB.id, email: userB.email });

    // User A creates a customer
    const custRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'عميل حصري للمستخدم أ',
        phone: '966599999991',
        consent: true,
      });

    customerAId = custRes.body.data.id;
  });

  afterAll(async () => {
    for (const uid of [userAId, userBId]) {
      if (uid) {
        await prisma.customer.deleteMany({ where: { userId: uid } });
        await prisma.messageTemplate.deleteMany({ where: { userId: uid } });
        await prisma.refreshToken.deleteMany({ where: { userId: uid } });
        await prisma.auditLog.deleteMany({ where: { userId: uid } });
        await prisma.user.delete({ where: { id: uid } });
      }
    }
    await prisma.$disconnect();
  });

  it('IDOR Prevention: User B should NOT be able to view User A customer by ID', async () => {
    const res = await request(app)
      .get(`/api/customers/${customerAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('IDOR Prevention: User B should NOT be able to update User A customer', async () => {
    const res = await request(app)
      .put(`/api/customers/${customerAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'محاولة اختراق البيانات',
      });

    expect(res.status).toBe(404);
  });

  it('IDOR Prevention: User B should NOT be able to delete User A customer', async () => {
    const res = await request(app)
      .delete(`/api/customers/${customerAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);

    // Verify User A customer is still intact
    const checkRes = await request(app)
      .get(`/api/customers/${customerAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.name).toBe('عميل حصري للمستخدم أ');
  });

  it('IDOR Prevention: User B customer list should NOT contain User A customers', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    const found = res.body.data.items.some((c: any) => c.id === customerAId);
    expect(found).toBe(false);
  });
});
