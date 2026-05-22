import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';

const ITEMS = [
  { key: 'sofa', label: 'Sofa', icon: '🛋️', price: 75000 },
  { key: 'kasur', label: 'Kasur', icon: '🛏️', price: 60000 },
  { key: 'lemari', label: 'Lemari', icon: '🚪', price: 85000 },
  { key: 'elektronik', label: 'Elektronik', icon: '📺', price: 50000 },
  { key: 'meja', label: 'Meja', icon: '🪑', price: 40000 },
  { key: 'kulkas', label: 'Kulkas', icon: '🧊', price: 90000 },
  { key: 'mesin_cuci', label: 'Mesin Cuci', icon: '🫧', price: 80000 },
  { key: 'lainnya', label: 'Lainnya', icon: '📦', price: 35000 },
];

const STATUS_MAP = {
  pending: 'Menunggu Konfirmasi', confirmed: 'Dikonfirmasi', assigned: 'Driver Ditugaskan',
  driver_heading: 'Driver Menuju Lokasi', pickup_arrived: 'Driver Tiba', in_transit: 'Dalam Perjalanan',
  completed: 'Selesai', cancelled: 'Dibatalkan',
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [selected, setSelected] = useState([]);
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleItem = async (item) => {
    const exists = selected.find((s) => s.key === item.key);
    const newSelected = exists
      ? selected.filter((s) => s.key !== item.key)
      : [...selected, { ...item, quantity: 1 }];
    setSelected(newSelected);
    if (newSelected.length > 0) {
      try {
        const res = await orderAPI.estimate({ items: newSelected.map((s) => ({ category: s.key, quantity: s.quantity })) });
        setEstimate(res.data.data);
      } catch { setEstimate(null); }
    } else { setEstimate(null); }
  };

  const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  return (
    <div>
      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container flex-between">
          <a href="#" className="logo">🚛 AngkutCepat</a>
          <div className="navbar-links">
            <a href="#estimator" className="navbar-link">Harga</a>
            <a href="#how" className="navbar-link">Cara Kerja</a>
            <Link to="/login" className="navbar-link">Masuk</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Daftar Gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="container">
          <div className="hero-content animate-fadeInUp">
            <div className="hero-badge">🌟 #1 Jasa Angkut Barang Terpercaya</div>
            <h1>Angkut Barang <span>Lama Anda</span><br />Cepat & Terpercaya</h1>
            <p>Solusi terbaik untuk memindahkan atau membuang barang bekas Anda. Foto barang, jadwalkan penjemputan, dan kami yang angkut — semudah itu!</p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">🚀 Pesan Sekarang</Link>
              <a href="#estimator" className="btn btn-secondary btn-lg">💰 Cek Harga</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><div className="stat-num">10K+</div><div className="stat-lbl">Barang Terangkut</div></div>
              <div className="hero-stat"><div className="stat-num">2K+</div><div className="stat-lbl">Pelanggan Puas</div></div>
              <div className="hero-stat"><div className="stat-num">50+</div><div className="stat-lbl">Armada Aktif</div></div>
              <div className="hero-stat"><div className="stat-num">4.9⭐</div><div className="stat-lbl">Rating</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ESTIMATOR */}
      <section className="estimator-section" id="estimator">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-tag">Simulasi Harga</div>
            <h2 className="section-title">Berapa Biaya Angkut Anda?</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>Pilih barang yang ingin diangkut dan lihat estimasi biaya secara langsung</p>
          </div>
          <div className="estimator-card">
            <div className="item-grid">
              {ITEMS.map((item) => (
                <button key={item.key} className={`item-chip ${selected.find(s => s.key === item.key) ? 'selected' : ''}`} onClick={() => toggleItem(item)}>
                  <span className="chip-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtCurrency(item.price)}</span>
                </button>
              ))}
            </div>
            {estimate ? (
              <div className="price-result">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Estimasi Total</div>
                    <div className="total">{fmtCurrency(estimate.total)}</div>
                  </div>
                  <Link to="/register" className="btn btn-primary">Pesan Sekarang →</Link>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Biaya dasar Rp 50.000 + barang {fmtCurrency(estimate.itemsTotal)}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '14px' }}>
                👆 Pilih minimal satu barang untuk melihat estimasi harga
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-tag">Cara Kerja</div>
            <h2 className="section-title">3 Langkah Mudah</h2>
          </div>
          <div className="steps-grid">
            {[
              { n: '01', icon: '📸', title: 'Foto & Daftarkan Barang', desc: 'Upload foto barang dan pilih kategori yang sesuai. Sistem kami akan menghitung estimasi biaya secara otomatis.' },
              { n: '02', icon: '📅', title: 'Jadwalkan Penjemputan', desc: 'Pilih tanggal dan waktu penjemputan yang nyaman. Kami beroperasi 7 hari seminggu dari 07.00 - 21.00.' },
              { n: '03', icon: '🚛', title: 'Kami Angkut!', desc: 'Driver kami yang berpengalaman akan datang tepat waktu, mengangkut barang dengan aman dan profesional.' },
            ].map((step) => (
              <div key={step.n} className="card step-card">
                <div className="step-number">{step.n}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(14,165,233,0.1))', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '32px', padding: '64px', textAlign: 'center' }}>
            <h2 className="section-title">Siap Bebaskan Ruangan Anda?</h2>
            <p className="section-sub" style={{ margin: '0 auto 32px' }}>Daftar sekarang dan dapatkan konsultasi gratis untuk kebutuhan angkut barang Anda.</p>
            <Link to="/register" className="btn btn-primary btn-lg">🚀 Mulai Sekarang — Gratis!</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 0', textAlign: 'center' }}>
        <div className="container">
          <div className="logo" style={{ display: 'block', marginBottom: '8px', textDecoration: 'none', fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #f97316, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🚛 AngkutCepat</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>© 2024 AngkutCepat. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
