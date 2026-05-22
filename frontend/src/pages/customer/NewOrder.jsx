import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomerLayout from '../../components/CustomerLayout';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'sofa', label: 'Sofa', icon: '🛋️', price: 75000 },
  { key: 'kasur', label: 'Kasur', icon: '🛏️', price: 60000 },
  { key: 'lemari', label: 'Lemari', icon: '🚪', price: 85000 },
  { key: 'elektronik', label: 'Elektronik', icon: '📺', price: 50000 },
  { key: 'meja', label: 'Meja', icon: '🪑', price: 40000 },
  { key: 'kulkas', label: 'Kulkas', icon: '🧊', price: 90000 },
  { key: 'mesin_cuci', label: 'Mesin Cuci', icon: '🫧', price: 80000 },
  { key: 'lainnya', label: 'Lainnya', icon: '📦', price: 35000 },
];

const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const STEP_NAMES = ['Pilih Barang', 'Detail Lokasi', 'Jadwal & Pembayaran', 'Konfirmasi'];

export default function NewOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [estimate, setEstimate] = useState(null);
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

  const toggleItem = async (cat) => {
    const exists = items.find(i => i.category === cat.key);
    const newItems = exists ? items.filter(i => i.category !== cat.key) : [...items, { category: cat.key, name: cat.label, quantity: 1 }];
    setItems(newItems);
    if (newItems.length > 0) {
      try {
        const res = await orderAPI.estimate({ items: newItems });
        setEstimate(res.data.data);
      } catch { setEstimate(null); }
    } else setEstimate(null);
  };

  const updateQty = (category, qty) => {
    const newItems = items.map(i => i.category === category ? { ...i, quantity: Math.max(1, qty) } : i);
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.create({ items, pickupAddress: { address: form.address, city: form.city, contactName: form.contactName, contactPhone: form.contactPhone }, scheduledDate: form.scheduledDate, scheduledTime: form.scheduledTime, paymentMethod: form.paymentMethod, notes: form.notes });
      toast.success('Pesanan berhasil dibuat!');
      navigate(`/order/${res.data.data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally { setLoading(false); }
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Buat Pesanan Baru</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>Ikuti langkah-langkah berikut untuk menjadwalkan penjemputan</p>

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
            {/* Step 0: Items */}
            {step === 0 && (
              <div>
                <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Pilih Barang yang Ingin Diangkut</h3>
                <div className="item-grid">
                  {CATEGORIES.map((cat) => {
                    const selected = items.find(i => i.category === cat.key);
                    return (
                      <div key={cat.key} style={{ position: 'relative' }}>
                        <button className={`item-chip ${selected ? 'selected' : ''}`} style={{ width: '100%' }} onClick={() => toggleItem(cat)}>
                          <span className="chip-icon">{cat.icon}</span>
                          <span>{cat.label}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtCurrency(cat.price)}</span>
                        </button>
                        {selected && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
                            <button onClick={() => updateQty(cat.key, selected.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-800)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px' }}>−</button>
                            <span style={{ fontSize: '13px', fontWeight: '600' }}>{selected.quantity}</span>
                            <button onClick={() => updateQty(cat.key, selected.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-800)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px' }}>+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {estimate && (
                  <div className="price-result">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estimasi Biaya</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>{fmtCurrency(estimate.total)}</div>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Biaya dasar: {fmtCurrency(estimate.basePrice)}<br />
                        Barang: {fmtCurrency(estimate.itemsTotal)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Location */}
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
                    <input className="form-input" type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Schedule */}
            {step === 2 && (
              <div>
                <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Jadwal & Metode Pembayaran</h3>
                <div className="form-group">
                  <label className="form-label">Tanggal Penjemputan</label>
                  <input className="form-input" type="date" min={minDate} value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Waktu Penjemputan</label>
                  <select className="form-input" value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })}>
                    {['07:00 - 10:00', '08:00 - 12:00', '10:00 - 14:00', '13:00 - 17:00', '16:00 - 20:00'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Metode Pembayaran</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[{ key: 'cash', label: '💵 Tunai' }, { key: 'transfer', label: '🏦 Transfer' }, { key: 'qris', label: '📱 QRIS' }, { key: 'ovo', label: '🟣 OVO' }, { key: 'gopay', label: '🟢 GoPay' }, { key: 'dana', label: '🔵 DANA' }].map(m => (
                      <button key={m.key} type="button" onClick={() => setForm({ ...form, paymentMethod: m.key })} style={{ padding: '10px', borderRadius: '8px', border: `2px solid ${form.paymentMethod === m.key ? 'var(--primary)' : 'var(--border)'}`, background: form.paymentMethod === m.key ? 'rgba(249,115,22,0.1)' : 'var(--bg-900)', color: form.paymentMethod === m.key ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}>{m.label}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan (Opsional)</label>
                  <textarea className="form-input" placeholder="Instruksi khusus untuk driver..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div>
                <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Konfirmasi Pesanan</h3>
                {[
                  { label: 'Barang', value: items.map(i => `${i.name} (${i.quantity}x)`).join(', ') },
                  { label: 'Lokasi', value: `${form.address}, ${form.city}` },
                  { label: 'Kontak', value: `${form.contactName} - ${form.contactPhone}` },
                  { label: 'Jadwal', value: `${form.scheduledDate} · ${form.scheduledTime}` },
                  { label: 'Pembayaran', value: form.paymentMethod.toUpperCase() },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: '16px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
                {estimate && (
                  <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(249,115,22,0.08)', borderRadius: '12px', border: '1px solid rgba(249,115,22,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600' }}>Total Pembayaran</span>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>{fmtCurrency(estimate.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
              <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary" disabled={step === 0}>← Kembali</button>
              {step < 3 ? (
                <button onClick={() => setStep(s => s + 1)} className="btn btn-primary" disabled={step === 0 && items.length === 0}>Lanjut →</button>
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
