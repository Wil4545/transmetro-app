import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Guardias() {
  const [guardias, setGuardias] = useState([])
  const [accesos, setAccesos] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [estacionFiltro, setEstacionFiltro] = useState('')
  const [form, setForm] = useState({ nombre_completo: '', dpi: '', telefono: '', acceso_id: '' })
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: g }, { data: a }, { data: e }] = await Promise.all([
      supabase.from('guardias').select('*, accesos(nombre, estacion_id, estaciones(nombre))').order('nombre_completo'),
      supabase.from('accesos').select('*, estaciones(nombre)').order('nombre'),
      supabase.from('estaciones').select('*').order('nombre')
    ])
    setGuardias(g ?? [])
    setAccesos(a ?? [])
    setEstaciones(e ?? [])
    setCargando(false)
  }

  async function guardar() {
    setError('')
    if (!form.nombre_completo.trim() || !form.dpi.trim() || !form.acceso_id) {
      setError('Nombre, DPI y acceso son obligatorios.')
      return
    }
    const payload = {
      nombre_completo: form.nombre_completo,
      dpi: form.dpi,
      telefono: form.telefono || null,
      acceso_id: form.acceso_id
    }
    if (editando) {
      await supabase.from('guardias').update(payload).eq('id', editando)
    } else {
      await supabase.from('guardias').insert(payload)
    }
    cancelar()
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este guardia?')) return
    await supabase.from('guardias').delete().eq('id', id)
    cargar()
  }

  function iniciarEdicion(g) {
    setEditando(g.id)
    setError('')
    setForm({
      nombre_completo: g.nombre_completo,
      dpi: g.dpi,
      telefono: g.telefono ?? '',
      acceso_id: g.acceso_id ?? ''
    })
  }

  function cancelar() {
    setEditando(null)
    setError('')
    setForm({ nombre_completo: '', dpi: '', telefono: '', acceso_id: '' })
  }

  // Accesos filtrados por estación seleccionada
  const accesosFiltrados = estacionFiltro
    ? accesos.filter(a => a.estacion_id === estacionFiltro)
    : accesos

  // Resumen de cobertura por acceso
  function guardiasPorAcceso(acceso_id) {
    return guardias.filter(g => g.acceso_id === acceso_id).length
  }

  const guardiasFiltrados = estacionFiltro
    ? guardias.filter(g => g.accesos?.estacion_id === estacionFiltro)
    : guardias

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Guardias de seguridad</h1>

      {/* Resumen de cobertura */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Cobertura por acceso</h2>
        <div style={{ marginBottom: 12 }}>
          <select
            style={{ ...styles.input, width: 'auto' }}
            value={estacionFiltro}
            onChange={e => setEstacionFiltro(e.target.value)}
          >
            <option value="">Todas las estaciones</option>
            {estaciones.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>
        {accesosFiltrados.length === 0 ? (
          <p style={styles.muted}>No hay accesos registrados.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Acceso</th>
                <th style={styles.th}>Estación</th>
                <th style={styles.th}>Guardias asignados</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {accesosFiltrados.map(a => {
                const cantidad = guardiasPorAcceso(a.id)
                return (
                  <tr key={a.id}>
                    <td style={styles.td}>{a.nombre}</td>
                    <td style={styles.td}>{a.estaciones?.nombre ?? '—'}</td>
                    <td style={styles.td}>{cantidad}</td>
                    <td style={styles.td}>
                      {cantidad >= 1
                        ? <span style={styles.badgeOk}>Cubierto</span>
                        : <span style={styles.badgeDanger}>Sin guardia</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulario */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>{editando ? 'Editar guardia' : 'Registrar guardia'}</h2>
        {error && <div style={styles.errorBox}>{error}</div>}
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre completo</label>
            <input
              style={styles.input}
              placeholder="Nombre completo"
              value={form.nombre_completo}
              onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>DPI</label>
            <input
              style={styles.input}
              placeholder="DPI"
              value={form.dpi}
              onChange={e => setForm({ ...form, dpi: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Teléfono</label>
            <input
              style={styles.input}
              placeholder="Teléfono"
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Acceso asignado</label>
            <select
              style={styles.input}
              value={form.acceso_id}
              onChange={e => setForm({ ...form, acceso_id: e.target.value })}
            >
              <option value="">Seleccionar acceso...</option>
              {accesos.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nombre} — {a.estaciones?.nombre ?? ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.formActions}>
          <button style={styles.btnPrimary} onClick={guardar}>
            {editando ? 'Actualizar' : 'Registrar'}
          </button>
          {editando && (
            <button style={styles.btnSecondary} onClick={cancelar}>Cancelar</button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div style={styles.card}>
        {cargando ? (
          <p style={styles.muted}>Cargando...</p>
        ) : guardiasFiltrados.length === 0 ? (
          <p style={styles.muted}>No hay guardias registrados.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>DPI</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Acceso</th>
                <th style={styles.th}>Estación</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {guardiasFiltrados.map(g => (
                <tr key={g.id}>
                  <td style={styles.td}>{g.nombre_completo}</td>
                  <td style={styles.td}>{g.dpi}</td>
                  <td style={styles.td}>{g.telefono ?? '—'}</td>
                  <td style={styles.td}>{g.accesos?.nombre ?? '—'}</td>
                  <td style={styles.td}>{g.accesos?.estaciones?.nombre ?? '—'}</td>
                  <td style={styles.td}>
                    <button style={styles.btnSmall} onClick={() => iniciarEdicion(g)}>Editar</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminar(g.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 24 },
  title: { fontSize: 20, fontWeight: 500, color: '#1a2e4a', marginBottom: 16 },
  subtitle: { fontSize: 14, fontWeight: 500, color: '#1a2e4a', marginBottom: 14 },
  card: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: 16, marginBottom: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#5a6a7e' },
  input: { padding: '8px 12px', borderRadius: 7, border: '1px solid #dde3ec', fontSize: 13, color: '#1a2e4a' },
  formActions: { display: 'flex', gap: 8, marginTop: 14 },
  btnPrimary: { padding: '8px 16px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSmall: { padding: '4px 10px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 4 },
  btnDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  errorBox: { background: '#fcebeb', color: '#a32d2d', border: '1px solid #f7c1c1', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
  badgeOk: { background: '#eaf3de', color: '#3b6d11', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeDanger: { background: '#fcebeb', color: '#a32d2d', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
}