"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Withdraw() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [rek, setRek] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");

      const w = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", data.user.id)
        .single();

      setBalance(Number(w.data?.balance || 0));
    });
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const amt = Number(amount);

      const note =
        `Bank Tujuan : ${bank}\n` +
        `No Rekening : ${rek}\n` +
        `Atas Nama   : ${name}`;

      const { error } = await supabase.rpc("request_withdraw", {
        req_amount: amt,
        req_note: note
      });

      if (error) throw error;

      alert("Withdraw diajukan. Menunggu persetujuan admin.");
      router.push("/transaksi");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Withdraw</h1>

      <div style={card}>
        <p>Saldo: <b>Rp {balance.toLocaleString("id-ID")}</b></p>

        <input style={input} placeholder="Jumlah Withdraw" value={amount} onChange={e => setAmount(e.target.value)} />
        <input style={input} placeholder="Nama Bank" value={bank} onChange={e => setBank(e.target.value)} />
        <input style={input} placeholder="No Rekening" value={rek} onChange={e => setRek(e.target.value)} />
        <input style={input} placeholder="Atas Nama" value={name} onChange={e => setName(e.target.value)} />

        <button style={btn} onClick={submit} disabled={loading}>
          {loading ? "Memproses..." : "Ajukan Withdraw"}
        </button>

        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
          Sistem otomatis cek minimal withdraw, saldo, dan limit harian.
        </p>
      </div>
    </div>
  );
}

const card = { background: "white", padding: 20, borderRadius: 12 };
const input = { width: "100%", padding: 10, margin: "8px 0", borderRadius: 10, border: "1px solid #ddd" };
const btn = { width: "100%", padding: 12, background: "#0b1c2d", color: "white", border: 0, borderRadius: 10 };
