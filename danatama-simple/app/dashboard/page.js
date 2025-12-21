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
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        window.location.href = "/login";
        return;
      }

      setUser(auth.user);

      // Profile (username)
      const prof = await supabase
        .from("profiles")
        .select("username")
        .eq("id", auth.user.id)
        .single();

      setUsername(prof.data?.username || "");

      // Wallet balance
      const w = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", auth.user.id)
        .single();

      setBalance(Number(w.data?.balance || 0));

      // Investments
      const inv = await supabase
        .from("user_investments")
        .select("amount, investment_products(name)")
        .eq("user_id", auth.user.id);

      setInvestments(inv.data || []);

      // Transactions summary
      const tx = await supabase
        .from("transactions")
        .select("status")
        .eq("user_id", auth.user.id);

      const sum = { pending: 0, approved: 0, rejected: 0 };
      (tx.data || []).forEach((t) => {
        if (t.status === "pending") sum.pending++;
        else if (t.status === "approved") sum.approved++;
        else if (t.status === "rejected") sum.rejected++;
      });

      setTxSummary(sum);

      setLoading(false);
    };

    init();
  }, []);

  const formattedBalance = useMemo(() => {
    return Number(balance || 0).toLocaleString();
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
        {/* HEADER */}
        <div style={topBar}>
          <div>
            <div style={crumb}>Dashboard</div>
            <h1 style={title}>
              Selamat datang{username ? `, ${username}` : ""} 👋
            </h1>
            <div style={subtitle}>
              Kelola saldo, investasi, dan transaksi Anda dengan nyaman.
            </div>
          </div>

          <div style={actions}>
            <a href="/wallet" style={btnPrimary}>Dompet</a>
            <a href="/investasi" style={btnGhost}>Investasi</a>
          </div>
        </div>

        {/* KPI CARDS */}
        <div style={grid3}>
          <div style={kpiCard}>
            <div style={kpiLabel}>Saldo Dompet</div>
            <div style={kpiValue}>Rp {formattedBalance}</div>
            <div style={kpiHint}>Siap untuk deposit / withdraw</div>

            <div style={kpiButtons}>
              <a href="/deposit" style={miniBtnGold}>Deposit</a>
              <a href="/withdraw" style={miniBtnDark}>Withdraw</a>
            </div>
          </div>

          <div style={kpiCard}>
            <div style={kpiLabel}>Status Transaksi</div>

            <div style={statusRow}>
              <span style={pill(PENDING)}>Pending</span>
              <b>{txSummary.pending}</b>
            </div>
            <div style={statusRow}>
              <span style={pill(SUCCESS)}>Approved</span>
              <b>{txSummary.approved}</b>
            </div>
            <div style={statusRow}>
              <span style={pill(DANGER)}>Rejected</span>
              <b>{txSummary.rejected}</b>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Pantau riwayat Anda untuk detail keputusan admin.
            </div>

            <div style={{ marginTop: 14 }}>
              <a href="/riwayat" style={miniBtnOutline}>Lihat Riwayat</a>
            </div>
          </div>

          <div style={kpiCard}>
            <div style={kpiLabel}>Akun</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              <div style={{ marginBottom: 8 }}>
                <b>Email:</b> {user?.email}
              </div>
              <div style={{ marginBottom: 8 }}>
                <b>ID:</b>{" "}
                <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                  {user?.id}
                </span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Jaga kerahasiaan data akun Anda.
              </div>
            </div>

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

        {/* PORTFOLIO */}
        <div style={card}>
          <div style={cardHead}>
            <h2 style={cardTitle}>Portofolio Investasi</h2>
            <a href="/investasi" style={miniBtnGold}>
              + Tambah Investasi
            </a>
          </div>

          {investments.length === 0 ? (
            <div style={emptyState}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                Belum ada investasi
              </div>
              <div style={{ opacity: 0.75, marginBottom: 16 }}>
                Mulai dari produk investasi yang tersedia untuk membangun
                portofolio.
              </div>
              <a href="/investasi" style={btnPrimary}>Mulai Investasi</a>
            </div>
          ) : (
            <div style={list}>
              {investments.map((i, idx) => (
                <div key={idx} style={row}>
                  <div>
                    <div style={rowTitle}>
                      {i?.investment_products?.name || "Produk Investasi"}
                    </div>
                    <div style={rowSub}>
                      Dana terinvestasi pada produk ini
                    </div>
                  </div>
                  <div style={rowAmount}>
                    Rp {Number(i.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUICK LINKS */}
        <div style={card}>
          <div style={cardHead}>
            <h2 style={cardTitle}>Akses Cepat</h2>
            <span style={{ fontSize: 12, opacity: 0.75 }}>
              Fitur utama platform
            </span>
          </div>

          <div style={quickGrid}>
            <a href="/wallet" style={quickCard}>
              <div style={quickIcon}>💳</div>
              <div style={quickTitle}>Dompet</div>
              <div style={quickDesc}>Lihat saldo & rekening deposit</div>
            </a>

            <a href="/deposit" style={quickCard}>
              <div style={quickIcon}>➕</div>
              <div style={quickTitle}>Deposit</div>
              <div style={quickDesc}>Ajukan deposit dana</div>
            </a>

            <a href="/withdraw" style={quickCard}>
              <div style={quickIcon}>➖</div>
              <div style={quickTitle}>Withdraw</div>
              <div style={quickDesc}>Ajukan penarikan dana</div>
            </a>

            <a href="/riwayat" style={quickCard}>
              <div style={quickIcon}>🧾</div>
              <div style={quickTitle}>Riwayat</div>
              <div style={quickDesc}>Status transaksi & catatan admin</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   COLORS / THEME
================================ */
const DARK = "#0B1C2D";
const DARK2 = "#132F4C";
const GOLD = "#D4AF37";
const BG = "#F4F6F8";
const BORDER = "#E5E7EB";
const SUCCESS = "#16A34A";
const DANGER = "#DC2626";
const PENDING = "#F59E0B";

/* ===============================
   UI HELPERS
================================ */
const pill = (bg) => ({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  background: bg,
  color: "white",
  fontSize: 12,
  fontWeight: 800,
});

/* ===============================
   STYLES
================================ */
const page = {
  minHeight: "100vh",
  background: BG,
  fontFamily: "Inter, system-ui, sans-serif",
  padding: "26px 12px",
};

const container = {
  maxWidth: 1100,
  margin: "0 auto",
};

const loadingCard = {
  background: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 20,
  marginBottom: 22,
  flexWrap: "wrap",
};

const crumb = {
  fontSize: 12,
  opacity: 0.7,
  marginBottom: 6,
};

const title = {
  fontSize: 30,
  fontWeight: 900,
  margin: 0,
  color: DARK,
};

const subtitle = {
  marginTop: 8,
  fontSize: 14,
  opacity: 0.75,
};

const actions = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const btnPrimary = {
  background: GOLD,
  color: DARK,
  padding: "12px 18px",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
  border: "none",
};

const btnGhost = {
  background: "transparent",
  color: DARK,
  padding: "12px 18px",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
  border: `1px solid ${BORDER}`,
};

const btnLogout = {
  marginTop: 16,
  width: "100%",
  padding: "12px 16px",
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  background: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
  marginBottom: 18,
};

const kpiCard = {
  background: "linear-gradient(180deg, #ffffff, #fbfdff)",
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
};

const kpiLabel = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: 10,
};

const kpiValue = {
  fontSize: 28,
  fontWeight: 950,
  color: DARK,
  marginBottom: 6,
};

const kpiHint = {
  fontSize: 12,
  opacity: 0.7,
};

const kpiButtons = {
  display: "flex",
  gap: 10,
  marginTop: 14,
  flexWrap: "wrap",
};

const miniBtnGold = {
  background: GOLD,
  color: DARK,
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 900,
  textDecoration: "none",
  border: "none",
};

const miniBtnDark = {
  background: DARK,
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 900,
  textDecoration: "none",
  border: "none",
};

const miniBtnOutline = {
  background: "transparent",
  color: DARK,
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 900,
  textDecoration: "none",
  border: `1px solid ${BORDER}`,
  display: "inline-block",
};

const statusRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: `1px dashed ${BORDER}`,
};

const card = {
  background: "white",
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
  marginBottom: 18,
};

const cardHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
  flexWrap: "wrap",
};

const cardTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 950,
  color: DARK,
};

const emptyState = {
  background: `linear-gradient(135deg, ${DARK}, ${DARK2})`,
  color: "white",
  borderRadius: 18,
  padding: 22,
  marginTop: 12,
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginTop: 12,
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 14,
  borderRadius: 16,
  border: `1px solid ${BORDER}`,
  background: "linear-gradient(180deg, #fff, #fcfdff)",
};

const rowTitle = {
  fontSize: 14,
  fontWeight: 950,
  color: DARK,
};

const rowSub = {
  fontSize: 12,
  opacity: 0.75,
};

const rowAmount = {
  fontSize: 14,
  fontWeight: 950,
  color: DARK,
};

const quickGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginTop: 12,
};

const quickCard = {
  textDecoration: "none",
  color: DARK,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
  background: "linear-gradient(180deg, #ffffff, #fbfdff)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
};

const quickIcon = { fontSize: 28, marginBottom: 8 };
const quickTitle = { fontSize: 14, fontWeight: 950, marginBottom: 4 };
const quickDesc = { fontSize: 12, opacity: 0.75 };
