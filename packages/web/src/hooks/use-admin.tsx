"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { verifyPassword } from "@/lib/actions/auth";

interface AdminContextValue {
  isAdmin: boolean;
  login: (eventId: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  login: async () => false,
  logout: () => {},
});

const DEV_ADMIN =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_ADMIN === "true";

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(DEV_ADMIN);

  const login = useCallback(async (eventId: string, password: string) => {
    const ok = await verifyPassword(eventId, password);
    if (ok) setIsAdmin(true);
    return ok;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
