import { useState, useEffect, useCallback } from "react";

interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  status: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

let cachedState: AuthState | null = null;
const listeners = new Set<() => void>();

async function loadAuthUser(): Promise<void> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) {
      cachedState = { user: null, isLoading: false, isAuthenticated: false };
    } else {
      const data = await res.json();
      if (data.user) {
        const meRes = await fetch("/api/users/me", { credentials: "include" });
        const meData = meRes.ok ? await meRes.json() : data.user;
        cachedState = { user: meData, isLoading: false, isAuthenticated: true };
      } else {
        cachedState = { user: null, isLoading: false, isAuthenticated: false };
      }
    }
  } catch {
    cachedState = { user: null, isLoading: false, isAuthenticated: false };
  }
  listeners.forEach((fn) => fn());
}

let fetchPromise: Promise<void> | null = null;

function ensureFetched(): void {
  if (cachedState || fetchPromise) return;
  fetchPromise = loadAuthUser();
}

export function useAuth() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    ensureFetched();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const logout = useCallback(() => {
    cachedState = null;
    fetchPromise = null;
    window.location.href = "/api/logout";
  }, []);

  const login = useCallback(() => {
    window.location.href = "/api/login";
  }, []);

  const state = cachedState ?? { user: null, isLoading: true, isAuthenticated: false };

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
  };
}
