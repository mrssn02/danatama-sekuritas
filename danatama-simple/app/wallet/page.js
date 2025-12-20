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
      if (!data.user) {
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
      const s = await supabase
        .from("settings")
        .select("key,value");

      if (s.data) {
        const bankRow = s.data.find(i => i.key === "deposit_bank");
        setBank(bankRow?.value || "");
      }

      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <h1>Dompet</h1>

      <div style={card}>
        <div style={saldo}>
          Saldo:
          <span style={saldoValue}>
            Rp {balance.toLocaleString("id-ID")}
          </span>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={label}>Rekening Deposit</div>
          <div style={bankBox}>
            {bank || "-"}
          </div>
        </div>

        <div style={actions}>
          <a href="/deposit" style={btnPrimary}>Deposit</a>
          <a href="/withdraw" style={btnOutline}>Withdraw</a>
          <a href="/transaksi" style={btnLink}>Riwayat Transaksi</a>
        </div>
      </div>
    </>
  );
}

/* ================= STYLES ================= */

const card = {
  background: "white",
  padding: 22,
  borderRadius: 14,
  maxWidth: 640,
  boxShadow: "0 8px 18px rgba(0,0,0,0.06)"
};

const saldo = {
  fontSize: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const saldoValue = {
  fontSize: 20,
  fontWeight: 700
};

const label = {
  fontSize: 12,
  opacity: 0.7,
  marginBottom: 6
};

const bankBox = {
  padding: "10px 12px",
  background: "#f1f5f9",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14
};

const actions = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 22
};

const btnPrimary = {
  background: "#0b1c2d",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontSize: 14
};

const btnOutline = {
  border: "1px solid #0b1c2d",
  color: "#0b1c2d",
  padding: "10px 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontSize: 14
};

const btnLink = {
  color: "#0b1c2d",
  fontSize: 14,
  textDecoration: "underline",
  alignSelf: "center"
};
