import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/admin/login'); };

  const navItems = [
    { to: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { to: '/admin/orders', icon: '📦', label: 'Pesanan' },
    { to: '/admin/drivers', icon: '🚛', label: 'Driver & Armada' },
    { to: '/admin/users', icon: '👥', label: 'Pelanggan' },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">🚛 AngkutCepat</div>
          <div className="logo-sub">Admin Portal</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Menu Utama</div>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <div className="nav-section">Lainnya</div>
          <NavLink to="/" className="nav-link">
            <span className="nav-icon">🌐</span> Website
          </NavLink>
          <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--danger)' }}>
            <span className="nav-icon">🚪</span> Keluar
          </button>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
