import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import CustomerLayout from '../../components/CustomerLayout';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [addrForm, setAddrForm] = useState({ label: '', address: '', city: '', postalCode: '', isDefault: false });
  const [loading, setLoading] = useState(false);
  const [showAddAddr, setShowAddAddr] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.data.user);
      toast.success('Profil diperbarui!');
    } catch (err) { toast.error('Gagal memperbarui profil'); } finally { setLoading(false); }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.addAddress(addrForm);
      updateUser({ ...user, addresses: res.data.data.addresses });
      toast.success('Alamat ditambahkan!');
      setShowAddAddr(false);
      setAddrForm({ label: '', address: '', city: '', postalCode: '', isDefault: false });
    } catch (err) { toast.error('Gagal menambahkan alamat'); }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const res = await authAPI.deleteAddress(id);
      updateUser({ ...user, addresses: res.data.data.addresses });
      toast.success('Alamat dihapus!');
    } catch { toast.error('Gagal menghapus alamat'); }
  };

  return (
    <CustomerLayout>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Profil Saya</h1>

        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--warning))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '18px' }}>{user?.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.email}</div>
                <span className="badge badge-confirmed" style={{ marginTop: '4px' }}>Customer</span>
              </div>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">No. Telepon</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </form>
          </div>
        </div>

        {/* Addresses */}
        <div className="card">
          <div className="card-body">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontWeight: '700' }}>Alamat Tersimpan</h3>
              <button onClick={() => setShowAddAddr(!showAddAddr)} className="btn btn-secondary btn-sm">+ Tambah Alamat</button>
            </div>

            {showAddAddr && (
              <form onSubmit={handleAddAddress} style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-900)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[{ k: 'label', l: 'Label (Rumah/Kantor)', p: 'Rumah' }, { k: 'city', l: 'Kota', p: 'Jakarta Selatan' }].map(({ k, l, p }) => (
                    <div key={k} className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label">{l}</label>
                      <input className="form-input" placeholder={p} value={addrForm[k]} onChange={e => setAddrForm({ ...addrForm, [k]: e.target.value })} required />
                    </div>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Alamat Lengkap</label>
                  <input className="form-input" placeholder="Jl. nama jalan, No. xx" value={addrForm.address} onChange={e => setAddrForm({ ...addrForm, address: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary btn-sm">Simpan</button>
                  <button type="button" onClick={() => setShowAddAddr(false)} className="btn btn-secondary btn-sm">Batal</button>
                </div>
              </form>
            )}

            {user?.addresses?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Belum ada alamat tersimpan</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {user?.addresses?.map((addr) => (
                  <div key={addr._id} style={{ padding: '14px', background: 'var(--bg-900)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{addr.label} {addr.isDefault && <span className="badge badge-completed" style={{ marginLeft: '6px', fontSize: '10px' }}>Default</span>}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{addr.address}, {addr.city}</div>
                    </div>
                    <button onClick={() => handleDeleteAddress(addr._id)} className="btn btn-danger btn-sm">Hapus</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
