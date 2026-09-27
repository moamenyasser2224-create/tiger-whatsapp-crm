import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();

describe('Employee Accounts & Face Recognition Biometrics Tests', () => {
  let adminToken: string;
  let adminId: string;
  let employeeToken: string;
  let employeeId: string;
  let employeeTempPass: string;

  const mockVector1 = Array.from({ length: 64 }, (_, i) => Math.sin(i));
  // Normalized vector identical to mockVector1
  const mockVectorSame = [...mockVector1];
  // Completely different vector (orthogonal/inverted)
  const mockVectorDifferent = Array.from({ length: 64 }, (_, i) => -Math.sin(i));

  beforeAll(async () => {
    // 1. Create or login as admin
    const adminEmail = `admin_test_${Date.now()}@example.com`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'أدمن النظام',
        email: adminEmail,
        password: 'AdminPassword@123',
      });

    adminToken = regRes.body.data.accessToken;
    adminId = regRes.body.data.user.id;

    // Promote to admin
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'admin' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Admin Employee Account Creation & Must Change Password', () => {
    it('should reject employee creation if requested by non-admin', async () => {
      // Create normal user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'موظف عادي',
          email: `employee_norm_${Date.now()}@example.com`,
          password: 'EmployeePassword@123',
        });
      const normToken = userRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/users/employee')
        .set('Authorization', `Bearer ${normToken}`)
        .send({
          name: 'موظف جديد',
          email: `new_emp_${Date.now()}@example.com`,
        });

      expect(res.status).toBe(403);
    });

    it('should allow Admin to create an employee account with generated temp password and mustChangePassword=true', async () => {
      const empEmail = `employee_real_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/users/employee')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'أحمد الموظف',
          email: empEmail,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.temporaryPassword).toBeDefined();
      expect(res.body.user.role).toBe('employee');
      expect(res.body.user.mustChangePassword).toBe(true);

      employeeId = res.body.user.id;
      employeeTempPass = res.body.temporaryPassword;

      // Verify in database
      const dbUser = await prisma.user.findUnique({ where: { id: employeeId } });
      expect(dbUser?.mustChangePassword).toBe(true);
      expect(dbUser?.role).toBe('employee');
    });

    it('should allow employee to login with temp password and signal mustChangePassword in response', async () => {
      const dbUser = await prisma.user.findUnique({ where: { id: employeeId } });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: dbUser!.email,
          password: employeeTempPass,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.mustChangePassword).toBe(true);
      employeeToken = loginRes.body.data.accessToken;
    });

    it('should allow employee to change password and clear mustChangePassword to false', async () => {
      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          currentPassword: employeeTempPass,
          newPassword: 'NewSecurePassword@2026',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      const dbUser = await prisma.user.findUnique({ where: { id: employeeId } });
      expect(dbUser?.mustChangePassword).toBe(false);
    });
  });

  describe('Face Recognition Biometrics, Legal Consent & Liveness', () => {
    it('should reject /api/auth/face/verify if user has no pre-enrolled faceEmbedding', async () => {
      const res = await request(app)
        .post('/api/auth/face/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          userId: employeeId,
          embedding: mockVector1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('لم يتم تسجيل بصمة الوجه لهذا الحساب مسبقاً');
    });

    it('should reject enrollment if biometric consent is false or missing', async () => {
      const res = await request(app)
        .post('/api/auth/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          embedding: mockVector1,
          biometricConsent: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('الموافقة البيومترية القانونية الصريحة إلزامية');
    });

    it('should successfully enroll face embedding with valid consent and encrypt it', async () => {
      const res = await request(app)
        .post('/api/auth/face/enroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          embedding: mockVector1,
          biometricConsent: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await prisma.user.findUnique({ where: { id: employeeId } });
      expect(dbUser?.biometricConsent).toBe(true);
      expect(dbUser?.faceEnrolledAt).toBeDefined();
      expect(dbUser?.faceEmbedding).toBeDefined();
      // Ensure faceEmbedding is an encrypted string (colon-separated IV:TAG:CIPHER), NOT plain text or raw image
      expect(dbUser?.faceEmbedding).toContain(':');
    });

    it('should verify matching face vector successfully on server', async () => {
      const res = await request(app)
        .post('/api/auth/face/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          userId: employeeId,
          embedding: mockVectorSame,
        });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.matchScore).toBeGreaterThanOrEqual(85);
    });

    it('should reject unmatching face vector on server with 401', async () => {
      const res = await request(app)
        .post('/api/auth/face/verify')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          userId: employeeId,
          embedding: mockVectorDifferent,
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('فشل التحقق من تطابق بصمة الوجه');
    });

    it('should completely wipe faceEmbedding and revoke biometric consent on DELETE /api/auth/face', async () => {
      const res = await request(app)
        .delete('/api/auth/face')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify in DB that faceEmbedding is null and biometricConsent is false
      const dbUser = await prisma.user.findUnique({ where: { id: employeeId } });
      expect(dbUser?.faceEmbedding).toBeNull();
      expect(dbUser?.faceEnrolledAt).toBeNull();
      expect(dbUser?.biometricConsent).toBe(false);
      expect(dbUser?.biometricConsentDate).toBeNull();
    });
  });
});
