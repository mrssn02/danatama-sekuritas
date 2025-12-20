import Header from "../components/Header";
import CsButton from "../components/CsButton"; // aman walau belum dipakai

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={body}>
        {/* ===== HEADER ===== */}
        <Header />

        {/* ===== KONTEN HALAMAN ===== */}
        <main style={main}>
          {children}
        </main>

        {/* ===== FOOTER ===== */}
        <footer style={footer}>
          <p>© 1992–{new Date().getFullYear()} PT. Danatama Makmur Sekuritas</p>
          <p style={{ opacity: 0.85 }}>
            Disclaimer: Informasi pada website ini bersifat Aman dan
            terpercaya untuk membeli atau menjual perdagangan efek saham.
          </p>
        </footer>

        {/* ===== CS WHATSAPP (muncul hanya jika login) ===== */}
        <CsButton />
      </body>
    </html>
  );
}

/* ================= STYLES ================= */

const body = {
  margin: 0,
  fontFamily: "Arial, sans-serif",
  background: "#f4f6f8",
  color: "#1f2937",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column"
};

const main = {
  flex: 1,
  padding: 40,
  maxWidth: 1200,
  margin: "0 auto",
  width: "100%"
};

const footer = {
  marginTop: 60,
  padding: "24px 32px",
  background: "#0b1c2d",
  color: "white",
  fontSize: 12
};
