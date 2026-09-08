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
    localStorage.setItem("manus-runtime-user-info", JSON.stringify(mockUser));
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
    logout: () => {
      localStorage.removeItem("manus-runtime-user-info");
      window.location.href = "/";
    },
  };
}
