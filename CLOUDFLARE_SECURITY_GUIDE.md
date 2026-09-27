# 🛡️ دليل الحماية السحابية الشاملة وتكوين Cloudflare WAF لنظام تايجر CRM

يوضح هذا الدليل كيفية تفعيل وتطبيق أعلى معايير الحماية السحابية (Enterprise-Grade Cloud Protection) لنظام **تايجر CRM** عند ربطه مع Cloudflare أو أي مزود سحابي آخر (AWS CloudFront / Google Cloud Armor / Nginx).

---

## 1. الحمايات المفعلة برمجياً داخل النظام (In-App Cloud Shield)

تم بناء وتفعيل طبقات حماية مدمجة داخل كود الخادم تعمل تلقائياً على مدار الساعة:

1. **التعرف المباشر على عنوان العميل الحقيقي (Real Cloud Client IP Extraction):**
   - يدعم استخراج وتحليل ترويسات `CF-Connecting-IP`, `True-Client-IP`, `X-Forwarded-For`.
   - منع تزوير الـ IP أو محاولات الالتفاف على محددات الطلب (Rate Limiting).
2. **جدار حماية تطبيقات الويب السحابي المدمج (In-App Cloud WAF):**
   - **حظر أدوات الفحص والاختراق الآلية (Vulnerability Scanners Block):** حظر فوري لأدوات مثل `sqlmap`, `nikto`, `masscan`, `acunetix`, `dirbuster`, `gobuster`, `wpscan`, وغيرها برمز `403 Forbidden`.
   - **حظر محاولات حقن قواعد البيانات (SQL Injection Filter):** فحص عميق للروابط والمدخلات وفك ترميز URL لكشف أي محاولات تخريبية.
   - **حظر محاولات اختراق المسارات (Path Traversal Guard):** حظر محاولات استهداف ملفات النظام الحساسة مثل `../`, `..\`, `/etc/passwd`.
   - **حظر استهداف المسارات المفخخة (Honeypot & Exploit Probing):** حظر الطلبات الموجهة إلى `/.env`, `/.git`, `/wp-admin`, `/phpmyadmin`, `/xmlrpc.php`.
3. **حماية التلوث البرمجي والمدخلات (Prototype & Parameter Pollution Guards):**
   - فحص شجري لمنع حقن كائنات `__proto__`, `constructor`, `prototype`.
   - تنظيف وتوحيد معلمات الاستعلام لمنع هجمات HPP.
4. **ترويسات الأمان السحابية الصارمة (Enterprise Security Headers):**
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (إلزام HTTPS لمدة سنتين).
   - `Content-Security-Policy (CSP)` معتمد لعزل المصادر ومنع ثغرات XSS.
   - `X-Frame-Options: SAMEORIGIN` (منع Clickjacking).
   - `X-Content-Type-Options: nosniff` (منع MIME-sniffing).
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.
5. **نظام الدفاع التكيفي وتجميد الحسابات (Cloud Brute-Force & Lockout Defense):**
   - تقييد معدل تسجيل الدخول بـ 5 محاولات في الدقيقة لكل IP.
   - عند تكرار 5 محاولات خاطئة لنفس الحساب أو الـ IP، يتم **تجميد الحساب تلقائياً لمدة 15 دقيقة** لحمايته من هجمات القوة الغاشمة (Brute-force).
   - تسجيل كافة المحاولات المشبوهة في سجل التدقيق المنيع (`AuditLog`).
6. **مكافحة هجمات حجب الخدمة البطيئة (Anti-Slowloris & Connection Exhaustion):**
   - مهلة استجابة 30 ثانية للطلبات المعلقة.
   - تحديد سقف الرؤوس (Headers Limit) بـ 100 رأس لمنع إغراق الذاكرة.
   - سقف حجم البيانات بـ 1MB لمنع استهلاك الموارد.

---

## 2. إعدادات Cloudflare الموصى بها لأعلى حماية (High Security Preset)

إذا قمت بربط الدومين الخاص بك عبر Cloudflare، يرجى تفعيل الخيارات التالية:

### أ. شهادة التشفير (SSL/TLS)
* **Encryption Mode:** اختر **Full (Strict)** لضمان تشفير حركة المرور بالكامل بين العميل و Cloudflare وبين Cloudflare وخادمك.
* **Minimum TLS Version:** اختر **TLS 1.2** (أو TLS 1.3).
* **Always Use HTTPS:** مفعل (Enabled).
* **Automatic HTTPS Rewrites:** مفعل (Enabled).

### ب. قواعد جدار الحماية (WAF Custom Rules)
قم بإضافة القواعد التالية في تبويب **Security > WAF**:
1. **Rule 1: Block High Threat Countries or Known Tor/VPNs (اختياري)**:
   - Action: `Managed Challenge`
   - Field: `Threat Score greater than 20`
2. **Rule 2: Protect Sensitive API Endpoints**:
   - Field: `URI Path starts with "/api/auth/"`
   - Rate: `5 requests per 1 minute`
   - Action: `Block` أو `Managed Challenge`

### ج. حماية البوتات (Bots Protection)
* **Bot Fight Mode:** تفعيل (Enabled) - لحجب عناكب البحث الضارة والبوتات المزعجة تلقائياً.

### د. حماية حجب الخدمة (DDoS Mitigation)
* في تبويب **Security > DDoS**، تأكد من ضبط الحساسية على **High**.
* في حال التعرض لهجوم كبير ومفاجئ، يمكن تفعيل وضع **Under Attack Mode** بضغطة زر واحدة.

---

## 3. التحقق من صحة الحماية
يمكنك فحص حالة الحماية السحابية في أي وقت من خلال استدعاء نقطة الفحص:
`GET /api/health`
والتي سترد بما يلي:
```json
{
  "status": "healthy",
  "cloudProtection": "active",
  "timestamp": "2026-09-27T23:25:00.000Z",
  "environment": "production",
  "clientIp": "198.51.100.42"
}
```
