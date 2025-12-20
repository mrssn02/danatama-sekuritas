"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Deposit() {
  const [amount, setAmount] = useState("");

  const submit = async () => {
    const { data } = await supabase.auth.getUser();
    await supabase.from("transactions").insert({
      user_id: data.user.id,
      type: "deposit",
      amount
    });
    alert("Deposit menunggu persetujuan admin");
  };

  return (
    <>
      <h1>Deposit</h1>
      <input placeholder="Jumlah" onChange={e=>setAmount(e.target.value)} />
      <button onClick={submit}>Kirim</button>
    </>
  );
}
