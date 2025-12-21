"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function WithdrawPage() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push("/login");
        return;
      }

      const uid = data.user.id;

      // === GET WALLET BALANCE ===
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", uid)
        .single();

      setBalance(Number(wallet?.balance || 0));
      setLoading(false);
    });
  }, [router]);

  const submitWithdraw = async () => {
    if (!amount || !bankName || !accountNumber || !accountName) {
      alert("Semua data penarikan wajib diisi");
      return;
    }

    if (Number(amount) <= 0) {
      alert("Nominal withdraw tidak valid");
      return;
    }

    if (Number(amount) > balance) {
      alert("Saldo tidak mencukupi");
      return;
    }

    setSubmitting(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user.id;

    const note = `Bank Tujuan: ${bankName} | No Rekening: ${accountNumber} | Atas Nama: ${accountName}`;

    const { error } = await supabase.from("transactions").insert({
      user_id: uid,
      type: "withdraw",
      amount: Number(amount),
      status: "pending",
      note,
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    alert("Permintaan withdraw berhasil dikirim");
    router.push("/wallet");
  };

  if (loading) {
    return (
      <div style={page}>
        <div style={container}>
          <div style={loadingCard}>Memuat halaman withdraw...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={container}>
        <div style={card}>
          <h1 style={title}>Withdraw Dana</h1>

          {/* SALDO */}
          <div style={saldoBox}>
            <div style={saldoLabel}>Saldo Tersedia</div>
            <div style={saldoValue}>
              Rp {balance.toLocaleString("id-ID")}
            </div>
          </div>

          {/* FORM */}
          <div style={formGroup}>
            <label style={label}>Nominal Withdraw</label>
            <input
              type="number"
              placeholder="Contoh: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Nama Bank Tujuan</label>
            <input
              placeholder="Contoh: BCA / BRI / Mandiri"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Nomor Rekening</label>
            <input
              placeholder="Nomor rekening tujuan"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              style={input}
            />
          </div>

          <div style={formGroup}>
            <label style={label}>Atas Nama</label>
            <input
              placeholder="Nama pemilik rekening"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              style={input}
            />
          </div>

          <button
            onClick={submitWithdraw}
            disabled={submitting}
            style={submitBtn}
          >
            {submitting ? "Memproses..." : "Ajukan Withdraw"}
          </button>

          <div style={footerNote}>
            Penarikan diproses setelah verifikasi oleh admin.
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

/* SALDO */
const saldoBox = {
  background: "#F8FAFC",
  padding: 18,
  borderRadius: 18,
  marginBottom: 26,
  border: `1px solid ${BORDER}`,
};

const saldoLabel = {
  fontSize: 12,
  opacity: 0.7,
};

const saldoValue = {
  fontSize: 22,
  fontWeight: 900,
  color: DARK,
  marginTop: 6,
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
  marginTop: 18,
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
