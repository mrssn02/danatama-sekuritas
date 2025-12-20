"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const MIN_WITHDRAW = 100000;

export default function Withdraw() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [rek, setRek] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");

      const w = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", data.user.id)
        .single();

      setBalance(w.data?.balance || 0);
    });
  }, []);

  const submit = async () => {
    const amt = Number(amount);

    if (!amt || amt < MIN_WITHDRAW) {
      alert(`Minimal withdraw Rp ${MIN_WITHDRAW.toLocaleString("id-ID")}`);
      return;
    }

    if (amt > balance) {
      alert("Saldo tidak mencukupi");
      return;
    }

    if (!bank || !rek || !name) {
      alert("Lengkapi data rekening tujuan");
      return;
    }

    const { data } = await supabase.auth.getUser();

    await supabase.from("transactions").insert({
      user_id: data.user.id,
      type: "withdraw",
      amount: amt,
      note:
        `Bank Tujuan : ${bank}\n` +
        `No Rekening : ${rek}\n` +
        `Atas Nama   : ${name}`
    });

    alert("Withdraw diajukan, menunggu persetujuan admin");
    router.push("/transaksi");
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Withdraw</h1>

      <div style={card}>
        <p>Saldo: <b>Rp {balance.toLocaleString("id-ID")}</b></p>

        <input style={input} placeholder="Jumlah Withdraw" value={amount}
          onChange={e => setAmount(e.target.value)} />

        <input style={input} placeholder="Nama Bank" value={bank}
          onChange={e => setBank(e.target.value)} />

        <input style={input} placeholder="No Rekening" value={rek}
          onChange={e => setRek(e.target.value)} />

        <input style={input} placeholder="Atas Nama" value={name}
          onChange={e => setName(e.target.value)} />

        <button style={btn} onClick={submit}>Ajukan Withdraw</button>
      </div>
    </div>
  );
}

const card = { background:"white", padding:20, borderRadius:12 };
const input = { width:"100%", padding:10, margin:"8px 0" };
const btn = { width:"100%", padding:12, background:"#0b1c2d", color:"white", border:0 };
