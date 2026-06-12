import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomerLayout from '../../components/CustomerLayout';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'sofa', label: 'Sofa', icon: '🛋️', defaultKg: 45 },
  { key: 'kasur', label: 'Kasur', icon: '🛏️', defaultKg: 25 },
  { key: 'lemari', label: 'Lemari', icon: '🚪', defaultKg: 60 },
  { key: 'elektronik', label: 'Elektronik', icon: '📺', defaultKg: 15 },
  { key: 'meja', label: 'Meja', icon: '🪑', defaultKg: 20 },
  { key: 'kulkas', label: 'Kulkas', icon: '🧊', defaultKg: 55 },
  { key: 'mesin_cuci', label: 'Mesin Cuci', icon: '🫧', defaultKg: 50 },
  { key: 'lainnya', label: 'Lainnya', icon: '📦', defaultKg: 20 },
];

const BASE_PACKAGE_KG = 10;        // 10 kg pertama
const BASE_PACKAGE_PRICE = 200000; // flat Rp 200.000
const EXCESS_PRICE_PER_KG = 15000; // Rp 15.000/kg kelebihan
const PLATFORM_FEE_RATE = 0.20;    // margin 20%

const fmtCurrency = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const calcItemSubtotal = (weightKg, qty) => weightKg * qty; // hanya untuk display berat total

const STEP_NAMES = ['Pilih Barang', 'Detail Lokasi', 'Jadwal & Pembayaran', 'Konfirmasi'];

