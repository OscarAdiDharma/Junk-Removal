import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form, true);
      toast.success('Login admin berhasil!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(249,115,22,0.08) 0%, transparent 60%)' }}>
      <div className="card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔐</div>
          <div className="auth-logo" style={{ display: 'block', textAlign: 'center' }}>Admin Portal</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>AngkutCepat Back-Office</div>
        </div>
        <h1 className="auth-title" style={{ textAlign: 'center' }}>Masuk Admin</h1>
        <p className="auth-sub" style={{ textAlign: 'center' }}>Akses dasbor operasional</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Admin</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@angkutcepat.id" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
            {loading ? 'Memproses...' : '🔓 Masuk'}
          </button>
        </form>
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(249,115,22,0.05)', borderRadius: '8px', border: '1px solid rgba(249,115,22,0.2)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Demo admin:</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>admin@angkutcepat.id / admin123</p>
        </div>
      </div>
    </div>
  );
}
