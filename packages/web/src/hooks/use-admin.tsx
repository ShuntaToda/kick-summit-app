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

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

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