export default function NewOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    address: user?.addresses?.[0]?.address || '',
    city: user?.addresses?.[0]?.city || '',
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    scheduledDate: '',
    scheduledTime: '08:00 - 12:00',
    paymentMethod: 'cash',
    notes: '',
  });

  // ─── Kalkulasi harga ───────────────────────────────────────────────
  const calcTotals = () => {
    const totalWeightKg = items.reduce(
      (sum, i) => sum + (i.weightKg || i.defaultKg) * i.quantity, 0
    );
    const excessKg = Math.max(0, totalWeightKg - BASE_PACKAGE_KG);
    const excessPrice = excessKg * EXCESS_PRICE_PER_KG;
    const baseAmount = BASE_PACKAGE_PRICE + excessPrice;
    const platformFee = Math.round(baseAmount * PLATFORM_FEE_RATE);
    return { totalWeightKg, excessKg, excessPrice, baseAmount, platformFee, total: baseAmount + platformFee };
  };

  // ─── Toggle item ───────────────────────────────────────────────────
  const toggleItem = (cat) => {
    const exists = items.find((i) => i.category === cat.key);
    if (exists) {
      setItems(items.filter((i) => i.category !== cat.key));
    } else {
      setItems([...items, {
        category: cat.key,
        name: cat.label,
        quantity: 1,
        weightKg: cat.defaultKg,
        defaultKg: cat.defaultKg,
      }]);
    }
  };

  const updateQty = (category, qty) =>
    setItems(items.map((i) => i.category === category ? { ...i, quantity: Math.max(1, qty) } : i));

  const updateWeight = (category, kg) =>
    setItems(items.map((i) => i.category === category ? { ...i, weightKg: Math.max(1, Number(kg) || 1) } : i));

  // ─── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      await orderAPI.create({
        items: items.map((i) => ({
          category: i.category,
          name: i.name,
          quantity: i.quantity,
          weightKg: i.weightKg,
        })),
        pickupAddress: {
          address: form.address,
          city: form.city,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
        },
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      }).then((res) => {
        toast.success('Pesanan berhasil dibuat!');
        navigate(`/order/${res.data.data.order._id}`);
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const { totalWeightKg, excessKg, excessPrice, baseAmount, platformFee, total } = calcTotals();

  const canProceed =
    (step === 0 && items.length > 0) ||
    (step === 1 && form.address && form.city && form.contactName && form.contactPhone) ||
    (step === 2 && form.scheduledDate !== '') ||
    step === 3;

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Buat Pesanan Baru</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          Ikuti langkah-langkah berikut untuk menjadwalkan penjemputan
        </p>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {STEP_NAMES.map((name, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: '4px', borderRadius: '2px', background: i <= step ? 'var(--primary)' : 'var(--border)', marginBottom: '6px', transition: 'var(--transition)' }} />
              <span style={{ fontSize: '11px', color: i === step ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === step ? '600' : '400' }}>{name}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-body">

            {/* ── Step 0: Pilih Barang ── */}
            {step === 0 && (
              <div>
                <h3 style={{ marginBottom: '6px', fontWeight: '700' }}>Pilih Barang yang Ingin Diangkut</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Pilih kategori barang lalu masukkan estimasi berat (kg). Driver akan menimbang ulang saat tiba.
                </p>

                <div className="item-grid">
                  {CATEGORIES.map((cat) => {
                    const selected = items.find((i) => i.category === cat.key);
                    return (
                      <div key={cat.key}>
                        <button
                          className={`item-chip ${selected ? 'selected' : ''}`}
                          style={{ width: '100%' }}
                          onClick={() => toggleItem(cat)}
                        >
                          <span className="chip-icon">{cat.icon}</span>
                          <span>{cat.label}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>~{cat.defaultKg} kg</span>
                        </button>

                        {/* Panel detail item setelah dipilih */}
                        {selected && (
                          <div style={{
                            marginTop: '8px', padding: '14px',
                            background: 'var(--bg-800)', borderRadius: '10px',
                            border: '1px solid var(--border)',
                          }}>
                            {/* Quantity */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>JUMLAH</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button onClick={() => updateQty(cat.key, selected.quantity - 1)}
                                  style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-700)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>−</button>
                                <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{selected.quantity}</span>
                                <button onClick={() => updateQty(cat.key, selected.quantity + 1)}
                                  style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-700)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>+</button>
                              </div>
                            </div>

                            {/* Input berat */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>ESTIMASI BERAT</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  min="1"
                                  step="0.5"
                                  value={selected.weightKg}
                                  onChange={(e) => updateWeight(cat.key, e.target.value)}
                                  style={{
                                    width: '70px', padding: '5px 8px', borderRadius: '6px',
                                    border: '1px solid var(--border)', background: 'var(--bg-900)',
                                    color: 'var(--text-primary)', fontSize: '14px', fontWeight: '700',
                                    textAlign: 'right',
                                  }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>kg</span>
                              </div>
                            </div>

                            {/* Info: driver akan timbang ulang */}
                            <div style={{
                              padding: '8px 10px', background: 'rgba(59,130,246,0.08)',
                              border: '1px solid rgba(59,130,246,0.2)', borderRadius: '6px',
                              fontSize: '11px', color: '#60a5fa',
                            }}>
                              ⚖️ Driver akan menimbang ulang saat tiba. Harga final disesuaikan berat aktual.
                            </div>

                            {/* Estimasi berat per item */}
                            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {selected.quantity}× · {selected.weightKg} kg/unit = {selected.weightKg * selected.quantity} kg
                              </span>
                              <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '11px' }}>
                                berkontribusi ke total berat
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ringkasan harga */}
                {items.length > 0 && (
                  <div className="price-result" style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                      Estimasi Biaya · Total {totalWeightKg} kg
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <span>📦 Paket Standard (≤{BASE_PACKAGE_KG} kg)</span>
                      <span>{fmtCurrency(BASE_PACKAGE_PRICE)}</span>
                    </div>
                    {excessKg > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>⚖️ Kelebihan {excessKg} kg × Rp 15.000</span>
                        <span>{fmtCurrency(excessPrice)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      <span>🏷️ Biaya layanan (20%)</span>
                      <span>{fmtCurrency(platformFee)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <span style={{ fontWeight: '700' }}>Total Estimasi</span>
                      <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--primary)' }}>
                        {fmtCurrency(total)}
                      </span>
                    </div>
                    <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      ✅ Termasuk jasa angkut dari dalam rumah ke kendaraan
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 1: Lokasi ── */}
            {step === 1 && (
              <div>
                <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Detail Lokasi Penjemputan</h3>
                {[
                  { key: 'contactName', label: 'Nama Kontak', type: 'text', placeholder: 'Nama penanggung jawab' },
                  { key: 'contactPhone', label: 'No. Telepon Kontak', type: 'tel', placeholder: '08xxxxxxxxxx' },
                  { key: 'address', label: 'Alamat Lengkap', type: 'text', placeholder: 'Jl. nama jalan, No. xx, RT/RW' },
                  { key: 'city', label: 'Kota/Kabupaten', type: 'text', placeholder: 'Jakarta Selatan' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="form-input" type={type} placeholder={placeholder}
                      value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
                  </div>
                ))}
              </div>
            )}

            {/* ── Step 2: Jadwal ── */}
            {step === 2 && (
              <div>
                <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Jadwal & Metode Pembayaran</h3>
                <div className="form-group">
                  <label className="form-label">Tanggal Penjemputan</label>
                  <input className="form-input" type="date" min={minDate} value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Waktu Penjemputan</label>
                  <select className="form-input" value={form.scheduledTime}
                    onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}>
                    {['07:00 - 10:00', '08:00 - 12:00', '10:00 - 14:00', '13:00 - 17:00', '16:00 - 20:00'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Metode Pembayaran</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { key: 'cash', label: '💵 Tunai' }, { key: 'transfer', label: '🏦 Transfer' },
                      { key: 'qris', label: '📱 QRIS' }, { key: 'ovo', label: '🟣 OVO' },
                      { key: 'gopay', label: '🟢 GoPay' }, { key: 'dana', label: '🔵 DANA' },
                    ].map((m) => (
                      <button key={m.key} type="button" onClick={() => setForm({ ...form, paymentMethod: m.key })}
                        style={{ padding: '10px', borderRadius: '8px', border: `2px solid ${form.paymentMethod === m.key ? 'var(--primary)' : 'var(--border)'}`, background: form.paymentMethod === m.key ? 'var(--bg-600)' : '#fff', color: form.paymentMethod === m.key ? 'var(--primary-dark)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan (Opsional)</label>
                  <textarea className="form-input" placeholder="Instruksi khusus untuk driver..."
                    value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            )}

            {/* ── Step 3: Konfirmasi ── */}
            {step === 3 && (
              <div>
                <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Konfirmasi Pesanan</h3>

                {/* Detail barang */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Barang
                  </div>
                  {items.map((item) => (
                    <div key={item.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.name} ({item.quantity}x)</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⚖️ Est. {item.weightKg} kg per unit</div>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {calcItemSubtotal(item.weightKg, item.quantity)} kg
                      </span>
                    </div>
                  ))}
                </div>

                {/* Info lainnya */}
                {[
                  { label: 'Lokasi', value: `${form.address}, ${form.city}` },
                  { label: 'Kontak', value: `${form.contactName} - ${form.contactPhone}` },
                  { label: 'Jadwal', value: `${form.scheduledDate} · ${form.scheduledTime}` },
                  { label: 'Pembayaran', value: form.paymentMethod.toUpperCase() },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: '16px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}

                {/* Rincian total */}
                <div style={{ marginTop: '20px', padding: '20px', background: 'var(--primary-xlight)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <span>📦 Paket Standard (≤{BASE_PACKAGE_KG} kg)</span><span>{fmtCurrency(BASE_PACKAGE_PRICE)}</span>
                  </div>
                  {excessKg > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span>⚖️ Kelebihan {excessKg} kg × Rp 15.000</span><span>{fmtCurrency(excessPrice)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <span>🏷️ Biaya layanan (20%)</span><span>{fmtCurrency(platformFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>Total Estimasi</span>
                    <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--primary)' }}>{fmtCurrency(total)}</span>
                  </div>
                  <p style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    ✅ Termasuk jasa angkut dari dalam rumah ke kendaraan
                  </p>
                </div>
              </div>
            )}

            {/* ── Navigasi ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
              <button onClick={() => setStep((s) => s - 1)} className="btn btn-secondary" disabled={step === 0}>
                ← Kembali
              </button>
              {step < 3 ? (
                <button onClick={() => setStep((s) => s + 1)} className="btn btn-primary" disabled={!canProceed}>
                  Lanjut →
                </button>
              ) : (
                <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                  {loading ? 'Memproses...' : '🚀 Buat Pesanan'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
