"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ADMIN_EMAIL = "sonandra111@gmail.com";

export default function Admin() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(true);

  // settings
  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  // manual adjustment
  const [adjUserId, setAdjUserId] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjNote, setAdjNote] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

      if (data.user.email !== ADMIN_EMAIL) {
        alert("Akses ditolak");
        router.push("/");
        return;
      }

      setUser(data.user);
      await loadAll();
      setLoading(false);
    });
  }, []);

  const loadAll = async () => {
    // transaksi pending
    const { data: trx } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setTx(trx || []);

    // settings
    const { data: s } = await supabase.from("settings").select("key,value");
    if (s) {
      setDepositBank(s.find(i => i.key === "deposit_bank")?.value || "");
      setCsWhatsapp(s.find(i => i.key === "cs_whatsapp")?.value || "");
    }
  };

  // === APPROVE / REJECT ===
  const approve = async (t) => {
    await supabase.from("transactions")
      .update({ status: "approved" })
      .eq("id", t.id);

    await supabase.rpc("adjust_balance", {
      uid: t.user_id,
      amt: t.type === "deposit" ? Number(t.amount) : -Number(t.amount)
    });

    alert("Transaksi berhasil di-ACC");
    loadAll();
  };

  const reject = async (t) => {
    await supabase.from("transactions")
      .update({ status: "rejected" })
      .eq("id", t.id);

    alert("Transaksi ditolak");
    loadAll();
  };

  // === UPDATE SETTINGS ===
  const saveSetting = async (key, value) => {
    const { error } = await supabase
      .from("settings")
      .update({ value })
      .eq("key", key);

    if (error) return alert(error.message);
    alert("Pengaturan disimpan");
  };

  // === MANUAL ADJUSTMENT ===
  const adjustManual = async () => {
    const uid = adjUserId.trim();
    const amt = Number(adjAmount);

    if (!uid) return alert("User ID wajib diisi");
    if (!amt || amt === 0) return alert("Amount tidak valid");

    // catat transaksi
    await supabase.from("transactions").insert({
      user_id: uid,
      type: "adjustment",
      amount: Math.abs(amt),
      status: "approved",
      note: adjNote || `Adjustment manual ${amt}`
    });

    // ubah saldo
    await supabase.rpc("adjust_balance", { uid, amt });

    alert("Saldo berhasil disesuaikan");
    setAdjUserId("");
    setAdjAmount("");
    setAdjNote("");
    loadAll();
  };

  if (loading) return <p>Loading admin panel...</p>;

  return (
    <>
      <h1>Panel Admin</h1>

      {/* ================= SETTINGS ================= */}
      <div style={grid}>
        <div style={card}>
          <h3>Rekening Deposit</h3>
          <input
            style={input}
            value={depositBank}
            onChange={(e) => setDepositBank(e.target.value)}
          />
          <button style={btn} onClick={() => saveSetting("deposit_bank", depositBank)}>
            Simpan
          </button>
        </div>

        <div style={card}>
          <h3>Customer Service (WhatsApp)</h3>
          <input
            style={input}
            value={csWhatsapp}
            onChange={(e) => setCsWhatsapp(e.target.value)}
            placeholder="628xxxxxxxxxx"
          />
          <button style={btn} onClick={() => saveSetting("cs_whatsapp", csWhatsapp)}>
            Simpan
          </button>
        </div>
      </div>

      {/* ================= TRANSAKSI ================= */}
      <div style={{ marginTop: 30 }}>
        <h3>Transaksi Pending</h3>

        {tx.length === 0 && <p>Tidak ada transaksi pending</p>}

        {tx.map(t => (
          <div key={t.id} style={card}>
            <p>
              <b>{t.type.toUpperCase()}</b> — Rp {Number(t.amount).toLocaleString("id-ID")}
            </p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              User ID: {t.user_id}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={btn} onClick={() => approve(t)}>ACC</button>
              <button style={btnDanger} onClick={() => reject(t)}>Reject</button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= ADJUSTMENT ================= */}
      <div style={{ marginTop: 30 }}>
        <h3>Tambah / Kurangi Saldo (Manual)</h3>

        <div style={card}>
          <input
            style={input}
            placeholder="User ID (UUID)"
            value={adjUserId}
            onChange={(e) => setAdjUserId(e.target.value)}
          />
          <input
            style={input}
            placeholder="Amount (contoh: 50000 atau -50000)"
            value={adjAmount}
            onChange={(e) => setAdjAmount(e.target.value)}
          />
          <input
            style={input}
            placeholder="Catatan (opsional)"
            value={adjNote}
            onChange={(e) => setAdjNote(e.target.value)}
          />
          <button style={btn} onClick={adjustManual}>
            Simpan Adjustment
          </button>
        </div>
      </div>
    </>
  );
}

/* ================= STYLES ================= */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 16
};

const card = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
  marginBottom: 12
};

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ddd"
};

const btn = {
  background: "#0b1c2d",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer"
};

const btnDanger = {
  background: "#b91c1c",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer"
};
