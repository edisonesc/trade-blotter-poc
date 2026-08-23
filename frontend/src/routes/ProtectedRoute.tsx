import { useAuth } from "@/context/AuthContext";
import { FullscreenSpinner } from "../components/FullScreenSpinner";
import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const { status } = useAuth();
  if (status === "loading") return <FullscreenSpinner />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === "loading") return <FullscreenSpinner />;
  if (status === "authenticated") return <Navigate to="/login" replace />;
  return <Outlet />;
}
