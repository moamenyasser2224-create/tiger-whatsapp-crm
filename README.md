# 📱 نظام إدارة عملاء واتساب الشامل (WhatsApp CRM)
> **نظام CRM حقيقي، متكامل، وجاهز للإنتاج (Production-Ready) مبني بأحدث المعايير البرمجية والأمنية لإدارة محادثات ومتابعات العملاء عبر واتساب.**

---

## 📑 جدول المحتويات
1. [المميزات الأساسية](#-المميزات-الأساسية)
2. [البنية التقنية (Tech Stack)](#-البنية-التقنية-tech-stack)
3. [هيكل المشروع (Monorepo Architecture)](#-هيكل-المشروع)
4. [نموذج البيانات (Database Schema)](#-نموذج-البيانات)
5. [التشغيل المحلي (Local Development Setup)](#-التشغيل-المحلي-خطوة-بخطوة)
6. [إدارة قواعد البيانات والـ Migrations](#-إدارة-قواعد-البيانات-والـ-migrations)
7. [قائمة الفحص الأمني (Security Checklist & Traceability)](#-قائمة-الفحص-الأمني-security-checklist)
8. [خطوات النشر والإنتاج (Production Deployment Guide)](#-خطوات-النشر-والإنتاج)
   - [النشر باستخدام Docker Compose](#1-النشر-باستخدام-docker-compose)
   - [النشر على VPS مستقل (Ubuntu + PM2 + Nginx + Let's Encrypt SSL)](#2-النشر-على-خادم-vps-مستقل-ubuntunginxpm2ssl)
   - [النشر السحابي (Railway / Render)](#3-النشر-السحابي-railway--render)
9. [الاختبارات وضمان الجودة (Testing & CI/CD)](#-الاختبارات-وضمان-الجودة)

---

## 🌟 المميزات الأساسية

- 🔒 **عزل تام للبيانات (Multi-Tenant Data Isolation & IDOR Protection):** بيانات كل مستخدم معزولة بالكامل برمجياً وعلى مستوى قاعدة البيانات (Row-Level Security).
- 🔐 **تشفير حقول حساسة (AES-256-GCM):** تشفير أرقام الجوال في قاعدة البيانات وفك تشفيرها فقط عند القراءة المصرح بها، مع فهرسة سريعة بالـ SHA-256 لمنع التكرار.
- 🛡️ **نظام مصادقة متقدم (JWT + 2FA TOTP):** Access Token (15 دقيقة) + Refresh Token في كوكيز آمنة `HttpOnly` + مصادقة ثنائية فعلية متوافقة مع Google Authenticator و1Password.
- 💬 **قوالب رسائل واتساب ذكية:** 5 قوالب افتراضية لكل مستخدم (جديد، تم التواصل، مهتم، تم البيع، غير مهتم) تدعم استبدال الاسم `{name}` تلقائياً ومعاينة حية وتوليد روابط `wa.me` فورية.
- ⏰ **لوحة المتابعات اليومية والمتأخرة:** فلترة ديناميكية ذكية للعملاء المستحقين للمتابعة اليوم أو المتأخرين (`next <= اليوم`) مع استبعاد الحالات المنتهية.
- ⚠️ **فحص تكرار الأرقام الذكي:** تنبيه تحذيري فوري (409) عند محاولة إضافة عميل برقم مسجل مسبقاً، مع عرض بيانات العميل الموجود وزر تأكيد مخصص.
- ✅ **حقل الموافقة الصريحة الإلزامي (Consent):** تسجيل إلزامي لموافقة العميل على التواصل مع توثيق التاريخ تلقائياً.
- 📊 **لوحة إحصائيات وتحليلات:** رسوم بيانية تفاعلية (Recharts) لحساب معدل التحويل (Conversion Rate)، وتوزيع الحالات والمصادر.
- 📁 **استيراد وتصدير متكامل:** تصدير واستيراد ملفات CSV تدعم اللغة العربية (UTF-8 BOM)، وزر لتصدير كافة بيانات الحساب (GDPR) وحذف الحساب نهائياً.

---

## 🛠️ البنية التقنية (Tech Stack)

### الخادم الخلفي (Backend)
- **اللغة والبيئة:** Node.js 20+ مع TypeScript
- **إطار العمل:** Express.js 4
- **قاعدة البيانات:** PostgreSQL 16
- **الـ ORM:** Prisma ORM 5
- **الأمان والتحقق:** Zod, Helmet, CORS, CSRF Protection, bcrypt (cost 12), express-rate-limit, AES-256-GCM
- **المصادقة الثنائية:** `otplib` + `qrcode` (RFC 6238 TOTP)
- **المراقبة وتتبع الأخطاء:** Sentry SDK
- **الاختبارات:** Jest + Supertest

### الواجهة الأمامية (Frontend)
- **الإطار واللغة:** React 18 + TypeScript + Vite 5
- **التصميم والواجهات:** Tailwind CSS + Lucide React + دعم كامل لـ RTL والوضع الليلي (Dark Mode)
- **إدارة الحالة والطلبات:** `@tanstack/react-query` (React Query v5) + Context API
- **النماذج والتحقق:** React Hook Form + Zod Resolvers
- **الرسوم البيانية:** Recharts
- **الاختبارات:** Vitest + React Testing Library + jsdom

---

## 📁 هيكل المشروع

```
whatsapp-crm/
├── .github/
│   └── workflows/
│       └── ci.yml               # مسار أتمتة الاختبارات والبناء (CI/CD)
├── docker-compose.yml           # تشغيل النظام بالكامل (Postgres + Server + Client)
├── .env.example                 # نموذج المتغيرات البيئية
├── package.json                 # سكريبتات Monorepo الجذرية
│
├── server/                      # كود الخادم الخلفي (Backend)
│   ├── prisma/
│   │   ├── schema.prisma        # هيكل قاعدة البيانات
│   │   ├── seed.ts              # بذر المستخدم التجريبي والقوالب الخمسة
│   │   └── migrations/          # ملفات الترحيل وسياسات Postgres RLS
│   ├── src/
│   │   ├── config/              # إعدادات البيئة، الثوابت، Sentry، Prisma
│   │   ├── controllers/         # معالجة الطلبات والردود
│   │   ├── middlewares/         # التحقق من الجلسات، الأذونات، الفلترة، ومكافحة الهجمات
│   │   ├── repositories/        # استعلامات Prisma والتعامل مع قاعدة البيانات
│   │   ├── routes/              # مسارات الـ API (/auth, /customers, /templates, /users)
│   │   ├── services/            # منطق العمل والتشفير والحسابات
│   │   ├── utils/               # دوال التشفير AES-256، الـ TOTP، التوكنات، ومعالجة الـ CSV
│   │   ├── validators/          # قواعد Zod برسائل خطأ عربية
│   │   ├── app.ts               # تهيئة Express والطبقات الأمنية
│   │   └── server.ts            # نقطة البداية وخادم HTTP مع Graceful Shutdown
│   ├── tests/                   # اختبارات التكامل للـ Auth, IDOR, Due-Today, CRUD
│   ├── Dockerfile               # Multi-stage Dockerfile للـ Backend
│   └── package.json
│
└── client/                      # كود الواجهة الأمامية (Frontend)
    ├── src/
    │   ├── components/          # المكونات (DueTodayBanner, CustomerModal, StatsCharts, etc.)
    │   ├── contexts/            # سياق المصادقة (AuthContext) والمظهر (ThemeContext)
    │   ├── lib/                 # عميل Axios مع تجديد التوكنات والـ CSRF
    │   ├── pages/               # الصفحات (Dashboard, Customers, Templates, Settings, Login)
    │   ├── types/               # تعريفات TypeScript
    │   ├── App.tsx              # المسارات العامة والمحمية
    │   └── main.tsx             # نقطة انطلاق التطبيق
    ├── nginx.conf               # إعدادات Nginx للإنتاج وتوجيه الـ SPA والـ Proxy
    ├── Dockerfile               # Multi-stage Dockerfile مع Nginx
    └── package.json
```

---

## 🗄️ نموذج البيانات

### جدول العملاء (`Customer`)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `id` | UUID | المعرف الفريد للعميل |
| `userId` | UUID | معرف المستخدم المالك (عزل البيانات) |
| `name` | String | اسم العميل (مطلوب) |
| `company` | String? | اسم الشركة (اختياري) |
| `phone` | String | رقم الجوال مشفر بـ AES-256-GCM |
| `phoneHash` | String | تجزئة SHA-256 مفهرسة للبحث وفحص التكرار السريع |
| `city` | String? | المدينة |
| `source` | Enum | إعلان, واتساب, انستغرام, فيسبوك, توصية, معرض, أخرى |
| `status` | Enum | جديد, تم التواصل, مهتم, تم البيع, غير مهتم |
| `last` | DateTime? | تاريخ آخر تواصل |
| `next` | DateTime? | تاريخ المتابعة القادمة |
| `notes` | Text? | ملاحظات وتفاصيل العميل |
| `consent` | Boolean | موافقة العميل على التواصل (إلزامي = true) |
| `consentDate` | DateTime | تاريخ تسجيل الموافقة تلقائياً |
| `deletedAt` | DateTime? | تاريخ الحذف المؤقت (Soft Delete) |

### جدول قوالب الرسائل (`MessageTemplate`)
- **الحقول:** `id`, `userId`, `status`, `body`, `updatedAt`
- **القوالب الافتراضية التلقائية:**
  1. **جديد:** `"مرحباً {name}، شكرًا لتواصلك معنا! كيف يمكننا مساعدتك؟"`
  2. **تم التواصل:** `"مرحباً {name}، تم التواصل معك سابقًا، حابب أتابع معاك آخر التفاصيل."`
  3. **مهتم:** `"مرحباً {name}، حابب أطمّن هل لسه مهتم بالعرض؟ جاهز أساعدك بأي استفسار."`
  4. **تم البيع:** `"مرحباً {name}، شكرًا لثقتك بنا! لو احتجت أي دعم بعد الشراء أنا موجود."`
  5. **غير مهتم:** `"مرحباً {name}، تمام، لو احتجت أي حاجة في المستقبل أنا موجود."`

---

## 💻 التشغيل المحلي خطوة بخطوة

### 1. المتطلبات المسبقة
- تثبيت [Node.js](https://nodejs.org/) الإصدار 20 أو أحدث.
- تثبيت [PostgreSQL](https://www.postgresql.org/) أو تشغيل خادم Postgres عبر Docker.

### 2. تثبيت الحزم
من المجلد الرئيسي للمشروع:
```bash
# تثبيت حزم الخادم
cd server
npm install

# تثبيت حزم الواجهة
cd ../client
npm install
```

### 3. إعداد المتغيرات البيئية
قم بإنشاء ملف `.env` داخل مجلد `server/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whatsapp_crm?schema=public"
FRONTEND_URL="http://localhost:5173"

JWT_ACCESS_SECRET="your_very_strong_and_secure_jwt_access_secret_key_minimum_32_characters_long_12345"
JWT_REFRESH_SECRET="your_very_strong_and_secure_jwt_refresh_secret_key_minimum_32_characters_long_67890"
JWT_RESET_PASSWORD_SECRET="your_very_strong_and_secure_jwt_reset_password_secret_key_minimum_32_chars_abc"

PHONE_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
SECURE_COOKIE=false
COOKIE_SAME_SITE="lax"
ENABLE_RLS=false
SENTRY_DSN=""
```

### 4. تطبيق الـ Migrations وبذر البيانات التجريبية
```bash
cd server
# تطبيق الترحيلات على قاعدة البيانات
npx prisma migrate dev --name init

# توليد عميل Prisma
npx prisma generate

# تشغيل الـ Seed لإنشاء الحساب التجريبي والقوالب الخمسة
npm run prisma:seed
```

> **بيانات الحساب التجريبي:**
> - **البريد الإلكتروني:** `admin@example.com`
> - **كلمة المرور:** `Admin@123456`

### 5. تشغيل بيئة التطوير
- **تشغيل الخادم الخلفي (Backend):**
  ```bash
  cd server
  npm run dev
  ```
  *(سيعمل الخادم على: `http://localhost:5000`)*

- **تشغيل الواجهة الأمامية (Frontend):**
  ```bash
  cd client
  npm run dev
  ```
  *(ستفتح الواجهة على: `http://localhost:5173`)*

---

## 🗃️ إدارة قواعد البيانات والـ Migrations

عند تعديل نموذج البيانات في `server/prisma/schema.prisma`:
```bash
# إنشاء ترحيل جديد وتطبيقه محلياً
npx prisma migrate dev --name your_migration_name

# لتطبيق الترحيلات في بيئة الإنتاج (Production)
npx prisma migrate deploy

# لفتح لوحة استعراض قاعدة البيانات المرئية (Prisma Studio)
npx prisma studio
```

---

## 🛡️ قائمة الفحص الأمني (Security Checklist)

تم تنفيذ جميع المتطلبات الأمنية المتقدمة وفق أفضل الممارسات المعتمدة:

| البند الأمني | آلية التنفيذ | مسار الملف المسؤول |
| :--- | :--- | :--- |
| **تشفير أرقام الجوال** | تشفير بـ `AES-256-GCM` ومفتاح 32 بايت مع AuthTag وIV عشوائي لكل رقم | [`server/src/utils/crypto.ts`](file:///server/src/utils/crypto.ts) |
| **فهرسة الأرقام المشفرة** | توليد تجزئة `SHA-256` مفهرسة للبحث السريع وفحص التكرار دون كشف الرقم | [`server/src/utils/crypto.ts`](file:///server/src/utils/crypto.ts) |
| **التحقق الثنائي (2FA TOTP)** | توليد أسرار TOTP وQR Code والتحقق من الرموز المكونة من 6 أرقام | [`server/src/utils/totp.ts`](file:///server/src/utils/totp.ts) |
| **تأمين الجلسات (JWT + Cookie)** | Access Token (15 دقيقة) + Refresh Token مشفر في HttpOnly Secure Cookie | [`server/src/utils/tokens.ts`](file:///server/src/utils/tokens.ts) |
| **حماية الـ CSRF** | نمط Double Submit Cookie عبر الـ Header `x-csrf-token` | [`server/src/middlewares/csrfProtection.ts`](file:///server/src/middlewares/csrfProtection.ts) |
| **عزل البيانات ومنع IDOR** | ربط كل العمليات بـ `req.user.id` + سياسات Postgres RLS المخصصة | [`server/src/middlewares/authenticate.ts`](file:///server/src/middlewares/authenticate.ts) & [`server/src/repositories/customer.repository.ts`](file:///server/src/repositories/customer.repository.ts) |
| **مكافحة هجمات القوة الغاشمة** | `express-rate-limit` (5 محاولات/دقيقة للدخول، 120/دقيقة للـ API) | [`server/src/middlewares/rateLimiter.ts`](file:///server/src/middlewares/rateLimiter.ts) |
| **ترويسات الأمان الصارمة** | `helmet()` لإضافة ترويسات HSTS, X-Content-Type-Options, Referrer-Policy | [`server/src/app.ts`](file:///server/src/app.ts) |
| **تقييد النطاقات (CORS)** | تقييد الوصول حصراً لنطاق الواجهة الأمامية بدون أي Wildcard (`*`) | [`server/src/app.ts`](file:///server/src/app.ts) |
| **تقييد حجم الحمولات** | ضبط حد أقصى للـ JSON Body عند `1MB` لمنع هجمات حجب الخدمة (DoS) | [`server/src/app.ts`](file:///server/src/app.ts) |
| **تجزئة كلمات المرور** | `bcrypt` بعامل تكلفة مرتفع (Cost Factor = 12) | [`server/src/services/auth.service.ts`](file:///server/src/services/auth.service.ts) |
| **سجل التدقيق (Audit Logs)** | توثيق كامل لكل عملية إضافة، تعديل، حذف، تصدير، أو تغيير أمني مع IP وUser-Agent | [`server/src/repositories/audit.repository.ts`](file:///server/src/repositories/audit.repository.ts) |
| **مراقبة وتتبع الأعطال** | تكامل كامل مع `Sentry Node SDK` لالتقاط الاستثناءات في بيئة الإنتاج | [`server/src/config/sentry.ts`](file:///server/src/config/sentry.ts) |

---

## 🚀 خطوات النشر والإنتاج

### 1. النشر باستخدام Docker Compose
أسرع وأسهل طريقة للنشر على أي خادم سحابي تدعم تشغيل النظام بالكامل بأمر واحد:

1. انسخ المشروع إلى خادمك.
2. أنشئ ملف `.env` في المجلد الرئيسي واملأ المفاتيح السرية الحقيقية:
   ```bash
   POSTGRES_USER=crm_admin
   POSTGRES_PASSWORD=SuperStrongDbPassword123!
   POSTGRES_DB=whatsapp_crm_prod
   FRONTEND_URL=https://crm.yourdomain.com
   JWT_ACCESS_SECRET=your_production_64_char_hex_access_secret_key
   JWT_REFRESH_SECRET=your_production_64_char_hex_refresh_secret_key
   JWT_RESET_PASSWORD_SECRET=your_production_reset_secret_key
   PHONE_ENCRYPTION_KEY=your_production_32_bytes_64_hex_encryption_key
   ```
3. شغّل الحاويات:
   ```bash
   docker-compose up -d --build
   ```
4. نفّذ الترحيلات والبذر داخل حاوية الخادم:
   ```bash
   docker-compose exec server npx prisma migrate deploy
   docker-compose exec server npm run prisma:seed
   ```

---

### 2. النشر على خادم VPS مستقل (Ubuntu/Nginx/PM2/SSL)

#### أ. إعداد الخادم والتبعيات
```bash
# تحديث الحزم
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 20 وPostgreSQL وNginx وGit
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx git certbot python3-certbot-nginx

# تثبيت PM2 لإدارة العمليات
sudo npm install -g pm2
```

#### ب. إعداد قاعدة بيانات PostgreSQL
```bash
sudo -u postgres psql
```
داخل موجه PostgreSQL:
```sql
CREATE DATABASE whatsapp_crm_prod;
CREATE USER crm_user WITH ENCRYPTED PASSWORD 'StrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_crm_prod TO crm_user;
\c whatsapp_crm_prod
GRANT ALL ON SCHEMA public TO crm_user;
\q
```

#### ج. بناء وتشغيل الخادم الخلفي عبر PM2
```bash
cd /var/www/whatsapp-crm/server
npm ci
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build

# تشغيل التطبيق عبر PM2
pm2 start dist/server.js --name "whatsapp-crm-api"
pm2 save
pm2 startup
```

#### د. بناء الواجهة الأمامية
```bash
cd /var/www/whatsapp-crm/client
npm ci
npm run build
# ستكون الملفات الجاهزة في /var/www/whatsapp-crm/client/dist
```

#### هـ. إعداد Nginx العكسي وشهادة Let's Encrypt SSL المجانية
أنشئ ملف إعداد Nginx:
```bash
sudo nano /etc/nginx/sites-available/whatsapp-crm
```
أضف المحتوى التالي:
```nginx
server {
    server_name crm.yourdomain.com;

    root /var/www/whatsapp-crm/client/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy to Node.js Backend API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
تفعيل الموقع وتوليد شهادة SSL:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# إصدار شهادة SSL تلقائياً
sudo certbot --nginx -d crm.yourdomain.com
```

---

### 3. النشر السحابي (Railway / Render)
1. **قاعدة البيانات:** أنشئ خدمة `PostgreSQL` وانسخ `DATABASE_URL`.
2. **الخادم الخلفي (Web Service):**
   - **Root Directory:** `server`
   - **Build Command:** `npm ci && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && node dist/server.js`
   - **Environment Variables:** أضف جميع المتغيرات المذكورة في `.env.example`.
3. **الواجهة الأمامية (Static Site أو Web Service):**
   - **Root Directory:** `client`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variable:** `VITE_API_URL=https://your-backend-service.railway.app/api`

---

## 🧪 الاختبارات وضمان الجودة

المشروع مزود بحزمة اختبارات شاملة تغطي جميع السيناريوهات الحساسة:

```bash
# تشغيل جميع اختبارات الخادم الخلفي (Backend Tests)
cd server
npm test

# تشغيل اختبارات الخادم مع قياس التغطية البرمجية (Coverage)
npm run test:coverage

# تشغيل اختبارات الواجهة الأمامية (Frontend Tests)
cd ../client
npm test
```

### السيناريوهات المختبرة:
- ✅ **اختبار المصادقة والتسجيل:** التحقق من إنشاء المستخدم والبذر التلقائي للقوالب الخمسة.
- ✅ **اختبار عزل البيانات (IDOR Isolation):** التأكد الصارم من أن المستخدم B لا يمكنه رؤية أو تعديل أو حذف أي عميل أو قالب للمستخدم A.
- ✅ **اختبار كشف تكرار الأرقام:** التحقق من إرجاع تحذير `409` مع بيانات العميل القديم، وإمكانية التأكيد عبر `force: true`.
- ✅ **اختبار متابعات اليوم والمتأخرة:** التحقق من تصفية المواعيد المستحقة واستبعاد الحالات المكتملة (`تم البيع` و`غير مهتم`).
- ✅ **اختبار تشفير أرقام الجوال:** التأكد من تخزين الرقم مشفراً في قاعدة البيانات بصيغة `iv:tag:ciphertext` وفك تشفيره في الرد.
- ✅ **اختبار الواجهة الأمامية:** اختبار عمل نماذج الدخول وشاشات إدارة العملاء.
