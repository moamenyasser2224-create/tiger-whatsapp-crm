# Data Protection Impact Assessment (DPIA)
## Facial Biometric Feature Extraction & Processing System
**Entity:** Tiger Workspace Platform  
**System:** High-Speed Time & Attendance Biometric Authentication Module  
**Document Version:** 2.0 (Defense in Depth Enterprise Edition)  
**Date:** September 2026  
**Status:** Approved for Implementation  

---

> [!CAUTION]
> **Regulatory Notice & Disclaimer**  
> This Data Protection Impact Assessment (DPIA) documents technical controls, data flows, and cryptographic safeguards implemented in code. It serves as a technical compliance framework and does **not** substitute for formal legal counsel or statutory legal review under specific national jurisdictions (e.g., EU GDPR Regulation 2016/679, Egyptian Data Protection Law No. 151/2020, or regional labor regulations).

---

## 1. Executive Summary & Purpose of Processing

The Tiger Workspace platform processes biometric facial geometry for the sole purpose of:
1. **Physical Presence Verification:** Ensuring that shift clock-in and clock-out timestamps correspond to the physical presence of the enrolled employee, mitigating timestamp manipulation ("buddy punching").
2. **Step-Up Authentication (2FA Fallback):** Providing authorized staff with an ephemeral cryptographic verification method in high-throughput workplace environments.

At no point is biometric data used for emotion detection, demographic profiling, automated behavioral scoring, or continuous surveillance.

---

## 2. Nature and Scope of Biometric Data

| Attribute | Specification |
| :--- | :--- |
| **Input Source** | Ephemeral browser video stream capture (480x480 resolution). |
| **Raw Image Storage** | **ZERO.** Raw images and video frames are never written to disk, cache, or external servers. |
| **Extracted Data Type** | 64-element normalized floating-point numerical embedding vector (`float[]`). |
| **Reversibility** | Irreversible. A 64-float cosine vector cannot be reverse-engineered into a photograph or facial image. |
| **Liveness Verification** | Randomized challenge-response protocol (`BLINK_EYES`, `TURN_HEAD_RIGHT`, `SMILE`, etc.) with 2-minute cryptographic nonces. |
| **Cryptographic Storage** | Encrypted using AES-256-GCM under an isolated key (`FACE_EMBEDDING_ENCRYPTION_KEY`). |

---

## 3. Lawful Basis & Voluntary Consent

Processing of special category biometric data is governed strictly by **explicit, informed, and revocable consent**:
- **Affirmative Opt-In:** Enrollment requires ticking an explicit legal statement on the enrollment interface.
- **Unforced Participation:** Participation is 100% voluntary. No employee may be coerced into enrolling.
- **No Workplace Penalty:** Declining biometric enrollment has zero impact on employment status, compensation, performance evaluation, or working conditions.

---

## 4. Alternative Mechanisms for Non-Consenting Staff

Employees who decline biometric enrollment or subsequently revoke consent are provided with complete, parallel alternatives:

```
┌────────────────────────────────────────────────────────┐
│              Authentication & Attendance Flow           │
└──────────────────────────────────┬─────────────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
     [Biometric Opt-In]                     [Biometric Opt-Out]
     - Camera Liveness Challenge            - Standard Strong Password
     - Ephemeral Cosine Match (<100ms)      - TOTP 2FA (Google Auth, Authy)
     - Automated Timestamp Stamped          - Manual Time Card Record
                                            - Supervisor Time Audit
```

1. **Standard Time Clock:** Employees log in with corporate email and strong password, entering their time-card punch via the web dashboard.
2. **Two-Factor Authentication:** TOTP (Time-based One-Time Password via Google Authenticator or 1Password) serves as the primary multi-factor authentication mechanism.
3. **Supervisor Verification:** Shift presence is auditable by team managers via the Daily Presence Log.

---

## 5. Cryptographic Isolation (Key Separation)

