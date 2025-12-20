"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Header() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        setProfile(prof);
      }

      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 16, background: "#0b1c2d", color: "white" }}>
        Memuat...
      </div>
    );
  }

  const isAdmin =
    profile &&
    ["super_admin", "admin_finance", "admin_it"].includes(profile.role);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header style={header}>
      <div style={container}>
        <div style={topRow}>
          <div style={brand}>
            <img src="/logo.png" style={{ height: 40 }} />
            <div>
              <b>PT. Danatama Makmur Sekuritas</b>
              <div style={{ fontSize: 11 }}>
                Member of Indonesia Stock Exchange
              </div>
            </div>
          </div>

          <div style={menu}>
            {user && <a href="/dashboard">Dashboard</a>}
            {user && <a href="/wallet">Dompet</a>}
            {user && <a href="/riwayat">Riwayat</a>}
            {isAdmin && <a href="/admin">Admin</a>}
            {!user && <a href="/login">Login</a>}
            {!user && <a href="/daftar">Daftar</a>}
            {user && (
              <>
                <span>Halo, {profile?.username || "User"}</span>
                <button onClick={logout}>Logout</button>
              </>
            )}
          </div>
        </div>

        <div style={bottomNav}>
          <a href="/tentang-kami">Tentang Kami</a>
          <a href="/">Home</a>
          <a href="/kontak">Kontak</a>
          <a href="/investasi">Investasi</a>
        </div>
      </div>
    </header>
  );
}

const header = { background: "#0b1c2d", color: "white" };
const container = { maxWidth: 1200, margin: "auto", padding: 16 };
const topRow = { display: "flex", justifyContent: "space-between" };
const brand = { display: "flex", gap: 12, alignItems: "center" };
const menu = { display: "flex", gap: 12, alignItems: "center" };
const bottomNav = {
  display: "flex",
  justifyContent: "center",
  gap: 24,
  marginTop: 10,
  fontSize: 13,
};
