"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Daftar() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Password dan konfirmasi tidak sama");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Pendaftaran berhasil. Silakan login.");
    }
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <h1>Daftar Akun</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={input}
        />

        <input
          type="password"
          placeholder="Konfirmasi Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={input}
        />

        <button style={button}>Daftar</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 12
};

const button = {
  width: "100%",
  padding: 10,
  background: "#0b1c2d",
  color: "white",
  border: "none"
};
