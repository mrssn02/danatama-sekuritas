"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [investTotal, setInvestTotal] = useState(0);
  const [profitTotal, setProfitTotal] = useState(0);
  const [roi7, setRoi7] = useState([]); // [{date, amount}]

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");

      const uid = data.user.id;

      const w = await supabase.from("wallets").select("balance").eq("user_id", uid).single();
      setBalance(Number(w.data?.balance || 0));

      const inv = await supabase
        .from("user_investments")
        .select("amount, profit_accum")
        .eq("user_id", uid)
        .eq("status", "active");

      const invRows = inv.data || [];
      setInvestTotal(invRows.reduce((s, r) => s + Number(r.amount || 0), 0));
      setProfitTotal(invRows.reduce((s, r) => s + Number(r.profit_accum || 0), 0));

      // ROI 7 hari dari ledger
      const { data: led } = await supabase
        .from("wallet_ledger")
        .select("amount, created_at, type")
        .eq("user_id", uid)
        .eq("type", "roi")
        .order("created_at", { ascending: false })
        .limit(200);

      const map = {};
      (led || []).forEach(x => {
        const d = new Date(x.created_at);
        const key = d.toISOString().slice(0, 10);
        map[key] = (map[key] || 0) + Number(x.amount || 0);
      });

      // ambil 7 hari terakhir
      const out = [];
      for (let i = 6; i >= 0; i--) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const key = dt.toISOString().slice(0, 10);
        out.push({ date: key, amount: map[key] || 0 });
      }
      setRoi7(out);
    });
  }, []);

  const maxVal = useMemo(() => Math.max(1, ...roi7.map(x => x.amount)), [roi7]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1>Dashboard</h1>

      <div style={grid}>
        <div style={card}>
          <div style={label}>Saldo</div>
          <div style={value}>Rp {balance.toLocaleString("id-ID")}</div>
        </div>
        <div style={card}>
          <div style={label}>Total Investasi Aktif</div>
          <div style={value}>Rp {investTotal.toLocaleString("id-ID")}</div>
        </div>
        <div style={card}>
          <div style={label}>Total Profit (ROI)</div>
          <div style={value}>Rp {profitTotal.toLocaleString("id-ID")}</div>
        </div>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Grafik ROI 7 Hari Terakhir</h3>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 120 }}>
          {roi7.map((x) => (
            <div key={x.date} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  height: Math.round((x.amount / maxVal) * 100),
                  background: "#0b1c2d",
                  borderRadius: 8
                }}
                title={`Rp ${x.amount.toLocaleString("id-ID")}`}
              />
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 6 }}>
                {x.date.slice(5)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <a href="/investasi">+ Beli Produk Investasi</a>{" "}
          {" | "}
          <a href="/wallet">Buka Dompet</a>{" "}
          {" | "}
          <a href="/transaksi">Riwayat</a>
        </div>
      </div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 12
};

const card = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)"
};

const label = { fontSize: 12, opacity: 0.7 };
const value = { fontSize: 20, fontWeight: 700, marginTop: 6 };
