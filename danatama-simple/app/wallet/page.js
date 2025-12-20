"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [bank, setBank] = useState("");
  const [cs, setCs] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user.id;

      const w = await supabase.from("wallets").select("balance").eq("user_id", uid).single();
      setBalance(w.data?.balance || 0);

      const s = await supabase.from("settings").select("*");
      s.data.forEach(i => {
        if (i.key === "deposit_bank") setBank(i.value);
        if (i.key === "cs_whatsapp") setCs(i.value);
      });
    });
  }, []);

  return (
    <>
      <h1>Dompet</h1>
      <div style={card}>
        <h3>Saldo: Rp {balance}</h3>
        <p>Rekening Deposit:</p>
        <b>{bank}</b>

        <div style={{ marginTop: 20 }}>
          <a href="/deposit">Deposit</a> | <a href="/withdraw">Withdraw</a>
        </div>
      </div>

      <a
        href={`https://wa.me/${cs}`}
        target="_blank"
        style={waBtn}
      >
        💬 Customer Service
      </a>
    </>
  );
}

const card = { background:"white", padding:20, borderRadius:12 };
const waBtn = {
  position:"fixed", bottom:20, right:20,
  background:"#25D366", color:"white",
  padding:"12px 16px", borderRadius:30,
  textDecoration:"none"
};
