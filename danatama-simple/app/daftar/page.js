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

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    // 🔥 cek apakah perlu verifikasi email
    if (data?.user && !data.session) {
      alert("Cek email kamu untuk verifikasi akun!");
    } else {
      alert("Pendaftaran berhasil!");
    }

    window.location.href = "/login";
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
