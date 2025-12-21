"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const ADMIN_EMAILS = ["sonandra111@gmail.com"];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  const [transactions, setTransactions] = useState([]);

  // catatan admin per transaksi (biar tidak nyangkut antar card)
  const [notesById, setNotesById] = useState({});

  const [manualEmail, setManualEmail] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  const [processingId, setProcessingId] = useState(null);

  // ===============================
  // AUTH & INIT
  // ===============================
  useEffect(() => {
    const init = async () => {
      const { data: auth, error: authErr } = await supabase.auth.getUser();

      if (authErr) {
        alert(authErr.message);
        window.location.href = "/login";
        return;
      }

      if (!auth?.user) {
        window.location.href = "/login";
        return;
      }

      const email = (auth.user.email || "").toLowerCase();

      if (!ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
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
    const { data, error } = await supabase.from("settings").select("*");
    if (error) {
      alert(error.message);
      return;
    }

    data?.forEach((s) => {
      if (s.key === "deposit_bank") setDepositBank(s.value || "");
      if (s.key === "cs_whatsapp") setCsWhatsapp(s.value || "");
    });
  };

  const loadPending = async () => {
    // Pakai RPC supaya tidak kehalang RLS
    const { data, error } = await supabase.rpc("admin_list_pending_transactions");

    if (error) {
      alert(error.message);
      setTransactions([]);
      return;
    }

    setTransactions(data || []);

    // siapkan notesById default kosong untuk tiap tx
    const next = {};
    (data || []).forEach((t) => (next[t.id] = next[t.id] ?? ""));
    setNotesById((prev) => ({ ...next, ...prev }));
  };

  // ===============================
  // SETTINGS
  // ===============================
  const saveSetting = async (key, value) => {
    const { error } = await supabase.from("settings").upsert({ key, value });
    if (error) return alert(error.message);
    alert("Tersimpan");
  };

  // ===============================
  // TRANSACTION ACTIONS (RPC)
  // ===============================
  const approveTx = async (tx) => {
    if (!tx?.id) return;

    setProcessingId(tx.id);

    const adminNote = (notesById[tx.id] || "").trim();

    const { error } = await supabase.rpc("admin_approve_transaction", {
      p_tx_id: tx.id,
      p_admin_note: adminNote || "Disetujui admin",
    });

    setProcessingId(null);

    if (error) {
      // tampilkan error yang jelas
      if (error.message?.includes("ALREADY_PROCESSED")) {
        alert("Transaksi sudah diproses (tidak bisa di-ACC 2x).");
      } else {
        alert(error.message);
      }
      return;
    }

    alert("Transaksi di-ACC");
    setNotesById((prev) => ({ ...prev, [tx.id]: "" }));
    await loadPending();
  };

  const rejectTx = async (tx) => {
    if (!tx?.id) return;

    const adminNote = (notesById[tx.id] || "").trim();
    if (!adminNote) {
      alert("Masukkan alasan penolakan (catatan admin) dulu.");
      return;
    }

    setProcessingId(tx.id);

    const { error } = await supabase.rpc("admin_reject_transaction", {
      p_tx_id: tx.id,
      p_admin_note: adminNote,
    });

    setProcessingId(null);

    if (error) {
      if (error.message?.includes("ALREADY_PROCESSED")) {
        alert("Transaksi sudah diproses (tidak bisa di-Reject 2x).");
      } else {
        alert(error.message);
      }
      return;
    }

    alert("Transaksi ditolak");
    setNotesById((prev) => ({ ...prev, [tx.id]: "" }));
    await loadPending();
  };

  // ===============================
  // MANUAL BALANCE (RPC by email)
  // ===============================
  const manualAdjust = async () => {
    const email = (manualEmail || "").trim();
    const amtStr = (manualAmount || "").toString().trim();

    if (!email || !amtStr) {
      alert("Email dan nominal wajib diisi");
      return;
    }

    const amt = Number(amtStr);
    if (!Number.isFinite(amt) || amt === 0) {
      alert("Nominal tidak valid");
      return;
    }

    const { error } = await supabase.rpc("admin_adjust_balance_by_email", {
      p_email: email,
      p_amount: amt,
    });

    if (error) {
      if (error.message?.includes("USER_NOT_FOUND")) {
        alert("User tidak ditemukan (email tidak ada di auth.users).");
      } else {
        alert(error.message);
      }
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
          style={input}
        />
        <button onClick={() => saveSetting("deposit_bank", depositBank)} style={btn}>
          Simpan
        </button>
      </div>

      <div style={card}>
        <h3>CS WhatsApp</h3>
        <input
          value={csWhatsapp}
          onChange={(e) => setCsWhatsapp(e.target.value)}
          style={input}
        />
        <button onClick={() => saveSetting("cs_whatsapp", csWhatsapp)} style={btn}>
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
              <b>{String(t.type || "").toUpperCase()}</b> — Rp{" "}
              {Number(t.amount || 0).toLocaleString()}
            </p>

            {t.note && <p>Catatan User: {t.note}</p>}

            <textarea
              placeholder="Catatan admin (wajib untuk reject)"
              value={notesById[t.id] || ""}
              onChange={(e) =>
                setNotesById((prev) => ({ ...prev, [t.id]: e.target.value }))
              }
              style={{ width: "100%", marginBottom: 8, minHeight: 60 }}
            />

            <button
              disabled={processingId === t.id}
              onClick={() => approveTx(t)}
              style={btn}
            >
              ACC
            </button>

            <button
              disabled={processingId === t.id}
              onClick={() => rejectTx(t)}
              style={{ ...btn, marginLeft: 8, background: "#b91c1c" }}
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
          style={input}
        />
        <input
          type="number"
          placeholder="Nominal (+ / -)"
          value={manualAmount}
          onChange={(e) => setManualAmount(e.target.value)}
          style={input}
        />
        <button onClick={manualAdjust} style={btn}>
          Simpan
        </button>

        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          Catatan: perubahan saldo manual tidak membuat transaksi baru (sesuai kebutuhan admin).
        </p>
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

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  marginBottom: 10,
};

const btn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: "#0b1c2d",
  color: "white",
};
