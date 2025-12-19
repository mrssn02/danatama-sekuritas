export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f5f7fa" }}>
        
        {/* Header */}
        <header style={{
          background: "#0b1c2d",
          color: "white",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 16
        }}>
          <img src="/logo.png" alt="Danatama" style={{ height: 48 }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>
              PT. Danatama Makmur Sekuritas
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Member of Indonesia Stock Exchange
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: 40 }}>
          {children}
        </main>

      </body>
    </html>
  );
}
