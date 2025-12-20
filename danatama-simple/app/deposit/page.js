"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Deposit() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [bankTujuan, setBankTujuan] = useState("");
  const [namaPengirim, setNamaPengirim] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("key,value").then(({ data }) => {
      const b = data?.find(i => i.key === "deposit_bank");
      setBankTujuan(b?.value || "");
    });
  }, []);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt) return alert("Masukkan jumlah deposit");
    if (!namaPengirim) return alert("Masukkan nama pengirim");

    setLoading(true);
    try {
      const note =
        `Nama Pengirim: ${namaPengirim}\n` +
        `Rekening Tujuan: ${bankTujuan}`;

      const { error } = await supabase.rpc("request_deposit", {
        req_amount: amt,
        req_note: note
      });

      if (error) throw error;

      alert("Deposit diajukan, menunggu konfirmasi admin");
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
        <p>Rekening Tujuan Deposit:</p>
        <b>{bankTujuan}</b>

        <input
          style={input}
          placeholder="Jumlah Deposit"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <input
          style={input}
          placeholder="Nama Pengirim"
          value={namaPengirim}
          onChange={e => setNamaPengirim(e.target.value)}
        />

        <button style={btn} onClick={submit} disabled={loading}>
          {loading ? "Memproses..." : "Ajukan Deposit"}
        </button>

        <p style={noteText}>
          Pastikan nama pengirim sesuai dengan transfer.
        </p>
      </div>
    </div>
  );
}

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)"
};

const input = {
  width: "100%",
  padding: 10,
  margin: "8px 0",
  borderRadius: 8,
  border: "1px solid #ddd"
};

const btn = {
  width: "100%",
  padding: 12,
  marginTop: 10,
  background: "#0b1c2d",
  color: "white",
  border: 0,
  borderRadius: 10,
  cursor: "pointer"
};

const noteText = {
  fontSize: 12,
  opacity: 0.7,
  marginTop: 10
};
