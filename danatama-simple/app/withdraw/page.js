"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Withdraw() {
  const [amount, setAmount] = useState("");

  const submit = async () => {
    const { data } = await supabase.auth.getUser();
    await supabase.from("transactions").insert({
      user_id: data.user.id,
      type: "withdraw",
      amount
    });
    alert("Withdraw menunggu persetujuan admin");
  };

  return (
    <>
      <h1>Withdraw</h1>
      <input placeholder="Jumlah" onChange={e=>setAmount(e.target.value)} />
      <button onClick={submit}>Kirim</button>
    </>
  );
}
