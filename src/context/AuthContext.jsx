import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCurrentUser, login as loginApi } from "../api/auth.api.js";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("nexo_user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(
    !!sessionStorage.getItem("access_token"),
  );
  const logout = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("nexo_user");
    setUser(null);
  }, []);
  const refreshUser = useCallback(async () => {
    const profile = await getCurrentUser();
    setUser(profile);
    sessionStorage.setItem("nexo_user", JSON.stringify(profile));
    return profile;
  }, []);
  useEffect(() => {
    let active = true;
    if (!sessionStorage.getItem("access_token")) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then((data) => {
        if (active) {
          setUser(data);
          sessionStorage.setItem("nexo_user", JSON.stringify(data));
        }
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => logout();
    window.addEventListener("nexo-session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("nexo-session-expired", expired);
    };
  }, [logout, refreshUser]);
  async function signIn(email, password) {
    const result = await loginApi(email, password);
    if (!result?.access_token)
      throw new Error("El servidor no devolvió un token de acceso.");
    sessionStorage.setItem("access_token", result.access_token);
    try {
      const profile = await getCurrentUser();
      if (!["student", "tutor", "admin"].includes(profile?.role))
        throw new Error("El usuario no tiene un rol válido.");
      setUser(profile);
      sessionStorage.setItem("nexo_user", JSON.stringify(profile));
      return profile;
    } catch (error) {
      logout();
      throw error;
    }
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requiere AuthProvider");
  return context;
};
