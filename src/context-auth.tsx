import React, { createContext, useContext, useMemo, useState } from "react";

export type Role = "admin" | "user";
export type AuthUser = { id: number; username: string; role: Role };

type C = {
  token: string | null;
  user: AuthUser | null;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
};

const API = "http://119.59.102.161:3099/api";
const Context = createContext<C | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (u: string, p: string) => {
    const r = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || "Login failed");
    setToken(d.token);
    setUser(d.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <Context.Provider
      value={useMemo(() => ({ token, user, login, logout }), [token, user])}
    >
      {children}
    </Context.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Context);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
};
