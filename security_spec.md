# Security Specification — Sistem Pencatatan & Validasi Kinerja Produksi

## 1. Data Invariants
1. **Authentication & Email Verification**: Every write and non-public read requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **PII Isolation**: User email addresses reside exclusively in `/users_private/{userId}` and are readable only by the document owner or a verified Admin. `/worker_profiles/{userId}` contains zero PII.
3. **Role Escalation Prevention**: Users cannot write to `/admins/{userId}` unless they are already verified Admins (`isAdmin()`). Admin status is determined strictly via `/admins/{uid}` existence or the bootstrapped verified admin email (`Annastiti@gmail.com`).
4. **Production Log Ownership & Workflow Integrity**:
   - On creation, `workerId` MUST equal `request.auth.uid`, `status` MUST equal `'pending'`, and `validatedBy` / `validatedByName` / `validatedAt` MUST be `null`.
   - `productionDate` MUST match `YYYY-MM-DD`, `monthKey` MUST match `YYYY-MM`, and `monthKey` MUST equal the first 7 characters of `productionDate`.
   - Workers can only edit or delete their own logs while `status != 'approved'` (Terminal State Locking). Workers cannot transition `status` to `'approved'` or `'rejected'`.
   - Only `isAdmin()` can transition `status` to `'approved'` or `'rejected'` and populate `validatedBy`, `validatedByName`, `validationNotes`, and `validatedAt`.
5. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` MUST equal `request.time` on creation; `createdAt`, `workerId`, and `sectionCode` are immutable on update.
6. **Strict Schema & Boundary Checks**: All documents enforce `keys().hasAll(...)` and `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, and `.size()` limits on all strings.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Spoof**: User with `email_verified: false` tries to create a `production_logs` entry -> `PERMISSION_DENIED`.
2. **Identity Spoofing on Create**: Worker A submits a `production_logs` document with `workerId: "workerB"` -> `PERMISSION_DENIED`.
3. **Self-Approval Shortcut**: Worker submits a `production_logs` document with `status: "approved"` -> `PERMISSION_DENIED`.
4. **Shadow Ghost Field Injection**: Worker includes `isVerified: true` or `bonusScore: 999` in `production_logs` create -> `PERMISSION_DENIED`.
5. **Client Timestamp Forgery**: Worker sets `createdAt` to a backdated timestamp instead of `request.time` -> `PERMISSION_DENIED`.
6. **Admin Privilege Escalation**: Non-admin worker attempts `setDoc` on `/admins/{ownUid}` -> `PERMISSION_DENIED`.
7. **PII Blanket Read**: Worker A attempts `get` or `list` on `/users_private/workerB` -> `PERMISSION_DENIED`.
8. **Terminal State Tampering**: Worker edits their own `production_logs` entry after it was `approved` by Admin -> `PERMISSION_DENIED`.
9. **Worker Self-Validation Update**: Worker updates `status: "approved"` on their own `pending` log -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Client writes to `/production_logs/` with a 1500-character document ID or invalid characters -> `PERMISSION_DENIED`.
11. **Resource Exhaustion / Value Poisoning**: Worker injects a 50KB string into `activityTitle` or negative `quantity: -50` -> `PERMISSION_DENIED`.
12. **Target Tampering**: Non-admin worker attempts to overwrite `/monthly_targets/2026-11` -> `PERMISSION_DENIED`.
