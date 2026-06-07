import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await login(correo, password)
    if (error) {
      setError('Correo o contraseña incorrectos')
      setCargando(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>🚌</div>
          <div>
            <div style={styles.logoText}>Transmetro</div>
            <div style={styles.logoSub}>Sistema de gestión</div>
          </div>
        </div>
        <h2 style={styles.heading}>Bienvenido</h2>
        <p style={styles.sub}>Ingresa tus credenciales para continuar</p>
        <form onSubmit={handleLogin}>
          <div style={styles.group}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              style={styles.input}
              type="email"
              placeholder="usuario@transmetro.gt"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              required
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: '#1a2e4a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    borderRadius: 14,
    padding: '32px 28px',
    width: 340,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 38,
    height: 38,
    background: '#1a2e4a',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  logoText: { fontSize: 16, fontWeight: 500, color: '#1a2e4a' },
  logoSub: { fontSize: 11, color: '#5a6a7e' },
  heading: { fontSize: 20, fontWeight: 500, color: '#1a2e4a', marginBottom: 6 },
  sub: { fontSize: 13, color: '#5a6a7e', marginBottom: 24 },
  group: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 500, color: '#5a6a7e', display: 'block', marginBottom: 5 },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 7,
    border: '1px solid #dde3ec',
    fontSize: 13,
    color: '#1a2e4a',
    boxSizing: 'border-box',
  },
  error: { fontSize: 12, color: '#a32d2d', marginBottom: 10 },
  btn: {
    width: '100%',
    padding: 10,
    background: '#1a2e4a',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 4,
  },
}