import { describe, it, expect, beforeEach } from "vitest";
import {
  isLockedOut,
  recordFailedAttempt,
  resetAttempts,
  getLockoutRemaining,
  getFailedAttempts,
} from "@/lib/accountLockout";

describe("Account Lockout", () => {
  beforeEach(() => {
    resetAttempts("1.2.3.4");
    resetAttempts("5.6.7.8");
  });

  it("should not lock out on first failed attempt", () => {
    recordFailedAttempt("1.2.3.4");
    expect(isLockedOut("1.2.3.4")).toBe(false);
    expect(getFailedAttempts("1.2.3.4")).toBe(1);
  });

  it("should lock out after 5 failed attempts", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("1.2.3.4");
    }
    expect(isLockedOut("1.2.3.4")).toBe(true);
    expect(getLockoutRemaining("1.2.3.4")).toBeGreaterThan(0);
  });

  it("should reset after successful login", () => {
    recordFailedAttempt("1.2.3.4");
    recordFailedAttempt("1.2.3.4");
    resetAttempts("1.2.3.4");
    expect(isLockedOut("1.2.3.4")).toBe(false);
    expect(getFailedAttempts("1.2.3.4")).toBe(0);
  });

  it("should track IPs independently", () => {
    recordFailedAttempt("1.2.3.4");
    recordFailedAttempt("1.2.3.4");
    expect(isLockedOut("5.6.7.8")).toBe(false);
    expect(getFailedAttempts("5.6.7.8")).toBe(0);
  });

  it("should not lock before 5 attempts", () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt("1.2.3.4");
    }
    expect(isLockedOut("1.2.3.4")).toBe(false);
  });
});
