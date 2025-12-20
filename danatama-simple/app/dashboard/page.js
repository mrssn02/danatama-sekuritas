"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;

      supabase.from("user_investments")
        .select("amount, investment_products(name)")
        .eq("user_id", data.user.id)
        .then(({ data }) => setInvestments(data || []));
    });
  }, []);

  return (
    <>
      <h1>Dashboard Investasi</h1>

      <div style={card}>
        <h3>Portofolio Anda</h3>

        {investments.length === 0 && (
          <p>Belum ada investasi.</p>
        )}

        {investments.map((i, idx) => (
          <p key={idx}>
            {i.investment_products.name} – Rp {i.amount}
          </p>
        ))}
      </div>

      <a href="/investasi">+ Tambah Investasi</a>
    </>
  );
}

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  marginBottom: 20
};
