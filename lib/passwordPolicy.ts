/**
 * Password policy enforcement — validates password strength.
 *
 * Requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * - Not a common password (basic check)
 */

const COMMON_PASSWORDS = new Set([
  "password", "Password1!", "1234567890", "qwerty12345",
  "admin12345", "letmein1234", "welcome1234", "sunvera1234",
  "Sunvera1234", "SunveraCapital", "Password12", "Password12!", "Admin12345",
]);

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong" | "very-strong";
}

export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least 1 uppercase letter.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least 1 lowercase letter.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least 1 number.");
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least 1 special character (!@#$%^&*...).");
  }

  if (COMMON_PASSWORDS.has(password)) {
    errors.push("Password is too common — choose a more unique password.");
  }

  // Calculate strength score
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  if (password.length >= 20) score++;

  let strength: PasswordValidationResult["strength"] = "weak";
  if (score >= 4) strength = "strong";
  if (score >= 5) strength = "very-strong";
  if (score === 3 && errors.length === 0) strength = "fair";

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}
