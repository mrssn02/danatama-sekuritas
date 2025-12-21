"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function DepositPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [depositBank, setDepositBank] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push("/login");
        return;
      }

      // === GET DEPOSIT BANK FROM SETTINGS ===
      const { data: settings } = await supabase
        .from("settings")
        .select("key,value");

      const bankRow = settings?.find((s) => s.key === "deposit_bank");
      setDepositBank(bankRow?.value || "-");

      setLoading(false);
    });
  }, [router]);

  const submitDeposit = async () => {
    if (!amount || !senderName) {
      alert("Nominal dan nama pengirim wajib diisi");
      return;
    }

    setSubmitting(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user.id;

    const note = `Nama Pengirim: ${senderName} | Rekening Tujuan: ${depositBank}`;

    const { error } = await supabase.from("transactions").insert({
      user_id: uid,
      type: "deposit",
      amount: Number(amount),
      status: "pending",
      note,
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    alert("Pengajuan deposit berhasil dikirim");
    router.push("/dompet");
  };

  if (loading) {
    return (
      <div style={page}>
        <div style={container}>
          <div style={loadingCard}>Memuat halaman deposit...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={container}>
        <div style={card}>
          <h1 style={title}>Deposit Dana</h1>

          {/* INFO REKENING */}
          <div style={infoBox}>
            <div style={infoLabel}>Rekening Tujuan Deposit</div>
            <div style={bankText}>{depositBank}</div>
            <div style={infoHint}>
              Pastikan transfer ke rekening di atas dan nama pengirim sesuai.
            </div>
          </div>

          {/* FORM */}
          <div style={formGroup}>
            <label style={label}>Nominal Deposit</label>
            <input
              type="number"
              placeholder="Contoh: 1000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Nama Pengirim</label>
            <input
              placeholder="Nama sesuai rekening pengirim"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              style={input}
            />
          </div>

          <button
            onClick={submitDeposit}
            disabled={submitting}
            style={submitBtn}
          >
            {submitting ? "Memproses..." : "Ajukan Deposit"}
          </button>

          <div style={footerNote}>
            Deposit akan diproses setelah diverifikasi oleh admin.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   LUXURY THEME
================================ */
const DARK = "#0B1C2D";
const GOLD = "#D4AF37";
const BG = "#F4F6F8";
const BORDER = "#E5E7EB";

const page = {
  background: BG,
  minHeight: "100vh",
  padding: "40px 16px",
  fontFamily: "Inter, system-ui, sans-serif",
};

const container = {
  maxWidth: 520,
  margin: "0 auto",
};

const loadingCard = {
  background: "white",
  padding: 30,
  borderRadius: 22,
  textAlign: "center",
  boxShadow: "0 18px 45px rgba(0,0,0,0.08)",
};

const card = {
  background: "white",
  padding: 32,
  borderRadius: 26,
  boxShadow: "0 25px 60px rgba(0,0,0,0.12)",
};

const title = {
  fontSize: 28,
  fontWeight: 900,
  marginBottom: 24,
  color: DARK,
};

/* INFO */
const infoBox = {
  background: "#F8FAFC",
  padding: 18,
  borderRadius: 18,
  marginBottom: 26,
  border: `1px solid ${BORDER}`,
};

const infoLabel = {
  fontSize: 12,
  opacity: 0.7,
  marginBottom: 6,
};

const bankText = {
  fontSize: 15,
  fontWeight: 800,
  color: DARK,
};

const infoHint = {
  fontSize: 12,
  marginTop: 6,
  opacity: 0.6,
};

/* FORM */
const formGroup = {
  marginBottom: 18,
};

const label = {
  display: "block",
  fontSize: 13,
  marginBottom: 6,
  fontWeight: 600,
};

const input = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  fontSize: 14,
  outline: "none",
};

/* BUTTON */
const submitBtn = {
  width: "100%",
  marginTop: 16,
  padding: "16px",
  background: GOLD,
  color: DARK,
  borderRadius: 18,
  fontSize: 15,
  fontWeight: 900,
  border: "none",
  cursor: "pointer",
};

const footerNote = {
  marginTop: 18,
  fontSize: 12,
  textAlign: "center",
  opacity: 0.6,
};
