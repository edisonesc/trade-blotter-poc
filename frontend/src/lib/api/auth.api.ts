import type { AuthResponse, User } from "@/types/auth.type";
import { request } from "./core/client";

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, username: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    }),
  me: () => request<User>("/user/me", {}),
};
