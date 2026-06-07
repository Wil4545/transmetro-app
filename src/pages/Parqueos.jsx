import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Parqueos() {
  const [parqueos, setParqueos] = useState([])
  const [municipalidades, setMunicipalidades] = useState([])
  const [form, setForm] = useState({ nombre: '', direccion: '', municipalidad_id: '' })
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from('parqueos').select('*, municipalidades(nombre)').order('nombre'),
      supabase.from('municipalidades').select('*').order('nombre')
    ])
    setParqueos(p ?? [])
    setMunicipalidades(m ?? [])
    setCargando(false)
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.municipalidad_id) return
    if (editando) {
      await supabase.from('parqueos').update(form).eq('id', editando)
    } else {
      await supabase.from('parqueos').insert(form)
    }
    setForm({ nombre: '', direccion: '', municipalidad_id: '' })
    setEditando(null)
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este parqueo?')) return
    await supabase.from('parqueos').delete().eq('id', id)
    cargar()
  }

  function iniciarEdicion(p) {
    setEditando(p.id)
    setForm({ nombre: p.nombre, direccion: p.direccion ?? '', municipalidad_id: p.municipalidad_id })
  }

  function cancelar() {
    setEditando(null)
    setForm({ nombre: '', direccion: '', municipalidad_id: '' })
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Parqueos</h1>
      <div style={styles.card}>
        <h2 style={styles.subtitle}>{editando ? 'Editar parqueo' : 'Nuevo parqueo'}</h2>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre</label>
            <input
              style={styles.input}
              placeholder="Ej: Parqueo Central A"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Municipalidad</label>
            <select
              style={styles.input}
              value={form.municipalidad_id}
              onChange={e => setForm({ ...form, municipalidad_id: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {municipalidades.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Dirección</label>
            <input
              style={styles.input}
              placeholder="Dirección del parqueo"
              value={form.direccion}
              onChange={e => setForm({ ...form, direccion: e.target.value })}
            />
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
      <div style={styles.card}>
        {cargando ? (
          <p style={styles.muted}>Cargando...</p>
        ) : parqueos.length === 0 ? (
          <p style={styles.muted}>No hay parqueos registrados.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Dirección</th>
                <th style={styles.th}>Municipalidad</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {parqueos.map(p => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.nombre}</td>
                  <td style={styles.td}>{p.direccion ?? '—'}</td>
                  <td style={styles.td}>{p.municipalidades?.nombre ?? '—'}</td>
                  <td style={styles.td}>
                    <button style={styles.btnSmall} onClick={() => iniciarEdicion(p)}>Editar</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminar(p.id)}>Eliminar</button>
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
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#5a6a7e' },
  input: { padding: '8px 12px', borderRadius: 7, border: '1px solid #dde3ec', fontSize: 13, color: '#1a2e4a' },
  formActions: { display: 'flex', gap: 8, marginTop: 14 },
  btnPrimary: { padding: '8px 16px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSmall: { padding: '4px 10px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 4 },
  btnDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
}