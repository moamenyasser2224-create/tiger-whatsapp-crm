import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const app = createApp();

describe('Cloud Protection & Enterprise WAF Shield Tests', () => {
  beforeAll(async () => {
    // Ensure clean state
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Cloud Security Headers & Client IP Resolution', () => {
    it('should set enterprise cloud security headers on health check', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('cf-connecting-ip', '198.51.100.42');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.cloudProtection).toBe('active');
      expect(res.body.clientIp).toBe('198.51.100.42');

      // Check enterprise security headers
      expect(res.headers['strict-transport-security']).toContain('max-age=63072000');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['content-security-policy']).toBeDefined();
    });

    it('should resolve X-Forwarded-For when CF-Connecting-IP is absent', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('x-forwarded-for', '203.0.113.195, 10.0.0.1');

      expect(res.status).toBe(200);
      expect(res.body.clientIp).toBe('203.0.113.195');
    });
  });

  describe('Prototype Pollution Guard', () => {
    it('should reject request payload containing __proto__ injection', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(JSON.parse('{"email": "test@example.com", "password": "Pass", "__proto__": {"admin": true}}'));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROTOTYPE_POLLUTION_DETECTED');
    });

    it('should reject nested constructor pollution injection', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Pass',
          details: {
            constructor: { prototype: { poll: true } },
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROTOTYPE_POLLUTION_DETECTED');
    });
  });

  describe('Cloud WAF Active Threat Interception', () => {
    // We invoke the WAF directly to test pattern detection
    it('should block known automated malicious vulnerability scanner User-Agents', async () => {
      const { cloudWafShield } = await import('../src/middlewares/cloudProtection.js');
      const req: any = {
        originalUrl: '/api/health',
        headers: { 'user-agent': 'sqlmap/1.5.2#stable (http://sqlmap.org)' },
        clientIp: '1.2.3.4',
      };
      let statusValue = 0;
      let jsonValue: any = null;
      const res: any = {
        status: (s: number) => {
          statusValue = s;
          return {
            json: (j: any) => {
              jsonValue = j;
            },
          };
        },
      };
      let nextCalled = false;
      cloudWafShield(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(statusValue).toBe(403);
      expect(jsonValue.code).toBe('CLOUD_WAF_SCANNER_BLOCKED');
    });

    it('should block path traversal exploits', async () => {
      const { cloudWafShield } = await import('../src/middlewares/cloudProtection.js');
      const req: any = {
        originalUrl: '/api/customers/../../etc/passwd',
        headers: { 'user-agent': 'Mozilla/5.0' },
        clientIp: '1.2.3.4',
      };
      let statusValue = 0;
      let jsonValue: any = null;
      const res: any = {
        status: (s: number) => {
          statusValue = s;
          return {
            json: (j: any) => {
              jsonValue = j;
            },
          };
        },
      };
      let nextCalled = false;
      cloudWafShield(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(statusValue).toBe(403);
      expect(jsonValue.code).toBe('CLOUD_WAF_TRAVERSAL_BLOCKED');
    });

    it('should block SQL injection signatures in query string', async () => {
      const { cloudWafShield } = await import('../src/middlewares/cloudProtection.js');
      const req: any = {
        originalUrl: '/api/customers?search=1%27%20UNION%20SELECT%20*%20FROM%20users--',
        headers: { 'user-agent': 'Mozilla/5.0' },
        clientIp: '1.2.3.4',
      };
      let statusValue = 0;
      let jsonValue: any = null;
      const res: any = {
        status: (s: number) => {
          statusValue = s;
          return {
            json: (j: any) => {
              jsonValue = j;
            },
          };
        },
      };
      let nextCalled = false;
      cloudWafShield(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(statusValue).toBe(403);
      expect(jsonValue.code).toBe('CLOUD_WAF_SQLI_BLOCKED');
    });

    it('should block suspicious probe paths like /.env', async () => {
      const { cloudWafShield } = await import('../src/middlewares/cloudProtection.js');
      const req: any = {
        originalUrl: '/.env',
        headers: { 'user-agent': 'Mozilla/5.0' },
        clientIp: '1.2.3.4',
      };
      let statusValue = 0;
      let jsonValue: any = null;
      const res: any = {
        status: (s: number) => {
          statusValue = s;
          return {
            json: (j: any) => {
              jsonValue = j;
            },
          };
        },
      };
      let nextCalled = false;
      cloudWafShield(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(statusValue).toBe(403);
      expect(jsonValue.code).toBe('CLOUD_WAF_PROBE_BLOCKED');
    });
  });

  describe('Brute-Force Lockout Defense', () => {
    it('should lock out account/IP after 5 consecutive failed login attempts', async () => {
      const uniqueEmail = `brute_${Date.now()}@example.com`;
      const testIp = '198.51.100.99';

      // 4 failed attempts should return 401
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('cf-connecting-ip', testIp)
          .send({ email: uniqueEmail, password: 'WrongPassword@123' });
        expect(res.status).toBe(401);
      }

      // 5th attempt still 401, but records lock
      const fifthRes = await request(app)
        .post('/api/auth/login')
        .set('cf-connecting-ip', testIp)
        .send({ email: uniqueEmail, password: 'WrongPassword@123' });
      expect(fifthRes.status).toBe(401);

      // 6th attempt should be frozen by cloud rate limiter or lockout with 429
      const lockedRes = await request(app)
        .post('/api/auth/login')
        .set('cf-connecting-ip', testIp)
        .send({ email: uniqueEmail, password: 'WrongPassword@123' });
      expect(lockedRes.status).toBe(429);

      // Verify that AuthService internal lockout triggers the 15-minute freeze message
      const { AuthService } = await import('../src/services/auth.service.js');
      const authService = new AuthService();
      await expect(
        authService.login({ email: uniqueEmail, password: 'WrongPassword@123', ipAddress: testIp })
      ).rejects.toThrow('تم تجميد الحساب مؤقتاً');
    });
  });
});
