import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = { id: string; nombre: string; tipo: "cliente" | "trabajador" };

type AuthState = {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadExtra(s: Session | null) {
    if (!s) {
      setPerfil(null);
      setIsAdmin(false);
      return;
    }
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, nombre, tipo").eq("id", s.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", s.user.id),
    ]);
    setPerfil((p as Perfil) ?? null);
    setIsAdmin(!!roles?.some((r) => r.role === "admin"));
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => {
        loadExtra(s).finally(() => setLoading(false));
      }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadExtra(data.session).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    perfil,
    isAdmin,
    loading,
    refresh: () => loadExtra(session),
    signOut: async () => {
      await supabase.auth.signOut();
      qc.invalidateQueries();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
