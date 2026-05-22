import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const load = useCallback((params = {}) => {
    setLoading(true);
    adminAPI.getUsers({ ...params, limit: 20 }).then(r => {
      setUsers(r.data.data.users);
      setPagination(r.data.data.pagination);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    load({ search });
  };

  const toggleUser = async (id) => {
    try {
      const res = await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u._id === id ? res.data.data.user : u));
      toast.success(res.data.message);
    } catch { toast.error('Gagal mengubah status user'); }
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Manajemen Pelanggan</h1>
        <p>Kelola akun pengguna terdaftar</p>
      </div>
      <div className="page-content">
        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="Cari nama, email, atau telepon..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Cari</button>
          {search && <button type="button" onClick={() => { setSearch(''); load(); }} className="btn btn-secondary">Reset</button>}
        </form>

        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700' }}>Daftar Pelanggan</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total: {pagination.total}</span>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>
            ) : users.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">👥</div><h3>Tidak ada pelanggan ditemukan</h3></div>
            ) : (
              <table>
                <thead><tr>
                  <th>Pelanggan</th><th>Kontak</th><th>Alamat</th><th>Bergabung</th><th>Status</th><th>Aksi</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px' }}>{u.phone}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {u.addresses?.length > 0 ? `${u.addresses[0].city} (+${u.addresses.length - 1} lainnya)` : '—'}
                      </td>
                      <td style={{ fontSize: '13px' }}>{fmtDate(u.createdAt)}</td>
                      <td>
                        <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', background: u.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: u.isActive ? 'var(--success)' : 'var(--danger)', border: `1px solid ${u.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => toggleUser(u._id)} className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}>
                          {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button key={i} onClick={() => load({ search, page: i + 1 })} className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
