"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "sonandra111@gmail.com";

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

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header style={header}>
      <div style={container}>
        {/* ================= BARIS ATAS ================= */}
        <div style={topRow}>
          <div style={brand}>
            <img src="/logo.png" alt="Danatama" style={{ height: 42 }} />
            <div>
              <div style={title}>PT. Danatama Makmur Sekuritas</div>
              <div style={subtitle}>Member of Indonesia Stock Exchange</div>
            </div>
          </div>

          <div style={topMenu}>
            {!user ? (
              <>
                <a href="/login" style={link}>Login</a>
                <a href="/daftar" style={link}>Daftar</a>
              </>
            ) : (
              <>
                {/* ===== MENU KHUSUS LOGIN ===== */}
                <a href="/dashboard" style={link}>Dashboard</a>
                <a href="/wallet" style={link}>Dompet</a>

                {/* ===== ADMIN ONLY ===== */}
                {isAdmin && (
                  <a href="/admin" style={{ ...link, fontWeight: 600 }}>
                    Admin
                  </a>
                )}

                <span style={userText}>
                  Halo, <b>{username || "User"}</b>
                </span>
                <button onClick={logout} style={btn}>Logout</button>
              </>
            )}
          </div>
        </div>

        {/* ================= GARIS ================= */}
        <div style={divider} />

        {/* ================= BARIS BAWAH ================= */}
        <nav style={bottomNav}>
          <a href="/tentang-kami" style={smallLink}>Tentang Kami</a>
          <a href="/" style={homeLink}>Home</a>
          <a href="/kontak" style={smallLink}>Kontak</a>
        </nav>
      </div>
    </header>
  );
}

/* ================= STYLES ================= */

const header = {
  background: "#0b1c2d",
  color: "white"
};

const container = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "14px 24px"
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 24,
  flexWrap: "wrap"
};

const brand = {
  display: "flex",
  alignItems: "center",
  gap: 12
};

const title = {
  fontSize: 16,
  fontWeight: 600
};

const subtitle = {
  fontSize: 11,
  opacity: 0.8
};

const topMenu = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap"
};

const divider = {
  height: 1,
  background: "rgba(255,255,255,0.2)",
  margin: "12px 0"
};

const bottomNav = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 32,
  flexWrap: "wrap"
};

const homeLink = {
  color: "white",
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 600
};

const smallLink = {
  color: "#cbd5e1",
  textDecoration: "none",
  fontSize: 13
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
  fontSize: 13,
  borderRadius: 6
};
