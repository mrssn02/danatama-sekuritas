"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
    window.location.href = "/";
  };

  return (
    <header style={header}>
      <div style={brand}>
        <img src="/logo.png" alt="Danatama" style={{ height: 40 }} />
        <div>
          <b>PT. Danatama Makmur Sekuritas</b>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Member of Indonesia Stock Exchange
          </div>
        </div>
      </div>

      <nav style={nav}>
        <a href="/" style={link}>Home</a>
        <a href="/tentang-kami" style={link}>Tentang Kami</a>
        <a href="/kontak" style={link}>Kontak</a>

        {!user ? (
          <>
            <a href="/login" style={link}>Login</a>
            <a href="/daftar" style={link}>Daftar</a>
          </>
        ) : (
          <button onClick={logout} style={btn}>Logout</button>
        )}
      </nav>
    </header>
  );
}

const header = {
  background: "#0b1c2d",
  color: "white",
  padding: "16px 32px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const brand = { display: "flex", gap: 16, alignItems: "center" };
const nav = { display: "flex", gap: 16 };
const link = { color: "white", textDecoration: "none" };
const btn = {
  background: "transparent",
  color: "white",
  border: "1px solid white",
  padding: "6px 10px",
  cursor: "pointer"
};
