"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const login = async (e) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/");
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <h1>Login</h1>
      <form onSubmit={login}>
        <input placeholder="Email" required style={input}
          value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required style={input}
          value={password} onChange={e=>setPassword(e.target.value)} />
        <button style={btn}>Login</button>
      </form>
      {error && <p style={{ color:"red" }}>{error}</p>}
    </div>
  );
}

const input = { width:"100%", padding:10, marginBottom:12 };
const btn = { width:"100%", padding:10, background:"#0b1c2d", color:"white", border:"none" };
