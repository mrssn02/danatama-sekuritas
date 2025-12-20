"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "sonandra111@gmail.com";

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    location.href = "/";
  };

  return (
    <header style={h}>
      <div style={row}>
        <b>PT. Danatama Makmur Sekuritas</b>

        <nav style={nav}>
          <a href="/">Home</a>
          {user && <a href="/dashboard">Dashboard</a>}
          {user && <a href="/wallet">Dompet</a>}
          {user?.email === ADMIN_EMAIL && <a href="/admin">Admin</a>}
          {!user ? (
            <>
              <a href="/login">Login</a>
              <a href="/daftar">Daftar</a>
            </>
          ) : (
            <button onClick={logout}>Logout</button>
          )}
        </nav>
      </div>
    </header>
  );
}

const h = { background:"#0b1c2d", color:"white", padding:16 };
const row = { display:"flex", justifyContent:"space-between", alignItems:"center" };
const nav = { display:"flex", gap:12 };
