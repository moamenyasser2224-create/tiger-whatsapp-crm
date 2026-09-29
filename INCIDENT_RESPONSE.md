# Tiger Workspace CRM — Security Incident Response Plan (IRP)
**Classification:** Restricted / Enterprise Operational Standard  
**Document Version:** 2.0 (Defense in Depth)  
**Effective Date:** September 2026  
**Review Frequency:** Bi-annual  

---

## 1. Incident Classification Levels

| Severity Level | Definition | Examples | SLA to Contain |
| :--- | :--- | :--- | :---: |
| **SEV-1 (Critical)** | Confirmed compromise of database, encryption keys, or sensitive customer/staff PII (salaries, biometrics). | Attacker gained shell on host, unauthorized database dump exported, secrets leaked in public repository. | **< 15 Minutes** |
| **SEV-2 (High)** | Active exploitation attempt, compromised individual staff credential without lateral movement, DDoS outage. | Multiple credential stuffing successes, brute force bypass, Cloudflare WAF high-frequency alerts. | **< 1 Hour** |
| **SEV-3 (Medium)** | Suspicious anomaly detected; no confirmed data breach. | Repeated failed logins on privileged accounts, abnormal rate-limit spikes from single IP, scanner probes. | **< 4 Hours** |
| **SEV-4 (Low)** | Minor security alert or policy violation. | Unintentional debug logging in staging, dependency alert for non-critical package with available patch. | **< 24 Hours** |

---

## 2. Immediate Containment Checklist (First 15 Minutes)

When a SEV-1 or SEV-2 incident is declared, execute the following containment actions immediately:

```
┌────────────────────────────────────────────────────────┐
│               INCIDENT TRIGGER DETECTED                │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 [1. Isolate Host]   [2. Invalidate Sessions]  [3. Rotate Secrets]
 UFW emergency lock  Revoke all Refresh Tokens Rotate Doppler/Vault
```

### Action 2.1: Isolate Server at Network Level
Prevent attacker command-and-control (C2) or data exfiltration without destroying forensic memory:
```bash
# Emergency firewall lockdown on host VPS:
sudo ufw default deny incoming
sudo ufw default deny outgoing
# Keep only trusted administrative IP for investigation:
sudo ufw allow from <YOUR_TRUSTED_STATIC_IP> to any port 22 proto tcp
sudo ufw reload
```

### Action 2.2: Invalidate All Active Sessions Immediately
Terminate all active user sessions and refresh tokens across the entire database:
```sql
-- Connect to database and immediately revoke all active refresh tokens
UPDATE refresh_tokens SET revoked = true WHERE revoked = false;

-- Invalidate password reset tokens
UPDATE password_reset_tokens SET used = true WHERE used = false;
```

### Action 2.3: Emergency Secrets & Key Rotation
If `JWT_ACCESS_SECRET` or any encryption key is suspected to be exposed:
1. In Doppler / HashiCorp Vault:
   - Generate new random 64-char hex strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
   - Update `DATABASE_URL` with new database user credentials.
2. Restart backend processes (`pm2 restart all` or `systemctl restart tiger-backend` or `docker compose restart backend`) to ingest new secrets.
3. Every active user will be forced to re-authenticate immediately.

---

## 3. Escalation Tree & Order of Notification

All notifications must proceed in the strict designated hierarchy below:

```
[1. Incident Commander / Tech Lead]
               │
               ▼
[2. Chief Information Security Officer (CISO) / Security Lead]
               │
               ▼
[3. Executive Management / Managing Director]
               │
               ▼
[4. Corporate Legal Counsel / DPO]
               │
       ┌───────┴───────┐
       ▼               ▼
[5. Regulatory Bodies]  [6. Affected Employees / Customers]
(within 72 hours)      (immediate if sensitive data compromised)
```

### Notification Contacts Directory
- **Incident Lead:** `lead-engineer@tiger-workspace.com` | Tel: +20 100 000 0001
- **Security Officer / CISO:** `security@tiger-workspace.com` | Tel: +20 100 000 0002
- **Corporate Legal & DPO:** `legal@tiger-workspace.com` | Tel: +20 100 000 0003

---

## 4. Statutory Notification Obligations (Affected Staff & Customers)

Under statutory data protection obligations (including GDPR Article 33/34 and Egyptian Data Protection Law No. 151/2020):

### 4.1 Statutory Notification Window
If an incident involves an unauthorized disclosure or theft of **sensitive personal data** (specifically **biometric mathematical embeddings** or **salary/payroll records**):
1. **Regulator Notification:** The supervisory data protection authority must be notified within **72 hours** of becoming aware of the breach.
2. **Individual Notification:** Affected employees and customers must be notified **without undue delay** if the breach poses a high risk to their rights and freedoms.

### 4.2 Standard Breach Notification Template
```markdown
Subject: Urgent Security Notice: Investigation and Protection of Your Tiger Account

Dear [Employee/Customer Name],

We are writing to inform you of a recent security incident that may have involved some of your personal data on the Tiger Workspace platform.

What Happened:
On [Date], our security monitoring detected unauthorized activity involving [describe incident scope, e.g., an unauthorized attempt to access database records]. Within [X minutes], our team isolated the system, revoked all active authentication sessions, and rotated all security keys.

What Data Was Involved:
- [Specify: e.g., name, phone number, salary statement records]
- [Specify status of biometric data: e.g., Biometric facial vectors are encrypted under AES-256-GCM with separate isolated keys, and our forensics indicate no plaintext facial images exist on our servers].

What We Have Done:
- All active sessions and tokens were immediately revoked.
- Server access rules and firewalls were completely locked down.
- Additional WAF rate-limiting and intrusion detection controls were deployed.

What You Should Do:
- When logging in again, you will be prompted to reset your password.
- Please do not reuse passwords across multiple corporate or personal accounts.
- If you utilize 2FA (Google Authenticator), your authenticator remains fully secure.

For questions or assistance, contact our dedicated security team at security@tiger-workspace.com.
```

---

## 5. Forensic Preservation & Root Cause Analysis (RCA)

Before applying patches or rebooting servers:
1. **Preserve Volatile Memory:** Dump RAM if possible (`lime` or `dd` of `/proc/kcore`).
2. **Snapshot Server Disk:** Create immediate cloud snapshot in your VPS provider (Hetzner, AWS, DigitalOcean) for offline forensics.
3. **Export Audit Logs:** Export `audit_logs` table records for the 7 days preceding the incident.
4. **Inspect WAF / Cloudflare Logs:** Review Cloudflare HTTP request logs for exploit payloads and attacker IPs.

---

## 6. Recovery & Clean Re-deployment

1. Validate root cause patch (e.g. patched dependency, corrected firewall rule, SQL parameterization).
2. Execute automated restore test in an isolated scratch environment:
   ```bash
   ./scripts/restore-test.sh
   ```
3. Deploy new container image with `npm ci` lockfile guarantee.
4. Conduct progressive traffic enablement through Cloudflare.
5. Post-Incident Review meeting within 5 business days; document formal Post-Mortem.
