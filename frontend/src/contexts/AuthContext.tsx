import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, setUnauthorizedHandler, TOKEN_KEY } from "@/lib/api";
import { storageGet, storageRemove, storageSet } from "@/lib/storage";
import type { Session, User } from "@/types/api";

const USER_KEY = "elizio:user";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string | undefined;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  const raw = storageGet(USER_KEY);
  if (!raw || !storageGet(TOKEN_KEY)) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function clearSession() {
  storageRemove(TOKEN_KEY);
  storageRemove(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [loading, setLoading] = useState<boolean>(() => storageGet(TOKEN_KEY) !== null);

  const locationRef = useRef(location);
  locationRef.current = location;

  const persistUser = useCallback((next: User) => {
    storageSet(USER_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // 401 em rota autenticada: limpa a sessão e leva para o login, voltando à rota atual depois.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setUser(null);
      const { pathname, search } = locationRef.current;
      if (pathname !== "/entrar") {
        toast.error("Sua sessão expirou. Entre novamente.");
        navigate(`/entrar?redirect=${encodeURIComponent(pathname + search)}`, { replace: true });
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  // Revalida o usuário guardado com GET /me ao iniciar.
  useEffect(() => {
    if (!storageGet(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get<User>("/me")
      .then((me) => {
        if (!cancelled) persistUser(me);
      })
      .catch(() => {
        // 401 já limpa a sessão pelo handler; falha de rede mantém o usuário guardado.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [persistUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await api.post<Session>("/session", { email, password });
      storageSet(TOKEN_KEY, session.token);
      const me = await api.get<User>("/me");
      persistUser(me);
      return me;
    },
    [persistUser]
  );

  const register = useCallback(
    async ({ name, email, password, phone }: RegisterInput) => {
      await api.post<User>("/users", { name, email, password, ...(phone ? { phone } : {}) });
      return login(email, password);
    },
    [login]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      isAdmin: user?.role === "ADMIN",
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
