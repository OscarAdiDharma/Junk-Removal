import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Akun berhasil dibuat!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal');
    } finally { setLoading(false); }
  };

  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <Link to="/" className="auth-logo">🚛 AngkutCepat</Link>
        <h1 className="auth-title">Buat Akun Baru</h1>
        <p className="auth-sub">Bergabung dan nikmati kemudahan angkut barang</p>
        <form onSubmit={handleSubmit}>
          {[
            { key: 'name', label: 'Nama Lengkap', type: 'text', placeholder: 'John Doe' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
            { key: 'phone', label: 'No. Telepon', type: 'tel', placeholder: '08xxxxxxxxxx' },
            { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 karakter' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input className="form-input" type={type} placeholder={placeholder} {...f(key)} required />
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading} type="submit">
            {loading ? 'Membuat Akun...' : 'Daftar Sekarang →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '20px' }}>
          Sudah punya akun? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Masuk</Link>
        </p>
      </div>
    </div>
  );
}
