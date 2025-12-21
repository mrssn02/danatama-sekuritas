"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Wallet() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [bank, setBank] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push("/login");
        return;
      }

      const uid = data.user.id;
      setEmail(data.user.email || "");

      // === PROFILE ===
      const p = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .single();

      setUsername(p.data?.username || "Member");

      // === WALLET ===
      const w = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", uid)
        .single();

      setBalance(Number(w.data?.balance || 0));

      // === SETTINGS (REKENING DEPOSIT) ===
      const s = await supabase.from("settings").select("key,value");
      if (s.data) {
        const bankRow = s.data.find((i) => i.key === "deposit_bank");
        setBank(bankRow?.value || "");
      }

      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div style={page}>
        <div style={container}>
          <div style={loadingCard}>Memuat Dompet VIP...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={container}>
        <h1 style={title}>Dompet VIP</h1>

        {/* IDENTITAS USER */}
        <div style={identityCard}>
          <div>
            <div style={userName}>{username}</div>
            <div style={userEmail}>{email}</div>
          </div>
          <div style={vipBadge}>VIP MEMBER</div>
        </div>

        {/* SALDO */}
        <div style={saldoCard}>
          <div style={saldoLabel}>Saldo Aktif</div>
          <div style={saldoValue}>
            Rp {balance.toLocaleString("id-ID")}
          </div>

          <div style={actions}>
            <a href="/deposit" style={btnGold}>Deposit</a>
            <a href="/withdraw" style={btnDark}>Withdraw</a>
          </div>
        </div>

        {/* REKENING */}
        <div style={card}>
          <div style={label}>Rekening Deposit</div>
          <div style={bankBox}>{bank || "-"}</div>
        </div>

        {/* RIWAYAT */}
        <div style={card}>
          <a href="/transaksi" style={link}>
            Lihat Riwayat Transaksi →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   THEME & STYLES (VIP LUXURY)
================================ */
const DARK = "#0B1C2D";
const DARK2 = "#132F4C";
const GOLD = "#D4AF37";
const BG = "#F4F6F8";
const BORDER = "#E5E7EB";

const page = {
  background: BG,
  minHeight: "100vh",
  padding: "30px 14px",
  fontFamily: "Inter, system-ui, sans-serif",
};

const container = {
  maxWidth: 760,
  margin: "0 auto",
};

const title = {
  fontSize: 34,
  fontWeight: 900,
  marginBottom: 24,
  color: DARK,
};

const loadingCard = {
  background: "white",
  padding: 26,
  borderRadius: 20,
  boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
};

/* === IDENTITAS === */
const identityCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 22,
  borderRadius: 20,
  background: `linear-gradient(135deg, ${DARK2}, ${DARK})`,
  color: "white",
  marginBottom: 20,
  boxShadow: "0 20px 45px rgba(0,0,0,0.2)",
};

const userName = {
  fontSize: 18,
  fontWeight: 900,
};

const userEmail = {
  fontSize: 13,
  opacity: 0.85,
};

const vipBadge = {
  background: GOLD,
  color: DARK,
  padding: "8px 14px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
};

/* === SALDO === */
const saldoCard = {
  background: `linear-gradient(135deg, ${DARK}, #020617)`,
  color: "white",
  padding: 28,
  borderRadius: 24,
  marginBottom: 22,
  boxShadow: "0 22px 55px rgba(0,0,0,0.25)",
};

const saldoLabel = {
  fontSize: 13,
  opacity: 0.85,
  marginBottom: 6,
};

const saldoValue = {
  fontSize: 38,
  fontWeight: 900,
  marginBottom: 20,
};

const actions = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
};

const btnGold = {
  background: GOLD,
  color: DARK,
  padding: "14px 26px",
  borderRadius: 16,
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 14,
};

const btnDark = {
  background: "white",
  color: DARK,
  padding: "14px 26px",
  borderRadius: 16,
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 14,
};

/* === CARD UMUM === */
const card = {
  background: "white",
  padding: 22,
  borderRadius: 20,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  border: `1px solid ${BORDER}`,
};

const label = {
  fontSize: 12,
  opacity: 0.7,
  marginBottom: 8,
};

const bankBox = {
  background: "#F8FAFC",
  padding: "14px 16px",
  borderRadius: 14,
  fontWeight: 700,
  fontSize: 14,
};

const link = {
  fontSize: 14,
  fontWeight: 800,
  color: DARK,
  textDecoration: "none",
};
