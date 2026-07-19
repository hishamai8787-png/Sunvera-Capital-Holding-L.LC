/**
 * Audit logging — tracks all admin and sensitive actions.
 *
 * Every state-changing operation is logged with:
 * - Timestamp (ISO 8601)
 * - User email (if authenticated)
 * - IP address
 * - Action type
 * - Resource affected
 * - Success/failure status
 *
 * Storage: In-memory (development) — should be persisted to
 * database or external log service for production.
 */

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_LOCKED"
  | "LOGOUT"
  | "2FA_VERIFY"
  | "2FA_FAILED"
  | "CLIENT_CREATE"
  | "CLIENT_UPDATE"
  | "CLIENT_DELETE"
  | "TRADE_CREATE"
  | "TRADE_DELETE"
  | "EXPORT_DATA"
  | "SCAN_RUN"
  | "CREDIT_DOC_GENERATE"
  | "PLAYBOOK_IMPORT"
  | "FEEDBACK_SUBMIT"
  | "CONTACT_SUBMIT"
  | "API_KEY_ACCESS"
  | "SETTINGS_UPDATE";

export interface AuditEntry {
  timestamp: string;
  action: AuditAction;
  ip: string;
  email?: string;
  resource?: string;
  success: boolean;
  details?: string;
}

// In-memory audit log (last 1000 entries)
const auditLog: AuditEntry[] = [];
const MAX_ENTRIES = 1000;

export function auditLogEntry(
  action: AuditAction,
  ip: string,
  options: {
    email?: string;
    resource?: string;
    success: boolean;
    details?: string;
  }
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action,
    ip,
    email: options.email,
    resource: options.resource,
    success: options.success,
    details: options.details,
  };

  auditLog.push(entry);

  // Trim to max entries
  if (auditLog.length > MAX_ENTRIES) {
    auditLog.shift();
  }

  // Log to structured logger
  if (options.success) {
    console.log(`[AUDIT] ${action} | ${ip} | ${options.email ?? "anonymous"} | ${options.resource ?? "-"}`);
  } else {
    console.warn(`[AUDIT FAILED] ${action} | ${ip} | ${options.email ?? "anonymous"} | ${options.details ?? "-"}`);
  }
}

/**
 * Get recent audit log entries (for admin dashboard)
 */
export function getAuditLog(limit = 100): AuditEntry[] {
  return auditLog.slice(-limit).reverse();
}

/**
 * Get audit log filtered by action type
 */
export function getAuditLogByAction(action: AuditAction, limit = 50): AuditEntry[] {
  return auditLog
    .filter((e) => e.action === action)
    .slice(-limit)
    .reverse();
}

/**
 * Get failed action count (for security dashboard)
 */
export function getFailedActionCount(timeWindowMs = 60 * 60 * 1000): number {
  const cutoff = Date.now() - timeWindowMs;
  return auditLog.filter(
    (e) => !e.success && new Date(e.timestamp).getTime() > cutoff
  ).length;
}
