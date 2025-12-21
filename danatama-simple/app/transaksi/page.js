"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function RiwayatTransaksi() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });

      setTransactions(data || []);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <p>Memuat riwayat...</p>;

  return (
    <div style={wrap}>
      <h1 style={title}>Riwayat Transaksi</h1>

      {transactions.length === 0 && (
        <div style={empty}>Belum ada transaksi.</div>
      )}

      {transactions.map((t) => (
        <div key={t.id} style={card}>
          <div style={row}>
            <span style={typeBadge(t.type)}>
              {t.type.toUpperCase()}
            </span>

            <span style={statusBadge(t.status)}>
              {t.status.toUpperCase()}
            </span>
          </div>

          <div style={amount}>
            Rp {Number(t.amount).toLocaleString("id-ID")}
          </div>

          {t.note && (
            <div style={noteBox}>
              <b>Catatan User:</b>
              <div>{t.note}</div>
            </div>
          )}

          {t.admin_note && (
            <div style={adminBox}>
              <b>Catatan Admin:</b>
              <div>{t.admin_note}</div>
            </div>
          )}

          <div style={date}>
            {new Date(t.created_at).toLocaleString("id-ID")}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===============================
   STYLES – LUXURY
================================ */

const wrap = {
  maxWidth: 820,
  margin: "0 auto",
};

const title = {
  fontSize: 26,
  fontWeight: 800,
  marginBottom: 24,
};

const empty = {
  background: "#f8fafc",
  padding: 24,
  borderRadius: 14,
  textAlign: "center",
  color: "#64748b",
};

const card = {
  background: "white",
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10,
};

const amount = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 12,
};

const noteBox = {
  background: "#f1f5f9",
  padding: 12,
  borderRadius: 10,
  fontSize: 14,
  marginBottom: 8,
};

const adminBox = {
  background: "#ecfeff",
  padding: 12,
  borderRadius: 10,
  fontSize: 14,
  marginBottom: 8,
  border: "1px solid #67e8f9",
};

const date = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 8,
};

/* ===============================
   BADGES
================================ */

const typeBadge = (type) => ({
  background: type === "deposit" ? "#dcfce7" : "#fee2e2",
  color: type === "deposit" ? "#166534" : "#991b1b",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
});

const statusBadge = (status) => {
  if (status === "approved") {
    return {
      background: "#dcfce7",
      color: "#166534",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
    };
  }

  if (status === "rejected") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
    };
  }

  return {
    background: "#fef3c7",
    color: "#92400e",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
};
