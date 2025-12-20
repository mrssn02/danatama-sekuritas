"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Admin() {
  const [tx, setTx] = useState([]);

  useEffect(() => {
    supabase.from("transactions")
      .select("*")
      .eq("status","pending")
      .then(({ data }) => setTx(data));
  }, []);

  const approve = async (t) => {
    await supabase.from("transactions")
      .update({ status:"approved" })
      .eq("id", t.id);

    await supabase.rpc("adjust_balance", {
      uid: t.user_id,
      amt: t.type === "deposit" ? t.amount : -t.amount
    });

    alert("Berhasil");
  };

  return (
    <>
      <h1>Admin Panel</h1>
      {tx.map(t => (
        <div key={t.id} style={card}>
          <p>{t.type} Rp {t.amount}</p>
          <button onClick={()=>approve(t)}>ACC</button>
        </div>
      ))}
    </>
  );
}

const card = { background:"white", padding:12, marginBottom:10 };
