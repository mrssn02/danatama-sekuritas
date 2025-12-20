"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState(0);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
      setEmail(data.user.email);

      // === PROFILE ===
      const p = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .single();

      setUsername(p.data?.username || "");

      // === WALLET ===
      const w = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", data.user.id)
        .single();

      setBalance(Number(w.data?.balance || 0));

      // === INVESTMENTS (KODE KAMU TETAP DIPAKAI) ===
      const { data: inv } = await supabase
        .from("user_investments")
        .select("amount, investment_products(name)")
        .eq("user_id", data.user.id);

      setInvestments(inv || []);
    });
  }, []);

  return (
    <>
      <h1>Dashboard</h1>

      {/* ===== RINGKASAN ===== */}
      <div style={grid}>
        <div style={card}>
          <h3>Akun</h3>
          <p><b>Username:</b> {username}</p>
          <p><b>Email:</b> {email}</p>
        </div>

        <div style={card}>
          <h3>Dompet</h3>
          <p style={{ fontSize: 18 }}>
            <b>Saldo:</b> Rp {balance.toLocaleString("id-ID")}
          </p>

          <div style={actions}>
            <a href="/wallet">Buka Dompet</a>
            <a href="/deposit">Deposit</a>
            <a href="/withdraw">Withdraw</a>
          </div>
        </div>
      </div>

      {/* ===== INVESTASI ===== */}
      <div style={card}>
        <h3>Portofolio Investasi</h3>

        {investments.length === 0 && (
          <p>Belum ada investasi.</p>
        )}

        {investments.map((i, idx) => (
          <div key={idx} style={row}>
            <span>{i.investment_products.name}</span>
            <b>Rp {Number(i.amount).toLocaleString("id-ID")}</b>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <a href="/investasi">+ Tambah Investasi</a>
        </div>
      </div>
    </>
  );
}

/* ================= STYLES ================= */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  marginBottom: 24
};

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
  marginBottom: 20
};

const actions = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 10
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #eee"
};
