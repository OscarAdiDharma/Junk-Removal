import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="flex-center" style={{ height: '80vh' }}><div className="spinner" /></div></AdminLayout>;

  const s = data?.summary || {};
  const stats = [
    { icon: '💰', label: 'Revenue Bulan Ini', value: fmtCurrency(s.monthlyRevenue), change: `${s.revenueGrowth >= 0 ? '+' : ''}${s.revenueGrowth}%`, up: s.revenueGrowth >= 0, color: 'rgba(249,115,22,0.15)' },
    { icon: '📦', label: 'Total Pesanan', value: s.totalOrders, color: 'rgba(14,165,233,0.15)' },
    { icon: '⏳', label: 'Pesanan Aktif', value: s.pendingOrders, color: 'rgba(245,158,11,0.15)' },
    { icon: '✅', label: 'Selesai', value: s.completedOrders, color: 'rgba(34,197,94,0.15)' },
    { icon: '👥', label: 'Total Pelanggan', value: s.totalUsers, color: 'rgba(139,92,246,0.15)' },
    { icon: '🚛', label: 'Driver Aktif', value: s.totalDrivers, color: 'rgba(6,182,212,0.15)' },
  ];

  const catIcons = { sofa: '🛋️', kasur: '🛏️', lemari: '🚪', elektronik: '📺', meja: '🪑', kulkas: '🧊', mesin_cuci: '🫧', lainnya: '📦' };
  const statusColors = { pending: '#f59e0b', confirmed: '#0ea5e9', assigned: '#8b5cf6', driver_heading: '#f97316', completed: '#22c55e', cancelled: '#ef4444' };
  const totalStatusCount = (data?.ordersByStatus || []).reduce((s, o) => s + o.count, 0);

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Dasbor Operasional</h1>
        <p>Ringkasan performa AngkutCepat hari ini</p>
      </div>
      <div className="page-content">

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {stats.map((s) => (
            <div key={s.label} className="card stat-card">
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              {s.change && <div className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change} vs bulan lalu</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Revenue Trend */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontWeight: '700', marginBottom: '20px' }}>Tren Revenue (7 Hari)</h3>
              {data?.revenueTrend?.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📈</div><p>Belum ada data</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data?.revenueTrend || []).map((d) => {
                    const max = Math.max(...(data?.revenueTrend || []).map(t => t.revenue));
                    const pct = max ? (d.revenue / max) * 100 : 0;
                    return (
                      <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>{d._id}</span>
                        <div style={{ flex: 1, height: '8px', background: 'var(--bg-700)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--warning))', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '90px', flexShrink: 0, textAlign: 'right' }}>{fmtCurrency(d.revenue)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Orders by Status */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontWeight: '700', marginBottom: '20px' }}>Distribusi Status Pesanan</h3>
              {(data?.ordersByStatus || []).map((s) => {
                const pct = totalStatusCount ? (s.count / totalStatusCount) * 100 : 0;
                return (
                  <div key={s._id} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>{s._id}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{s.count}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-700)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: statusColors[s._id] || 'var(--primary)', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Categories */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-body">
              <h3 style={{ fontWeight: '700', marginBottom: '20px' }}>Kategori Barang Terpopuler</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                {(data?.topCategories || []).map((c, i) => (
                  <div key={c._id} style={{ padding: '16px', background: 'var(--bg-900)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{catIcons[c._id] || '📦'}</div>
                    <div style={{ fontWeight: '700', textTransform: 'capitalize' }}>{c._id}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.count} item · {fmtCurrency(c.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
