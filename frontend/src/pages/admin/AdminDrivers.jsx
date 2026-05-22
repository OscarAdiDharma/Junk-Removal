import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

const VEHICLE_TYPES = { pickup: 'Pickup', truck_small: 'Truk Kecil', truck_medium: 'Truk Sedang', truck_large: 'Truk Besar' };

const initForm = { name: '', email: '', phone: '', password: '', licenseNumber: '', 'vehicle.plateNumber': '', 'vehicle.type': 'pickup', 'vehicle.brand': '', 'vehicle.model': '', 'vehicle.year': '', 'vehicle.capacity': '' };

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [form, setForm] = useState(initForm);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getDrivers().then(r => { setDrivers(r.data.data.drivers); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditDriver(null); setForm(initForm); setShowModal(true); };
  const openEdit = (d) => {
    setEditDriver(d);
    setForm({ name: d.name, email: d.email, phone: d.phone, password: '', licenseNumber: d.licenseNumber, 'vehicle.plateNumber': d.vehicle?.plateNumber || '', 'vehicle.type': d.vehicle?.type || 'pickup', 'vehicle.brand': d.vehicle?.brand || '', 'vehicle.model': d.vehicle?.model || '', 'vehicle.year': d.vehicle?.year || '', 'vehicle.capacity': d.vehicle?.capacity || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, email: form.email, phone: form.phone, licenseNumber: form.licenseNumber, vehicle: { plateNumber: form['vehicle.plateNumber'], type: form['vehicle.type'], brand: form['vehicle.brand'], model: form['vehicle.model'], year: Number(form['vehicle.year']), capacity: form['vehicle.capacity'] } };
    if (!editDriver) payload.password = form.password;
    try {
      if (editDriver) { await adminAPI.updateDriver(editDriver._id, payload); toast.success('Data driver diperbarui!'); }
      else { await adminAPI.createDriver({ ...payload, password: form.password || 'driver123' }); toast.success('Driver berhasil ditambahkan!'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan data'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Nonaktifkan driver ini?')) return;
    try { await adminAPI.deleteDriver(id); toast.success('Driver dinonaktifkan'); load(); } catch { toast.error('Gagal'); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  return (
    <AdminLayout>
      <div className="page-header">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div><h1>Driver & Armada</h1><p>Kelola data supir dan kendaraan</p></div>
          <button onClick={openCreate} className="btn btn-primary">+ Tambah Driver</button>
        </div>
      </div>
      <div className="page-content">
        {loading ? (
          <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {drivers.map(d => (
              <div key={d._id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--warning))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#fff' }}>
                        {d.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700' }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.phone}</div>
                      </div>
                    </div>
                    <span className={`badge badge-${d.status}`}>{d.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <div>🚛 {d.vehicle?.brand} {d.vehicle?.model} ({VEHICLE_TYPES[d.vehicle?.type]})</div>
                    <div>🔖 {d.vehicle?.plateNumber}</div>
                    <div>⭐ {d.rating?.average} · {d.totalTrips} trip</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(d)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Edit</button>
                    <button onClick={() => handleDelete(d._id)} className="btn btn-danger btn-sm">Nonaktifkan</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editDriver ? 'Edit Driver' : 'Tambah Driver Baru'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[{ k: 'name', l: 'Nama Lengkap', t: 'text' }, { k: 'email', l: 'Email', t: 'email' }, { k: 'phone', l: 'No. Telepon', t: 'tel' }, { k: 'licenseNumber', l: 'No. SIM', t: 'text' }].map(({ k, l, t }) => (
                    <div key={k} className="form-group">
                      <label className="form-label">{l}</label>
                      <input className="form-input" type={t} {...f(k)} required={k !== 'password'} />
                    </div>
                  ))}
                  {!editDriver && (
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input className="form-input" type="password" placeholder="Min. 6 karakter" {...f('password')} />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px' }}>Data Kendaraan</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[{ k: 'vehicle.plateNumber', l: 'Plat Nomor', t: 'text' }, { k: 'vehicle.brand', l: 'Merek', t: 'text' }, { k: 'vehicle.model', l: 'Model', t: 'text' }, { k: 'vehicle.year', l: 'Tahun', t: 'number' }, { k: 'vehicle.capacity', l: 'Kapasitas', t: 'text' }].map(({ k, l, t }) => (
                      <div key={k} className="form-group">
                        <label className="form-label">{l}</label>
                        <input className="form-input" type={t} {...f(k)} />
                      </div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">Tipe Kendaraan</label>
                      <select className="form-input" value={form['vehicle.type']} onChange={e => setForm({ ...form, 'vehicle.type': e.target.value })}>
                        {Object.entries(VEHICLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '0', marginTop: '20px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Batal</button>
                  <button type="submit" className="btn btn-primary">{editDriver ? 'Simpan Perubahan' : 'Tambah Driver'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
