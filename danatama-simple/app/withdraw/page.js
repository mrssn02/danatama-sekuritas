"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Withdraw() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [rekening, setRekening] = useState("");
  const [atasNama, setAtasNama] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

      const w = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", data.user.id)
        .single();

      setBalance(Number(w.data?.balance || 0));
    });
  }, []);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Jumlah withdraw tidak valid");
      return;
    }

    if (Number(amount) > balance) {
      alert("Saldo tidak mencukupi");
      return;
    }

    if (!bank || !rekening || !atasNama) {
      alert("Lengkapi data rekening tujuan");
      return;
    }

    setLoading(true);

    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const note = `
Bank Tujuan : ${bank}
No Rekening : ${rekening}
Atas Nama   : ${atasNama}
    `.trim();

    const { error } = await supabase.from("transactions").insert({
      user_id: data.user.id,
      type: "withdraw",
      amount: Number(amount),
      note
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Withdraw berhasil diajukan. Menunggu persetujuan admin.");
    router.push("/transaksi");
  };

  return (
    <div style={wrap}>
      <h1>Withdraw</h1>

      <div style={card}>
        <p>
          Saldo tersedia:{" "}
          <b>Rp {balance.toLocaleString("id-ID")}</b>
        </p>

        <input
          style={input}
          placeholder="Jumlah Withdraw"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <hr style={{ margin: "16px 0" }} />

        <h3>Rekening Tujuan</h3>

        <input
          style={input}
          placeholder="Nama Bank (contoh: BCA)"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
        />

        <input
          style={input}
          placeholder="Nomor Rekening"
          value={rekening}
          onChange={(e) => setRekening(e.target.value)}
        />

        <input
          style={input}
          placeholder="Atas Nama Rekening"
          value={atasNama}
          onChange={(e) => setAtasNama(e.target.value)}
        />

        <button style={btn} onClick={submit} disabled={loading}>
          {loading ? "Memproses..." : "Ajukan Withdraw"}
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const wrap = {
  maxWidth: 520,
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
  marginBottom: 12,
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
  cursor: "pointer",
  marginTop: 10
};
