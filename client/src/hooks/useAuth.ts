import { useMemo } from "react";

export function useAuth() {
  const mockUser = {
    id: "eg-001",
    name: "محمد - EG Blockchain",
    email: "gomr996@altrend.eg",
    openId: "eg-local",
    role: "admin",
  };
  const state = useMemo(() => {
    return {
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true,
    };
  }, []);
  return {
    ...state,
    refresh: async () => {},
    logout: () => { window.location.href = "/"; },
  };
}
