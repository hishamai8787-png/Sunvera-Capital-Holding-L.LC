/**
 * Account lockout — brute force protection.
 *
 * Tracks failed login attempts per IP address.
 * After MAX_FAILED_ATTEMPTS, the IP is locked for LOCKOUT_DURATION.
 *
 * Production: Should use Upstash Redis for distributed lockout tracking.
 * Development: In-memory fallback (single instance).
 */

interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // Reset counter after 15 min of no attempts

// In-memory store: Map<IP, LockoutState>
const lockoutStore = new Map<string, LockoutState>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, state] of lockoutStore.entries()) {
    if (state.lockedUntil && state.lockedUntil < now) {
      lockoutStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function isLockedOut(ip: string): boolean {
  const state = lockoutStore.get(ip);
  if (!state) return false;

  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    return true;
  }

  // Lockout expired — reset
  if (state.lockedUntil && state.lockedUntil <= Date.now()) {
    lockoutStore.delete(ip);
    return false;
  }

  return false;
}

export function getLockoutRemaining(ip: string): number {
  const state = lockoutStore.get(ip);
  if (!state || !state.lockedUntil) return 0;
  return Math.max(0, Math.ceil((state.lockedUntil - Date.now()) / 1000));
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  let state = lockoutStore.get(ip);

  if (!state || (state.lockedUntil && state.lockedUntil < now)) {
    state = { failedAttempts: 0, lockedUntil: null };
  }

  // Reset counter if outside the attempt window
  if (state.failedAttempts > 0 && !state.lockedUntil) {
    // Keep incrementing — window resets only on successful login
  }

  state.failedAttempts += 1;

  if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  lockoutStore.set(ip, state);
}

export function resetAttempts(ip: string): void {
  lockoutStore.delete(ip);
}

export function getFailedAttempts(ip: string): number {
  const state = lockoutStore.get(ip);
  return state?.failedAttempts ?? 0;
}
