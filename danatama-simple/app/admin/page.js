"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [note, setNote] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error) setTransactions(data || []);
    setLoading(false);
  }

  async function approve(tx) {
    if (tx.status !== "pending") {
      alert("Transaksi sudah diproses");
      return;
    }

    setProcessingId(tx.id);

    // Update status transaksi
    const { error: updateErr } = await supabase
      .from("transactions")
      .update({
        status: "approved",
        admin_note: note || "Disetujui admin",
        approved_at: new Date().toISOString()
      })
      .eq("id", tx.id);

    if (updateErr) {
      alert(updateErr.message);
      setProcessingId(null);
      return;
    }

    // Tambah / kurangi saldo
    const amount =
      tx.type === "deposit" ? tx.amount : -tx.amount;

    const { error: balErr } = await supabase.rpc("adjust_balance", {
      uid: tx.user_id,
      amt: amount
    });

    if (balErr) {
      alert("Gagal update saldo: " + balErr.message);
      setProcessingId(null);
      return;
    }

    alert("Transaksi di-ACC");
    setNote("");
    setProcessingId(null);
    loadPending();
  }

  async function reject(tx) {
    if (!note) {
      alert("Masukkan alasan penolakan");
      return;
    }

    if (tx.status !== "pending") {
      alert("Transaksi sudah diproses");
      return;
    }

    setProcessingId(tx.id);

    const { error } = await supabase
      .from("transactions")
      .update({
        status: "rejected",
        admin_note: note,
        rejected_at: new Date().toISOString()
      })
      .eq("id", tx.id);

    if (error) {
      alert(error.message);
      setProcessingId(null);
      return;
    }

    alert("Transaksi ditolak");
    setNote("");
    setProcessingId(null);
    loadPending();
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Admin Panel</h1>

      {loading && <p>Memuat...</p>}

      {!loading && transactions.length === 0 && (
        <p>Tidak ada transaksi pending</p>
      )}

      {transactions.map((tx) => (
        <div key={tx.id} style={card}>
          <b>
            {tx.type.toUpperCase()} — Rp{" "}
            {tx.amount.toLocaleString()}
          </b>

          <p>
            User ID: <code>{tx.user_id}</code>
          </p>

          {tx.note && (
            <p>
              <b>Catatan User:</b> {tx.note}
            </p>
          )}

          <textarea
            placeholder="Catatan admin (wajib untuk reject)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={textarea}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={processingId === tx.id}
              onClick={() => approve(tx)}
              style={btnApprove}
            >
              ACC
            </button>

            <button
              disabled={processingId === tx.id}
              onClick={() => reject(tx)}
              style={btnReject}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= STYLES ================= */

const card = {
  background: "white",
  padding: 16,
  borderRadius: 10,
  marginBottom: 16,
  border: "1px solid #e5e7eb"
};

const textarea = {
  width: "100%",
  minHeight: 60,
  marginTop: 8,
  marginBottom: 10,
  padding: 8
};

const btnApprove = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "8px 14px",
  cursor: "pointer",
  borderRadius: 6
};

const btnReject = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "8px 14px",
  cursor: "pointer",
  borderRadius: 6
};
