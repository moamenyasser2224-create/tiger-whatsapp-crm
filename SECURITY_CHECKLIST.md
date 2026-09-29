# Tiger Workspace Platform — Enterprise Security Checklist & Go-Live Gate

**Document Version:** 2.0 (Defense in Depth Enterprise Edition)  
**System:** Tiger Workspace Platform & WhatsApp CRM  
**Classification:** Confidential / Regulatory & Operational Standard  
**Last Audit Date:** September 2026  

---

> [!CAUTION]
> **MANDATORY PRODUCTION GATEWAY**  
> Under no circumstances may real production data—particularly real employee compensation figures (salaries/deductions) or biometric facial embeddings—be ingested, stored, or processed until every operational sign-off item in Section 2 is verified and formally executed by authorized leadership in Section 3.

---

## 1. Code-Level Defense in Depth (Implemented & Automated)

The following controls have been fully engineered, integrated into the source codebase, and verified via automated test suites and static analysis.

| Ref | Control Domain | Technical Implementation | Code Location | Status |
| :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | **Cryptographic Key Separation** | 4 distinct 256-bit encryption keys (`PHONE_ENCRYPTION_KEY`, `SALARY_ENCRYPTION_KEY`, `FACE_EMBEDDING_ENCRYPTION_KEY`, `BACKUP_ENCRYPTION_KEY`) parsed via strict Zod schema. Fallback logic preserves backward-compatibility while isolating sensitive domains. | [`server/src/config/env.ts`](file:///server/src/config/env.ts)<br>[`server/src/utils/crypto.ts`](file:///server/src/utils/crypto.ts)<br>[`server/src/utils/faceMath.ts`](file:///server/src/utils/faceMath.ts) | `PASS (Automated)` |
| **SEC-02** | **Log Redaction & Safe Observability** | Global console sanitizer (`logRedactor.ts`) and Express middleware scrub sensitive fields (`password`, `phone`, `embedding`, `salary`, `accessToken`, `refreshToken`, `token`) from stdout, stderr, and external logging transports. | [`server/src/middlewares/logRedactor.ts`](file:///server/src/middlewares/logRedactor.ts)<br>[`server/src/app.ts`](file:///server/src/app.ts) | `PASS (Automated)` |
| **SEC-03** | **Biometric Isolation & Auto-Purge** | Biometric facial embeddings are encrypted under isolated keys. Automated daily background job purges revoked or terminated employee biometric records following a strict 24-hour grace period with full audit logging. | [`server/src/jobs/biometricPurge.job.ts`](file:///server/src/jobs/biometricPurge.job.ts)<br>[`server/src/jobs/index.ts`](file:///server/src/jobs/index.ts)<br>[`server/src/server.ts`](file:///server/src/server.ts) | `PASS (Automated)` |
| **SEC-04** | **Data Protection Impact Assessment** | Comprehensive regulatory DPIA documenting biometric scope, non-reversibility of 64-float vectors, voluntary opt-in, non-biometric fallback procedures, and GDPR / statutory compliance safeguards. | [`DPIA.md`](file:///DPIA.md) | `DOCUMENTED` |
| **SEC-05** | **Password Leakage Prevention (HIBP)** | Integration with Have I Been Pwned API utilizing k-anonymity (SHA-1 prefix matching). Rejects breached passwords on registration, password reset, and password modification with fail-open timeout resilience. | [`server/src/utils/pwnedPassword.ts`](file:///server/src/utils/pwnedPassword.ts)<br>[`server/src/services/auth.service.ts`](file:///server/src/services/auth.service.ts) | `PASS (Automated)` |
| **SEC-06** | **Privileged Account Anomaly Alerting** | Automated detection and logging of logins from unrecognized IP addresses or user agents for privileged roles (`admin`, `hr`, `owner`), alerting operations teams of potential credential takeover. | [`server/src/services/auth.service.ts`](file:///server/src/services/auth.service.ts) | `PASS (Automated)` |
| **SEC-07** | **Database Least-Privilege Architecture** | SQL initialization script establishing restricted application role (`tiger_app` with schema-specific CRUD) and dedicated analytics role (`tiger_readonly`), revoking superuser and public access. | [`scripts/init-db-roles.sql`](file:///scripts/init-db-roles.sql) | `READY TO DEPLOY` |
| **SEC-08** | **Host Hardening Automation** | Production VPS configuration script automating SSH hardening (key-only authentication, disabled root login), UFW firewall isolation (blocking database and application ports directly), fail2ban, and unattended security updates. | [`scripts/setup-vps-security.sh`](file:///scripts/setup-vps-security.sh) | `READY TO DEPLOY` |
| **SEC-09** | **Cloudflare Origin Cloaking & WAF** | Nginx reverse proxy configuration strictly accepting traffic from Cloudflare IP ranges, restoring visitor IPs (`CF-Connecting-IP`), enforcing TLS 1.2+, HSTS, and rate-limiting WebSocket handshakes. | [`scripts/cloudflare-nginx.conf`](file:///scripts/cloudflare-nginx.conf) | `READY TO DEPLOY` |
| **SEC-10** | **Immutable Build & Minimal Runtime** | Multi-stage Dockerfile enforcing clean, repeatable dependency installs (`npm ci --omit=dev`), discarding build tools, and running unprivileged as `node:node`. | [`Dockerfile`](file:///Dockerfile) | `PASS (Docker)` |
| **SEC-11** | **Supply Chain Security & SAST Pipeline** | GitHub Actions workflow executing `npm audit --audit-level=high`, Vitest unit/integration testing, GitHub CodeQL semantic SAST scanning, and Aqua Security Trivy container CVE vulnerability analysis. | [`.github/workflows/security-ci.yml`](file:///.github/workflows/security-ci.yml) | `PASS (CI Pipeline)` |
| **SEC-12** | **Cryptographic Backup Pipeline** | Automated backup script performing streaming compression and OpenSSL AES-256-CBC encryption via `BACKUP_ENCRYPTION_KEY` with PBKDF2 iterations, SHA-256 checksum generation, and remote transfer hooks. | [`scripts/backup-database.sh`](file:///scripts/backup-database.sh) | `VERIFIED` |
| **SEC-13** | **Automated Restore Verification** | Test automation script verifying backup integrity by decrypting, restoring into an ephemeral scratch database, asserting row counts, and sanitizing test artifacts. | [`scripts/restore-test.sh`](file:///scripts/restore-test.sh) | `VERIFIED` |
| **SEC-14** | **Incident Response Standard (IRP)** | Enterprise incident classification (SEV-1 through SEV-4), 15-minute containment protocols, role-based escalation tree, forensic preservation steps, and 72-hour regulatory notification templates. | [`INCIDENT_RESPONSE.md`](file:///INCIDENT_RESPONSE.md) | `DOCUMENTED` |

---

## 2. Operational & Human Pre-Production Gate (Required Before Launch)

The following actions cannot be verified by source code alone. Each operational item must be executed by the designated team member on production infrastructure and signed off prior to production switch-on.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRODUCTION GO-LIVE OPERATIONAL GATE                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────┬───────┴───────────────┬────────────────────┐
    ▼                       ▼                       ▼                    ▼
[Infra Hardening]     [Secrets Sync]         [Database Roles]    [Backup Dry Run]
UFW / Cloudflare      Doppler / Vault        tiger_app CRUD      Restore into test
```

### Checklist Matrix

| Gate ID | Operational Task | Verification Criteria | Responsible Role | Sign-Off Date | Status |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **OPS-01** | **Production Secret Management Provisioning** | Migrate all keys from local `.env` files into a centralized secret manager (Doppler, HashiCorp Vault, or AWS Secrets Manager). Ensure zero `.env` files exist on the host filesystem. | DevOps / SecOps | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-02** | **Cryptographic Key Generation** | Generate four independent, cryptographically random 256-bit hex keys for `PHONE_ENCRYPTION_KEY`, `SALARY_ENCRYPTION_KEY`, `FACE_EMBEDDING_ENCRYPTION_KEY`, and `BACKUP_ENCRYPTION_KEY`. Ensure no key reuse across domains. | SecOps Lead | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-03** | **PostgreSQL Private VPC Isolation** | Confirm PostgreSQL instance is bound to the private internal VPC IP address only. Confirm external port `5432` is closed to the public internet using an external port scan (`nmap -p 5432 <PUBLIC_IP>`). | Infrastructure Lead | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-04** | **Database Least-Privilege Role Provisioning** | Execute [`scripts/init-db-roles.sql`](file:///scripts/init-db-roles.sql) against production PostgreSQL. Verify the application connects exclusively as `tiger_app` and cannot perform administrative DDL or alter database ownership. | Lead DBA | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-05** | **VPS Host Lockdown Execution** | Execute [`scripts/setup-vps-security.sh`](file:///scripts/setup-vps-security.sh) on production server. Verify root SSH login is disabled, password authentication is rejected, UFW denies ports `5000` and `5432`, and `fail2ban` service is active. | System Admin | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-06** | **Cloudflare Origin Cloaking & WAF Configuration** | Point domain DNS to Cloudflare with proxying enabled (Orange Cloud). Enable Cloudflare Web Application Firewall (WAF) managed rules. Configure Nginx with [`scripts/cloudflare-nginx.conf`](file:///scripts/cloudflare-nginx.conf) to reject requests not originating from Cloudflare edge IP ranges. | DevOps Lead | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-07** | **Zero Generic Admin Accounts Enforced** | Confirm all generic or default accounts (e.g., `admin@example.com`, `admin`, `root`) are deleted or deactivated. Confirm every administrator and HR manager has an individual named account with mandatory 2FA enabled. | Security Officer | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-08** | **Backup & Disaster Recovery Dry Run** | Execute [`scripts/backup-database.sh`](file:///scripts/backup-database.sh) followed by [`scripts/restore-test.sh`](file:///scripts/restore-test.sh) on a dedicated staging/restoration VM. Verify decrypted data restores cleanly without errors. | DevOps / DBA | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-09** | **Offsite Backup Storage Immutability (WORM)** | Confirm backup destination bucket (e.g., AWS S3 or Wasabi) is configured with Object Lock (WORM - Write Once, Read Many) with a 30-day retention policy to prevent ransomware deletion. | Cloud Architect | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-10** | **Biometric Policy & Consent Distribution** | Distribute voluntary biometric enrollment policy to all participating employees. Confirm digital/physical opt-in consent records are cataloged in HR records according to [`DPIA.md`](file:///DPIA.md). | HR & Legal / DPO | `YYYY-MM-DD` | `[ ] PENDING` |
| **OPS-11** | **Incident Response Notification Chain Verification** | Verify emergency contact details in [`INCIDENT_RESPONSE.md`](file:///INCIDENT_RESPONSE.md). Confirm emergency communication channel (e.g., dedicated Signal group or out-of-band bridge) is configured and active. | Incident Lead | `YYYY-MM-DD` | `[ ] PENDING` |

---

## 3. Formal Go-Live Sign-Off & Authorization Table

Real operational data may only be populated after formal sign-off by all three designated authorities:

### Technical Lead / Chief Technology Officer (CTO)
- [ ] I confirm that all code-level security controls, cryptographic key separation, database roles, and CI/CD pipelines have been implemented, tested, and validated.
- **Name:** ___________________________
- **Signature:** ________________________
- **Date:** _____________________________

### Data Protection Officer (DPO) / Legal Compliance Officer
- [ ] I confirm that the Data Protection Impact Assessment (DPIA) has been reviewed, employee voluntary consent procedures are established, biometric alternatives are in place, and automated purge workflows comply with applicable statutory standards.
- **Name:** ___________________________
- **Signature:** ________________________
- **Date:** _____________________________

### Infrastructure & Operations Lead / System Administrator
- [ ] I confirm that host hardening, VPC isolation, Cloudflare origin cloaking, Doppler/Vault secret syncing, and disaster recovery restore tests have been executed and verified in the production environment.
- **Name:** ___________________________
- **Signature:** ________________________
- **Date:** _____________________________

---

## 4. Annual & Periodic Security Audit Schedule

| Activity | Frequency | Responsible Party | Output Artifact |
| :--- | :--- | :--- | :--- |
| **Automated Restore Drill** | Weekly (Automated) / Monthly (Manual) | Lead DBA & DevOps | Verification log in `/var/log/tiger-backups/` |
| **Cryptographic Key Rotation Drill** | Every 180 Days | SecOps & Tech Lead | Key Rotation Audit Record |
| **Static & Dynamic Vulnerability Assessment** | Bi-monthly | Security Team | GitHub Security Center / Trivy Report |
| **Biometric Consent & Purge Audit** | Quarterly | HR Compliance & DPO | Biometric Compliance Register |
| **Incident Response Simulation (Tabletop)** | Annually | Executive Incident Team | Tabletop Post-Mortem Report |
