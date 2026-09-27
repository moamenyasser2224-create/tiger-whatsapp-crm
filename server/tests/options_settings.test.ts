import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../src/utils/tokens.js';

const app = createApp();

describe('ListOption & Settings API Endpoints', () => {
  let adminUser: any;
  let adminToken: string;
  let employeeUser: any;
  let employeeToken: string;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin_opt_test@example.com', 'emp_opt_test@example.com'] },
      },
    });

    const password = await bcrypt.hash('Password@123', 10);

    adminUser = await prisma.user.create({
      data: {
        email: 'admin_opt_test@example.com',
        name: 'مدير الخيارات',
        password,
        role: 'admin',
      },
    });
    adminToken = generateAccessToken({ userId: adminUser.id, email: adminUser.email });

    employeeUser = await prisma.user.create({
      data: {
        email: 'emp_opt_test@example.com',
        name: 'موظف عادي',
        password,
        role: 'employee',
      },
    });
    employeeToken = generateAccessToken({ userId: employeeUser.id, email: employeeUser.email });
  });

  afterAll(async () => {
    await prisma.listOption.deleteMany({
      where: { label: { in: ['مصدر تجريبي جديد', 'حالة تجريبية معدلة'] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminUser.id, employeeUser.id] } },
    });
    await prisma.$disconnect();
  });

  it('should allow authenticated users to fetch all list options', async () => {
    const res = await request(app)
      .get('/api/options')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should block non-admin from creating a new list option (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/options')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'source', label: 'مصدر تجريبي جديد' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('يتطلب صلاحيات المدير');
  });

  let createdOptionId: string;

  it('should allow admin to create a new list option', async () => {
    const res = await request(app)
      .post('/api/options')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'source', label: 'مصدر تجريبي جديد' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.label).toBe('مصدر تجريبي جديد');
    expect(res.body.data.type).toBe('source');
    createdOptionId = res.body.data.id;
  });

  it('should allow admin to update a list option', async () => {
    const res = await request(app)
      .put(`/api/options/${createdOptionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'حالة تجريبية معدلة', order: 99 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.label).toBe('حالة تجريبية معدلة');
  });

  it('should allow admin to delete a list option', async () => {
    const res = await request(app)
      .delete(`/api/options/${createdOptionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should allow any authenticated user to fetch organization settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orgName).toBeDefined();
  });

  it('should block employee from updating organization settings', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ orgName: 'مؤسسة غير مصرحة' });

    expect(res.status).toBe(403);
  });

  it('should allow admin to update organization name', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ orgName: 'تايجر هولدينج الدولية' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orgName).toBe('تايجر هولدينج الدولية');

    // Reset back
    await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ orgName: 'تايجر CRM' });
  });
});
