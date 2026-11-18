// Adversarial test specification for Firestore Security Rules (Dirty Dozen)
// Verified against firestore.rules constraints and invariants.

export interface DirtyDozenCase {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  payload: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 'DD-01-unverified-email',
    collection: 'production_logs/log_001',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: false }, data: { workerId: 'u1', status: 'pending' } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02-identity-spoof',
    collection: 'production_logs/log_002',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { workerId: 'u2', status: 'pending' } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03-self-approval-create',
    collection: 'production_logs/log_003',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { workerId: 'u1', status: 'approved' } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04-ghost-field-injection',
    collection: 'production_logs/log_004',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { workerId: 'u1', status: 'pending', isAdminOverride: true } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05-timestamp-forgery',
    collection: 'production_logs/log_005',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { workerId: 'u1', createdAt: '2020-01-01T00:00:00Z' } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06-admin-escalation',
    collection: 'admins/u1',
    operation: 'create',
    payload: { auth: { uid: 'u1', email: 'worker@example.com', email_verified: true }, data: { uid: 'u1' } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07-pii-read-other',
    collection: 'users_private/u2',
    operation: 'get',
    payload: { auth: { uid: 'u1', email: 'worker@example.com', email_verified: true } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08-terminal-state-edit',
    collection: 'production_logs/log_approved',
    operation: 'update',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { quantity: 999 } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09-worker-self-validate-update',
    collection: 'production_logs/log_pending',
    operation: 'update',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { status: 'approved', validatedBy: 'u1' } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10-id-poisoning',
    collection: `production_logs/${'a'.repeat(300)}`,
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { workerId: 'u1' } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11-negative-quantity',
    collection: 'production_logs/log_011',
    operation: 'create',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { workerId: 'u1', quantity: -5 } },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12-target-tampering',
    collection: 'monthly_targets/2026-11',
    operation: 'update',
    payload: { auth: { uid: 'u1', email_verified: true }, data: { targetTotalOutput: 1 } },
    expectedResult: 'PERMISSION_DENIED',
  },
];
