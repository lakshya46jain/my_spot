import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type UserRole = "guest" | "authenticated";

interface AuthState {
  role: UserRole | null; // null = not yet chosen (landing page)
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  loginAsGuest: () => void;
  loginAsUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);

  const loginAsGuest = useCallback(() => {
    // Database implementation required here — validate guest session
    setRole("guest");
  }, []);

  const loginAsUser = useCallback(() => {
    // Database implementation required here — authenticate user credentials
    setRole("authenticated");
  }, []);

  const logout = useCallback(() => {
    // Database implementation required here — clear session/tokens
    setRole(null);
  }, []);

  const isAuthenticated = role !== null;
  const isGuest = role === "guest";
  const isLoggedIn = role === "authenticated";

  return (
    <AuthContext.Provider
      value={{ role, isAuthenticated, isGuest, isLoggedIn, loginAsGuest, loginAsUser, logout }}
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
