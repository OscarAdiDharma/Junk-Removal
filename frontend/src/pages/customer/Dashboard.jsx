import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomerLayout from '../../components/CustomerLayout';

const STATUS_LABEL = { pending: 'Menunggu', confirmed: 'Dikonfirmasi', assigned: 'Driver Ditugaskan', driver_heading: 'Driver Menuju', pickup_arrived: 'Driver Tiba', in_transit: 'Dalam Perjalanan', completed: 'Selesai', cancelled: 'Dibatalkan' };
const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    orderAPI.getMyOrders({ limit: 20 }).then(r => { setOrders(r.data.data.orders); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const completed = orders.filter(o => o.status === 'completed');
  const totalSpent = completed.reduce((s, o) => s + o.pricing.total, 0);

  return (
    <CustomerLayout>
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Halo, {user?.name?.split(' ')[0]}! 👋</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Kelola semua pesanan angkut barang Anda di sini</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { icon: '📦', label: 'Total Pesanan', value: orders.length, color: '#f97316' },
          { icon: '⏳', label: 'Pesanan Aktif', value: active.length, color: '#0ea5e9' },
          { icon: '✅', label: 'Selesai', value: completed.length, color: '#22c55e' },
          { icon: '💰', label: 'Total Belanja', value: fmtCurrency(totalSpent), color: '#8b5cf6' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Orders */}
      <div className="card">
        <div className="card-body">
          <div className="flex-between" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Riwayat Pesanan</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'pending', 'assigned', 'completed'].map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
                  {s === 'all' ? 'Semua' : STATUS_LABEL[s]}
                </button>
              ))}
              <Link to="/order/new" className="btn btn-primary btn-sm">+ Pesan Baru</Link>
            </div>
          </div>

          {loading ? (
            <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Belum ada pesanan</h3>
              <p>Buat pesanan pertama Anda sekarang!</p>
              <Link to="/order/new" className="btn btn-primary" style={{ marginTop: '16px' }}>Pesan Sekarang</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((order) => (
                <Link key={order._id} to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--bg-900)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'var(--transition)', flexWrap: 'wrap', gap: '12px' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{order.orderNumber}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {order.items.map(i => i.name).join(', ')} · {fmtDate(order.scheduledDate)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{fmtCurrency(order.pricing.total)}</span>
                      <span className={`badge badge-${order.status}`}>{STATUS_LABEL[order.status]}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
