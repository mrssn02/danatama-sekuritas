"use client";

export const dynamic = "force-dynamic";

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

      const uid = auth.user.id;

      // PROFILE
      const prof = await supabase
        .from("profiles")
        .select("username")
        .eq("id", uid)
        .single();

      setUsername(prof.data?.username || "");

      // ✅ FIX SALDO (users)
      const w = await supabase
        .from("users")
        .select("balance")
        .eq("id", uid)
        .single();

      setBalance(Number(w.data?.balance || 0));

      // INVESTMENT
      const inv = await supabase
        .from("user_investments")
        .select("amount, investment_products(name)")
        .eq("user_id", uid);

      setInvestments(inv.data || []);

      // TRANSAKSI
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
      </div>
    </div>
  );
}

/* === STYLE (WAJIB ADA, INI YANG BIKIN ERROR KEMARIN) === */
const DARK = "#0B1C2D";
const GOLD = "#D4AF37";
const BG = "#F4F6F8";
const BORDER = "#E5E7EB";
const SUCCESS = "#16A34A";
const DANGER = "#DC2626";
const PENDING = "#F59E0B";

const page = { background: BG, minHeight: "100vh", padding: "26px 12px" };
const container = { maxWidth: 1100, margin: "0 auto" };
const loadingCard = { background: "white", padding: 24 };

const topBar = { display: "flex", justifyContent: "space-between", marginBottom: 20 };
const crumb = { fontSize: 12 };
const title = { fontSize: 28, fontWeight: 900 };
const subtitle = { fontSize: 14 };

const actions = { display: "flex", gap: 10 };

const btnPrimary = { background: GOLD, padding: 10, borderRadius: 10 };
const btnGhost = { border: `1px solid ${BORDER}`, padding: 10 };

const grid3 = { display: "grid", gap: 16 };

const kpiCard = { background: "white", padding: 16, borderRadius: 12 };
const kpiLabel = { fontSize: 12 };
const kpiValue = { fontSize: 24, fontWeight: 900 };
const kpiHint = { fontSize: 12 };

const kpiButtons = { display: "flex", gap: 10 };

const miniBtnGold = { background: GOLD, padding: 8 };
const miniBtnDark = { background: DARK, color: "white", padding: 8 };

const miniBtnOutline = { border: `1px solid ${BORDER}`, padding: 8 };

const statusRow = { display: "flex", justifyContent: "space-between" };

const btnLogout = { marginTop: 10, padding: 10 };

const pill = (bg) => ({
  background: bg,
  color: "white",
  padding: "4px 8px",
  borderRadius: 999,
});
