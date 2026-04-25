"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState(0);

  const [txSummary, setTxSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        window.location.href = "/login";
        return;
      }

      setUser(auth.user);
      const uid = auth.user.id;

      // PROFILE
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .single();

      setUsername(profile?.username || "Member");

      // ✅ SALDO FIX (users)
      const { data: userRow } = await supabase
        .from("users")
        .select("balance")
        .eq("id", uid)
        .single();

      setBalance(Number(userRow?.balance || 0));

      // TRANSAKSI
      const { data: tx } = await supabase
        .from("transactions")
        .select("status")
        .eq("user_id", uid);

      const sum = { pending: 0, approved: 0, rejected: 0 };
      (tx || []).forEach((t) => {
        if (t.status === "pending") sum.pending++;
        if (t.status === "approved") sum.approved++;
        if (t.status === "rejected") sum.rejected++;
      });

      setTxSummary(sum);
      setLoading(false);
    };

    init();
  }, []);

  const formattedBalance = useMemo(() => {
    return Number(balance).toLocaleString("id-ID");
  }, [balance]);

  if (loading) {
    return <div style={page}>Memuat dashboard...</div>;
  }

  return (
    <div style={page}>
      <div style={container}>
        <h1 style={title}>
          Selamat datang{username ? `, ${username}` : ""} 👋
        </h1>

        {/* SALDO */}
        <div style={card}>
          <div style={label}>Saldo Dompet</div>
          <div style={saldo}>Rp {formattedBalance}</div>

          <div style={actions}>
            <a href="/deposit" style={btnGold}>Deposit</a>
            <a href="/withdraw" style={btnDark}>Withdraw</a>
          </div>
        </div>

        {/* STATUS */}
        <div style={card}>
          <div style={label}>Status Transaksi</div>

          <div style={row}>
            <span>Pending</span>
            <b>{txSummary.pending}</b>
          </div>
          <div style={row}>
            <span>Approved</span>
            <b>{txSummary.approved}</b>
          </div>
          <div style={row}>
            <span>Rejected</span>
            <b>{txSummary.rejected}</b>
          </div>
        </div>

        {/* AKUN */}
        <div style={card}>
          <div style={label}>Akun</div>
          <p>Email: {user?.email}</p>
          <p style={{ fontSize: 12 }}>ID: {user?.id}</p>

          <button
            style={btnLogout}
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* STYLE (AMAN, MINIMAL, GA ERROR) */
const page = {
  background: "#F4F6F8",
  minHeight: "100vh",
  padding: 20,
};

const container = {
  maxWidth: 600,
  margin: "0 auto",
};

const title = {
  fontSize: 26,
  fontWeight: "bold",
  marginBottom: 20,
};

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  marginBottom: 15,
};

const label = {
  fontSize: 12,
  opacity: 0.7,
};

const saldo = {
  fontSize: 28,
  fontWeight: "bold",
  margin: "10px 0",
};

const actions = {
  display: "flex",
  gap: 10,
};

const btnGold = {
  background: "#D4AF37",
  padding: 10,
  borderRadius: 8,
  textDecoration: "none",
};

const btnDark = {
  background: "#0B1C2D",
  color: "white",
  padding: 10,
  borderRadius: 8,
  textDecoration: "none",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 8,
};

const btnLogout = {
  marginTop: 10,
  padding: 10,
};
