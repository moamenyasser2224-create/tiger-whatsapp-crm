# 🐅 تايجر CRM وإدارة العمل الداخلي (Tiger Workspace & WhatsApp CRM)
> **نظام إدارة عمل داخلي متكامل وحقيقي جاهز للإنتاج (Production-Ready) يجمع بين إدارة عملاء واتساب (CRM)، نظام الحضور والانصراف اللحظي، والشات الداخلي المباشر بين أعضاء الفريق.**

---

## 📑 جدول المحتويات
1. [نظرة عامة والمميزات الأساسية](#-المميزات-الأساسية)
2. [البنية التقنية (Tech Stack)](#-البنية-التقنية-tech-stack)
3. [هيكل المشروع (Monorepo Architecture)](#-هيكل-المشروع)
4. [نماذج البيانات (Database Schema)](#-نماذج-البيانات)
5. [التشغيل المحلي خطوة بخطوة (Local Setup)](#-التشغيل-المحلي-خطوة-بخطوة)
6. [إدارة قواعد البيانات والـ Migrations](#-إدارة-قواعد-البيانات-والـ-migrations)
7. [قائمة الفحص الأمني والربط المرجعي (Security Checklist & Traceability)](#-قائمة-الفحص-الأمني-security-checklist)
8. [خطوات النشر والإنتاج (Production Deployment Guide)](#-خطوات-النشر-والإنتاج)
   - [النشر باستخدام Docker Compose](#1-النشر-باستخدام-docker-compose)
   - [النشر على VPS مستقل (Ubuntu + PM2 + Nginx + SSL + WebSocket Support)](#2-النشر-على-خادم-vps-مستقل-ubuntupm2nginxsslwebsocket)
   - [النشر السحابي (Render / Railway)](#3-النشر-السحابي-render--railway)
9. [الاختبارات وضمان الجودة (Testing & CI/CD)](#-الاختبارات-وضمان-الجودة)

---

## 🌟 المميزات الأساسية

### 1. إدارة عملاء واتساب (WhatsApp CRM)
- 🔒 **عزل تام للبيانات (Multi-Tenant Data Isolation & IDOR Protection):** عزل بيانات كل مستخدم برمجياً وعلى مستوى قاعدة البيانات (Row-Level Security).
- 🔐 **تشفير حقول حساسة (AES-256-GCM):** تشفير أرقام الهواتف بأمان وفك تشفيرها فقط عند الطلب المصرح به، مع فهرسة `SHA-256` للبحث وفحص التكرار.
- 💬 **قوالب رسائل واتساب ذكية:** 5 قوالب افتراضية لكل مستخدم تدعم استبدال `{name}` آلياً، وتوليد روابط `wa.me` فورية.
- ⏰ **لوحة المتابعات اليومية والمتأخرة:** فلترة ديناميكية ذكية للعملاء المستحقين للمتابعة اليوم أو المتأخرين (`next <= اليوم`) مع استبعاد الحالات المنتهية.
- ⚠️ **فحص تكرار الأرقام:** تنبيه فوري عند تكرار رقم مسجل مع نافذة تأكيد للمستخدم.
- ✅ **حقل الموافقة الصريحة الإلزامي (Consent):** توثيق موافقة العميل على التواصل مع التاريخ تلقائياً.
- 📊 **لوحة إحصائيات تفاعلية:** رسوم بيانية تفاعلية (Recharts) لحساب معدل التحويل وتوزيع الحالات والمصادر.

### 2. نظام الحضور والانصراف الذكي (Attendance System)
- ⏱️ **تسجيل حضور وانصراف بضغطة زر:** أزرار ذكية تتفعل وتتعطل آلياً حسب حالة الموظف اليومية.
- 🚫 **منع التكرار الصارم:** سجل واحد فقط لكل موظف في اليوم الواحد (`userId + date` Unique Constraint)، مع رفض تكرار الحضور أو تسجيل الانصراف قبل الحضور.
- 📡 **بث مباشر عبر WebSocket (Socket.io):** تحديث لحظي لجدول حضور الفريق فور تسجيل أي موظف لحضوره أو انصرافه دون الحاجة لإعادة تحميل الصفحة.
- 👤 **بطاقة حالتي اليوم:** استعراض توقيت الحضور، توقيت الانصراف، وحالة التواجد المباشرة.

### 3. الشات الداخلي للمنظومة (Internal Team Chat)
- 💬 **قناة عامة للمؤسسة (Organization-wide Channel):** محادثة جماعية مشفرة ومؤمنة تضم كافة أعضاء وإداريي المنظومة.
- 🛡️ **حماية ضد هجمات XSS:** تنظيف وتعقيم نصوص الرسائل آلياً قبل حفظها وإرسالها للمستخدمين.
- ⚡ **تحديث لحظي عبر Socket.io:** استلام الرسائل فور إرسالها مع ميزة التمرير التلقائي (Auto-scroll).
- 🚦 **مكافحة الإغراق (Strict Rate Limiting):** تحديد حد أقصى 10 رسائل في الدقيقة لكل مستخدم لمنع السبام (Spam).
- 🎨 **تصميم RTL راقي:** فقاعات محادثة مميزة، إظهار أسماء المرسلين الحقيقية ورتبهم (مدير / موظف)، وتوقيت الرسائل.

---

## 🛠️ البنية التقنية (Tech Stack)

### الخادم الخلفي (Backend)
- **البيئة:** Node.js 20+ مع TypeScript
- **إطار العمل:** Express.js 4 + HTTP Server
- **المحرك اللحظي (Real-time):** Socket.io 4 مع Handshake JWT Authentication
- **قواعد البيانات:** PostgreSQL 16 (أو SQLite محلياً للتطوير الخفيف)
- **الـ ORM:** Prisma ORM 5
- **الأمان والتحقق:** Zod, Helmet, CORS, CSRF Double-Submit Protection, bcrypt (cost 12), express-rate-limit, AES-256-GCM
- **المصادقة الثنائية:** `otplib` + `qrcode` (RFC 6238 TOTP)
- **المراقبة وتتبع الأعطال:** Sentry SDK
- **الاختبارات:** Jest + Supertest

### الواجهة الأمامية (Frontend)
- **البيئة:** React 18 + TypeScript + Vite 5
- **التصميم:** Tailwind CSS + Lucide Icons + دعم كامل للغة العربية (RTL) والوضع الليلي (Dark Mode)
- **إدارة الحالة:** `@tanstack/react-query` (React Query v5) + Context API
- **النماذج:** React Hook Form + Zod
- **المحرك اللحظي للعميل:** `socket.io-client` مع إعادة اتصال ذكية
- **الاختبارات:** Vitest + React Testing Library + JSDOM

---

## 📁 هيكل المشروع

```
whatsapp-crm/
├── ci_workflows/workflows/ci.yml # مسار أتمتة الاختبارات والبناء (CI/CD)
├── docker-compose.yml           # تشغيل النظام بالكامل بأمر واحد (Postgres + Server + Client)
├── .env.example                 # نموذج المتغيرات البيئية
│
├── server/                      # كود الخادم الخلفي (Backend)
│   ├── prisma/
│   │   ├── schema.prisma        # هيكل PostgreSQL والترحيلات
│   │   ├── schema.sqlite.prisma # هيكل SQLite لبيئة التطوير الخفيفة
│   │   └── seed.ts              # بذر الحساب التجريبي والقوالب الخمسة
│   ├── src/
│   │   ├── config/              # إعدادات البيئة، Prisma، Sentry
│   │   ├── controllers/         # معالجة طلبات Auth, Customers, Attendance, Chat, Templates
│   │   ├── middlewares/         # التحقق من الجلسات، الأذونات، الفلترة، ومكافحة السبام
│   │   ├── repositories/        # استعلامات Prisma لكافة الكيانات
│   │   ├── routes/              # مسارات API (/auth, /customers, /attendance, /chat, /templates)
│   │   ├── services/            # منطق العمل والتشفير والبث اللحظي
│   │   ├── socket.ts            # تهيئة Socket.io ومصادقة Handshake JWT والبث اللحظي
│   │   ├── utils/               # دوال AES-256، التعقيم ضد XSS، TOTP، والتوكنات
│   │   ├── validators/          # قواعد التحقق Zod برسائل خطأ عربية
│   │   ├── app.ts               # تهيئة Express والطبقات الأمنية
│   │   └── server.ts            # نقطة البداية وتشغيل السيرفر اللحظي
│   ├── tests/                   # 6 أجنحة اختبارات شاملة (29 اختبار نجح بالكامل)
│   ├── Dockerfile               # Multi-stage Dockerfile للـ Backend
│   └── package.json
│
└── client/                      # كود الواجهة الأمامية (Frontend)
    ├── src/
    │   ├── components/          # Sidebar متجاوب، Topbar، النوافذ والمخططات
    │   ├── contexts/            # سياق AuthContext، ThemeContext، SocketContext
    │   ├── lib/                 # عميل Axios مع تجديد التوكنات ومعالجة CSRF
    │   ├── pages/               # CustomersPage, AttendancePage, ChatPage, SettingsPage, Login
    │   ├── types/               # تعريفات TypeScript لجميع الكيانات
    │   ├── App.tsx              # المسارات العامة والمحمية وسياق WebSocket
    │   └── main.tsx
    ├── nginx.conf               # إعدادات Nginx للإنتاج مع دعم WebSocket (/socket.io/)
    ├── Dockerfile               # Multi-stage Dockerfile مع Nginx
    └── package.json
```

---

## 🗄️ نماذج البيانات

### 1. المستخدم (`User`)
- `id` (UUID), `name`, `email`, `password`, `role` (`admin` / `employee`), `isTwoFactorEnabled`, `twoFactorSecret`, `createdAt`, `updatedAt`, `deletedAt`.

### 2. العميل (`Customer`)
- `id` (UUID), `userId` (عزل البيانات), `name`, `company`, `phone` (مشفر بـ AES-256-GCM), `phoneHash` (SHA-256 مفهرس), `city`, `source`, `status`, `last`, `next`, `notes`, `consent` (إلزامي = true), `consentDate`, `deletedAt`.

### 3. الحضور والانصراف (`Attendance`)
- `id` (UUID), `userId`, `date` (YYYY-MM-DD), `checkIn` (DateTime?), `checkOut` (DateTime?), `createdAt`, `updatedAt`.
- **قيد فريد:** `@@unique([userId, date])` — سجل واحد فقط لكل موظف لكل يوم.

### 4. الشات الداخلي (`ChatMessage`)
- `id` (UUID), `senderId`, `text` (Text، معقم ضد XSS، حد أقصى 1000 حرف), `createdAt`.

### 5. قوالب الرسائل (`MessageTemplate`)
- `id`, `userId`, `status`, `body` (يحتوي على `{name}`), `updatedAt`.

---

## 💻 التشغيل المحلي خطوة بخطوة

### 1. تثبيت الحزم
```bash
# تثبيت حزم الخادم
cd server
npm install

# تثبيت حزم الواجهة
cd ../client
npm install
```

### 2. إعداد المتغيرات البيئية
أنشئ ملف `.env` داخل `server/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
FRONTEND_URL="http://localhost:5173"

JWT_ACCESS_SECRET="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
JWT_REFRESH_SECRET="abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
JWT_RESET_PASSWORD_SECRET="reset_secret_key_minimum_32_characters_long_1234567890"

PHONE_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
SECURE_COOKIE=false
COOKIE_SAME_SITE="lax"
ENABLE_RLS=false
SENTRY_DSN=""
```

### 3. مزامنة قاعدة البيانات والـ Seed
```bash
cd server
npx prisma db push --schema=prisma/schema.sqlite.prisma
npm run prisma:seed
```

> **بيانات حساب المدير التجريبي:**
> - البريد الإلكتروني: `admin@example.com`
> - كلمة المرور: `Admin@123456`

### 4. تشغيل الخادم والواجهة
```bash
# تشغيل الخادم ومحرك Socket.io (المنفذ 5000)
cd server
npm run build && node dist/server.js

# تشغيل واجهة React (المنفذ 5173)
cd client
npm run dev
```

---

## 🛡️ قائمة الفحص الأمني (Security Checklist)

| المتطلب الأمني | آلية التنفيذ البرمجية | المسار الدقيق للملف |
| :--- | :--- | :--- |
| **مصادقة WebSocket Handshake** | فحص JWT في مصافحة Socket.io ورفض أي اتصال غير مصرح | [`server/src/socket.ts`](file:///server/src/socket.ts) |
| **تعقيم المدخلات ضد XSS** | تجريد ونزع وسوم `<script>` والسمات الخطرة من رسائل الشات والملاحظات | [`server/src/utils/sanitize.ts`](file:///server/src/utils/sanitize.ts) |
| **منع إغراق الشات (Chat Rate Limit)** | تحديد 10 رسائل/دقيقة لكل مستخدم برفض الطلب الحادي عشر بكود `429` | [`server/src/middlewares/rateLimiter.ts`](file:///server/src/middlewares/rateLimiter.ts) |
| **منع تكرار الحضور والانصراف** | فحص حالة الحضور والخروج مسبقاً مع قيد `@@unique([userId, date])` | [`server/src/services/attendance.service.ts`](file:///server/src/services/attendance.service.ts) |
| **تشفير أرقام الهواتف** | تشفير بـ `AES-256-GCM` ومفتاح 32 بايت مع AuthTag وIV عشوائي | [`server/src/utils/crypto.ts`](file:///server/src/utils/crypto.ts) |
| **فهرسة الأرقام المشفرة** | توليد تجزئة `SHA-256` للبحث السريع وفحص التكرار | [`server/src/utils/crypto.ts`](file:///server/src/utils/crypto.ts) |
| **حماية الـ CSRF** | نمط Double Submit Cookie عبر الـ Header `x-csrf-token` | [`server/src/middlewares/csrfProtection.ts`](file:///server/src/middlewares/csrfProtection.ts) |
| **عزل البيانات ومنع IDOR** | ربط كافة العمليات بـ `req.user.id` مع سياسات RLS | [`server/src/middlewares/authenticate.ts`](file:///server/src/middlewares/authenticate.ts) |
| **المصادقة الثنائية (2FA TOTP)** | توليد أسرار TOTP وQR Code والتحقق من رموز الـ 6 أرقام | [`server/src/utils/totp.ts`](file:///server/src/utils/totp.ts) |
| **ترويسات الحماية الصارمة** | تفعيل `helmet()` لضبط HSTS وX-Content-Type-Options | [`server/src/app.ts`](file:///server/src/app.ts) |
| **تجزئة كلمات المرور** | خوارزمية `bcrypt` بعامل تكلفة 12 | [`server/src/services/auth.service.ts`](file:///server/src/services/auth.service.ts) |
| **سجل التدقيق (Audit Logs)** | توثيق كامل للعمليات الحساسة مع عنوان الـ IP والـ User-Agent | [`server/src/repositories/audit.repository.ts`](file:///server/src/repositories/audit.repository.ts) |

---

## 🚀 خطوات النشر والإنتاج

### 1. النشر باستخدام Docker Compose
تشغيل النظام بالكامل متضمناً قاعدة بيانات PostgreSQL، خادم Express مع محرك Socket.io، وواجهة React عبر Nginx:
```bash
docker-compose up -d --build
```

---

### 2. النشر على خادم VPS مستقل (Ubuntu/PM2/Nginx/SSL/WebSocket)

عند النشر على VPS، يجب تهيئة Nginx ليدعم ترقية اتصالات **WebSocket الخاصة بـ Socket.io** عبر التكوين التالي:

أنشئ الإعداد في `/etc/nginx/sites-available/tiger-crm`:
```nginx
# Map لترقية اتصالات WebSocket
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    server_name crm.yourdomain.com;

    root /var/www/whatsapp-crm/client/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # SPA Routing للواجهة الأمامية
    location / {
        try_files $uri $uri/ /index.html;
    }

    # تمرير طلبات الـ REST API للخادم الخلفي
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # تمرير اتصالات WebSocket الحية لـ Socket.io (شات وحضور لحظي)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

تفعيل الموقع وإصدار شهادة SSL المجانية:
```bash
sudo ln -s /etc/nginx/sites-available/tiger-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d crm.yourdomain.com
```

---

### 3. النشر السحابي (Render / Railway)
- **قاعدة البيانات:** PostgreSQL Database مخصصة.
- **الخادم (Backend Service):**
  - أمر البناء: `npm ci && npx prisma generate && npm run build`
  - أمر التشغيل: `npx prisma migrate deploy && node dist/server.js`
- **الواجهة (Frontend):**
  - أمر البناء: `npm ci && npm run build`
  - مجلد النشر: `dist`
  - متغير البيئة: `VITE_API_URL=https://your-backend-api.onrender.com/api`

---

## 🧪 الاختبارات وضمان الجودة

يحتوي النظام على حزمة اختبارات شاملة تغطي الخادم الخلفي والواجهة الأمامية:

### 1. اختبارات الخادم الخلفي (29 اختباراً نجحت بنسبة 100%):
```bash
cd server
npm test
```
- ✅ **الحضور والانصراف:** التحقق من نجاح الحضور، رفض الانصراف قبل الحضور، ورفض التكرار في نفس اليوم.
- ✅ **الشات ومكافحة السبام:** رفض الرسائل الفارغة أو الأطول من 1000 حرف، تعقيم وسوم XSS، وحظر الطلب الحادي عشر خلال دقيقة بـ `429`.
- ✅ **منع هجمات IDOR:** التأكد الصارم من عزل بيانات المستخدمين وعدم إمكانية الوصول لسجلات الآخرين.
- ✅ **المصادقة والتسجيل و2FA:** توليد التوكنات، التحقق من كلمات المرور، وبذر القوالب الخمسة.
- ✅ **قوالب الرسائل:** التحقق من وجود وسم `{name}` وتنسيق الرسائل لـ WhatsApp.

### 2. اختبارات الواجهة الأمامية:
```bash
cd client
npm test
```
- ✅ اختبار صفحة تسجيل الدخول (`LoginPage.test.tsx`)
- ✅ اختبار صفحة العملاء وتدفق البيانات (`CustomersPage.test.tsx`)
- ✅ اختبار صفحة الحضور والانصراف وعناصر التحكم (`AttendancePage.test.tsx`)
- ✅ اختبار صفحة الشات وقناة الفريق المباشرة (`ChatPage.test.tsx`)
