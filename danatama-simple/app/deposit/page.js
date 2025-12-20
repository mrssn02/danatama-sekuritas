"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Deposit() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("key,value").then(({ data }) => {
      const b = data?.find(i => i.key === "deposit_bank");
      setBank(b?.value || "");
    });
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const amt = Number(amount);
      const note = `Deposit ke rekening:\n${bank}`;

      const { error } = await supabase.rpc("request_deposit", {
        req_amount: amt,
        req_note: note
      });

      if (error) throw error;

      alert("Deposit diajukan. Menunggu konfirmasi admin.");
      router.push("/transaksi");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Deposit</h1>

      <div style={card}>
        <p>Rekening tujuan:</p>
        <b>{bank}</b>

        <input
          style={input}
          placeholder="Jumlah Deposit"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <button style={btn} onClick={submit} disabled={loading}>
          {loading ? "Memproses..." : "Ajukan Deposit"}
        </button>

        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
          Minimal deposit mengikuti aturan sistem (contoh: Rp 50.000).
        </p>
      </div>
    </div>
  );
}

const card = { background: "white", padding: 20, borderRadius: 12 };
const input = { width: "100%", padding: 10, margin: "12px 0" };
const btn = { width: "100%", padding: 12, background: "#0b1c2d", color: "white", border: 0, borderRadius: 10 };
