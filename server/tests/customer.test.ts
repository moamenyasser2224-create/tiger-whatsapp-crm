import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/utils/tokens.js';
import bcrypt from 'bcrypt';

const app = createApp();

describe('Customer Management Tests', () => {
  let userId: string;
  let token: string;
  const testPhone = '966501234567';

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'مستخدم تجريبي للعملاء',
        email: `customer_test_${Date.now()}@example.com`,
        password: hashedPassword,
      },
    });
    userId = user.id;
    token = generateAccessToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    await prisma.customer.deleteMany({ where: { userId } });
    await prisma.messageTemplate.deleteMany({ where: { userId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('POST /api/customers - should create a customer and encrypt phone', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'محمد عبدالله',
        phone: testPhone,
        company: 'شركة النور',
        city: 'الرياض',
        source: 'واتساب',
        status: 'جديد',
        consent: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('محمد عبدالله');
    expect(res.body.data.phone).toBe(testPhone); // Decrypted in response

    // Verify phone is stored encrypted in DB
    const dbCustomer = await prisma.customer.findUnique({
      where: { id: res.body.data.id },
    });
    expect(dbCustomer?.phone).not.toBe(testPhone);
    expect(dbCustomer?.phone.split(':').length).toBe(3); // iv:tag:ciphertext
  });

  it('POST /api/customers - should reject if consent is false or missing', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'سالم أحمد',
        phone: '966509876543',
        consent: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/customers - should return 409 warning on duplicate phone', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'محمد عبدالله مكرر',
        phone: testPhone,
        consent: true,
        force: false,
      });

    expect(res.status).toBe(409);
    expect(res.body.details?.duplicate).toBe(true);
    expect(res.body.details?.existingCustomer.name).toBe('محمد عبدالله');
  });

  it('POST /api/customers - should allow creation if force=true on duplicate', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'محمد عبدالله مكرر ومؤكد',
        phone: testPhone,
        consent: true,
        force: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/customers/due-today - should return overdue and due today, excluding completed statuses', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const today = new Date();

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create overdue customer
    await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'عميل متأخر',
        phone: '966511111111',
        next: yesterday.toISOString(),
        status: 'مهتم',
        consent: true,
      });

    // Create due today customer
    await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'عميل اليوم',
        phone: '966522222222',
        next: today.toISOString(),
        status: 'تم التواصل',
        consent: true,
      });

    // Create completed status customer due today (should be excluded)
    await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'عميل تم البيع اليوم',
        phone: '966533333333',
        next: today.toISOString(),
        status: 'تم البيع',
        consent: true,
      });

    const res = await request(app)
      .get('/api/customers/due-today')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((c: any) => c.name);
    expect(names).toContain('عميل متأخر');
    expect(names).toContain('عميل اليوم');
    expect(names).not.toContain('عميل تم البيع اليوم');
  });
});
