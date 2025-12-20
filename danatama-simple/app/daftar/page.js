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

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !email) {
      setError("Username dan email wajib diisi");
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
      // 1️⃣ AUTH SIGN UP
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password
      });

      if (authErr) throw authErr;
      if (!data.user) throw new Error("Gagal membuat user");

      const userId = data.user.id;

      // 2️⃣ INSERT PROFILE (USERNAME + EMAIL)
      const { error: profileErr } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          username,
          email
        });

      if (profileErr) throw profileErr;

      // 3️⃣ CREATE WALLET (BALANCE = 0)
      const { error: walletErr } = await supabase
        .from("wallets")
        .insert({
          user_id: userId,
          balance: 0
        });

      if (walletErr) throw walletErr;

      alert("Pendaftaran berhasil, silakan login");
      router.push("/login");

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
        />

        <input
          style={input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          style={input}
          type="password"
          placeholder="Konfirmasi Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button style={btn} disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </button>

        {error && <p style={err}>{error}</p>}
      </form>
    </div>
  );
}

/* ===== STYLES ===== */

const wrap = { maxWidth: 420, margin: "0 auto" };

const card = {
  background: "white",
  padding: 24,
  borderRadius: 14,
  boxShadow: "0 10px 24px rgba(0,0,0,0.08)"
};

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #ddd"
};

const btn = {
  width: "100%",
  padding: 12,
  background: "#0b1c2d",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer"
};

const err = { color: "red", marginTop: 10, fontSize: 13 };
