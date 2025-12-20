"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ADMIN_EMAIL = "sonandra111@gmail.com";

export default function Admin() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  // settings
  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  // manual saldo
  const [search, setSearch] = useState("");
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

    setTransactions(trx || []);

    const { data: s } = await supabase.from("settings").select("key,value");
    if (s) {
      setDepositBank(s.find(i => i.key === "deposit_bank")?.value || "");
      setCsWhatsapp(s.find(i => i.key === "cs_whatsapp")?.value || "");
    }
  };

  // ===== ACC / REJECT =====
  const approve = async (t) => {
    const note = prompt("Keterangan admin (wajib):");
    if (!note) return alert("Keterangan wajib diisi");

    await supabase
      .from("transactions")
      .update({ status: "approved", admin_note: note })
      .eq("id", t.id);

    await supabase.rpc("adjust_balance", {
      uid: t.user_id,
      amt: t.type === "deposit" ? t.amount : -t.amount
    });

    loadAll();
  };

  const reject = async (t) => {
    await supabase
      .from("transactions")
      .update({
        status: "rejected",
        admin_note: "Ditolak admin"
      })
      .eq("id", t.id);

    loadAll();
  };

  // ===== MANUAL SALDO (USERNAME / EMAIL) =====
  const adjustManual = async () => {
    if (!search || !amount) return alert("Lengkapi data");

    const amt = Number(amount);
    if (!amt) return alert("Jumlah tidak valid");

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${search},email.eq.${search}`)
      .single();

    if (!profile) return alert("User tidak ditemukan");

    await supabase.rpc("adjust_balance", {
      uid: profile.id,
      amt
    });

    alert("Saldo berhasil diubah");
    setSearch("");
    setAmount("");
  };

  const saveSetting = async (key, value) => {
    await supabase.from("settings").update({ value }).eq("key", key);
    alert("Disimpan");
  };

  if (loading) return <p>Loading admin...</p>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1>Panel Admin</h1>

      <div style={grid}>
        <div style={card}>
          <h3>Rekening Deposit</h3>
          <input style={input} value={depositBank}
            onChange={e => setDepositBank(e.target.value)} />
          <button style={btn}
            onClick={() => saveSetting("deposit_bank", depositBank)}>
            Simpan
          </button>
        </div>

        <div style={card}>
          <h3>CS WhatsApp</h3>
          <input style={input} value={csWhatsapp}
            onChange={e => setCsWhatsapp(e.target.value)} />
          <button style={btn}
            onClick={() => saveSetting("cs_whatsapp", csWhatsapp)}>
            Simpan
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 30 }}>Deposit & Withdraw Pending</h3>

      {transactions.map(t => (
        <div key={t.id} style={card}>
          <p><b>{t.type.toUpperCase()}</b> — Rp {t.amount.toLocaleString("id-ID")}</p>
          {t.note && <pre style={note}>{t.note}</pre>}
          <button style={btn} onClick={() => approve(t)}>ACC</button>
          <button style={btnDanger} onClick={() => reject(t)}>Reject</button>
        </div>
      ))}

      <h3 style={{ marginTop: 30 }}>Tambah / Kurangi Saldo Manual</h3>
      <div style={card}>
        <input style={input}
          placeholder="Username / Email"
          value={search}
          onChange={e => setSearch(e.target.value)} />
        <input style={input}
          placeholder="Jumlah (contoh: 100000 / -50000)"
          value={amount}
          onChange={e => setAmount(e.target.value)} />
        <button style={btn} onClick={adjustManual}>Simpan Saldo</button>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
  gap: 16
};

const card = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  marginBottom: 14,
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)"
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
  padding: "8px 14px",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  marginRight: 6
};

const btnDanger = {
  ...btn,
  background: "#b91c1c"
};

const note = {
  background: "#f8fafc",
  padding: 10,
  borderRadius: 8,
  fontSize: 13,
  marginBottom: 8,
  whiteSpace: "pre-wrap"
};
