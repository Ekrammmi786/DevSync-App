import { z } from "zod";

// Mirrors backend zod rules in backend/src/validations/auth.validation.js
export const signupSchema = z.object({
  fullname: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must be at most 50 characters"),
  email: z.string().email("Invalid email format"),
password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
  terms: z.literal(true, { message: "You must accept the terms" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().min(4, "Enter the 4-digit code from your email").max(6),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const verifyEmailSchema = z.object({
  otp: z.string().min(4, "Enter the 4-digit code from your email").max(6),
});

export const getFieldError = (result, field) => {
  if (!result?.error) return undefined;
  const issue = result.error.issues.find((i) => i.path[0] === field);
  return issue?.message;
};

export const passwordStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
if (pw.length >= 6) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

export const strengthLabel = ["Very weak", "Weak", "Okay", "Good", "Strong"];
