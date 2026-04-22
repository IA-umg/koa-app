import { LoginResponse } from "@/components/FormLogin/FormLogin";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  auth: LoginResponse | null;
  setAuth: (auth: LoginResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      auth: null,

      setAuth: (auth) => set({ auth }),

      clearAuth: () => set({ auth: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);