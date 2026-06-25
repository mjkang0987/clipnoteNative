import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthState = {
  session: Session | null;
  loading: boolean;
  loggedIn: boolean;
  accessToken: string | null;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  session: null,
  loading: true,
  loggedIn: false,
  accessToken: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  // 네이버 로그인 딥링크(`clipnote://auth/naver?token_hash=...`) 복귀는
  // expo-router 가 `app/auth/naver.tsx` 화면으로 라우팅해 처리한다.

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        loading,
        loggedIn: Boolean(session?.user),
        accessToken: session?.access_token ?? null,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(Ctx);
}
