"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/**
 * ADMIN EMAIL YANG DIIZINKAN
 * (sementara hardcode agar tidak rusak)
 */
const ADMIN_EMAILS = ["sonandra111@gmail.com"];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  const [transactions, setTransactions] = useState([]);

  const [adminNotes, setAdminNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const [manualEmail, setManualEmail] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  // ===============================
  // AUTH & INIT
  // ===============================
  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        window.location.href = "/login";
        return;
      }

      if (!ADMIN_EMAILS.includes(auth.user.email)) {
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

  // ===============================
  // LOAD DATA
  // ===============================
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

  // ===============================
  // SETTINGS
  // ===============================
  const saveSetting = async (key, value) => {
    const { error } = await supabase.from("settings").upsert({ key, value });
    if (error) {
      alert(error.message);
      return;
    }
    alert("Tersimpan");
  };

  // ===============================
  // APPROVE TRANSACTION (AMAN)
  // ===============================
  const approveTx = async (tx) => {
    if (processingId) return;
    setProcessingId(tx.id);

    const note = adminNotes[tx.id] || "Disetujui admin";

    const { error } = await supabase.rpc("approve_transaction", {
      tx_id: tx.id,
      admin_note: note,
    });

    if (error) {
      alert(error.message);
      setProcessingId(null);
      return;
    }

    alert("Transaksi di-ACC");
    setProcessingId(null);
    loadPending();
  };

  // ===============================
  // REJECT TRANSACTION
  // ===============================
  const rejectTx = async (tx) => {
    const note = adminNotes[tx.id];
    if (!note) {
      alert("Catatan admin wajib diisi untuk reject");
      return;
    }

    if (processingId) return;
    setProcessingId(tx.id);

    const { error } = await supabase.rpc("reject_transaction", {
      tx_id: tx.id,
      admin_note: note,
    });

    if (error) {
      alert(error.message);
      setProcessingId(null);
      return;
    }

    alert("Transaksi ditolak");
    setProcessingId(null);
    loadPending();
  };

  // ===============================
  // MANUAL BALANCE (TIDAK BUAT RIWAYAT)
  // ===============================
  const manualAdjust = async () => {
    if (!manualEmail || !manualAmount) {
      alert("Email dan nominal wajib diisi");
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
      return;
    }

    alert("Saldo berhasil diubah");
    setManualEmail("");
    setManualAmount("");
  };

  // ===============================
  // RENDER
  // ===============================
  if (loading) return <p>Memuat...</p>;
  if (!authorized) return null;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Admin Panel</h1>

      {/* SETTINGS */}
      <div style={card}>
        <h3>Rekening Deposit</h3>
        <input
          value={depositBank}
          onChange={(e) => setDepositBank(e.target.value)}
        />
        <button onClick={() => saveSetting("deposit_bank", depositBank)}>
          Simpan
        </button>
      </div>

      <div style={card}>
        <h3>CS WhatsApp</h3>
        <input
          value={csWhatsapp}
          onChange={(e) => setCsWhatsapp(e.target.value)}
        />
        <button onClick={() => saveSetting("cs_whatsapp", csWhatsapp)}>
          Simpan
        </button>
      </div>

      {/* TRANSACTIONS */}
      <div style={card}>
        <h3>Deposit & Withdraw Pending</h3>

        {transactions.length === 0 && <p>Tidak ada transaksi pending.</p>}

        {transactions.map((t) => (
          <div key={t.id} style={tx}>
            <p>
              <b>{t.type.toUpperCase()}</b> — Rp{" "}
              {t.amount.toLocaleString()}
            </p>

            {t.note && <p>Catatan User: {t.note}</p>}

            <textarea
              placeholder="Catatan admin"
              value={adminNotes[t.id] || ""}
              onChange={(e) =>
                setAdminNotes({ ...adminNotes, [t.id]: e.target.value })
              }
              style={{ width: "100%", marginBottom: 8 }}
            />

            <button
              disabled={processingId === t.id}
              onClick={() => approveTx(t)}
            >
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

      {/* MANUAL BALANCE */}
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
        <button onClick={manualAdjust}>Simpan Saldo</button>
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
