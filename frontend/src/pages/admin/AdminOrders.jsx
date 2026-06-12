import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

const STATUS_LABEL = { pending: 'Menunggu', confirmed: 'Dikonfirmasi', assigned: 'Driver Ditugaskan', driver_heading: 'Driver Menuju', pickup_arrived: 'Driver Tiba', in_transit: 'Dalam Perjalanan', completed: 'Selesai', cancelled: 'Dibatalkan' };
const STATUS_FLOW = ['pending', 'confirmed', 'assigned', 'driver_heading', 'pickup_arrived', 'in_transit', 'completed'];
const fmtCurrency = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [showAssign, setShowAssign] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [weightInputs, setWeightInputs] = useState({}); // { itemIndex: kg }
  const [savingWeight, setSavingWeight] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (filter !== 'all') params.status = filter;
      const res = await adminAPI.getOrders(params);
      setOrders(res.data.data.orders);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Gagal memuat pesanan'); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { adminAPI.getAvailableDrivers().then(r => setDrivers(r.data.data.drivers)).catch(() => {}); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await adminAPI.updateOrderStatus(orderId, { status });
      toast.success('Status diperbarui!');
      loadOrders();
      if (selectedOrder?._id === orderId) {
        const res = await adminAPI.getOrders({ limit: 1 });
        // refresh selected
        setSelectedOrder(prev => ({ ...prev, status }));
      }
    } catch { toast.error('Gagal memperbarui status'); }
  };

  const assignDriver = async (orderId, driverId) => {
    try {
      await adminAPI.assignDriver(orderId, { driverId });
      toast.success('Driver berhasil ditugaskan!');
      setShowAssign(null);
      loadOrders();
    } catch { toast.error('Gagal menugaskan driver'); }
  };

  const handleWeightInputChange = (itemIndex, val) => {
    setWeightInputs((prev) => ({ ...prev, [itemIndex]: val }));
  };

  const saveActualWeights = async () => {
    if (!selectedOrder) return;
    setSavingWeight(true);
    try {
      const items = Object.entries(weightInputs).map(([idx, kg]) => ({
        itemIndex: parseInt(idx),
        actualWeightKg: parseFloat(kg),
      }));
      const res = await adminAPI.updateActualWeight(selectedOrder._id, { items });
      setSelectedOrder(res.data.data.order);
      toast.success('Berat aktual & harga berhasil diperbarui! ⚖️');
      loadOrders();
      setWeightInputs({});
    } catch { toast.error('Gagal menyimpan berat aktual'); } finally { setSavingWeight(false); }
  };

  // Init weight inputs saat order dipilih
  const selectOrder = (order) => {
    if (selectedOrder?._id === order._id) {
      setSelectedOrder(null);
      setWeightInputs({});
    } else {
      setSelectedOrder(order);
      const init = {};
      order.items?.forEach((item, idx) => { init[idx] = item.weightKg || 20; });
      setWeightInputs(init);
    }
  };

  const filtered = orders.filter(o =>
    search === '' || o.orderNumber?.toLowerCase().includes(search.toLowerCase()) || o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Manajemen Pesanan</h1>
        <p>Command center untuk semua pesanan masuk</p>
      </div>
      <div className="page-content">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="Cari nomor pesanan atau nama pelanggan..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'assigned', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
                {s === 'all' ? 'Semua' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 380px' : '1fr', gap: '20px' }}>
          {/* Table */}
          <div className="card">
            <div className="table-wrapper">
              {loading ? (
                <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>
              ) : filtered.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📭</div><h3>Tidak ada pesanan</h3></div>
              ) : (
                <table>
                  <thead><tr>
                    <th>No. Pesanan</th><th>Pelanggan</th><th>Barang</th>
                    <th>Jadwal</th><th>Total</th><th>Status</th><th>Aksi</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(order => (
                      <tr key={order._id} onClick={() => selectOrder(order)} style={{ cursor: 'pointer', background: selectedOrder?._id === order._id ? 'rgba(249,115,22,0.05)' : '' }}>
                        <td><span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary)' }}>{order.orderNumber}</span></td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{order.customer?.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.customer?.phone}</div>
                        </td>
                        <td style={{ fontSize: '13px' }}>{order.items?.map(i => i.name).join(', ')}</td>
                        <td style={{ fontSize: '13px' }}>{fmtDate(order.scheduledDate)}</td>
                        <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px' }}>{fmtCurrency(order.pricing?.total)}</td>
                        <td><span className={`badge badge-${order.status}`}>{STATUS_LABEL[order.status]}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {order.status === 'pending' && (
                              <button onClick={e => { e.stopPropagation(); updateStatus(order._id, 'confirmed'); }} className="btn btn-success btn-sm">Konfirmasi</button>
                            )}
                            {order.status === 'confirmed' && (
                              <button onClick={e => { e.stopPropagation(); setShowAssign(order._id); }} className="btn btn-primary btn-sm">Assign Driver</button>
                            )}
                            {['assigned', 'driver_heading', 'pickup_arrived', 'in_transit'].includes(order.status) && (
                              <button onClick={e => { e.stopPropagation(); const idx = STATUS_FLOW.indexOf(order.status); if (idx < STATUS_FLOW.length - 1) updateStatus(order._id, STATUS_FLOW[idx + 1]); }} className="btn btn-secondary btn-sm">Next →</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
              Total: {pagination.total} pesanan
            </div>
          </div>

          {/* Order Detail Panel */}
          {selectedOrder && (
            <div className="card" style={{ height: 'fit-content' }}>
              <div className="card-body">
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontWeight: '700', fontSize: '16px' }}>Detail Pesanan</h3>
                  <button onClick={() => setSelectedOrder(null)} className="modal-close">×</button>
                </div>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '12px' }}>{selectedOrder.orderNumber}</div>
                  {[
                    { l: 'Pelanggan', v: selectedOrder.customer?.name },
                    { l: 'Telepon', v: selectedOrder.customer?.phone },
                    { l: 'Jadwal', v: `${fmtDate(selectedOrder.scheduledDate)} · ${selectedOrder.scheduledTime}` },
                    { l: 'Lokasi', v: `${selectedOrder.pickupAddress?.address}, ${selectedOrder.pickupAddress?.city}` },
                    { l: 'Pembayaran', v: selectedOrder.payment?.method?.toUpperCase() },
                    { l: 'Driver', v: selectedOrder.driver?.name || '— Belum ditugaskan' },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: '70px' }}>{l}</span>
                      <span style={{ fontWeight: '500' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Barang & Berat:</div>
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} style={{ marginBottom: '10px', padding: '10px', background: 'var(--bg-800)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.name} ×{item.quantity}</span>
                          <span style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '700' }}>{fmtCurrency(item.estimatedPrice)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>Berat aktual (kg):</span>
                          <input
                            type="number" min="1" step="0.5"
                            value={weightInputs[i] ?? item.weightKg ?? 20}
                            onChange={(e) => handleWeightInputChange(i, e.target.value)}
                            style={{ width: '65px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-900)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '700', textAlign: 'right' }}
                          />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>kg</span>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={saveActualWeights}
                      disabled={savingWeight}
                      className="btn btn-primary"
                      style={{ width: '100%', marginBottom: '8px' }}
                    >
                      {savingWeight ? 'Menyimpan...' : '⚖️ Simpan Berat Aktual & Hitung Ulang Harga'}
                    </button>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>📦 Paket Standard (≤10 kg)</span><span>{fmtCurrency(selectedOrder.pricing?.basePrice)}</span>
                      </div>
                      {selectedOrder.pricing?.itemsTotal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>⚖️ Biaya kelebihan muatan</span><span>{fmtCurrency(selectedOrder.pricing?.itemsTotal)}</span>
                        </div>
                      )}
                      {selectedOrder.pricing?.platformFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>🏷️ Biaya layanan (20%)</span><span>{fmtCurrency(selectedOrder.pricing?.platformFee)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                        <span>Total Final</span>
                        <span style={{ color: 'var(--primary)', fontSize: '16px' }}>{fmtCurrency(selectedOrder.pricing?.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assign Driver Modal */}
        {showAssign && (
          <div className="modal-overlay" onClick={() => setShowAssign(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Pilih Driver</h3>
                <button className="modal-close" onClick={() => setShowAssign(null)}>×</button>
              </div>
              <div className="modal-body">
                {drivers.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">🚛</div><h3>Tidak ada driver tersedia</h3></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {drivers.map(d => (
                      <div key={d._id} style={{ padding: '14px', background: 'var(--bg-900)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700' }}>{d.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.vehicle?.brand} {d.vehicle?.model} · {d.vehicle?.plateNumber}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>⭐ {d.rating?.average} · {d.phone}</div>
                        </div>
                        <button onClick={() => assignDriver(showAssign, d._id)} className="btn btn-primary btn-sm">Pilih</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
