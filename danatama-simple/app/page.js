export default function Home() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Selamat Datang</h1>
      <p style={{ maxWidth: 600 }}>
        Website resmi PT. Danatama Makmur Sekuritas.
        Saat ini website masih dalam tahap pengembangan.
      </p>

      <div style={{
        marginTop: 32,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
        maxWidth: 800
      }}>
        <div style={cardStyle}>
          <h3>Terdaftar & Diawasi</h3>
          <p>Anggota Bursa Efek Indonesia.</p>
        </div>
        <div style={cardStyle}>
          <h3>Layanan Profesional</h3>
          <p>Transparan dan sesuai regulasi.</p>
        </div>
        <div style={cardStyle}>
          <h3>Pengembangan Berkelanjutan</h3>
          <p>Website akan terus diperbarui.</p>
        </div>
      </div>
    </>
  );
}

const cardStyle = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
};
