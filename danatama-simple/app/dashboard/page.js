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
        const { data: auth, error: authError } =
          await supabase.auth.getUser();

        if (authError || !auth?.user) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }

        const uid = auth.user.id;
        setUser(auth.user);

        // PROFILE
        const { data: prof, error: profError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", uid);

        if (profError) console.error("Profile error:", profError);

        setUsername(prof?.[0]?.username || "");

        // WALLET (FIX UTAMA - TANPA single/maybeSingle)
        const { data: w, error: wError } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", uid);

        if (wError) console.error("Wallet error:", wError);

        setBalance(Number(w?.[0]?.balance || 0));

        // INVESTMENTS
        const { data: inv, error: invError } = await supabase
          .from("user_investments")
          .select("amount, investment_products(name)")
          .eq("user_id", uid);

        if (invError) console.error("Investment error:", invError);

        setInvestments(inv || []);

        // TRANSACTIONS
        const { data: tx, error: txError } = await supabase
          .from("transactions")
          .select("status")
          .eq("user_id", uid);

        if (txError) console.error("Transaction error:", txError);

        const sum = { pending: 0, approved: 0, rejected: 0 };
        (tx || []).forEach((t) => {
          if (t.status === "pending") sum.pending++;
          else if (t.status === "approved") sum.approved++;
          else if (t.status === "rejected") sum.rejected++;
        });

        setTxSummary(sum);
      } catch (err) {
        console.error("Dashboard fatal error:", err);
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

        {/* KPI */}
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

/* styles tetap sama (tidak diubah) */
