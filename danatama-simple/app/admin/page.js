"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/* ===============================
   KONFIGURASI ADMIN
================================ */
const ADMIN_EMAILS = ["sonandra111@gmail.com"];

/* ===============================
   HALAMAN ADMIN
================================ */
export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [notesById, setNotesById] = useState({});

  const [manualEmail, setManualEmail] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  const [processingId, setProcessingId] = useState(null);

  /* ===============================
     AUTH & INIT
  ================================ */
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
  ================================ */
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
  ================================ */
  const saveSetting = async (key, value) => {
    await supabase.from("settings").upsert({ key, value });
    alert("Tersimpan");
  };

  /* ===============================
     TRANSAKSI
  ================================ */
  const approveTx = async (tx) => {
    if (processingId) return;
    setProcessingId(tx.id);

    const admin_note = notesById[tx.id] || "Disetujui admin";

    const { error } = await supabase
      .from("transactions")
      .update({
        status: "approved",
        admin_note,
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

    alert("Transaksi di-ACC");
    setProcessingId(null);
    loadPending();
  };

  const rejectTx = async (tx) => {
    const admin_note = notesById[tx.id];
    if (!admin_note) {
      alert("Masukkan catatan penolakan");
      return;
    }

    setProcessingId(tx.id);

    const { error } = await supabase
      .from("transactions")
      .update({
        status: "rejected",
        admin_note,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", tx.id)
      .eq("status", "pending");

    if (error) {
      alert(error.message);
      setProcessingId(null);
      return;
    }

    alert("Transaksi ditolak");
    setProcessingId(null);
    loadPending();
  };

  /* ===============================
     MANUAL SALDO
  ================================ */
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
  ================================ */
  if (loading) return <p style={{ padding: 40 }}>Memuat...</p>;
  if (!authorized) return null;

  return (
    <div style={page}>
      <div style={container}>
        <h1 style={heading}>Admin Panel</h1>

        {/* SETTINGS */}
        <div style={card}>
          <h3 style={section}>Rekening Deposit</h3>
          <input style={input} value={depositBank} onChange={(e) => setDepositBank(e.target.value)} />
          <button style={btnPrimary} onClick={() => saveSetting("deposit_bank", depositBank)}>Simpan</button>
        </div>

        <div style={card}>
          <h3 style={section}>CS WhatsApp</h3>
          <input style={input} value={csWhatsapp} onChange={(e) => setCsWhatsapp(e.target.value)} />
          <button style={btnPrimary} onClick={() => saveSetting("cs_whatsapp", csWhatsapp)}>Simpan</button>
        </div>

        {/* TRANSAKSI */}
        <div style={card}>
          <h3 style={section}>Deposit & Withdraw Pending</h3>

          {transactions.length === 0 && <p>Tidak ada transaksi pending.</p>}

          {transactions.map((t) => (
            <div key={t.id} style={txCard}>
              <span style={badge(t.type === "deposit" ? "#16a34a" : "#f59e0b")}>
                {t.type.toUpperCase()}
              </span>

              <p style={amount}>Rp {Number(t.amount).toLocaleString()}</p>

              {t.note && <p style={note}><b>Catatan User:</b> {t.note}</p>}

              <textarea
                style={textarea}
                placeholder="Catatan admin"
                value={notesById[t.id] || ""}
                onChange={(e) =>
                  setNotesById((prev) => ({ ...prev, [t.id]: e.target.value }))
                }
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button style={btnSuccess} disabled={processingId === t.id} onClick={() => approveTx(t)}>ACC</button>
                <button style={btnDanger} disabled={processingId === t.id} onClick={() => rejectTx(t)}>Reject</button>
              </div>
            </div>
          ))}
        </div>

        {/* MANUAL */}
        <div style={card}>
          <h3 style={section}>Tambah / Kurangi Saldo Manual</h3>
          <input style={input} placeholder="Email user" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
          <input style={input} placeholder="+ / -" type="number" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} />
          <button style={btnPrimary} onClick={manualAdjust}>Simpan</button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STYLING MEWAH
================================ */
const page = { background: "#f4f6f8", minHeight: "100vh", padding: 30 };
const container = { maxWidth: 900, margin: "0 auto" };
const heading = { fontSize: 32, fontWeight: 800, marginBottom: 30 };
const section = { fontSize: 18, fontWeight: 700, marginBottom: 12 };

const card = {
  background: "white",
  padding: 22,
  borderRadius: 16,
  marginBottom: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  marginBottom: 10,
};

const textarea = {
  width: "100%",
  minHeight: 70,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  marginBottom: 10,
};

const btnPrimary = {
  padding: "10px 18px",
  borderRadius: 12,
  border: "none",
  background: "#0b1c2d",
  color: "white",
  fontWeight: 700,
};

const btnSuccess = { ...btnPrimary, background: "#16a34a" };
const btnDanger = { ...btnPrimary, background: "#dc2626" };

const txCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  marginBottom: 14,
};

const badge = (bg) => ({
  background: bg,
  color: "white",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
});

const amount = { fontSize: 20, fontWeight: 800, margin: "8px 0" };
const note = { fontSize: 14, opacity: 0.8 };
