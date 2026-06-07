import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/lineas', label: 'Líneas', icon: '🛣️' },
  { path: '/estaciones', label: 'Estaciones', icon: '📍' },
  { path: '/buses', label: 'Buses', icon: '🚌' },
  { path: '/pilotos', label: 'Pilotos', icon: '👨‍✈️' },
  { path: '/guardias', label: 'Guardias', icon: '💂' },
  { path: '/operadores', label: 'Operadores', icon: '👥' },
  { path: '/alertas', label: 'Alertas', icon: '🔔' },
  { path: '/reportes', label: 'Reportes', icon: '📈' },
  { path: '/municipalidades', label: 'Municipalidades', icon: '🏛️' },
  { path: '/parqueos', label: 'Parqueos', icon: '🅿️' },
  { path: '/accesos', label: 'Accesos', icon: '🚪' },
]

export default function Layout() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div style={styles.shell}>
      <div style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🚌</div>
          <div>
            <div style={styles.logoText}>Transmetro</div>
            <div style={styles.logoSub}>Gestión de red</div>
          </div>
        </div>
        <nav style={styles.nav}>
          {navItems.map(item => (
            <button
              key={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {})
              }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={styles.sidebarBottom}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {perfil?.nombre_completo?.charAt(0) ?? 'U'}
            </div>
            <div>
              <div style={styles.userName}>{perfil?.nombre_completo ?? 'Usuario'}</div>
              <div style={styles.userRole}>{perfil?.roles?.nombre ?? ''}</div>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
      <div style={styles.main}>
        <Outlet />
      </div>
    </div>
  )
}

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    background: '#f4f6f9',
    fontFamily: 'system-ui, sans-serif',
  },
  sidebar: {
    width: 220,
    background: '#1a2e4a',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: '#39ff14',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
  logoText: { fontSize: 14, fontWeight: 500, color: '#fff' },
  logoSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 7,
    border: 'none',
    background: 'none',
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  navItemActive: {
    background: 'rgba(57,255,20,0.15)',
    color: '#fff',
  },
  sidebarBottom: {
    padding: '12px 8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    marginBottom: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(57,255,20,0.2)',
    color: '#39ff14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 500,
    flexShrink: 0,
  },
  userName: { fontSize: 12, fontWeight: 500, color: '#fff' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  logoutBtn: {
    width: '100%',
    padding: '8px 10px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: 7,
  },
}