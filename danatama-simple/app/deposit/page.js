"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [sender, setSender] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!amount || !sender) {
      alert("Nominal dan nama pengirim wajib diisi");
      return;
    }

    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();

    await supabase.from("transactions").insert({
      user_id: auth.user.id,
      type: "deposit",
      amount: Number(amount),
      note: `Pengirim: ${sender}`,
      status: "pending",
    });

    setLoading(false);
    alert("Deposit berhasil diajukan");
    window.location.href = "/wallet";
  };

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={title}>Deposit Dana</h1>

        <input
          style={input}
          placeholder="Nominal Deposit"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          style={input}
          placeholder="Nama Pengirim"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
        />

        <button style={btn} onClick={submit} disabled={loading}>
          {loading ? "Memproses..." : "Ajukan Deposit"}
        </button>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const page = { background: "#F4F6F8", minHeight: "100vh", padding: 40 };
const card = {
  maxWidth: 420,
  margin: "0 auto",
  background: "white",
  padding: 30,
  borderRadius: 20,
  boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
};
const title = { fontSize: 28, fontWeight: 900, marginBottom: 20 };
const input = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #E5E7EB",
  marginBottom: 14,
};
const btn = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  background: "#D4AF37",
  color: "#0B1C2D",
  fontWeight: 900,
  border: "none",
};
