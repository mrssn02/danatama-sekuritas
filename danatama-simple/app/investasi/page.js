"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Investasi() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [amount, setAmount] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push("/login");
    });

    supabase
      .from("investment_products")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .then(({ data }) => setProducts(data || []));
  }, []);

  const buy = async (p) => {
    const amt = Number(amount[p.id] || 0);
    if (!amt) return alert("Masukkan nominal investasi");

    if (amt < p.min_amount) {
      return alert(
        `Minimal investasi Rp ${Number(p.min_amount).toLocaleString("id-ID")}`
      );
    }

    setLoadingId(p.id);
    try {
      const { error } = await supabase.rpc("invest_buy", {
        pid: p.id,
        amt,
      });

      if (error) throw error;

      alert("Investasi berhasil dibuat. Saldo terpotong.");
      router.push("/dashboard");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={container}>
      <div style={headerBox}>
        <h1 style={title}>Produk Investasi</h1>
        <p style={subtitle}>
          Investasi premium dengan sistem aman & transparan.
        </p>
      </div>

      <div style={grid}>
        {products.map((p) => (
          <div key={p.id} style={card}>
            <span style={badge}>INVESTMENT</span>

            <h3 style={productName}>{p.name}</h3>
            <p style={desc}>{p.description}</p>

            <div style={infoRow}>
              <div>
                <div style={label}>Minimal</div>
                <div style={value}>
                  Rp {Number(p.min_amount).toLocaleString("id-ID")}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={label}>ROI Harian</div>
                <div style={roi}>{p.roi_daily_percent}%</div>
              </div>
            </div>

            <input
              style={input}
              type="number"
              inputMode="numeric"
              placeholder="Nominal investasi"
              value={amount[p.id] || ""}
              onChange={(e) =>
                setAmount((prev) => ({
                  ...prev,
                  [p.id]: e.target.value,
                }))
              }
            />

            <button
              style={{
                ...btn,
                opacity: loadingId === p.id ? 0.6 : 1,
              }}
              disabled={loadingId === p.id}
              onClick={() => buy(p)}
            >
              {loadingId === p.id ? "Memproses..." : "Invest Sekarang"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================
   STYLES — LUXURY + MOBILE SAFE
================================ */

const container = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 16px 40px",
};

const headerBox = {
  marginBottom: 28,
};

const title = {
  fontSize: 28,
  fontWeight: 800,
  marginBottom: 6,
};

const subtitle = {
  color: "#64748b",
  fontSize: 15,
  lineHeight: 1.5,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const card = {
  background: "linear-gradient(180deg, #ffffff, #f8fafc)",
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 18px 36px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
};

const badge = {
  background: "#0b1c2d",
  color: "white",
  fontSize: 11,
  padding: "4px 10px",
  borderRadius: 999,
  width: "fit-content",
  marginBottom: 10,
  letterSpacing: 0.5,
};

const productName = {
  fontSize: 19,
  fontWeight: 800,
  marginBottom: 6,
};

const desc = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.6,
  marginBottom: 14,
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 14,
};

const label = {
  fontSize: 12,
  color: "#64748b",
};

const value = {
  fontSize: 15,
  fontWeight: 700,
};

const roi = {
  fontSize: 16,
  fontWeight: 800,
  color: "#166534",
};

const input = {
  width: "100%",
  padding: "14px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  fontSize: 15,
  marginBottom: 14,
  outline: "none",
};

const btn = {
  width: "100%",
  padding: "15px",
  background: "linear-gradient(135deg, #0b1c2d, #1e293b)",
  color: "white",
  border: 0,
  borderRadius: 16,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  touchAction: "manipulation", // ⬅️ penting agar aman di HP
};
