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

### 2. نظام التصميم والحركة الحديث (SaaS Monochrome & Motion System)
- 🎨 **تصميم عالمي بالأبيض والأسود (100% Monochrome):** أسلوب Vercel وLinear الحديث بحدود دقيقة (1px)، ظلال ناعمة، وخط عربي حديث ومتناسق.
- 🚀 **نظام حركات انسيابي (Framer Motion):** انتقالات صفحات سلسة مع `AnimatePresence`، تبويبات منزلقة عبر `layoutId`، وعدادات متصاعدة رقمية (Count-Up).
- 🕒 **ساعة رقمية حية تفاعلية (Flip Clock):** ساعة شريطية ميكانيكية حية في رأس صفحة الحضور والانصراف.
- 🔦 **بطاقات تفاعلية (Spotlight Tracking):** تتبع مسار الفأرة بتأثير ضوئي رمادي خافت على بطاقات الإحصائيات.

### 3. نظام الحضور والانصراف والورديات وإدارة الغياب (Shifts, Heatmap & Absence)
- ⏱️ **إدارة الورديات وفترات السماح (Shifts & Grace Periods):** حساب دقيق لدقائق التأخير بعد فترة السماح (Grace Period)، والانصراف المبكر، وساعات العمل الفعلية.
- 📅 **تقويم الحضور الشهري (Calendar Heatmap):** تمثيل بصري لحالات الحضور والغياب والتأخيرات على مدار الشهر بدرجات الرمادي.
- 🏖️ **إدارة الإجازات (Leave Requests Workflow):** تقديم ومراجعة طلبات الإجازات (سنوية، مرضية، غير مدفوعة، اضطرارية) مع توثيق قرارات الإدارة.
- 🔄 **طلبات تصحيح البصمة (Attendance Corrections):** تمكين الموظف من رفع طلب تصحيح البصمة مع سبب إلزامي وموافقة الإدارة.
- 🤖 **محرك رصد الغياب الآلي (Idempotent Absence Detection Job):** فحص يومي للموظفين المجدولين، استبعاد العطلات والإجازات، وحساب الغياب واقتراح الخصومات آلياً دون أي تكرار.

### 4. نظام الخصومات ومسير الرواتب (Deductions, Disputes & Payroll Lock)
- 🔐 **تشفير الرواتب (AES-256 Encrypted Salary):** حفظ رواتب الموظفين مشفرة في قاعدة البيانات مع عزل تام لا يتيح الاطلاع عليها إلا للإدارة والموظف نفسه.
- 📐 **شفافية معادلات الخصم (JSON Equation Breakdown):** تفصيل كامل لمعادلة حساب كل خصم (أجر اليوم × معامل الشريحة) يظهر للموظف في جدول "خصوماتي".
- 🛡️ **إنفاذ السقف التأديبي الشهري (Monthly Disciplinary Cap):** فرض حد أقصى للخصومات التأديبية (وفق النسبة المحددة بقانون العمل أو إعدادات المؤسسة) لمنع استنزاف راتب الموظف.
- ⚖️ **دورة الاعتراضات المتكاملة (Dispute Workflow):** تمكين الموظف من الاعتراض خلال نافذة زمنية، مع مراجعة الإدارة (قبول يلغي الخصم، أو رفض مع ذكر الأسباب).
- 🎁 **التسويات والمكافآت الإدارية (Adjustments):** إضافة مكافآت أو تسويات مالية يدويًا مع بيان مكتوب إلزامي لأغراض الرقابة المالية.
- 🔒 **إغلاق وتجميد الشهر المالي نهائياً (Payroll Closing Lock):** قفل الشهر المالي يجمّد كافة الخصومات والتسويات نهائياً ويمنع أي تعديل أو اعتراض لاحق عليها.
- 📑 **تصدير كشوفات الرواتب:** استخراج مسير الرواتب بصيغة CSV وExcel وPDF جاهزة للصرف.

### 5. الشات الداخلي للمنظومة (Internal Team Chat)
- 💬 **قناة عامة للمؤسسة (Organization-wide Channel):** محادثة جماعية مشفرة ومؤمنة تضم كافة أعضاء وإداريي المنظومة.
- 🛡️ **حماية ضد هجمات XSS:** تنظيف وتعقيم نصوص الرسائل آلياً قبل حفظها وإرسالها للمستخدمين.
- ⚡ **تحديث لحظي عبر Socket.io:** استلام الرسائل فور إرسالها مع ميزة التمرير التلقائي (Auto-scroll).
- 🚦 **مكافحة الإغراق (Strict Rate Limiting):** تحديد حد أقصى 10 رسائل في الدقيقة لكل مستخدم لمنع السبام (Spam).

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

