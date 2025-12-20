"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Daftar() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (password !== confirm) {
      setError("Password dan konfirmasi tidak sama");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);

    const userId = data.user.id;
    const { error: pErr } = await supabase
      .from("profiles")
      .insert({ id: userId, username });

    if (pErr) setError(pErr.message);
    else setSuccess("Pendaftaran berhasil. Silakan login.");
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <h1>Daftar</h1>
      <form onSubmit={submit}>
        <input placeholder="Username" required style={input}
          value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="Email" required style={input}
          value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required style={input}
          value={password} onChange={e=>setPassword(e.target.value)} />
        <input type="password" placeholder="Konfirmasi Password" required style={input}
          value={confirm} onChange={e=>setConfirm(e.target.value)} />
        <button style={btn}>Daftar</button>
      </form>
      {error && <p style={{ color:"red" }}>{error}</p>}
      {success && <p style={{ color:"green" }}>{success}</p>}
    </div>
  );
}

const input = { width:"100%", padding:10, marginBottom:12 };
const btn = { width:"100%", padding:10, background:"#0b1c2d", color:"white", border:"none" };
