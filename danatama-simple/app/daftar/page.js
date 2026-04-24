"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!email || !password || !confirm) {
      alert("Semua field wajib diisi");
      return;
    }

    if (password !== confirm) {
      alert("Konfirmasi password tidak cocok");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // 🔥 handle email verification
      if (data?.user && !data.session) {
        alert("Cek email kamu untuk verifikasi akun!");
      } else {
        alert("Pendaftaran berhasil!");
      }

      // redirect ke login
      window.location.href = "/login";
    } catch (err) {
      console.error("Register error:", err);
      alert(err.message || "Terjadi kesalahan saat daftar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={title}>Buat Akun</h1>
        <p style={subtitle}>Daftar untuk mulai berinvestasi</p>

        <input
          style={input}
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={input}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          style={input}
          placeholder="Konfirmasi Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button style={btn} onClick={register} disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </button>

        <p style={footerText}>
          Sudah punya akun? <a href="/login">Masuk</a>
        </p>
      </div>
    </div>
  );
}

/* ===============================
   STYLES (TIDAK DIUBAH)
================================ */
const page = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0B1C2D, #132F4C)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const card = {
  background: "white",
  padding: 40,
  borderRadius: 20,
  width: 380,
  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
};

const title = {
  fontSize: 28,
  fontWeight: 800,
  marginBottom: 6,
};

const subtitle = {
  fontSize: 14,
  opacity: 0.7,
  marginBottom: 30,
};

const input = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  marginBottom: 14,
  fontSize: 14,
};

const btn = {
  width: "100%",
  padding: "14px",
  borderRadius: 14,
  border: "none",
  background: "#D4AF37",
  color: "#0B1C2D",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 10,
};

const footerText = {
  marginTop: 24,
  fontSize: 13,
  textAlign: "center",
};
