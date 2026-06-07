import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Accesos() {
  const [accesos, setAccesos] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [form, setForm] = useState({ nombre: '', estacion_id: '' })
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: a }, { data: e }] = await Promise.all([
      supabase.from('accesos').select('*, estaciones(nombre)').order('nombre'),
      supabase.from('estaciones').select('*').order('nombre')
    ])
    setAccesos(a ?? [])
    setEstaciones(e ?? [])
    setCargando(false)
  }

  async function guardar() {
    setError('')
    if (!form.nombre.trim() || !form.estacion_id) {
      setError('Nombre y estación son obligatorios.')
      return
    }
    const payload = { nombre: form.nombre, estacion_id: form.estacion_id }
    if (editando) {
      await supabase.from('accesos').update(payload).eq('id', editando)
    } else {
      await supabase.from('accesos').insert(payload)
    }
    cancelar()
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este acceso?')) return
    await supabase.from('accesos').delete().eq('id', id)
    cargar()
  }

  function iniciarEdicion(a) {
    setEditando(a.id)
    setError('')
    setForm({ nombre: a.nombre, estacion_id: a.estacion_id })
  }

  function cancelar() {
    setEditando(null)
    setError('')
    setForm({ nombre: '', estacion_id: '' })
  }

  // Accesos agrupados por estación
  const porEstacion = estaciones.map(e => ({
    ...e,
    accesos: accesos.filter(a => a.estacion_id === e.id)
  })).filter(e => e.accesos.length > 0)

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Accesos</h1>

      {/* Formulario */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>{editando ? 'Editar acceso' : 'Nuevo acceso'}</h2>
        {error && <div style={styles.errorBox}>{error}</div>}
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre del acceso</label>
            <input
              style={styles.input}
              placeholder="Ej: Acceso Norte, Entrada Principal..."
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Estación</label>
            <select
              style={styles.input}
              value={form.estacion_id}
              onChange={e => setForm({ ...form, estacion_id: e.target.value })}
            >
              <option value="">Seleccionar estación...</option>
              {estaciones.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.formActions}>
          <button style={styles.btnPrimary} onClick={guardar}>
            {editando ? 'Actualizar' : 'Agregar'}
          </button>
          {editando && (
            <button style={styles.btnSecondary} onClick={cancelar}>Cancelar</button>
          )}
        </div>
      </div>

      {/* Accesos agrupados por estación */}
      {porEstacion.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.subtitle}>Accesos por estación</h2>
          {porEstacion.map(e => (
            <div key={e.id} style={styles.estacionGroup}>
              <div style={styles.estacionHeader}>
                <span style={styles.estacionNombre}>{e.nombre}</span>
                <span style={styles.estacionCount}>{e.accesos.length} acceso{e.accesos.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={styles.accesosRow}>
                {e.accesos.map(a => (
                  <div key={a.id} style={styles.accesoBadgeBox}>
                    <span style={styles.accesoBadge}>{a.nombre}</span>
                    <button style={styles.btnTiny} onClick={() => iniciarEdicion(a)}>Editar</button>
                    <button style={{ ...styles.btnTiny, ...styles.btnTinyDanger }} onClick={() => eliminar(a.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla completa */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Todos los accesos</h2>
        {cargando ? (
          <p style={styles.muted}>Cargando...</p>
        ) : accesos.length === 0 ? (
          <p style={styles.muted}>No hay accesos registrados.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Estación</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map(a => (
                <tr key={a.id}>
                  <td style={styles.td}>{a.nombre}</td>
                  <td style={styles.td}>{a.estaciones?.nombre ?? '—'}</td>
                  <td style={styles.td}>
                    <button style={styles.btnSmall} onClick={() => iniciarEdicion(a)}>Editar</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminar(a.id)}>Eliminar</button>
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
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#5a6a7e' },
  input: { padding: '8px 12px', borderRadius: 7, border: '1px solid #dde3ec', fontSize: 13, color: '#1a2e4a' },
  formActions: { display: 'flex', gap: 8, marginTop: 14 },
  btnPrimary: { padding: '8px 16px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSmall: { padding: '4px 10px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 4 },
  btnDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  btnTiny: { padding: '2px 8px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 5, fontSize: 11, cursor: 'pointer', marginLeft: 4 },
  btnTinyDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  errorBox: { background: '#fcebeb', color: '#a32d2d', border: '1px solid #f7c1c1', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
  estacionGroup: { marginBottom: 14, borderBottom: '1px solid #f4f6f9', paddingBottom: 14 },
  estacionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  estacionNombre: { fontSize: 13, fontWeight: 500, color: '#1a2e4a' },
  estacionCount: { fontSize: 12, color: '#5a6a7e' },
  accesosRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  accesoBadgeBox: { display: 'flex', alignItems: 'center', background: '#f4f6f9', border: '1px solid #dde3ec', borderRadius: 7, padding: '4px 10px', gap: 4 },
  accesoBadge: { fontSize: 12, color: '#1a2e4a' },
}