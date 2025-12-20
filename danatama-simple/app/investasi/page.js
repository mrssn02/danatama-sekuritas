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
      if (!data.user) router.push("/login");
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
      const { error } = await supabase.rpc("invest_buy", { pid: p.id, amt });
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
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1>Produk Investasi</h1>

      <div style={grid}>
        {products.map(p => (
          <div key={p.id} style={card}>
            <h3 style={{ marginTop: 0 }}>{p.name}</h3>
            <p style={{ opacity: 0.8 }}>{p.description}</p>
            <p><b>Minimal:</b> Rp {Number(p.min_amount).toLocaleString("id-ID")}</p>
            <p><b>ROI Harian:</b> {p.roi_daily_percent}%</p>

            <input
              style={input}
              placeholder="Nominal investasi"
              value={amount[p.id] || ""}
              onChange={(e) => setAmount(prev => ({ ...prev, [p.id]: e.target.value }))}
            />

            <button style={btn} onClick={() => buy(p)} disabled={loadingId === p.id}>
              {loadingId === p.id ? "Memproses..." : "Invest Sekarang"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 16
};

const card = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)"
};

const input = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd", margin: "10px 0" };
const btn = { width: "100%", padding: 12, background: "#0b1c2d", color: "white", border: 0, borderRadius: 10 };
