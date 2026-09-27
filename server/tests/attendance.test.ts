import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../src/utils/tokens.js';

const app = createApp();

describe('Attendance API Endpoints', () => {
  let user: any;
  let token: string;
  const today = new Date().toISOString().split('T')[0];

  beforeAll(async () => {
    // Clean existing test data
    await prisma.attendance.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'attendance_test@example.com' } });

    const password = await bcrypt.hash('Password@123', 10);
    user = await prisma.user.create({
      data: {
        email: 'attendance_test@example.com',
        password,
        name: 'موظف الحضور التجريبي',
      },
    });

    token = generateAccessToken({ userId: user.id, email: user.email });
  });

  afterAll(async () => {
    await prisma.attendance.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it('should reject check-out before check-in', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('لم يتم تسجيل حضورك لليوم بعد');
  });

  it('should successfully record check-in', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkIn).toBeDefined();
    expect(res.body.data.userId).toBe(user.id);
  });

  it('should reject duplicate check-in on the same day', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('تم تسجيل حضورك اليوم بالفعل');
  });

  it('should successfully record check-out after check-in', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.checkOut).toBeDefined();
  });

  it('should reject duplicate check-out on the same day', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('تم تسجيل انصرافك اليوم بالفعل');
  });

  it('should retrieve today team attendance', async () => {
    const res = await request(app)
      .get('/api/attendance/today')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].user.name).toBe(user.name);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).post('/api/attendance/check-in');
    expect(res.status).toBe(401);
  });
});