Under the Defense in Depth architecture:
- `FACE_EMBEDDING_ENCRYPTION_KEY` is completely isolated from `PHONE_ENCRYPTION_KEY` and `SALARY_ENCRYPTION_KEY`.
- If an attacker compromises application secrets for customer phone numbers, biometric data remains mathematically sealed and unreadable.
- Vector payloads follow the format: `iv:authTag:ciphertext` where IV is 12 random bytes per encryption and tag is 16 bytes.

---

## 6. Retention Schedule & 24-Hour Automated Purge Policy

Biometric mathematical vectors are retained only for the duration of active service and active consent:

```
[Consent Revoked] ──> [24-Hour Grace Period] ──> [Automated Purge Cron (03:30 AM)] ──> [NULL in Database]
[Employee Offboarded] > [24-Hour Grace Period] ──> [Automated Purge Cron (03:30 AM)] ──> [Permanent Vector Erasure]
```

1. **Active Employment:** Vectors are stored in encrypted format in the `users` table (`faceEmbedding`).
2. **Consent Revocation:** When an employee revokes consent in Settings, `biometricConsent` is set to `false`. The vector is permanently expunged immediately or within a maximum 24-hour grace window by the automated purge job.
3. **Employee Termination / Offboarding:** When an employee account is flagged with `deletedAt`, the automated background job (`biometricPurge.job.ts`) permanently zeroes and purges the `faceEmbedding` and `faceEnrolledAt` fields within 24 hours.
4. **Audit Trail:** A tamper-evident log entry (`BIOMETRIC_PURGE_AUTOMATED`) is recorded in `audit_logs` confirming permanent erasure for regulatory accountability.

---

## 7. Access Control & Authorization (Least Privilege)

- **Zero Human Access:** Neither administrators, managers, HR personnel, nor developers have access to view, download, or export mathematical vectors.
- **Server Internal Execution Only:** Decryption of the vector occurs exclusively in RAM on the secure backend during an active verification request and is garbage-collected immediately.
- **API Boundary:** Endpoints return only a cosine similarity match score (`matchScore: 94.2%`) and a boolean verification status (`verified: true`). The raw vector is never included in API responses.

---

## 8. Risk Assessment & Mitigations Matrix

| Identified Threat | Inherent Risk | Technical & Procedural Mitigations | Residual Risk |
| :--- | :---: | :--- | :---: |
| **Vector Theft via SQL Injection** | High | Parameterized Prisma ORM, Cloud WAF input sanitization, and AES-256-GCM encryption with isolated key. Raw DB dump yields unreadable ciphertext. | **Low** |
| **Spoofing / Presentation Attack (Photo/Video)** | High | Cryptographic liveness challenge (`verifyLivenessChallenge`) requiring dynamic head turn, smile, or eye blink within 120-second nonce expiry. | **Low** |
| **Key Leakage Impacting All Data** | Critical | Strict key separation (`PHONE_ENCRYPTION_KEY`, `SALARY_ENCRYPTION_KEY`, `FACE_EMBEDDING_ENCRYPTION_KEY`). Leak of one key leaves biometric data safe. | **Low** |
| **Unauthorized Surveillance / Function Creep** | High | Code-level restrictions: vectors are only compared 1:1 against the authenticating user (`userId`). 1:N bulk scanning across all users is prohibited in code. | **Negligible** |
| **Data Leak in Application Logs** | High | Explicit `logRedactionMiddleware` automatically intercepts and scrubs all vectors, passwords, and tokens before writing to stdout or file logs. | **Negligible** |

---

## 9. Contact and Data Protection Officer (DPO)

For data privacy inquiries, consent withdrawal, or exercising rights of access and erasure:
- **Data Protection Lead:** security@tiger-workspace.com
- **Supervisory Escalation:** Management Security Council
- **Review Cycle:** Semi-annual (Next scheduled review: March 2027)
