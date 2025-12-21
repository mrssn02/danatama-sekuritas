"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);register

  const login = async () => {
    if (!email || !password) {
      alert("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={title}>Masuk Akun</h1>
        <p style={subtitle}>Akses platform investasi Anda</p>

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

        <button style={btn} onClick={login} disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <p style={footerText}>
          Belum punya akun? <a href="/daftar">Daftar sekarang</a>
        </p>
      </div>
    </div>
  );
}

/* ===============================
   STYLES
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
