import {
  createContext,
  useContext,
  useState,
  useCallback,
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
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  loginAsGuest: () => void;
  loginAsUser: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const loginAsGuest = useCallback(() => {
    setRole("guest");
    setUser(null);
  }, []);

  const loginAsUser = useCallback((userData: AuthUser) => {
    setRole("authenticated");
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setUser(null);
  }, []);

  const isAuthenticated = role !== null;
  const isGuest = role === "guest";
  const isLoggedIn = role === "authenticated";

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
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
