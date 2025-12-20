"use client";

import { useEffect, useMemo, useState } from "react";
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

  // products
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodMin, setProdMin] = useState("100000");
  const [prodRoi, setProdRoi] = useState("0.5");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push("/login");
      if (data.user.email !== ADMIN_EMAIL) {
        alert("Akses admin ditolak");
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

  // ========== ACC / REJECT ==========
  const approve = async (t) => {
    const note = prompt("Keterangan admin (wajib):\nContoh: Dana diterima / Transfer done 14:30");
    if (!note) return alert("Keterangan wajib diisi");

    await supabase
      .from("transactions")
      .update({ status: "approved", admin_note: note })
      .eq("id", t.id);

    // adjust saldo hanya untuk deposit/withdraw
    await supabase.rpc("adjust_balance", {
      uid: t.user_id,
      amt: t.type === "deposit" ? Number(t.amount) : -Number(t.amount)
    });

    // ledger (untuk chart + audit user)
    await supabase.from("wallet_ledger").insert({
      user_id: t.user_id,
      type: t.type,
      amount: t.type === "deposit" ? Number(t.amount) : -Number(t.amount),
      note: `Admin approved: ${note}`
    });

    alert("Di-ACC");
    loadAll();
  };

  const reject = async (t) => {
    const reason = prompt("Alasan reject (opsional):") || "Ditolak admin";
    await supabase
      .from("transactions")
      .update({ status: "rejected", admin_note: reason })
      .eq("id", t.id);

    alert("Rejected");
    loadAll();
  };

  // ========== SETTINGS ==========
  const saveSetting = async (key, value) => {
    const { error } = await supabase.from("settings").update({ value }).eq("key", key);
    if (error) return alert(error.message);
    alert("Disimpan");
  };

  // ========== MANUAL SALDO (tanpa transaksi) ==========
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

    await supabase.rpc("adjust_balance", { uid: profile.id, amt });
    alert("Saldo berhasil diubah (tanpa riwayat transaksi).");
    setSearch("");
    setAmount("");
  };

  // ========== RUN ROI HARIAN ==========
  const runRoi = async () => {
    const ok = confirm("Jalankan ROI harian untuk semua investasi aktif?");
    if (!ok) return;

    const { error } = await supabase.rpc("run_daily_roi");
    if (error) return alert(error.message);

    alert("ROI harian berhasil dijalankan.");
  };

  // ========== TAMBAH PRODUK ==========
  const addProduct = async () => {
    const name = prodName.trim();
    if (!name) return alert("Nama produk wajib");

    const payload = {
      name,
      description: prodDesc,
      min_amount: Number(prodMin || 0),
      roi_daily_percent: Number(prodRoi || 0),
      is_active: true
    };

    const { error } = await supabase.from("investment_products").insert(payload);
    if (error) return alert(error.message);

    alert("Produk ditambahkan");
    setProdName("");
    setProdDesc("");
  };

  // ========== EXPORT CSV ==========
  const exportCsv = async () => {
    // admin harus punya policy select transactions + profiles kalau perlu.
    const { data: trx, error } = await supabase
      .from("transactions")
      .select("id,user_id,type,amount,status,admin_note,note,created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) return alert(error.message);

    const rows = trx || [];
    const header = ["id","user_id","type","amount","status","admin_note","note","created_at"];
    const esc = (v) => `"${String(v ?? "").replaceAll('"','""')}"`;

    const csv = [
      header.join(","),
      ...rows.map(r => header.map(k => esc(r[k])).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const pendingCount = useMemo(() => transactions.length, [transactions]);

  if (loading) return <p>Loading admin...</p>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <h1>Panel Admin</h1>

      <div style={toolbar}>
        <button style={btn} onClick={runRoi}>Jalankan ROI Harian</button>
        <button style={btnOutline} onClick={exportCsv}>Export Transaksi CSV</button>
      </div>

      <div style={grid}>
        <div style={card}>
          <h3>Rekening Deposit</h3>
          <input style={input} value={depositBank} onChange={e => setDepositBank(e.target.value)} />
          <button style={btn} onClick={() => saveSetting("deposit_bank", depositBank)}>Simpan</button>
        </div>

        <div style={card}>
          <h3>CS WhatsApp</h3>
          <input style={input} value={csWhatsapp} onChange={e => setCsWhatsapp(e.target.value)} />
          <button style={btn} onClick={() => saveSetting("cs_whatsapp", csWhatsapp)}>Simpan</button>
        </div>
      </div>

      <h3 style={{ marginTop: 18 }}>Deposit & Withdraw Pending ({pendingCount})</h3>
      {transactions.length === 0 && <p>Tidak ada transaksi pending.</p>}

      {transactions.map(t => (
        <div key={t.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ margin: 0 }}>
                <b>{t.type.toUpperCase()}</b> — Rp {Number(t.amount).toLocaleString("id-ID")}
              </p>
              <small style={{ opacity: 0.7 }}>{new Date(t.created_at).toLocaleString("id-ID")}</small>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btn} onClick={() => approve(t)}>ACC</button>
              <button style={btnDanger} onClick={() => reject(t)}>Reject</button>
            </div>
          </div>

          {t.type === "withdraw" && t.note && (
            <pre style={noteBox}>{t.note}</pre>
          )}
        </div>
      ))}

      <h3 style={{ marginTop: 22 }}>Tambah / Kurangi Saldo Manual</h3>
      <div style={card}>
        <input style={input} placeholder="Username atau Email" value={search} onChange={e => setSearch(e.target.value)} />
        <input style={input} placeholder="Jumlah (contoh: 100000 atau -50000)" value={amount} onChange={e => setAmount(e.target.value)} />
        <button style={btn} onClick={adjustManual}>Simpan Saldo</button>
        <small style={{ opacity: 0.7 }}>
          Perubahan saldo manual tidak membuat transaksi baru (sesuai kebutuhan admin).
        </small>
      </div>

      <h3 style={{ marginTop: 22 }}>Tambah Produk Investasi</h3>
      <div style={card}>
        <input style={input} placeholder="Nama Produk" value={prodName} onChange={e => setProdName(e.target.value)} />
        <input style={input} placeholder="Deskripsi" value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
        <input style={input} placeholder="Minimal (contoh: 100000)" value={prodMin} onChange={e => setProdMin(e.target.value)} />
        <input style={input} placeholder="ROI Harian % (contoh: 0.5)" value={prodRoi} onChange={e => setProdRoi(e.target.value)} />
        <button style={btn} onClick={addProduct}>Tambah Produk</button>
      </div>
    </div>
  );
}

const toolbar = { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" };

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
  cursor: "pointer"
};

const btnOutline = {
  background: "transparent",
  color: "#0b1c2d",
  padding: "8px 14px",
  border: "1px solid #0b1c2d",
  borderRadius: 8,
  cursor: "pointer"
};

const btnDanger = {
  background: "#b91c1c",
  color: "white",
  padding: "8px 14px",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const noteBox = {
  background: "#f8fafc",
  padding: 10,
  borderRadius: 8,
  fontSize: 13,
  whiteSpace: "pre-wrap",
  marginTop: 10
};
