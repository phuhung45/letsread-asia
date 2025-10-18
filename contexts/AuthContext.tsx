import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>; // ✅ thêm hàm này
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🟢 [AuthProvider] Mounted");

    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🧩 [AuthContext] Current session:", session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Lắng nghe thay đổi đăng nhập / đăng xuất
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("⚡ [AuthContext] Event:", event);
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      console.log("🔴 [AuthProvider] Unmounted");
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log("🚪 [AuthContext] Signing out...");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