# مفاتيح التشفير المنفصلة (64-character Hex / 32-byte Keys)
PHONE_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
SALARY_ENCRYPTION_KEY="1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
FACE_EMBEDDING_ENCRYPTION_KEY="2123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
BACKUP_ENCRYPTION_KEY="3123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

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

## 🔐 إدارة الأسرار وفصل مفاتيح التشفير (Enterprise Secrets Management & Key Rotation)

في بيئة الإنتاج الحقيقية، **يُحظر تماماً حفظ مفاتيح التشفير أو أسرار JWT داخل ملفات `.env` على نظام ملفات الخادم**. يجب حقن المتغيرات البيئية مباشرة في ذاكرة المعالجة (Process Memory) بواسطة منصة متخصصة لإدارة الأسرار.

### 1. منصات إدارة الأسرار المعتمدة
- **Doppler (موصى به للبساطة وسرعة الربط):**
  ```bash
  # تثبيت Doppler CLI على الخادم
  curl -Ls --tlsv1.2 --proto "=https" https://cli.doppler.com/install.sh | sudo sh

  # تسجيل الدخول وتحديد بيئة الإنتاج
  doppler login
  doppler setup --project tiger-workspace --config prd

  # تشغيل الخادم بحقن الأسرار مباشرة في الذاكرة دون أي ملف .env على القرص
  doppler run -- node dist/server.js
  # أو مع PM2
  doppler run -- pm2 start dist/server.js --name tiger-crm
  ```
- **HashiCorp Vault (للبنى التحتية الخاصة Enterprise On-Prem / Hybrid):**
  - تفعيل محرك KV v2 وتخزين الأسرار تحت المسار `secret/data/tiger/production`.
  - استخدام `vault-agent` أو AppRole لتمرير الـ Token وتشغيل الحاوية دون تخزين دائم للأسرار.
- **مزودو الاستضافة المدارون (AWS Secrets Manager / GCP Secret Manager / Render Secrets):**
  - ضبط المتغيرات كـ Environment Secrets مباشرة في لوحة التحكم وتفعيل التشفير أثناء النقل والراحة (KMS).

### 2. مفاتيح التشفير الأربعة المنفصلة (Cryptographic Key Separation)
النظام يعتمد على 4 مفاتيح 256-bit منفصلة تماماً ومستقلة:
1. `PHONE_ENCRYPTION_KEY`: تشفير أرقام هواتف العملاء (AES-256-GCM) مع تجزئة SHA-256 مفهرسة.
2. `SALARY_ENCRYPTION_KEY`: تشفير رواتب الموظفين والبدلات ومبالغ الخصومات الحساسة.
3. `FACE_EMBEDDING_ENCRYPTION_KEY`: تشفير متجهات بصمة الوجه (64-float cosine vector) بمعزل تام عن باقي البيانات.
4. `BACKUP_ENCRYPTION_KEY`: تشفير النسخ الاحتياطية المضغوطة لقاعدة البيانات باستخدام OpenSSL AES-256-CBC وPBKDF2.

### 3. دليل تدوير المفاتيح الدوري (Zero-Downtime Key Rotation Procedure)
لإجراء تدوير دوري لمفاتيح التشفير (كل 180 يوماً أو فور الاشتباه بأي تسريب):
1. **توليد المفتاح الجديد:** توليد مفتاح 64-char hex عشوائي آمن وحفظه كـ `NEW_<KEY_NAME>`.
2. **تشغيل سكربت إعادة التشفير المزدوج (Dual-Key Migration):**
   - قراءة السجل القديم وفك تشفيره باستخدام المفتاح الحالي (`OLD_KEY`).
   - إعادة تشفيره فوراً بالمفتاح الجديد (`NEW_KEY`) وتحديث الحقل في قاعدة البيانات.
   - التحقق من سلامة فك التشفير لكافة السجلات (Assert Checksum / Test Decryption).
3. **تحديث المفتاح في Doppler/Vault:** تعيين `KEY_NAME = NEW_KEY` وحذف المفتاح القديم.
4. **إعادة تشغيل التطبيق بنظام Graceful Reload:** (`pm2 reload tiger-crm`).

---

## 🛡️ طبقات الحماية وقائمة الفحص الأمني (Defense in Depth)

