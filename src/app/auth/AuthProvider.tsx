import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** Verdadeiro só até a primeira resposta do Supabase — nunca mais depois disso. */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Fonte única de sessão do frontend.
 *
 * `onAuthStateChange` já dispara uma vez, de forma síncrona, com a sessão em
 * cache assim que alguém se inscreve — não precisa de uma chamada separada a
 * `getSession()` antes. Um único listener cobre a carga inicial e toda troca
 * de sessão depois (login, logout, refresh de token), sem o risco de os dois
 * caminhos divergirem.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
        setLoading(false);
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  }
  return ctx;
}
