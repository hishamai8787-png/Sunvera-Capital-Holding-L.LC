import { describe, it, expect } from "vitest";
import {
  validatePasswordPolicy,
} from "@/lib/passwordPolicy";

describe("Password Policy", () => {
  it("should reject short passwords", () => {
    const result = validatePasswordPolicy("Short1!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("12 characters"))).toBe(true);
  });

  it("should reject passwords without uppercase", () => {
    const result = validatePasswordPolicy("lowercase123!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("uppercase"))).toBe(true);
  });

  it("should reject passwords without lowercase", () => {
    const result = validatePasswordPolicy("UPPERCASE123!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("lowercase"))).toBe(true);
  });

  it("should reject passwords without numbers", () => {
    const result = validatePasswordPolicy("NoNumbersHere!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("number"))).toBe(true);
  });

  it("should reject passwords without special characters", () => {
    const result = validatePasswordPolicy("NoSpecial1234");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("special"))).toBe(true);
  });

  it("should reject common passwords", () => {
    const result = validatePasswordPolicy("Password12!");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("common"))).toBe(true);
  });

  it("should accept strong passwords", () => {
    const result = validatePasswordPolicy("Str0ng!P@ssw0rd#2026");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should rate very long passwords as very-strong", () => {
    const result = validatePasswordPolicy("Th1s!Is@V3ry#L0ng&Str0ng^P@ssw0rd");
    expect(result.strength).toBe("very-strong");
  });
});

describe("CSRF Protection", () => {
  it("should identify state-changing methods", async () => {
    const { requiresCSRFProtection } = await import("@/lib/csrf");
    expect(requiresCSRFProtection("POST")).toBe(true);
    expect(requiresCSRFProtection("PUT")).toBe(true);
    expect(requiresCSRFProtection("PATCH")).toBe(true);
    expect(requiresCSRFProtection("DELETE")).toBe(true);
    expect(requiresCSRFProtection("GET")).toBe(false);
    expect(requiresCSRFProtection("HEAD")).toBe(false);
    expect(requiresCSRFProtection("OPTIONS")).toBe(false);
  });

  it("should validate matching tokens", async () => {
    const { validateCSRFToken } = await import("@/lib/csrf");
    const token = "abcdef1234567890abcdef1234567890";
    expect(validateCSRFToken(token, token)).toBe(true);
  });

  it("should reject mismatched tokens", async () => {
    const { validateCSRFToken } = await import("@/lib/csrf");
    expect(validateCSRFToken("token1", "token2")).toBe(false);
  });

  it("should reject missing tokens", async () => {
    const { validateCSRFToken } = await import("@/lib/csrf");
    expect(validateCSRFToken(undefined, "token")).toBe(false);
    expect(validateCSRFToken("token", undefined)).toBe(false);
    expect(validateCSRFToken(undefined, undefined)).toBe(false);
  });
});

describe("2FA (TOTP)", () => {
  it("should generate a valid TOTP secret", async () => {
    const { generateTOTPSecret } = await import("@/lib/twoFactor");
    const secret = generateTOTPSecret();
    expect(secret).toBeTruthy();
    expect(secret.length).toBeGreaterThan(10);
  });

  it("should verify a valid TOTP token", async () => {
    const { generateTOTPSecret, verifyTOTP } = await import("@/lib/twoFactor");
    const { generateSync } = await import("otplib");
    const secret = generateTOTPSecret();
    const token = generateSync({ secret });
    expect(verifyTOTP(token, secret)).toBe(true);
  });

  it("should reject an invalid TOTP token", async () => {
    const { generateTOTPSecret, verifyTOTP } = await import("@/lib/twoFactor");
    const secret = generateTOTPSecret();
    expect(verifyTOTP("000000", secret)).toBe(false);
  });
});

describe("Audit Log", () => {
  it("should record and retrieve entries", async () => {
    const { auditLogEntry, getAuditLog } = await import("@/lib/auditLog");
    auditLogEntry("LOGIN_SUCCESS", "1.2.3.4", {
      email: "test@example.com",
      success: true,
    });
    const log = getAuditLog(10);
    expect(log.length).toBeGreaterThan(0);
    const entry = log.find((e) => e.action === "LOGIN_SUCCESS" && e.ip === "1.2.3.4");
    expect(entry).toBeDefined();
    expect(entry?.success).toBe(true);
  });

  it("should track failed actions", async () => {
    const { auditLogEntry, getFailedActionCount } = await import("@/lib/auditLog");
    auditLogEntry("LOGIN_FAILED", "5.6.7.8", {
      email: "bad@example.com",
      success: false,
      details: "Wrong password",
    });
    const count = getFailedActionCount();
    expect(count).toBeGreaterThan(0);
  });
});

describe("Request Body Size", () => {
  it("should allow requests within limit", async () => {
    const { validateBodySize } = await import("@/lib/requestLimit");
    expect(validateBodySize("1024")).toBeNull();
  });

  it("should reject oversized requests", async () => {
    const { validateBodySize, MAX_BODY_SIZE } = await import("@/lib/requestLimit");
    const error = validateBodySize(String(MAX_BODY_SIZE + 1));
    expect(error).not.toBeNull();
    expect(error).toContain("too large");
  });

  it("should allow null content-length", async () => {
    const { validateBodySize } = await import("@/lib/requestLimit");
    expect(validateBodySize(null)).toBeNull();
  });
});
