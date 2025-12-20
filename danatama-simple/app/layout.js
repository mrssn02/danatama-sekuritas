import Header from "../components/Header";

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={body}>
        <Header />
        <main style={{ padding: 32 }}>{children}</main>

        <footer style={footer}>
          <p>© 1992–2025 PT. Danatama Makmur Sekuritas</p>
          <p style={{ opacity: 0.8 }}>
            Disclaimer: Informasi pada website ini bersifat aman dan terpercaya
            untuk membeli atau menjual perdagangan efek saham.
          </p>
        </footer>
      </body>
    </html>
  );
}

const body = {
  margin: 0,
  fontFamily: "Arial, sans-serif",
  background: "#f4f6f8",
};

const footer = {
  marginTop: 60,
  padding: 24,
  background: "#0b1c2d",
  color: "white",
  fontSize: 12,
};
