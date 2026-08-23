import { authApi } from "@/lib/api/auth.api";
import { tokenStorage } from "@/lib/api/core/token-storage";
import type { User } from "@/types/auth.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    tokenStorage.getToken(),
  );
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        tokenStorage.clearToken();
        throw err;
      }
    },
    enabled: !!token,
  });

  let status: AuthStatus;

  if (!token) {
    status = "unauthenticated";
  } else if (meQuery.isPending) {
    status = "loading";
  } else if (meQuery.isSuccess) {
    status = "authenticated";
  } else {
    status = "unauthenticated";
  }

  function persistLogin(accessToken: string) {
    tokenStorage.setToken(accessToken);
    setToken(accessToken);
  }

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
  });

  const registerMutation = useMutation({
    mutationFn: ({
      email,
      username,
      password,
    }: {
      email: string;
      username: string;
      password: string;
    }) => authApi.register(email, username, password),
  });

  async function login(email: string, password: string) {
    const { accessToken } = await loginMutation.mutateAsync({
      email,
      password,
    });
    persistLogin(accessToken);
  }

  async function register(email: string, username: string, password: string) {
    const { accessToken } = await registerMutation.mutateAsync({
      email,
      username,
      password,
    });
    persistLogin(accessToken);
  }

  function logout() {
    tokenStorage.clearToken();
    setToken(null);
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.removeQueries({ queryKey: ["trades"] });
  }

  const value: AuthContextValue = {
    token,
    user: meQuery.data ?? null,
    status,
    isAuthenticated: status === "authenticated",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
