"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState(null);

  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [adminNotes, setAdminNotes] = useState({});

  const [manualEmail, setManualEmail] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [processingId, setProcessingId] = useState(null);

  /* ===============================
     INIT & AUTH
  =============================== */
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      window.location.href = "/login";
      return;
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .eq("user_id", auth.user.id)
      .single();

    if (!admin) {
      alert("Akses admin ditolak");
      window.location.href = "/";
      return;
    }

    setRole(admin.role);
    setAuthorized(true);

    await loadSettings();
    await loadPending();
    setLoading(false);
  };

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
     SETTINGS (FINANCE & SUPER)
  =============================== */
  const canManageSettings = role === "super_admin" || role === "finance";

  const saveSetting = async (key, value) => {
    if (!canManageSettings) return alert("Tidak punya akses");
    await supabase.from("settings").upsert({ key, value });
    alert("Tersimpan");
  };

  /* ===============================
     APPROVE / REJECT
  =============================== */
  const approveTx = async (tx) => {
    if (processingId || tx.status !== "pending") return;
    setProcessingId(tx.id);

    const note = adminNotes[tx.id] || "Disetujui admin";

    const { error } = await supabase
      .from("transactions")
      .update({
        status: "approved",
        admin_note: note,
        approved_at: new Date().toISOString(),
      })
      .eq("id", tx.id)
      .eq("status", "pending");

    if (error) {
      alert(error.message);
      setProcessingId(null);
      return;
    }

    await supabase.rpc("adjust_balance", {
      uid: tx.user_id,
      amt: tx.type === "deposit" ? tx.amount : -tx.amount,
    });

    setProcessingId(null);
    loadPending();
  };

  const rejectTx = async (tx) => {
    const note = adminNotes[tx.id];
    if (!note) return alert("Alasan wajib diisi");

    if (processingId || tx.status !== "pending") return;
    setProcessingId(tx.id);

    const { error } = await supabase
      .from("transactions")
      .update({
        status: "rejected",
        admin_note: note,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", tx.id)
      .eq("status", "pending");

    if (error) {
      alert(error.message);
      setProcessingId(null);
      return;
    }

    setProcessingId(null);
    loadPending();
  };

  /* ===============================
     MANUAL BALANCE
  =============================== */
  const canManual = role !== "it";

  const manualAdjust = async () => {
    if (!canManual) return alert("Tidak punya akses");
    if (!manualEmail || !manualAmount) return alert("Lengkapi data");

    const { data: user } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", manualEmail)
      .single();

    if (!user) return alert("User tidak ditemukan");

    await supabase.rpc("adjust_balance", {
      uid: user.id,
      amt: Number(manualAmount),
    });

    alert("Saldo diperbarui");
    setManualEmail("");
    setManualAmount("");
  };

  /* ===============================
     RENDER
  =============================== */
  if (loading) return <p>Memuat...</p>;
  if (!authorized) return null;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Admin Panel ({role})</h1>

      {canManageSettings && (
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

      <div style={card}>
        <h3>Deposit & Withdraw Pending</h3>
        {transactions.length === 0 && <p>Tidak ada transaksi.</p>}

        {transactions.map((t) => (
          <div key={t.id} style={tx}>
            <b>{t.type.toUpperCase()}</b> — Rp {t.amount.toLocaleString()}
            <p>{t.note}</p>

            <textarea
              placeholder="Catatan admin"
              value={adminNotes[t.id] || ""}
              onChange={(e) =>
                setAdminNotes({ ...adminNotes, [t.id]: e.target.value })
              }
              style={{ width: "100%" }}
            />

            <button onClick={() => approveTx(t)}>ACC</button>
            <button onClick={() => rejectTx(t)} style={{ marginLeft: 8 }}>
              Reject
            </button>
          </div>
        ))}
      </div>

      {canManual && (
        <div style={card}>
          <h3>Tambah / Kurangi Saldo Manual</h3>
          <input placeholder="Email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
          <input placeholder="+ / -" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} />
          <button onClick={manualAdjust}>Simpan</button>
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
