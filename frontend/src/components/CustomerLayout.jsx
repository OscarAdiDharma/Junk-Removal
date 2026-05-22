import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); toast.success('Berhasil keluar'); navigate('/'); };

  const links = [
    { to: '/dashboard', label: '📊 Dashboard' },
    { to: '/order/new', label: '➕ Pesan Baru' },
    { to: '/profile', label: '👤 Profil' },
  ];

  return (
    <div className="customer-layout">
      <nav className="customer-navbar">
        <Link to="/" style={{ textDecoration: 'none', fontSize: '18px', fontWeight: '800', background: 'linear-gradient(135deg, #f97316, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🚛 AngkutCepat
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} style={{ padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '500', color: location.pathname === l.to ? 'var(--primary)' : 'var(--text-secondary)', background: location.pathname === l.to ? 'rgba(249,115,22,0.1)' : 'transparent', transition: 'all 0.2s' }}>{l.label}</Link>
          ))}
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.name}</span>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">Keluar</button>
        </div>
      </nav>
      <main className="customer-content">{children}</main>
    </div>
  );
}
