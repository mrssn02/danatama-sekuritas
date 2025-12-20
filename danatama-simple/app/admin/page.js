"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ADMIN_EMAIL = "sonandra111@gmail.com";

export default function Admin() {
  const router = useRouter();

  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(true);

  // settings
  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  // manual balance
  const [search, setSearch] = useState(""); // username / email
  const [amount, setAmount] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");

      if (data.user.email !== ADMIN_EMAIL) {
        alert("Akses ditolak");
        return router.push("/");
      }

      await loadAll();
      setLoading(false);
    });
  }, []);

  const loadAll = async () => {
    const { data: trx } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setTx(trx || []);

    const { data: s } = await supabase.from("settings").select("key,value");
    if (s) {
      setDepositBank(s.find(i => i.key === "deposit_bank")?.value || "");
      setCsWhatsapp(s.find(i => i.key === "cs_whatsapp")?.value || "");
    }
  };

  // ================= APPROVE / REJECT =================
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

  // ================= SETTINGS =================
  const saveSetting = async (key, value) => {
    const { error } = await supabase
      .from("settings")
      .update({ value })
      .eq("key", key);

    if (error) return alert(error.message);
    alert("Pengaturan disimpan");
  };

  // ================= MANUAL BALANCE (NO TRANSACTION LOG) =================
  const adjustManual = async () => {
    if (!search || !amount) {
      alert("Lengkapi pencarian user dan jumlah");
      return;
    }

    const amt = Number(amount);
    if (!amt) {
      alert("Jumlah tidak valid");
      return;
    }

    let userId = null;

    // 1️⃣ cari berdasarkan username
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", search)
      .single();

    if (profile?.id) {
      userId = profile.id;
    } else {
      // 2️⃣ cari berdasarkan email
      const { data: users } = await supabase.auth.admin.listUsers();
      const found = users.users.find(u => u.email === search);
      if (found) userId = found.id;
    }

    if (!userId) {
      alert("User tidak ditemukan");
      return;
    }

    // === LANGSUNG ADJUST SALDO (TANPA RIWAYAT) ===
    await supabase.rpc("adjust_balance", {
      uid: userId,
      amt
    });

    alert("Saldo berhasil diperbarui");
    setSearch("");
    setAmount("");
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
        <h3>Deposit & Withdraw Pending</h3>

        {tx.length === 0 && <p>Tidak ada transaksi pending</p>}

        {tx.map(t => (
          <div key={t.id} style={card}>
            <p>
              <b>{t.type.toUpperCase()}</b> — Rp {Number(t.amount).toLocaleString("id-ID")}
            </p>

            {/* === INFO REKENING WD === */}
            {t.type === "withdraw" && t.note && (
              <pre style={noteBox}>{t.note}</pre>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button style={btn} onClick={() => approve(t)}>ACC</button>
              <button style={btnDanger} onClick={() => reject(t)}>Reject</button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MANUAL BALANCE ================= */}
      <div style={{ marginTop: 30 }}>
        <h3>Tambah / Kurangi Saldo Manual</h3>

        <div style={card}>
          <input
            style={input}
            placeholder="Username atau Email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            style={input}
            placeholder="Jumlah (contoh: 50000 atau -50000)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button style={btn} onClick={adjustManual}>
            Simpan Saldo
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

const noteBox = {
  background: "#f8fafc",
  padding: 10,
  borderRadius: 8,
  fontSize: 13,
  whiteSpace: "pre-wrap",
  marginBottom: 10
};
