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
          Pilih produk investasi premium dengan imbal hasil harian.
        </p>
      </div>

      <div style={grid}>
        {products.map((p) => (
          <div key={p.id} style={card}>
            <div style={cardTop}>
              <span style={badge}>INVESTMENT</span>
              <h3 style={productName}>{p.name}</h3>
              <p style={desc}>{p.description}</p>
            </div>

            <div style={divider} />

            <div style={infoRow}>
              <div>
                <div style={label}>Minimal Investasi</div>
                <div style={value}>
                  Rp {Number(p.min_amount).toLocaleString("id-ID")}
                </div>
              </div>

              <div>
                <div style={label}>ROI Harian</div>
                <div style={roi}>{p.roi_daily_percent}%</div>
              </div>
            </div>

            <input
              style={input}
              placeholder="Masukkan nominal investasi"
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
                opacity: loadingId === p.id ? 0.7 : 1,
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
   STYLES — LUXURY
================================ */

const container = {
  maxWidth: 1100,
  margin: "0 auto",
  paddingBottom: 40,
};

const headerBox = {
  marginBottom: 30,
};

const title = {
  fontSize: 30,
  fontWeight: 800,
  marginBottom: 6,
};

const subtitle = {
  color: "#64748b",
  fontSize: 15,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 24,
};

const card = {
  background: "linear-gradient(180deg, #ffffff, #f8fafc)",
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
};

const cardTop = {
  marginBottom: 14,
};

const badge = {
  background: "#0b1c2d",
  color: "white",
  fontSize: 11,
  padding: "4px 10px",
  borderRadius: 999,
  display: "inline-block",
  marginBottom: 10,
  letterSpacing: 0.5,
};

const productName = {
  fontSize: 20,
  fontWeight: 800,
  margin: "4px 0",
};

const desc = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.6,
};

const divider = {
  height: 1,
  background: "#e5e7eb",
  margin: "14px 0",
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
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  marginBottom: 14,
  outline: "none",
};

const btn = {
  width: "100%",
  padding: "14px",
  background: "linear-gradient(135deg, #0b1c2d, #1e293b)",
  color: "white",
  border: 0,
  borderRadius: 14,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
