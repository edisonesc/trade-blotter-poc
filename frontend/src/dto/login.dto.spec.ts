import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./login.dto";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      username: "validname",
      password: "longenough",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a username shorter than 5 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      username: "usr",
      password: "longenough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      username: "validname",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      username: "validname",
      password: "longenough",
    });
    expect(result.success).toBe(false);
  });
});
