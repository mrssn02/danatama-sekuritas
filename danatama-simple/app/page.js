export default function HomePage() {
  return (
    <div style={page}>
      {/* HERO */}
      <section style={hero}>
        <h1 style={heroTitle}>
          Investasi Saham <span style={{ color: "#D4AF37" }}>Aman & Profesional</span>
        </h1>
        <p style={heroText}>
          Platform investasi modern dengan sistem transparan, cepat, dan terpercaya.
        </p>
        <div style={heroButtons}>
          <a href="/register" style={btnPrimary}>Mulai Sekarang</a>
          <a href="/login" style={btnOutline}>Masuk</a>
        </div>
      </section>

      {/* FEATURES */}
      <section style={section}>
        <div style={grid}>
          {features.map((f, i) => (
            <div key={i} style={card}>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={footer}>
        © 1992–2025 PT. Danatama Makmur Sekuritas
      </footer>
    </div>
  );
}

/* ===============================
   DATA
================================ */
const features = [
  { title: "Keamanan Tinggi", desc: "Transaksi aman dengan sistem berlapis." },
  { title: "Deposit Cepat", desc: "Proses cepat & transparan." },
  { title: "Withdraw Mudah", desc: "Penarikan saldo tanpa ribet." },
];

/* ===============================
   STYLES
================================ */
const page = { background: "#F4F6F8", minHeight: "100vh" };

const hero = {
  background: "linear-gradient(135deg, #0B1C2D, #132F4C)",
  color: "white",
  padding: "120px 20px",
  textAlign: "center",
};

const heroTitle = {
  fontSize: 48,
  fontWeight: 800,
  marginBottom: 20,
};

const heroText = {
  fontSize: 18,
  maxWidth: 600,
  margin: "0 auto 30px",
  opacity: 0.9,
};

const heroButtons = {
  display: "flex",
  justifyContent: "center",
  gap: 16,
};

const btnPrimary = {
  background: "#D4AF37",
  color: "#0B1C2D",
  padding: "14px 26px",
  borderRadius: 14,
  fontWeight: 700,
  textDecoration: "none",
};

const btnOutline = {
  border: "2px solid #D4AF37",
  color: "#D4AF37",
  padding: "12px 24px",
  borderRadius: 14,
  fontWeight: 700,
  textDecoration: "none",
};

const section = { padding: "80px 20px" };

const grid = {
  maxWidth: 1000,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))",
  gap: 24,
};

const card = {
  background: "white",
  padding: 30,
  borderRadius: 20,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const footer = {
  textAlign: "center",
  padding: 30,
  color: "#6B7280",
};
