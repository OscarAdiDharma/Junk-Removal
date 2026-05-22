import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Selamat datang, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <Link to="/" className="auth-logo">🚛 AngkutCepat</Link>
        <h1 className="auth-title">Selamat Datang!</h1>
        <p className="auth-sub">Masuk untuk mengelola pesanan Anda</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
            {loading ? 'Memproses...' : 'Masuk →'}
          </button>
        </form>
        <div className="auth-divider">atau</div>
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Belum punya akun? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Daftar sekarang</Link>
        </p>
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(249,115,22,0.05)', borderRadius: '8px', border: '1px solid rgba(249,115,22,0.2)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Demo akun:</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Customer: budi@gmail.com / password123</p>
        </div>
      </div>
    </div>
  );
}
