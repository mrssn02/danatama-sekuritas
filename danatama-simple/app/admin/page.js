"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState(null);

  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [adminNotes, setAdminNotes] = useState({});

  const [manualEmail, setManualEmail] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  const [processingId, setProcessingId] = useState(null);

  /* ===============================
     AUTH & INIT
  =============================== */
  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        window.location.href = "/login";
        return;
      }

      const { data: admin } = await supabase
        .from("admins")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (!admin) {
        alert("Akses admin ditolak");
        window.location.href = "/";
        return;
      }

      setAdminRole(admin.role);
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
     APPROVE TRANSACTION (SAFE)
  =============================== */
  const approveTx = async (tx) => {
    if (processingId) return;
    setProcessingId(tx.id);

    // pastikan masih pending
    const { data: fresh } = await supabase
      .from("transactions")
      .select("status")
      .eq("id", tx.id)
      .single();

    if (!fresh || fresh.status !== "pending") {
      alert("Transaksi sudah diproses");
      setProcessingId(null);
      return;
    }

    // update status dulu
    await supabase
      .from("transactions")
      .update({
        status: "approved",
        admin_note: adminNotes[tx.id] || "Disetujui admin",
        approved_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    // update saldo (1x saja)
    const amount = tx.type === "deposit" ? tx.amount : -tx.amount;
    await supabase
      .from("wallets")
      .update({
        balance: supabase.rpc
          ? undefined
          : undefined,
      });

    await supabase.rpc("adjust_balance", {
      uid: tx.user_id,
      amt: amount,
    });

    alert("Transaksi di-ACC");
    setProcessingId(null);
    loadPending();
  };

  /* ===============================
     REJECT TRANSACTION
  =============================== */
  const rejectTx = async (tx) => {
    const note = adminNotes[tx.id];
    if (!note) {
      alert("Isi alasan penolakan");
      return;
    }

    if (processingId) return;
    setProcessingId(tx.id);

    await supabase
      .from("transactions")
      .update({
        status: "rejected",
        admin_note: note,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    alert("Transaksi ditolak");
    setProcessingId(null);
    loadPending();
  };

  /* ===============================
     MANUAL BALANCE (EMAIL BASED)
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

    await supabase.rpc("adjust_balance", {
      uid: user.id,
      amt: Number(manualAmount),
    });

    alert("Saldo berhasil diubah");
    setManualEmail("");
    setManualAmount("");
  };

  /* ===============================
     RENDER
  =============================== */
  if (loading) return <p>Memuat...</p>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Admin Panel</h1>

      {/* SETTINGS */}
      {(adminRole === "super_admin" || adminRole === "admin_finance") && (
        <>
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
        </>
      )}

      {/* TRANSACTIONS */}
      <div style={card}>
        <h3>Deposit & Withdraw Pending</h3>

        {transactions.length === 0 && <p>Tidak ada transaksi pending.</p>}

        {transactions.map((t) => (
          <div key={t.id} style={tx}>
            <p>
              <b>{t.type.toUpperCase()}</b> — Rp {t.amount.toLocaleString()}
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

      {/* MANUAL BALANCE */}
      {(adminRole === "super_admin" || adminRole === "admin_finance" || adminRole === "admin_it") && (
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
      )}
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
