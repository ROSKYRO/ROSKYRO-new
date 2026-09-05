import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("roskyro_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (phone, password) => {
    // Customer login only — the backend rejects admin/support accounts here.
    const { data } = await api.post("/auth/login", { phone, password });
    persist(data);
    return data;
  }, []);

  const adminLogin = useCallback(async (phone, password) => {
    // Separate endpoint, separate rate limit, short-lived token. Never call
    // this from the public-facing Login page.
    const { data } = await api.post("/admin/auth/login", { phone, password });
    persist(data);
    return data;
  }, []);

  const hospitalLogin = useCallback(async (phone, password) => {
    // Hospital Console session — fully separate from customer/admin auth.
    const { data } = await api.post("/hospital-console/auth/login", { phone, password });
    persist(data);
    return data;
  }, []);

  const signup = useCallback(async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    persist(data);
    return data;
  }, []);

  function persist(data) {
    localStorage.setItem("roskyro_token", data.access_token);
    const u = { user_id: data.user_id, full_name: data.full_name, role: data.role };
    localStorage.setItem("roskyro_user", JSON.stringify(u));
    setUser(u);
  }

  const logout = useCallback(() => {
    localStorage.removeItem("roskyro_token");
    localStorage.removeItem("roskyro_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, adminLogin, hospitalLogin, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
