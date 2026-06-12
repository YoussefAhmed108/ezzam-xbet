import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, apiUpload, clearToken, getToken, setToken } from "./api";
import type { AuthResponse, User } from "./types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  updateProfile: (payload: ProfileUpdate) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export interface SignupPayload {
  nickname: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface ProfileUpdate {
  nickname?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await apiFetch<User>("/auth/me");
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const res = await apiFetch<AuthResponse>("/auth/signup", {
      method: "POST",
      auth: false,
      body: payload,
    });
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const updateProfile = useCallback(async (payload: ProfileUpdate) => {
    const updated = await apiFetch<User>("/auth/me", {
      method: "PATCH",
      body: payload,
    });
    setUser(updated);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const updated = await apiUpload<User>("/upload/avatar", file);
    setUser(updated);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    signup,
    updateProfile,
    uploadAvatar,
    logout,
    refresh: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
