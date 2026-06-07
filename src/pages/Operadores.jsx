import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Operadores() {
  const [operadores, setOperadores] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState({ nombre_completo: '', correo: '', rol_id: '', estacion_id: '' })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: o }, { data: e }, { data: r }] = await Promise.all([
      supabase.from('usuarios').select('*, roles(nombre), estaciones(nombre)').order('nombre_completo'),
      supabase.from('estaciones').select('*').order('nombre'),
      supabase.from('roles').select('*').order('nombre')
    ])
    setOperadores(o ?? [])
    setEstaciones(e ?? [])
    setRoles(r ?? [])
    setCargando(false)
  }

  async function guardar() {
    setError('')
    setExito('')
    if (!form.nombre_completo.trim() || !form.correo.trim() || !form.rol_id) {
      setError('Nombre, correo y rol son obligatorios.')
      return
    }
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('correo', form.correo)
      .single()
    if (existente) {
      setError('Ya existe un operador con ese correo.')
      return
    }
    await supabase.from('usuarios').insert({
      nombre_completo: form.nombre_completo,
      correo: form.correo,
      rol_id: form.rol_id,
      estacion_id: form.estacion_id || null
    })
    setExito(`Operador ${form.correo} registrado exitosamente. Crea su acceso en Supabase → Authentication → Users con el mismo correo.`)
    setForm({ nombre_completo: '', correo: '', rol_id: '', estacion_id: '' })
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este operador?')) return
    await supabase.from('usuarios').delete().eq('id', id)
    cargar()
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Operadores</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Nuevo operador</h2>
        {error && <div style={styles.errorBox}>{error}</div>}
        {exito && <div style={styles.exitoBox}>{exito}</div>}
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
            <label style={styles.label}>Correo electrónico</label>
            <input
              style={styles.input}
              type="email"
              placeholder="correo@transmetro.gt"
              value={form.correo}
              onChange={e => setForm({ ...form, correo: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Rol</label>
            <select
              style={styles.input}
              value={form.rol_id}
              onChange={e => setForm({ ...form, rol_id: e.target.value })}
            >
              <option value="">Seleccionar rol...</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Estación asignada (opcional)</label>
            <select
              style={styles.input}
              value={form.estacion_id}
              onChange={e => setForm({ ...form, estacion_id: e.target.value })}
            >
              <option value="">Sin estación asignada</option>
              {estaciones.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.formActions}>
          <button style={styles.btnPrimary} onClick={guardar}>Crear operador</button>
        </div>
        <p style={styles.hint}>* Después de registrar el operador, créale su acceso en Supabase → Authentication → Users con el mismo correo.</p>
      </div>

      <div style={styles.card}>
        {cargando ? (
          <p style={styles.muted}>Cargando...</p>
        ) : operadores.length === 0 ? (
          <p style={styles.muted}>No hay operadores registrados.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Estación</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {operadores.map(o => (
                <tr key={o.id}>
                  <td style={styles.td}>{o.nombre_completo}</td>
                  <td style={styles.td}>{o.correo}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{o.roles?.nombre ?? '—'}</span>
                  </td>
                  <td style={styles.td}>{o.estaciones?.nombre ?? '—'}</td>
                  <td style={styles.td}>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminar(o.id)}>Eliminar</button>
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
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#5a6a7e' },
  input: { padding: '8px 12px', borderRadius: 7, border: '1px solid #dde3ec', fontSize: 13, color: '#1a2e4a' },
  formActions: { display: 'flex', gap: 8, marginTop: 14 },
  btnPrimary: { padding: '8px 16px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSmall: { padding: '4px 10px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 4 },
  btnDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  errorBox: { background: '#fcebeb', color: '#a32d2d', border: '1px solid #f7c1c1', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginBottom: 14 },
  exitoBox: { background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
  hint: { fontSize: 11, color: '#5a6a7e', marginTop: 10 },
  badge: { background: '#e8eef6', color: '#1a2e4a', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500 },
}