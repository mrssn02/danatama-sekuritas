"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Investasi() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    supabase.from("investment_products")
      .select("*")
      .then(({ data }) => setProducts(data || []));
  }, []);

  return (
    <>
      <h1>Produk Investasi</h1>

      <div style={grid}>
        {products.map(p => (
          <div key={p.id} style={card}>
            <h3>{p.name}</h3>
            <p>Risiko: <b>{p.risk}</b></p>
            <p>Estimasi Return: <b>{p.return_pct}% / tahun</b></p>
            <p>{p.description}</p>
            <a href="/dashboard">Investasi</a>
          </div>
        ))}
      </div>
    </>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 20
};

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,.05)"
};
