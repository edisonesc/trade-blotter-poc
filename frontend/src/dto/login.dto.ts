import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email("Invalid email").min(1, "Email is required"),
  username: z.string().min(5, "At least 5 characters"),
  password: z.string().min(8, "At least 8 characters"),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
