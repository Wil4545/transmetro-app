import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Alertas() {
  const [alertas, setAlertas] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [buses, setBuses] = useState([])
  const [afluencia, setAfluencia] = useState([])
  const [formAfluencia, setFormAfluencia] = useState({ estacion_id: '', pasajeros_actuales: '' })
  const [formBaja, setFormBaja] = useState({ bus_id: '', pasajeros_actuales: '' })
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: a }, { data: e }, { data: b }, { data: af }] = await Promise.all([
      supabase.from('alertas').select('*, estaciones(nombre), buses(codigo)').order('created_at', { ascending: false }),
      supabase.from('estaciones').select('*').order('nombre'),
      supabase.from('buses').select('*, lineas(codigo)').order('codigo'),
      supabase.from('afluencia_estacion').select('*, estaciones(nombre, capacidad_maxima)').order('registrado_en', { ascending: false }).limit(20)
    ])
    setAlertas(a ?? [])
    setEstaciones(e ?? [])
    setBuses(b ?? [])
    setAfluencia(af ?? [])
    setCargando(false)
  }

  async function registrarAfluencia() {
    if (!formAfluencia.estacion_id || !formAfluencia.pasajeros_actuales) return
    const estacion = estaciones.find(e => e.id === formAfluencia.estacion_id)
    if (!estacion) return
    const pasajeros = parseInt(formAfluencia.pasajeros_actuales)

    // Registrar afluencia
    await supabase.from('afluencia_estacion').insert({
      estacion_id: formAfluencia.estacion_id,
      pasajeros_actuales: pasajeros
    })

    // RF-13: si supera el 50% de capacidad, generar alerta
    const porcentaje = (pasajeros / estacion.capacidad_maxima) * 100
    if (porcentaje > 50) {
      await supabase.from('alertas').insert({
        tipo: 'Sobrecapacidad',
        descripcion: `La estación ${estacion.nombre} tiene ${pasajeros} pasajeros (${Math.round(porcentaje)}% de su capacidad máxima de ${estacion.capacidad_maxima}). Se requiere bus adicional.`,
        estacion_id: formAfluencia.estacion_id,
        resuelta: false
      })
    }

    setFormAfluencia({ estacion_id: '', pasajeros_actuales: '' })
    cargar()
  }

  async function registrarBajaAfluencia() {
    if (!formBaja.bus_id || !formBaja.pasajeros_actuales) return
    const bus = buses.find(b => b.id === formBaja.bus_id)
    if (!bus) return
    const pasajeros = parseInt(formBaja.pasajeros_actuales)

    // RF-14: si no llena el 25% de capacidad generar alerta
    // Usamos 80 como capacidad estándar por bus
    const capacidadBus = 80
    const porcentaje = (pasajeros / capacidadBus) * 100
    if (porcentaje < 25) {
      await supabase.from('alertas').insert({
        tipo: 'Baja afluencia',
        descripcion: `El bus ${bus.codigo} tiene ${pasajeros} pasajeros (${Math.round(porcentaje)}% de capacidad). Debe esperar 5 minutos adicionales en cada estación.`,
        bus_id: formBaja.bus_id,
        resuelta: false
      })
    }

    setFormBaja({ bus_id: '', pasajeros_actuales: '' })
    cargar()
  }

  async function resolverAlerta(id) {
    await supabase.from('alertas').update({ resuelta: true }).eq('id', id)
    cargar()
  }

  async function eliminarAlerta(id) {
    if (!confirm('¿Eliminar esta alerta?')) return
    await supabase.from('alertas').delete().eq('id', id)
    cargar()
  }

  const alertasPendientes = alertas.filter(a => !a.resuelta)
  const alertasResueltas = alertas.filter(a => a.resuelta)

  function colorTipo(tipo) {
    if (tipo === 'Sobrecapacidad') return styles.badgeDanger
    if (tipo === 'Baja afluencia') return styles.badgeWarn
    return styles.badgeOk
  }

  function formatFecha(fecha) {
    return new Date(fecha).toLocaleString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Alertas operativas</h1>

      {/* Resumen */}
      <div style={styles.statGrid}>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #e24b4a' }}>
          <div style={styles.statLabel}>Alertas pendientes</div>
          <div style={{ ...styles.statValue, color: '#a32d2d' }}>{alertasPendientes.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #2dd10f' }}>
          <div style={styles.statLabel}>Resueltas hoy</div>
          <div style={styles.statValue}>{alertasResueltas.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #1a2e4a' }}>
          <div style={styles.statLabel}>Total registradas</div>
          <div style={styles.statValue}>{alertas.length}</div>
        </div>
      </div>

      {/* Registrar afluencia estación — RF-13 */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Registrar afluencia en estación</h2>
        <p style={styles.hint}>Si la afluencia supera el 50% de la capacidad máxima, se generará una alerta automáticamente.</p>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Estación</label>
            <select
              style={styles.input}
              value={formAfluencia.estacion_id}
              onChange={e => setFormAfluencia({ ...formAfluencia, estacion_id: e.target.value })}
            >
              <option value="">Seleccionar estación...</option>
              {estaciones.map(e => (
                <option key={e.id} value={e.id}>{e.nombre} (cap. {e.capacidad_maxima})</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Pasajeros actuales</label>
            <input
              style={styles.input}
              type="number"
              placeholder="Ej: 120"
              value={formAfluencia.pasajeros_actuales}
              onChange={e => setFormAfluencia({ ...formAfluencia, pasajeros_actuales: e.target.value })}
            />
          </div>
        </div>
        <div style={styles.formActions}>
          <button style={styles.btnPrimary} onClick={registrarAfluencia}>Registrar afluencia</button>
        </div>
      </div>

      {/* Registrar baja afluencia bus — RF-14 */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Registrar ocupación de bus</h2>
        <p style={styles.hint}>Si el bus no llena el 25% de su capacidad, se generará una alerta de baja afluencia automáticamente.</p>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Bus</label>
            <select
              style={styles.input}
              value={formBaja.bus_id}
              onChange={e => setFormBaja({ ...formBaja, bus_id: e.target.value })}
            >
              <option value="">Seleccionar bus...</option>
              {buses.map(b => (
                <option key={b.id} value={b.id}>{b.codigo} {b.lineas ? `— Línea ${b.lineas.codigo}` : '— Sin línea'}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Pasajeros actuales</label>
            <input
              style={styles.input}
              type="number"
              placeholder="Ej: 15"
              value={formBaja.pasajeros_actuales}
              onChange={e => setFormBaja({ ...formBaja, pasajeros_actuales: e.target.value })}
            />
          </div>
        </div>
        <div style={styles.formActions}>
          <button style={styles.btnPrimary} onClick={registrarBajaAfluencia}>Registrar ocupación</button>
        </div>
      </div>

      {/* Alertas pendientes */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Alertas pendientes</h2>
        {cargando ? (
          <p style={styles.muted}>Cargando...</p>
        ) : alertasPendientes.length === 0 ? (
          <p style={styles.muted}>No hay alertas pendientes. ✅</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Estación / Bus</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alertasPendientes.map(a => (
                <tr key={a.id}>
                  <td style={styles.td}><span style={colorTipo(a.tipo)}>{a.tipo}</span></td>
                  <td style={styles.td}><span style={styles.desc}>{a.descripcion}</span></td>
                  <td style={styles.td}>{a.estaciones?.nombre ?? a.buses?.codigo ?? '—'}</td>
                  <td style={styles.td}>{formatFecha(a.created_at)}</td>
                  <td style={styles.td}>
                    <button style={{ ...styles.btnSmall, ...styles.btnOk }} onClick={() => resolverAlerta(a.id)}>Resolver</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminarAlerta(a.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Alertas resueltas */}
      {alertasResueltas.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.subtitle}>Alertas resueltas</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Estación / Bus</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {alertasResueltas.map(a => (
                <tr key={a.id} style={{ opacity: 0.6 }}>
                  <td style={styles.td}><span style={styles.badgeOk}>Resuelta</span></td>
                  <td style={styles.td}><span style={styles.desc}>{a.descripcion}</span></td>
                  <td style={styles.td}>{a.estaciones?.nombre ?? a.buses?.codigo ?? '—'}</td>
                  <td style={styles.td}>{formatFecha(a.created_at)}</td>
                  <td style={styles.td}>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminarAlerta(a.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Historial de afluencia */}
      {afluencia.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.subtitle}>Últimos registros de afluencia</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Estación</th>
                <th style={styles.th}>Pasajeros</th>
                <th style={styles.th}>Capacidad máx.</th>
                <th style={styles.th}>Ocupación</th>
                <th style={styles.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {afluencia.map(af => {
                const pct = Math.round((af.pasajeros_actuales / af.estaciones?.capacidad_maxima) * 100)
                return (
                  <tr key={af.id}>
                    <td style={styles.td}>{af.estaciones?.nombre ?? '—'}</td>
                    <td style={styles.td}>{af.pasajeros_actuales}</td>
                    <td style={styles.td}>{af.estaciones?.capacidad_maxima}</td>
                    <td style={styles.td}>
                      <span style={pct > 50 ? styles.badgeDanger : pct > 30 ? styles.badgeWarn : styles.badgeOk}>
                        {pct}%
                      </span>
                    </td>
                    <td style={styles.td}>{formatFecha(af.registrado_en)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: 24 },
  title: { fontSize: 20, fontWeight: 500, color: '#1a2e4a', marginBottom: 16 },
  subtitle: { fontSize: 14, fontWeight: 500, color: '#1a2e4a', marginBottom: 10 },
  card: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: 16, marginBottom: 16 },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '14px 16px' },
  statLabel: { fontSize: 12, color: '#5a6a7e', marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 500, color: '#1a2e4a' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#5a6a7e' },
  input: { padding: '8px 12px', borderRadius: 7, border: '1px solid #dde3ec', fontSize: 13, color: '#1a2e4a' },
  formActions: { display: 'flex', gap: 8, marginTop: 14 },
  btnPrimary: { padding: '8px 16px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSmall: { padding: '4px 10px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 4 },
  btnDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  btnOk: { background: '#eaf3de', color: '#3b6d11', borderColor: '#c0dd97' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
  hint: { fontSize: 12, color: '#5a6a7e', marginBottom: 12 },
  desc: { fontSize: 12, color: '#5a6a7e' },
  badgeOk: { background: '#eaf3de', color: '#3b6d11', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeWarn: { background: '#faeeda', color: '#854f0b', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeDanger: { background: '#fcebeb', color: '#a32d2d', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
}