"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };
    init();
  }, []);

  return (
    <div style={page}>
      {/* HERO */}
      <section style={hero}>
        <div style={heroOverlay}>
          <h1 style={heroTitle}>
            Investasi Saham
            <br />
            <span style={{ color: GOLD }}>Aman • Elegan • Profesional</span>
          </h1>

          <p style={heroText}>
            Platform investasi modern dengan sistem transparan, cepat,
            dan standar keamanan tingkat tinggi.
          </p>

          {!loading && (
            <div style={heroButtons}>
              {!user ? (
                <>
                  <a href="/daftar" style={btnPrimary}>Mulai Sekarang</a>
                  <a href="/login" style={btnGhost}>Masuk</a>
                </>
              ) : (
                <>
                  <a href="/dashboard" style={btnPrimary}>Dashboard</a>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.reload();
                    }}
                    style={btnGhost}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section style={section}>
        <div style={sectionTitle}>
          <h2>Kenapa Memilih Kami</h2>
          <p>Solusi investasi terpercaya untuk masa depan finansial Anda</p>
        </div>

        <div style={grid}>
          {features.map((f, i) => (
            <div key={i} style={card}>
              <div style={icon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section style={trust}>
        <div style={trustBox}>
          <h2>Terdaftar & Diawasi</h2>
          <p>
            PT. Danatama Makmur Sekuritas adalah perusahaan investasi
            dengan sistem internal yang terstruktur dan aman.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={footer}>
        <div>© 1992–2025 PT. Danatama Makmur Sekuritas</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          Informasi pada website ini bersifat informatif dan edukatif.
        </div>
      </footer>
    </div>
  );
}

/* ===============================
   DATA
================================ */
const features = [
  { icon: "🔒", title: "Keamanan Tinggi", desc: "Sistem transaksi berlapis & terlindungi." },
  { icon: "⚡", title: "Proses Cepat", desc: "Deposit & withdraw diproses efisien." },
  { icon: "📊", title: "Transparan", desc: "Riwayat dan saldo dapat dipantau real-time." },
  { icon: "💼", title: "Profesional", desc: "Dikelola dengan standar finansial tinggi." },
];

/* ===============================
   COLORS
================================ */
const DARK = "#0B1C2D";
const GOLD = "#D4AF37";
const BG = "#F4F6F8";

/* ===============================
   STYLES
================================ */
const page = {
  background: BG,
  minHeight: "100vh",
  fontFamily: "Inter, system-ui, sans-serif",
};

const hero = {
  background: "linear-gradient(135deg, #0B1C2D, #132F4C)",
  padding: "140px 20px",
  color: "white",
};

const heroOverlay = {
  maxWidth: 900,
  margin: "0 auto",
  textAlign: "center",
};

const heroTitle = {
  fontSize: 52,
  fontWeight: 800,
  lineHeight: 1.2,
  marginBottom: 24,
};

const heroText = {
  fontSize: 18,
  maxWidth: 650,
  margin: "0 auto 40px",
  opacity: 0.9,
};

const heroButtons = {
  display: "flex",
  justifyContent: "center",
  gap: 18,
  flexWrap: "wrap",
};

const btnPrimary = {
  background: GOLD,
  color: DARK,
  padding: "14px 30px",
  borderRadius: 16,
  fontWeight: 700,
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
};

const btnGhost = {
  background: "transparent",
  color: GOLD,
  padding: "14px 28px",
  borderRadius: 16,
  border: `2px solid ${GOLD}`,
  fontWeight: 700,
  cursor: "pointer",
};

const section = {
  padding: "90px 20px",
};

const sectionTitle = {
  textAlign: "center",
  marginBottom: 50,
};

const grid = {
  maxWidth: 1100,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 28,
};

const card = {
  background: "white",
  padding: 36,
  borderRadius: 22,
  boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
};

const icon = {
  fontSize: 34,
  marginBottom: 14,
};

const trust = {
  background: "#0F172A",
  color: "white",
  padding: "80px 20px",
};

const trustBox = {
  maxWidth: 800,
  margin: "0 auto",
  textAlign: "center",
};

const footer = {
  background: "#020617",
  color: "#CBD5E1",
  textAlign: "center",
  padding: 40,
};
