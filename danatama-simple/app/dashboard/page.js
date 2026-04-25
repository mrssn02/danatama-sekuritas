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
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }

      const uid = auth.user.id;
      setUser(auth.user);

      // ===============================
      // PROFILE
      // ===============================
      const prof = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .single();

      setUsername(prof.data?.username || "");

      // ===============================
      // 🔥 WALLET (DISAMAKAN DENGAN WALLET PAGE)
      // ===============================
      const w = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", uid)
        .single();

      setBalance(Number(w.data?.balance || 0));

      // ===============================
      // INVESTMENTS
      // ===============================
      const inv = await supabase
        .from("user_investments")
        .select("amount, investment_products(name)")
        .eq("user_id", uid);

      setInvestments(inv.data || []);

      // ===============================
      // TRANSACTIONS
      // ===============================
      const tx = await supabase
        .from("transactions")
        .select("status")
        .eq("user_id", uid);

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
                if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
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
                    Rp {Number(i.amount || 0).toLocaleString("id-ID")}
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
          </div>

          <div style={quickGrid}>
            <a href="/wallet" style={quickCard}>Dompet</a>
            <a href="/deposit" style={quickCard}>Deposit</a>
            <a href="/withdraw" style={quickCard}>Withdraw</a>
            <a href="/riwayat" style={quickCard}>Riwayat</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================== */
/* STYLE (TIDAK DIUBAH) */
/* =============================== */

const DARK = "#0B1C2D";
const DARK2 = "#132F4C";
const GOLD = "#D4AF37";
const BG = "#F4F6F8";
const BORDER = "#E5E7EB";
const SUCCESS = "#16A34A";
const DANGER = "#DC2626";
const PENDING = "#F59E0B";

const pill = (bg) => ({
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  background: bg,
  color: "white",
  fontSize: 12,
  fontWeight: 800,
});

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
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 20,
  marginBottom: 22,
  flexWrap: "wrap",
};

const crumb = { fontSize: 12, opacity: 0.7, marginBottom: 6 };

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
};

const btnPrimary = {
  background: GOLD,
  color: DARK,
  padding: "12px 18px",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
};

const btnGhost = {
  border: `1px solid ${BORDER}`,
  padding: "12px 18px",
  borderRadius: 14,
  textDecoration: "none",
  color: DARK,
};

const btnLogout = {
  marginTop: 16,
  width: "100%",
  padding: "12px",
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  background: "white",
};

const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const kpiCard = {
  background: "white",
  borderRadius: 18,
  padding: 18,
  border: `1px solid ${BORDER}`,
};

const kpiLabel = { fontSize: 12, marginBottom: 8 };

const kpiValue = {
  fontSize: 28,
  fontWeight: 900,
};

const kpiHint = { fontSize: 12 };

const kpiButtons = {
  marginTop: 10,
  display: "flex",
  gap: 10,
};

const miniBtnGold = {
  background: GOLD,
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: DARK,
};

const miniBtnDark = {
  background: DARK,
  color: "white",
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
};

const miniBtnOutline = {
  border: `1px solid ${BORDER}`,
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: DARK,
};

const statusRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 6,
};

const card = {
  background: "white",
  padding: 18,
  borderRadius: 18,
  marginTop: 16,
};

const cardHead = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 12,
};

const cardTitle = { fontSize: 18, fontWeight: 900 };

const emptyState = {
  padding: 20,
  background: DARK,
  color: "white",
  borderRadius: 12,
};

const list = { display: "flex", flexDirection: "column", gap: 10 };

const row = {
  display: "flex",
  justifyContent: "space-between",
};

const rowTitle = { fontWeight: 700 };
const rowSub = { fontSize: 12 };
const rowAmount = { fontWeight: 700 };

const quickGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const quickCard = {
  padding: 12,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  textDecoration: "none",
  color: DARK,
};
