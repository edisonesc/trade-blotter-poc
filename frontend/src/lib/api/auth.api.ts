import type { AuthResponse, User } from "@/types/auth.type";
import { request } from "./core/client";
import type { LoginDTO, RegisterDTO } from "@/dto/login.dto";

export const authApi = {
  login: (dto: LoginDTO) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  register: (dto: RegisterDTO) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  me: () => request<User>("/user/me", {}),
};
