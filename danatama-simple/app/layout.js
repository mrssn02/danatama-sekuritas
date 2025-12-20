import Header from "../components/Header";

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={body}>
        <Header />
        <main style={{ padding: 40 }}>{children}</main>

        <footer style={footer}>
          <p>© 2023–{new Date().getFullYear()} PT. Danatama Makmur Sekuritas</p>
          <p>
            Disclaimer: Informasi pada website ini bersifat umum dan
            bukan merupakan ajakan membeli atau menjual efek.
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
  color: "#1f2937"
};

const footer = {
  marginTop: 60,
  padding: "24px 32px",
  background: "#0b1c2d",
  color: "white",
  fontSize: 12
};
