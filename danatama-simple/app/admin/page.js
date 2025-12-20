"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const SUPER_ADMIN_EMAIL = "sonandra111@gmail.com";

export default function AdminPage() {
  const router = useRouter();

  const [me, setMe] = useState(null); // auth user
  const [profile, setProfile] = useState(null); // profiles row
  const role = profile?.role || "user";

  // Settings
  const [depositBank, setDepositBank] = useState("");
  const [csWhatsapp, setCsWhatsapp] = useState("");

  // Pending Transactions
  const [pendingTx, setPendingTx] = useState([]);
  const [adminNoteMap, setAdminNoteMap] = useState({}); // id -> catatan admin
  const [loading, setLoading] = useState(false);

  // Manual adjust
  const [searchText, setSearchText] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [foundUser, setFoundUser] = useState(null);

  // Super admin manage admins
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("admin_finance");

  const isAdmin = useMemo(
    () => ["super_admin", "admin_finance", "admin_it"].includes(role),
    [role]
  );

  const canEditSettings = useMemo(
    () => role === "super_admin" || role === "admin_finance",
    [role]
  );

  const canManageAdmins = useMemo(() => role === "super_admin", [role]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        alert("Silakan login terlebih dahulu.");
        router.push("/login");
        return;
      }
      setMe(data.user);

      const { data: p } = await supabase
        .from("profiles")
        .select("id,email,username,role")
        .eq("id", data.user.id)
        .single();

      setProfile(p || null);
    })();
  }, [router]);

  useEffect(() => {
    if (!profile) return;

    if (!isAdmin) {
      alert("Akses ditolak. Halaman ini hanya untuk admin.");
      router.push("/");
      return;
    }

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadAll = async () => {
    await Promise.all([loadSettings(), loadPendingTx(), loadAdminList()]);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from("settings").select("key,value");
    const dep = data?.find((x) => x.key === "deposit_bank")?.value || "";
    const cs = data?.find((x) => x.key === "cs_whatsapp")?.value || "";
    setDepositBank(dep);
    setCsWhatsapp(cs);
  };

  const upsertSetting = async (key, value) => {
    const { error } = await supabase.from("settings").upsert(
      { key, value },
      { onConflict: "key" }
    );
    if (error) throw error;
  };

  const saveDepositBank = async () => {
    if (!canEditSettings) return alert("Role kamu tidak bisa mengubah setting ini.");
    setLoading(true);
    try {
      await upsertSetting("deposit_bank", depositBank);
      alert("Rekening deposit berhasil disimpan");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveCsWhatsapp = async () => {
    if (!canEditSettings) return alert("Role kamu tidak bisa mengubah setting ini.");
    setLoading(true);
    try {
      await upsertSetting("cs_whatsapp", csWhatsapp);
      alert("Nomor CS berhasil disimpan");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingTx = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("id, user_id, type, amount, status, note, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    setPendingTx(data || []);
  };

  const approveTx = async (t) => {
    const adminNote = (adminNoteMap[t.id] || "").trim();

    const ok = confirm(`ACC transaksi ${t.type.toUpperCase()} Rp ${formatRp(t.amount)}?`);
    if (!ok) return;

    setLoading(true);
    try {
      // update status + catatan admin (pakai kolom note tambahan, aman walau belum ada)
      // Kalau tabel kamu belum punya kolom admin_note, kita gabungkan ke note.
      const mergedNote = adminNote
        ? `${t.note || ""}\n\n[ADMIN NOTE]\n${adminNote}`
        : (t.note || "");

      const { error: uerr } = await supabase
        .from("transactions")
        .update({ status: "approved", note: mergedNote })
        .eq("id", t.id);

      if (uerr) throw uerr;

      // adjust wallet balance
      const amt = t.type === "deposit" ? Number(t.amount) : -Number(t.amount);

      const { error: rerr } = await supabase.rpc("adjust_balance", {
        uid: t.user_id,
        amt
      });

      if (rerr) throw rerr;

      alert("Berhasil di-ACC");
      await loadPendingTx();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ================
  // MANUAL ADJUST
  // ================
  const findUser = async () => {
    const q = searchText.trim();
    if (!q) return alert("Isi email atau username dulu.");

    // Cari by email exact dulu, kalau tidak ada baru username (ilike)
    let found = null;

    const byEmail = await supabase
      .from("profiles")
      .select("id,email,username,role")
      .eq("email", q)
      .maybeSingle();

    if (byEmail.data) found = byEmail.data;

    if (!found) {
      const byUser = await supabase
        .from("profiles")
        .select("id,email,username,role")
        .ilike("username", q)
        .limit(1);

      if (byUser.data?.length) found = byUser.data[0];
    }

    if (!found) {
      setFoundUser(null);
      alert("User tidak ditemukan");
      return;
    }

    setFoundUser(found);
    alert(`User ditemukan: ${found.email} (${found.username})`);
  };

  const adjustManual = async () => {
    if (!foundUser) return alert("Cari user dulu.");

    const amt = Number(manualAmount);
    if (!amt) return alert("Isi nominal (+ untuk tambah, - untuk kurangi).");

    setLoading(true);
    try {
      const { error } = await supabase.rpc("adjust_balance", {
        uid: foundUser.id,
        amt
      });
      if (error) throw error;

      alert("Saldo berhasil diubah (tanpa buat transaksi baru)");
      setManualAmount("");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // SUPER ADMIN - MANAGE ADMINS
  // ======================
  const loadAdminList = async () => {
    if (!canManageAdmins) return;

    const { data } = await supabase
      .from("profiles")
      .select("id,email,username,role")
      .in("role", ["admin_finance", "admin_it"])
      .order("email", { ascending: true });

    setAdmins(data || []);
  };

  const setAdminRole = async () => {
    if (!canManageAdmins) return alert("Hanya Super Admin yang bisa mengelola admin.");

    const email = newAdminEmail.trim();
    if (!email) return alert("Isi email admin.");
    if (email === SUPER_ADMIN_EMAIL) return alert("Email Super Admin tidak perlu diubah.");

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newAdminRole })
        .eq("email", email);

      if (error) throw error;

      alert("Role admin berhasil disimpan.");
      setNewAdminEmail("");
      await loadAdminList();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeAdmin = async (email) => {
    if (!canManageAdmins) return;

    const ok = confirm(`Copot admin untuk ${email}?`);
    if (!ok) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("email", email);

      if (error) throw error;

      alert("Admin berhasil dicopot.");
      await loadAdminList();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div style={{ padding: 20 }}>Memuat...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <h1>Panel Admin</h1>
      <p style={{ opacity: 0.75, marginTop: -6 }}>
        Login sebagai: <b>{profile.email}</b> — Role: <b>{role}</b>
      </p>

      {/* SETTINGS (Super Admin + Finance) */}
      {(role === "super_admin" || role === "admin_finance") && (
        <div style={grid2}>
          <div style={card}>
            <h3>Rekening Deposit</h3>
            <input
              style={input}
              value={depositBank}
              onChange={(e) => setDepositBank(e.target.value)}
              placeholder="Contoh: BRI 123xxxx a.n ..."
            />
            <button style={btn} onClick={saveDepositBank} disabled={loading}>
              Simpan
            </button>
          </div>

          <div style={card}>
            <h3>CS WhatsApp</h3>
            <input
              style={input}
              value={csWhatsapp}
              onChange={(e) => setCsWhatsapp(e.target.value)}
              placeholder="Contoh: 628123456789"
            />
            <button style={btn} onClick={saveCsWhatsapp} disabled={loading}>
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* PENDING TX (Semua admin) */}
      <div style={card}>
        <h3>Deposit & Withdraw Pending ({pendingTx.length})</h3>
        {pendingTx.length === 0 && <p>Tidak ada transaksi pending.</p>}

        {pendingTx.map((t) => (
          <div key={t.id} style={txCard}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <b style={{ textTransform: "uppercase" }}>{t.type}</b>{" "}
                — Rp {formatRp(t.amount)}
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {new Date(t.created_at).toLocaleString("id-ID")}
                </div>
              </div>
              <button style={btn} onClick={() => approveTx(t)} disabled={loading}>
                ACC
              </button>
            </div>

            {t.note && (
              <pre style={noteBox}>
                {t.note}
              </pre>
            )}

            <input
              style={input}
              placeholder="Keterangan admin (opsional) - akan tersimpan di note"
              value={adminNoteMap[t.id] || ""}
              onChange={(e) =>
                setAdminNoteMap((m) => ({ ...m, [t.id]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>

      {/* MANUAL ADJUST (Semua admin) */}
      <div style={card}>
        <h3>Tambah / Kurangi Saldo Manual</h3>
        <p style={{ fontSize: 12, opacity: 0.75, marginTop: -6 }}>
          Cari user pakai <b>email</b> atau <b>username</b>. Nominal bisa pakai tanda minus untuk mengurangi.
          Perubahan manual <b>tidak</b> membuat transaksi baru.
        </p>

        <div style={grid2}>
          <div>
            <input
              style={input}
              placeholder="Email atau username"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button style={btnOutline} onClick={findUser} disabled={loading}>
              Cari User
            </button>

            {foundUser && (
              <div style={{ marginTop: 10, fontSize: 13 }}>
                Ditemukan: <b>{foundUser.email}</b> ({foundUser.username})
              </div>
            )}
          </div>

          <div>
            <input
              style={input}
              placeholder="Nominal (contoh: 100000 atau -50000)"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
            />
            <button style={btn} onClick={adjustManual} disabled={loading}>
              Simpan Saldo
            </button>
          </div>
        </div>
      </div>

      {/* SUPER ADMIN - MANAGE ADMINS */}
      {canManageAdmins && (
        <div style={card}>
          <h3>Kelola Admin (Super Admin)</h3>
          <p style={{ fontSize: 12, opacity: 0.75, marginTop: -6 }}>
            Kamu bisa menambahkan admin berdasarkan email dan mencopotnya kapan saja.
          </p>

          <div style={grid2}>
            <div>
              <input
                style={input}
                placeholder="Email calon admin"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>

            <div>
              <select
                style={input}
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
              >
                <option value="admin_finance">Admin Finance</option>
                <option value="admin_it">Admin IT</option>
              </select>
            </div>
          </div>

          <button style={btn} onClick={setAdminRole} disabled={loading}>
            Simpan Role Admin
          </button>

          <hr style={{ margin: "18px 0", opacity: 0.3 }} />

          <h4>Admin Aktif</h4>
          {admins.length === 0 && <p>Belum ada admin selain kamu.</p>}

          {admins.map((a) => (
            <div key={a.id} style={adminRow}>
              <div>
                <b>{a.email}</b>{" "}
                <span style={{ opacity: 0.75 }}>({a.role})</span>
              </div>
              <button style={btnDanger} onClick={() => revokeAdmin(a.email)} disabled={loading}>
                Copot
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================
// Helpers + Styles
// =====================
function formatRp(n) {
  const num = Number(n || 0);
  return num.toLocaleString("id-ID");
}

const card = {
  background: "white",
  padding: 18,
  borderRadius: 14,
  marginTop: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
  marginTop: 10,
};

const input = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  outline: "none",
};

const btn = {
  marginTop: 10,
  background: "#0b1c2d",
  color: "white",
  border: 0,
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
};

const btnOutline = {
  marginTop: 10,
  background: "transparent",
  color: "#0b1c2d",
  border: "1px solid #0b1c2d",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
};

const btnDanger = {
  background: "#b91c1c",
  color: "white",
  border: 0,
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
};

const txCard = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #eee",
  background: "#fafafa",
};

const noteBox = {
  marginTop: 10,
  padding: 10,
  borderRadius: 10,
  background: "#0b1c2d",
  color: "white",
  fontSize: 12,
  whiteSpace: "pre-wrap",
  overflowX: "auto",
};

const adminRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #eee",
};
