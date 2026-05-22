import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import toast from 'react-hot-toast';

const STATUS_LABEL = { pending: 'Menunggu Konfirmasi', confirmed: 'Dikonfirmasi', assigned: 'Driver Ditugaskan', driver_heading: 'Driver Menuju Lokasi', pickup_arrived: 'Driver Tiba', in_transit: 'Dalam Perjalanan', completed: 'Selesai', cancelled: 'Dibatalkan' };
const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDateTime = (d) => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState({ score: 5, comment: '' });
  const [showRating, setShowRating] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    orderAPI.getOrder(id).then(r => { setOrder(r.data.data.order); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const handleRate = async () => {
    setRatingLoading(true);
    try {
      await orderAPI.rate(id, rating);
      toast.success('Terima kasih atas penilaian Anda!');
      setShowRating(false);
      const res = await orderAPI.getOrder(id);
      setOrder(res.data.data.order);
    } catch (err) { toast.error('Gagal menyimpan penilaian'); } finally { setRatingLoading(false); }
  };

  if (loading) return <CustomerLayout><div className="flex-center" style={{ height: '50vh' }}><div className="spinner" /></div></CustomerLayout>;
  if (!order) return <CustomerLayout><div className="empty-state"><h3>Pesanan tidak ditemukan</h3><Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '16px' }}>Kembali</Link></div></CustomerLayout>;

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div className="flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}>← Kembali</Link>
            <h1 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>{order.orderNumber}</h1>
          </div>
          <span className={`badge badge-${order.status}`} style={{ padding: '8px 16px', fontSize: '13px' }}>{STATUS_LABEL[order.status]}</span>
        </div>

        {/* Driver Info */}
        {order.driver && (
          <div className="card" style={{ marginBottom: '16px', padding: '20px', background: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚛</div>
              <div>
                <div style={{ fontWeight: '700' }}>{order.driver.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.driver.vehicle?.brand} {order.driver.vehicle?.model} · {order.driver.vehicle?.plateNumber}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📞 {order.driver.phone} · ⭐ {order.driver.rating?.average}</div>
              </div>
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Detail Pesanan</h3>
            {[
              { label: 'Jadwal', value: `${fmtDate(order.scheduledDate)} · ${order.scheduledTime}` },
              { label: 'Lokasi', value: `${order.pickupAddress.address}, ${order.pickupAddress.city}` },
              { label: 'Kontak', value: `${order.pickupAddress.contactName} · ${order.pickupAddress.contactPhone}` },
              { label: 'Pembayaran', value: `${order.payment.method.toUpperCase()} · ${order.payment.status === 'paid' ? '✅ Lunas' : '⏳ Belum Dibayar'}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', minWidth: '80px' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>{value}</span>
              </div>
            ))}

            <h4 style={{ fontWeight: '700', margin: '20px 0 12px' }}>Barang</h4>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(51,65,85,0.3)', fontSize: '14px' }}>
                <span>{item.name} ×{item.quantity}</span>
                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{fmtCurrency(item.estimatedPrice)}</span>
              </div>
            ))}

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700' }}>Total</span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)' }}>{fmtCurrency(order.pricing.total)}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <h3 style={{ fontWeight: '700', marginBottom: '20px' }}>Riwayat Status</h3>
            <div className="timeline">
              {[...order.statusHistory].reverse().map((h, i) => (
                <div key={i} className={`timeline-item ${i === 0 ? 'active' : 'done'}`}>
                  <div className="timeline-label">{STATUS_LABEL[h.status] || h.status}</div>
                  {h.note && <div className="timeline-note">{h.note}</div>}
                  <div className="timeline-time">{fmtDateTime(h.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rating */}
        {order.status === 'completed' && !order.rating?.score && !showRating && (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '14px' }}>Bagaimana pengalaman Anda?</p>
            <button onClick={() => setShowRating(true)} className="btn btn-primary">⭐ Beri Penilaian</button>
          </div>
        )}
        {order.rating?.score && (
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{'⭐'.repeat(order.rating.score)}</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.rating.comment}</p>
          </div>
        )}
        {showRating && (
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Beri Penilaian</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating({ ...rating, score: s })} style={{ fontSize: '32px', background: 'none', border: 'none', cursor: 'pointer', opacity: s <= rating.score ? 1 : 0.3, transition: 'all 0.2s' }}>⭐</button>
                ))}
              </div>
              <textarea className="form-input" placeholder="Ceritakan pengalaman Anda..." value={rating.comment} onChange={e => setRating({ ...rating, comment: e.target.value })} style={{ marginBottom: '16px' }} />
              <button onClick={handleRate} className="btn btn-primary" style={{ width: '100%' }} disabled={ratingLoading}>{ratingLoading ? 'Menyimpan...' : 'Kirim Penilaian'}</button>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
