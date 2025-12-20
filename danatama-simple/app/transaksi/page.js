"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Transaksi() {
  const router = useRouter();
  const [data, setData] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

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
          <p>
            <b>{t.type.toUpperCase()}</b> — Rp{" "}
            {Number(t.amount).toLocaleString("id-ID")}
          </p>

          <p>Status: <b>{t.status}</b></p>

          {t.note && (
            <>
              <p style={label}>Detail Pengajuan:</p>
              <pre style={box}>{t.note}</pre>
            </>
          )}

          {t.admin_note && (
            <>
              <p style={label}>Keterangan Admin:</p>
              <pre style={adminBox}>{t.admin_note}</pre>
            </>
          )}

          <p style={date}>
            {new Date(t.created_at).toLocaleString("id-ID")}
          </p>
        </div>
      ))}
    </div>
  );
}

const card = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
  marginBottom: 14
};

const label = {
  fontSize: 13,
  fontWeight: 600,
  marginTop: 8
};

const box = {
  background: "#f8fafc",
  padding: 10,
  borderRadius: 8,
  fontSize: 13,
  whiteSpace: "pre-wrap"
};

const adminBox = {
  ...box,
  background: "#ecfeff",
  borderLeft: "4px solid #06b6d4"
};

const date = {
  fontSize: 12,
  opacity: 0.6,
  marginTop: 6
};
