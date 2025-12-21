"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/**
 * DAFTAR EMAIL ADMIN
 * (sementara PAKAI INI DULU biar aman & gak rusak)
 */
const ADMIN_EMAILS = ["sonandra111@gmail.com"];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [adminNotes, setAdminNotes] = useState({});

  const [manualEmail, setManualEmail] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  const [processingId, setProcessingId] = useState(null);

  /* ===============================
     AUTH
  =============================== */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        window.location.href = "/login";
        return;
      }

      if (!ADMIN_EMAILS.includes(data.user.email)) {
        alert("Akses admin ditolak");
        window.location.href = "/";
        return;
      }

      setAuthorized(true);
      await loadSettings();
      await loadPending();
      setLoading(false);
    };

    init();
  }, []);

  /* ===============================
     LOAD DATA
  =============================== */
  const loadSettings = async () => {
    const { data } = await supabase.from("settings").select("*");
    data?.forEach((s) => {
      if (s.key === "deposit_bank") setDepositBank(s.value);
      if (s.key === "cs_whatsapp") setCsWhatsapp(s.value);
    });
  };

  const loadPending = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setTransactions(data || []);
  };

  /* ===============================
     SETTINGS
  =============================== */
  const saveSetting = async (key, value) => {
    await supabase.from("settings").upsert({ key, value });
    alert("Tersimpan");
  };

  /* ===============================
     APPROVE / REJECT (AMAN)
  =============================== */
  const approveTx = async (tx) => {
    if (processingId) return;
    setProcessingId(tx.id);

    const note = adminNotes[tx.id] || "Disetujui admin";

    const { error } = await supabase.rpc("approve_transaction", {
      tx_id: tx.id,
      p_admin_note: note,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Transaksi di-ACC");
      await loadPending();
    }

    setProcessingId(null);
  };

  const rejectTx = async (tx) => {
    const note = adminNotes[tx.id];
    if (!note) {
      alert("Catatan admin wajib diisi");
      return;
    }

    if (processingId) return;
    setProcessingId(tx.id);

    const { error } = await supabase.rpc("reject_transaction", {
      tx_id: tx.id,
      p_admin_note: note,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Transaksi ditolak");
      await loadPending();
    }

    setProcessingId(null);
  };

  /* ===============================
     MANUAL BALANCE (EMAIL)
  =============================== */
  const manualAdjust = async () => {
    if (!manualEmail || !manualAmount) {
      alert("Email & nominal wajib diisi");
      return;
    }

    const { data: user } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", manualEmail)
      .single();

    if (!user) {
      alert("User tidak ditemukan");
      return;
    }

    const { error } = await supabase.rpc("adjust_balance", {
      uid: user.id,
      amt: Number(manualAmount),
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Saldo berhasil diubah");
      setManualEmail("");
      setManualAmount("");
    }
  };

  /* ===============================
     RENDER
  =============================== */
  if (loading) return <p>Memuat...</p>;
  if (!authorized) return null;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Admin Panel</h1>

      <div style={card}>
        <h3>Rekening Deposit</h3>
        <input value={depositBank} onChange={(e) => setDepositBank(e.target.value)} />
        <button onClick={() => saveSetting("deposit_bank", depositBank)}>Simpan</button>
      </div>

      <div style={card}>
        <h3>CS WhatsApp</h3>
        <input value={csWhatsapp} onChange={(e) => setCsWhatsapp(e.target.value)} />
        <button onClick={() => saveSetting("cs_whatsapp", csWhatsapp)}>Simpan</button>
      </div>

      <div style={card}>
        <h3>Deposit & Withdraw Pending</h3>

        {transactions.length === 0 && <p>Tidak ada transaksi pending.</p>}

        {transactions.map((t) => (
          <div key={t.id} style={tx}>
            <b>{t.type.toUpperCase()}</b> — Rp {t.amount.toLocaleString()}
            <p>Catatan User: {t.note || "-"}</p>

            <textarea
              placeholder="Catatan admin"
              value={adminNotes[t.id] || ""}
              onChange={(e) =>
                setAdminNotes({ ...adminNotes, [t.id]: e.target.value })
              }
              style={{ width: "100%", marginBottom: 8 }}
            />

            <button disabled={processingId === t.id} onClick={() => approveTx(t)}>
              ACC
            </button>

            <button
              disabled={processingId === t.id}
              onClick={() => rejectTx(t)}
              style={{ marginLeft: 8 }}
            >
              Reject
            </button>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3>Tambah / Kurangi Saldo Manual</h3>
        <input
          placeholder="Email user"
          value={manualEmail}
          onChange={(e) => setManualEmail(e.target.value)}
        />
        <input
          type="number"
          placeholder="Nominal (+ / -)"
          value={manualAmount}
          onChange={(e) => setManualAmount(e.target.value)}
        />
        <button onClick={manualAdjust}>Simpan</button>
      </div>
    </div>
  );
}

/* ===============================
   STYLES
================================ */
const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  marginBottom: 20,
};

const tx = {
  border: "1px solid #e5e7eb",
  padding: 12,
  borderRadius: 8,
  marginBottom: 10,
};
