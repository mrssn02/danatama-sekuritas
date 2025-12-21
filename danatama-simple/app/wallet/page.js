"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Wallet() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [bank, setBank] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push("/login");
        return;
      }

      const uid = data.user.id;

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
          <div style={loadingCard}>Memuat Dompet...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={container}>
        <h1 style={title}>Dompet</h1>

        {/* SALDO */}
        <div style={cardPrimary}>
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
          <div style={bankBox}>
            {bank || "-"}
          </div>
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
   STYLES (LUXURY)
================================ */
const DARK = "#0B1C2D";
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
  maxWidth: 720,
  margin: "0 auto",
};

const title = {
  fontSize: 32,
  fontWeight: 900,
  marginBottom: 22,
  color: DARK,
};

const loadingCard = {
  background: "white",
  padding: 24,
  borderRadius: 18,
  boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
};

const cardPrimary = {
  background: `linear-gradient(135deg, ${DARK}, #132F4C)`,
  color: "white",
  padding: 26,
  borderRadius: 22,
  marginBottom: 20,
  boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
};

const saldoLabel = {
  fontSize: 13,
  opacity: 0.85,
  marginBottom: 6,
};

const saldoValue = {
  fontSize: 36,
  fontWeight: 900,
  marginBottom: 18,
};

const actions = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const btnGold = {
  background: GOLD,
  color: DARK,
  padding: "12px 22px",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 14,
};

const btnDark = {
  background: "white",
  color: DARK,
  padding: "12px 22px",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 14,
};

const card = {
  background: "white",
  padding: 22,
  borderRadius: 18,
  marginBottom: 16,
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
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 14,
};

const link = {
  fontSize: 14,
  fontWeight: 700,
  color: DARK,
  textDecoration: "none",
};
