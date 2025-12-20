"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const MIN_DEPOSIT = 1000000;

export default function Deposit() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");

  useEffect(() => {
    supabase.from("settings").select("key,value").then(({ data }) => {
      const b = data?.find(i => i.key === "deposit_bank");
      setBank(b?.value || "");
    });
  }, []);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt < MIN_DEPOSIT) {
      alert(`Minimal deposit Rp ${MIN_DEPOSIT.toLocaleString("id-ID")}`);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) return router.push("/login");

    await supabase.from("transactions").insert({
      user_id: data.user.id,
      type: "deposit",
      amount: amt,
      note: `Deposit ke rekening:\n${bank}`
    });

    alert("Deposit diajukan, menunggu konfirmasi admin");
    router.push("/transaksi");
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

        <button style={btn} onClick={submit}>
          Ajukan Deposit
        </button>
      </div>
    </div>
  );
}

const card = { background:"white", padding:20, borderRadius:12 };
const input = { width:"100%", padding:10, margin:"12px 0" };
const btn = { width:"100%", padding:12, background:"#0b1c2d", color:"white", border:0 };
