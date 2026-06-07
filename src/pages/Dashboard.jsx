import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { perfil } = useAuth()
  const [stats, setStats] = useState({ lineas: 0, estaciones: 0, buses: 0, alertas: 0 })
  const [alertasRecientes, setAlertasRecientes] = useState([])
  const [afluencia, setAfluencia] = useState([])
  const [lineas, setLineas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: l }, { data: e }, { data: b }, { data: a }, { data: af }] = await Promise.all([
      supabase.from('lineas').select('*, linea_estacion(id), buses(id)').order('codigo'),
      supabase.from('estaciones').select('id'),
      supabase.from('buses').select('id'),
      supabase.from('alertas').select('*, estaciones(nombre), buses(codigo)').eq('resuelta', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('afluencia_estacion').select('*, estaciones(nombre, capacidad_maxima)').order('registrado_en', { ascending: false }).limit(5)
    ])
    setStats({
      lineas: l?.length ?? 0,
      estaciones: e?.length ?? 0,
      buses: b?.length ?? 0,
      alertas: a?.length ?? 0
    })
    setAlertasRecientes(a ?? [])
    setAfluencia(af ?? [])
    setLineas(l ?? [])
    setCargando(false)
  }

  function formatFecha(fecha) {
    return new Date(fecha).toLocaleString('es-GT', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function estadoFlota(l) {
    const est = l.linea_estacion?.length ?? 0
    const asig = l.buses?.length ?? 0
    if (asig < est) return { label: 'Bajo mínimo', style: styles.badgeWarn }
    if (asig >= est * 2) return { label: 'Máximo', style: styles.badgeDanger }
    return { label: 'Normal', style: styles.badgeOk }
  }

  if (cargando) return <div style={{ padding: 24, color: '#1a2e4a' }}>Cargando...</div>

  return (
    <div style={styles.page}>
      <div style={styles.welcomeRow}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.welcome}>Bienvenido, {perfil?.nombre_completo ?? 'Usuario'} — {perfil?.roles?.nombre}</p>
        </div>
        <div style={styles.fecha}>{new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* Métricas */}
      <div style={styles.statGrid}>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #2dd10f' }}>
          <div style={styles.statLabel}>🛣️ Líneas activas</div>
          <div style={styles.statValue}>{stats.lineas}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>📍 Estaciones</div>
          <div style={styles.statValue}>{stats.estaciones}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>🚌 Buses registrados</div>
          <div style={styles.statValue}>{stats.buses}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: stats.alertas > 0 ? '3px solid #e24b4a' : '3px solid #2dd10f' }}>
          <div style={styles.statLabel}>🔔 Alertas pendientes</div>
          <div style={{ ...styles.statValue, color: stats.alertas > 0 ? '#a32d2d' : '#3b6d11' }}>{stats.alertas}</div>
        </div>
      </div>

      <div style={styles.twoCol}>
        {/* Estado de líneas */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Estado de líneas</h2>
          {lineas.length === 0 ? (
            <p style={styles.muted}>No hay líneas registradas.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Línea</th>
                  <th style={styles.th}>Estaciones</th>
                  <th style={styles.th}>Buses</th>
                  <th style={styles.th}>Flota</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map(l => {
                  const estado = estadoFlota(l)
                  return (
                    <tr key={l.id}>
                      <td style={styles.td}><span style={styles.badge}>{l.codigo}</span> {l.nombre}</td>
                      <td style={styles.td}>{l.linea_estacion?.length ?? 0}</td>
                      <td style={styles.td}>{l.buses?.length ?? 0}</td>
                      <td style={styles.td}><span style={estado.style}>{estado.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Alertas recientes */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Alertas recientes</h2>
          {alertasRecientes.length === 0 ? (
            <p style={styles.muted}>No hay alertas pendientes. ✅</p>
          ) : (
            alertasRecientes.map(a => (
              <div key={a.id} style={styles.alertRow}>
                <div style={a.tipo === 'Sobrecapacidad' ? styles.alertIconRed : styles.alertIconAmber}>
                  {a.tipo === 'Sobrecapacidad' ? '⚠️' : '📉'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.alertTitle}>{a.tipo}</div>
                  <div style={styles.alertDesc}>{a.estaciones?.nombre ?? a.buses?.codigo ?? '—'}</div>
                </div>
                <div style={styles.alertTime}>{formatFecha(a.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Últimos registros de afluencia */}
      {afluencia.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Últimos registros de afluencia</h2>
          {afluencia.map(af => {
            const pct = Math.round((af.pasajeros_actuales / af.estaciones?.capacidad_maxima) * 100)
            return (
              <div key={af.id} style={styles.afluenciaRow}>
                <span style={styles.afluenciaNombre}>{af.estaciones?.nombre}</span>
                <div style={styles.barWrap}>
                  <div style={{
                    ...styles.barFill,
                    width: `${Math.min(pct, 100)}%`,
                    background: pct > 50 ? '#e24b4a' : pct > 30 ? '#ef9f27' : '#2dd10f'
                  }} />
                </div>
                <span style={styles.afluenciaPct}>{pct}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: 24 },
  welcomeRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 500, color: '#1a2e4a', marginBottom: 4 },
  welcome: { fontSize: 13, color: '#5a6a7e' },
  fecha: { fontSize: 12, color: '#5a6a7e', textAlign: 'right' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '14px 16px' },
  statLabel: { fontSize: 12, color: '#5a6a7e', marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 500, color: '#1a2e4a' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  card: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 500, color: '#1a2e4a', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f4f6f9' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
  badge: { background: '#e8eef6', color: '#1a2e4a', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500 },
  badgeOk: { background: '#eaf3de', color: '#3b6d11', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeWarn: { background: '#faeeda', color: '#854f0b', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeDanger: { background: '#fcebeb', color: '#a32d2d', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  alertRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f4f6f9' },
  alertIconRed: { width: 32, height: 32, background: '#fcebeb', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  alertIconAmber: { width: 32, height: 32, background: '#faeeda', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  alertTitle: { fontSize: 13, fontWeight: 500, color: '#1a2e4a' },
  alertDesc: { fontSize: 12, color: '#5a6a7e' },
  alertTime: { fontSize: 11, color: '#5a6a7e', flexShrink: 0 },
  afluenciaRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f4f6f9' },
  afluenciaNombre: { fontSize: 12, color: '#1a2e4a', width: 140, flexShrink: 0 },
  barWrap: { flex: 1, height: 8, borderRadius: 4, background: '#f4f6f9', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s' },
  afluenciaPct: { fontSize: 11, color: '#5a6a7e', width: 36, textAlign: 'right', flexShrink: 0 },
}