"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Pastikan user login
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          setErrorMsg("Anda belum login.");
          setLoading(false);
          return;
        }

        // 2. Ambil transaksi pending (deposit & withdraw)
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: true });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setTransactions(data || []);
        }
      } catch (e) {
        setErrorMsg(e.message);
      }

      // ⚠️ PENTING: loading DIMATIKAN APA PUN HASILNYA
      setLoading(false);
    };

    load();
  }, []);

  const approve = async (tx) => {
    try {
      // update status transaksi
      await supabase
        .from("transactions")
        .update({ status: "approved" })
        .eq("id", tx.id);

      // update saldo wallet
      await supabase.rpc("adjust_balance", {
        uid: tx.user_id,
        amt: tx.type === "deposit" ? tx.amount : -tx.amount
      });

      alert("Transaksi berhasil di-ACC");

      // refresh list
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
    } catch (e) {
      alert(e.message);
    }
  };

  // =========================
  // RENDER
  // =========================

  if (loading) {
    return <p>Memuat...</p>;
  }

  if (errorMsg) {
    return (
      <div>
        <h1>Admin Panel</h1>
        <p style={{ color: "red" }}>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin Panel</h1>

      {transactions.length === 0 && (
        <p>Tidak ada transaksi pending.</p>
      )}

      {transactions.map((t) => (
        <div key={t.id} style={card}>
          <p>
            <b>{t.type.toUpperCase()}</b> – Rp{" "}
            {t.amount.toLocaleString("id-ID")}
          </p>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            {t.note || "-"}
          </p>
          <button onClick={() => approve(t)}>ACC</button>
        </div>
      ))}
    </div>
  );
}

const card = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  marginBottom: 12
};
