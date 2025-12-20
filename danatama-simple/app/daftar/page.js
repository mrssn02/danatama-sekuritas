"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Daftar() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Username wajib diisi");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (password !== confirm) {
      setError("Password dan konfirmasi tidak sama");
      return;
    }

    setLoading(true);

    try {
      // ===============================
      // 1. SIGN UP AUTH
      // ===============================
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("User tidak berhasil dibuat");

      const userId = data.user.id;

      // ===============================
      // 2. INSERT PROFILE
      // ===============================
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          username
        });

      if (profileError) throw profileError;

      // ===============================
      // 3. CREATE WALLET (WAJIB)
      // ===============================
      const { error: walletError } = await supabase
        .from("wallets")
        .insert({
          user_id: userId,
          balance: 0
        });

      if (walletError) throw walletError;

      // ===============================
      // SELESAI
      // ===============================
      setSuccess("Pendaftaran berhasil. Silakan login.");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirm("");

      setTimeout(() => {
        router.push("/login");
      }, 1200);

    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <h1>Daftar Akun</h1>

      <form onSubmit={submit} style={card}>
        <input
          style={input}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          style={input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          style={input}
          type="password"
          placeholder="Password (min. 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          style={input}
          type="password"
          placeholder="Konfirmasi Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button style={btn} disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </button>

        {error && <p style={err}>{error}</p>}
        {success && <p style={ok}>{success}</p>}
      </form>
    </div>
  );
}

/* ================= STYLES ================= */

const wrap = {
  maxWidth: 420,
  margin: "0 auto"
};

const card = {
  background: "white",
  padding: 24,
  borderRadius: 14,
  boxShadow: "0 10px 24px rgba(0,0,0,0.08)"
};

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 14,
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: 14
};

const btn = {
  width: "100%",
  padding: 12,
  background: "#0b1c2d",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  cursor: "pointer"
};

const err = {
  color: "#b91c1c",
  marginTop: 12,
  fontSize: 13
};

const ok = {
  color: "#15803d",
  marginTop: 12,
  fontSize: 13
};
