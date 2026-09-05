import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin" && user.role !== "support") return <Navigate to="/" replace />;
  return children;
}

export function RequireHospitalStaff({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/hospital-login" replace />;
  if (user.role !== "hospital_staff") return <Navigate to="/" replace />;
  return children;
}
