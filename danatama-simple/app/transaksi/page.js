"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Transaksi() {
  const router = useRouter();
  const [data, setData] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");

      const { data: trx } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

      setData(trx || []);
    });
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1>Riwayat Transaksi</h1>

      {data.length === 0 && <p>Belum ada transaksi.</p>}

      {data.map(t => (
        <div key={t.id} style={card}>
          <div style={row}>
            <b>{t.type.toUpperCase()}</b>
            <span style={badge(t.status)}>{t.status}</span>
          </div>

          <p>Rp {Number(t.amount).toLocaleString("id-ID")}</p>

          {t.note && <pre style={box}>{t.note}</pre>}
          {t.admin_note && (
            <pre style={adminBox}>Admin: {t.admin_note}</pre>
          )}

          <small>{new Date(t.created_at).toLocaleString("id-ID")}</small>
        </div>
      ))}
    </div>
  );
}

const badge = (status) => ({
  padding: "4px 10px",
  borderRadius: 12,
  fontSize: 12,
  color: "white",
  background:
    status === "approved" ? "#16a34a" :
    status === "rejected" ? "#dc2626" :
    "#ca8a04"
});

const card = {
  background:"white",
  padding:16,
  borderRadius:12,
  marginBottom:14,
  boxShadow:"0 6px 16px rgba(0,0,0,0.06)"
};

const row = { display:"flex", justifyContent:"space-between" };
const box = { background:"#f8fafc", padding:10, borderRadius:8, fontSize:13 };
const adminBox = { ...box, background:"#ecfeff", borderLeft:"4px solid #06b6d4" };