وثائق الامتثال والحماية المتقدمة متوفرة في الملفات المخصصة التالية:
- 📋 [**بوابة الجاهزية للإنتاج وفحص الاعتماد (SECURITY_CHECKLIST.md)**](file:///SECURITY_CHECKLIST.md): تفصيل دقيق لما تم اختباره برمجياً وما يتطلب إجراءات تشغيلية وبشرية مع جدول التوقيع الإلزامي قبل فتح النظام للإنتاج.
- 👤 [**تقييم الأثر على حماية البيانات الحيوية (DPIA.md)**](file:///DPIA.md): توثيق تقني وقانوني لمعالجة بصمات الوجه، الموافقة الطوعية، والبدائل المتاحة.
- 🚨 [**خطة الاستجابة للطوارئ والاختراقات (INCIDENT_RESPONSE.md)**](file:///INCIDENT_RESPONSE.md): تصنيف الحوادث (SEV-1 إلى SEV-4)، إجراءات الاحتواء في أقل من 15 دقيقة، وإشعار المتضررين خلال 72 ساعة.

### جدول مصفوفة الضوابط الأمنية المتكاملة

| المتطلب الأمني | آلية التنفيذ البرمجية | المسار الدقيق للملف |
| :--- | :--- | :--- |
| **فصل مفاتيح التشفير (Key Separation)** | 4 مفاتيح 256-بت منفصلة للهواتف والرواتب والبصمات والنسخ الاحتياطي | [`server/src/utils/crypto.ts`](file:///server/src/utils/crypto.ts) \| [`server/src/utils/faceMath.ts`](file:///server/src/utils/faceMath.ts) |
| **تعقيم السجلات (Log Redaction)** | حجب تلقائي لكلمات المرور وأرقام الهواتف والرواتب والبصمات والتوكنات من Console | [`server/src/middlewares/logRedactor.ts`](file:///server/src/middlewares/logRedactor.ts) |
| **فحص كلمات المرور المسربة (HIBP)** | فحص آمن عبر k-anonymity لمنع استخدام أي كلمة مرور مسربة عالمياً | [`server/src/utils/pwnedPassword.ts`](file:///server/src/utils/pwnedPassword.ts) \| [`server/src/services/auth.service.ts`](file:///server/src/services/auth.service.ts) |
| **حذف البصمات التلقائي (Biometric Purge)** | مهمة خلفية مجدولة تحذف بصمات المفصولين ومن ألغوا موافقتهم بعد 24 ساعة | [`server/src/jobs/biometricPurge.job.ts`](file:///server/src/jobs/biometricPurge.job.ts) |
| **تنبيه الأجهزة الجديدة للحسابات الحساسة** | كشف وتسجيل فوري لمحاولات الدخول من عناوين IP أو متصفحات جديدة للإداريين | [`server/src/services/auth.service.ts`](file:///server/src/services/auth.service.ts) |
| **عزل شبكة وصلاحيات قاعدة البيانات** | سكربت حصر الصلاحيات لمستخدم التطبيق `tiger_app` و`tiger_readonly` | [`scripts/init-db-roles.sql`](file:///scripts/init-db-roles.sql) |
| **تحصين خادم الإنتاج (VPS Hardening)** | سكربت أتمتة إغلاق SSH root وكلمات المرور، وجدار ناري UFW، وfail2ban | [`scripts/setup-vps-security.sh`](file:///scripts/setup-vps-security.sh) |
| **حجب الأصل وتكامل Cloudflare WAF** | إعداد Nginx يقصر قبول الزيارات على نطاقات IPs الخاصة بـ Cloudflare | [`scripts/cloudflare-nginx.conf`](file:///scripts/cloudflare-nginx.conf) |
| **أمن سلسلة التوريد (Supply Chain & SAST)** | مسار GitHub Actions لفحص الحزم، فحص CodeQL، ومسح ثغرات صور Docker عبر Trivy | [`.github/workflows/security-ci.yml`](file:///.github/workflows/security-ci.yml) |
| **نسخ احتياطي مشفر ومختبر (Backup & Restore)** | سكربت تشفير AES-256-CBC مع فحص استعادة تلقائي في قاعدة بيانات تجريبية | [`scripts/backup-database.sh`](file:///scripts/backup-database.sh) \| [`scripts/restore-test.sh`](file:///scripts/restore-test.sh) |
| **مصادقة WebSocket Handshake** | فحص JWT في مصافحة Socket.io ورفض أي اتصال غير مصرح | [`server/src/socket.ts`](file:///server/src/socket.ts) |
| **تعقيم المدخلات ضد XSS** | تجريد ونزع وسوم `<script>` والسمات الخطرة من رسائل الشات والملاحظات | [`server/src/utils/sanitize.ts`](file:///server/src/utils/sanitize.ts) |
| **منع إغراق الشات (Chat Rate Limit)** | تحديد 10 رسائل/دقيقة لكل مستخدم برفض الطلب الحادي عشر بكود `429` | [`server/src/middlewares/rateLimiter.ts`](file:///server/src/middlewares/rateLimiter.ts) |
| **منع تكرار الحضور والانصراف** | فحص حالة الحضور والخروج مسبقاً مع قيد `@@unique([userId, date])` | [`server/src/services/attendance.service.ts`](file:///server/src/services/attendance.service.ts) |
| **حماية الـ CSRF** | نمط Double Submit Cookie عبر الـ Header `x-csrf-token` | [`server/src/middlewares/csrfProtection.ts`](file:///server/src/middlewares/csrfProtection.ts) |
| **عزل البيانات ومنع IDOR** | ربط كافة العمليات بـ `req.user.id` مع سياسات RLS | [`server/src/middlewares/authenticate.ts`](file:///server/src/middlewares/authenticate.ts) |
| **المصادقة الثنائية (2FA TOTP)** | توليد أسرار TOTP وQR Code والتحقق من رموز الـ 6 أرقام | [`server/src/utils/totp.ts`](file:///server/src/utils/totp.ts) |
| **سجل التدقيق (Audit Logs)** | توثيق كامل للعمليات الحساسة مع عنوان الـ IP والـ User-Agent | [`server/src/repositories/audit.repository.ts`](file:///server/src/repositories/audit.repository.ts) |

---

## 🚀 خطوات النشر والإنتاج

### 1. النشر باستخدام Docker Compose
تشغيل النظام بالكامل متضمناً قاعدة بيانات PostgreSQL، خادم Express مع محرك Socket.io، وواجهة React عبر Nginx:
```bash
docker-compose up -d --build
```

---

---

### 2. النشر على خادم VPS مستقل وتحصين البنية التحتية (Hardened Ubuntu VPS)

لضمان تحصين الخادم قبل استقبال بيانات حقيقية، تم إعداد حزمة سكربتات أتمتة متكاملة داخل مجلد `scripts/`:

#### أ) تشغيل سكربت تحصين الخادم (Automated VPS Hardening):
```bash
chmod +x scripts/setup-vps-security.sh
sudo ./scripts/setup-vps-security.sh
```
يقوم السكربت بالمهام التالية تلقائياً:
- تعطيل تسجيل الدخول بحساب `root` عبر SSH وإلغاء تسجيل الدخول بكلمات المرور (`PasswordAuthentication no`).
- تفعيل جدار الحماية `UFW` وإغلاق المنافذ الداخلية (منفذ PostgreSQL 5432 ومنفذ Node 5000) مع السماح فقط بـ 80 و443 وSSH.
- تثبيت وتفعيل `fail2ban` لمنع محاولات التخمين والاختراق العنيف (Brute Force).
- تفعيل التحديثات الأمنية التلقائية عبر `unattended-upgrades`.

#### ب) عزل صلاحيات قاعدة البيانات (Least Privilege Roles):
```bash
# تنفيذ سكربت إنشاء المستخدمين ذوي الصلاحيات المحدودة في PostgreSQL:
sudo -u postgres psql -d tiger_db -f scripts/init-db-roles.sql
```
- ينشئ مستخدم التطبيق `tiger_app` بصلاحيات `SELECT, INSERT, UPDATE, DELETE` فقط مع حظر صلاحيات Superuser وحذف الجداول.
- ينشئ مستخدم القراءة والتحليلات `tiger_readonly` بصلاحيات `SELECT` فقط.

#### ج) حجب الأصل وNginx مع Cloudflare WAF (Origin Cloaking):
استخدم التكوين الجاهز في [`scripts/cloudflare-nginx.conf`](file:///scripts/cloudflare-nginx.conf):
```bash
sudo cp scripts/cloudflare-nginx.conf /etc/nginx/sites-available/tiger-crm
sudo ln -s /etc/nginx/sites-available/tiger-crm /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
- يستقبل الاتصالات فقط من خوادم Cloudflare الأصلية (يقفل الوصول المباشر عبر IP السيرفر).
- يستعيد IP الحقيقي للزائر عبر ترويسة `CF-Connecting-IP`.
- يفرض بروتوكول TLS 1.2+ مع ترويسات HSTS الصارمة ويدعم WebSocket الشات والحضور.

#### د) خط أنابيب النسخ الاحتياطي المشفر والتحقق من الاستعادة (Backup & Restore Verification):
```bash
# 1. أخذ نسخة احتياطية مشفرة بـ AES-256-CBC:
BACKUP_ENCRYPTION_KEY="your_64_char_hex_key" ./scripts/backup-database.sh

# 2. إجراء اختبار استعادة دوري للتحقق من سلامة البيانات:
BACKUP_ENCRYPTION_KEY="your_64_char_hex_key" ./scripts/restore-test.sh /var/backups/tiger/tiger_backup_YYYYMMDD_HHMMSS.sql.enc
```
- يمكنك جدولة السكربت كـ Cron Job يومي الساعة 2:00 صباحاً مع رفع تلقائي إلى S3 / Wasabi مع خاصية WORM (Object Lock).

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
