import { authApi } from "@/lib/api/auth.api";
import { setUnauthorizedHandler } from "@/lib/api/core/client";
import { tokenStorage } from "@/lib/api/core/token-storage";
import { AuthContext, type AuthContextValue, type AuthStatus } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    tokenStorage.getToken(),
  );
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => authApi.me(),
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
      authApi.login({ email, password }),
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
    }) => authApi.register({ email, username, password }),
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

  useEffect(() => {
    setUnauthorizedHandler(logout);
  });

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
