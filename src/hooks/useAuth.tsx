import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { consumePostAuthRedirect, hydrateSessionFromRedirectUrl } from "@/lib/authRedirect";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hadOAuthParamsRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const hash = window.location.hash || "";
    const search = window.location.search || "";
    hadOAuthParamsRef.current =
      /[#&?](access_token|refresh_token|code|error)=/.test(hash) ||
      /[?&](access_token|refresh_token|code|error)=/.test(search);

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    };

    const initialize = async () => {
      try {
        const hydratedSession = await hydrateSessionFromRedirectUrl();
        const currentSession = hydratedSession ?? (await supabase.auth.getSession()).data.session;
        applySession(currentSession);
        if (currentSession && hadOAuthParamsRef.current) {
          hadOAuthParamsRef.current = false;
          const dest = consumePostAuthRedirect();
          navigate(dest, { replace: true });
        }
      } catch (error) {
        console.error("Session redirect hydration failed", error);
        applySession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      if (mounted) setLoading(false);
      if (nextSession && hadOAuthParamsRef.current) {
        hadOAuthParamsRef.current = false;
        const dest = consumePostAuthRedirect();
        navigate(dest, { replace: true });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <Ctx.Provider value={{ user, session, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);