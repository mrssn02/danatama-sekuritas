"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Header() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchProfile(data.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setUsername("");
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (data) setUsername(data.username);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header style={header}>
      <div style={container}>
        {/* BRAND */}
        <div style={brand}>
          <img src="/logo.png" alt="Danatama" style={{ height: 40 }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              PT. Danatama Makmur Sekuritas
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Member of Indonesia Stock Exchange
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav style={nav}>
          <a href="/" style={link}>Home</a>
          <a href="/tentang-kami" style={link}>Tentang Kami</a>
          <a href="/kontak" style={link}>Kontak</a>

          {user && <a href="/dashboard" style={link}>Dashboard</a>}

          {!user ? (
            <>
              <a href="/login" style={link}>Login</a>
              <a href="/daftar" style={link}>Daftar</a>
            </>
          ) : (
            <>
              <span style={userText}>
                Halo, <b>{username || "User"}</b>
              </span>
              <button onClick={logout} style={btn}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ===== STYLES ===== */

const header = {
  background: "#0b1c2d",
  color: "white"
};

const container = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "14px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 24
};

const brand = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  whiteSpace: "nowrap"
};

const nav = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "nowrap"
};

const link = {
  color: "white",
  textDecoration: "none",
  fontSize: 14
};

const userText = {
  fontSize: 13,
  color: "#cbd5e1"
};

const btn = {
  background: "transparent",
  color: "white",
  border: "1px solid white",
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 13
};
