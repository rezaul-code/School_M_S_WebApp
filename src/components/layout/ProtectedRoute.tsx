import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/api/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
