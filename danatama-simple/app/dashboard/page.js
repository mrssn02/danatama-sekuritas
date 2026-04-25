"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState(0);
  const [investments, setInvestments] = useState([]);
  const [txSummary, setTxSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();

        if (!auth?.user) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }

        const uid = auth.user.id;
        setUser(auth.user);

        const { data: prof } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", uid);

        setUsername(prof?.[0]?.username || "");

        const { data: w } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", uid);

        setBalance(Number(w?.[0]?.balance || 0));

        const { data: inv } = await supabase
          .from("user_investments")
          .select("amount, investment_products(name)")
          .eq("user_id", uid);

        setInvestments(inv || []);

        const { data: tx } = await supabase
          .from("transactions")
          .select("status")
          .eq("user_id", uid);

        const sum = { pending: 0, approved: 0, rejected: 0 };
        (tx || []).forEach((t) => {
          if (t.status === "pending") sum.pending++;
          else if (t.status === "approved") sum.approved++;
          else if (t.status === "rejected") sum.rejected++;
        });

        setTxSummary(sum);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const formattedBalance = useMemo(() => {
    return Number(balance || 0).toLocaleString("id-ID");
  }, [balance]);

  if (loading) {
    return (
      <div style={page}>
        <div style={container}>
          <div style={loadingCard}>Memuat Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={container}>
        <h1 style={title}>
          Selamat datang{username ? `, ${username}` : ""} 👋
        </h1>

        <div style={card}>
          <h3>Saldo</h3>
          <div style={saldo}>Rp {formattedBalance}</div>
        </div>

        <div style={card}>
          <h3>Status Transaksi</h3>
          <p>Pending: {txSummary.pending}</p>
          <p>Approved: {txSummary.approved}</p>
          <p>Rejected: {txSummary.rejected}</p>
        </div>

        <div style={card}>
          <h3>Akun</h3>
          <p>{user?.email}</p>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================== */
/* STYLE (INI YANG BIKIN ERROR TADI) */
/* =============================== */

const page = {
  minHeight: "100vh",
  background: "#F4F6F8",
  padding: 20,
};

const container = {
  maxWidth: 900,
  margin: "0 auto",
};

const title = {
  fontSize: 28,
  fontWeight: "bold",
  marginBottom: 20,
};

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  marginBottom: 16,
};

const saldo = {
  fontSize: 22,
  fontWeight: "bold",
};

const loadingCard = {
  background: "white",
  padding: 20,
  borderRadius: 12,
};
