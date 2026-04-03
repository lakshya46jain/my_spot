import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type UserRole = "guest" | "authenticated";

export interface AuthUser {
  userId: number;
  displayName: string;
  email: string;
  roleId: number;
  roleName: string;
}

interface AuthState {
  role: UserRole | null;
  user: AuthUser | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  loginAsGuest: () => void;
  loginAsUser: (user: AuthUser, rememberMe?: boolean) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "myspot-auth";

const AuthContext = createContext<AuthContextType | null>(null);

function safeReadAuthStorage(): {
  role: UserRole | null;
  user: AuthUser | null;
} {
  if (typeof window === "undefined") {
    return { role: null, user: null };
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return { role: null, user: null };
    }

    const parsed = JSON.parse(raw) as {
      role: UserRole | null;
      user: AuthUser | null;
    };

    return {
      role: parsed.role ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return { role: null, user: null };
  }
}

function safeWriteAuthStorage(payload: {
  role: UserRole | null;
  user: AuthUser | null;
}) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function safeClearAuthStorage() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = safeReadAuthStorage();
    setRole(stored.role);
    setUser(stored.user);
    setIsHydrated(true);
  }, []);

  const loginAsGuest = useCallback(() => {
    setRole("guest");
    setUser(null);
    safeClearAuthStorage();
  }, []);

  const loginAsUser = useCallback((userData: AuthUser, rememberMe = false) => {
    setRole("authenticated");
    setUser(userData);

    if (rememberMe) {
      safeWriteAuthStorage({
        role: "authenticated",
        user: userData,
      });
    } else {
      safeClearAuthStorage();
    }
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setUser(null);
    safeClearAuthStorage();
  }, []);

  const isAuthenticated = role !== null;
  const isGuest = role === "guest";
  const isLoggedIn = role === "authenticated";

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        isHydrated,
        isAuthenticated,
        isGuest,
        isLoggedIn,
        loginAsGuest,
        loginAsUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
