import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Municipalidades() {
  const [municipalidades, setMunicipalidades] = useState([])
  const [nombre, setNombre] = useState('')
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from('municipalidades').select('*').order('nombre')
    setMunicipalidades(data ?? [])
    setCargando(false)
  }

  async function guardar() {
    if (!nombre.trim()) return
    if (editando) {
      await supabase.from('municipalidades').update({ nombre }).eq('id', editando)
    } else {
      await supabase.from('municipalidades').insert({ nombre })
    }
    setNombre('')
    setEditando(null)
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta municipalidad?')) return
    await supabase.from('municipalidades').delete().eq('id', id)
    cargar()
  }

  function iniciarEdicion(m) {
    setEditando(m.id)
    setNombre(m.nombre)
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Municipalidades</h1>
      <div style={styles.card}>
        <div style={styles.formRow}>
          <input
            style={styles.input}
            placeholder="Nombre de la municipalidad"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
          />
          <button style={styles.btnPrimary} onClick={guardar}>
            {editando ? 'Actualizar' : 'Agregar'}
          </button>
          {editando && (
            <button style={styles.btnSecondary} onClick={() => { setEditando(null); setNombre('') }}>
              Cancelar
            </button>
          )}
        </div>
      </div>
      <div style={styles.card}>
        {cargando ? (
          <p style={styles.muted}>Cargando...</p>
        ) : municipalidades.length === 0 ? (
          <p style={styles.muted}>No hay municipalidades registradas.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {municipalidades.map(m => (
                <tr key={m.id}>
                  <td style={styles.td}>{m.nombre}</td>
                  <td style={styles.td}>
                    <button style={styles.btnSmall} onClick={() => iniciarEdicion(m)}>Editar</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminar(m.id)}>Eliminar</button>
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
  card: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: 16, marginBottom: 16 },
  formRow: { display: 'flex', gap: 8, alignItems: 'center' },
  input: { flex: 1, padding: '8px 12px', borderRadius: 7, border: '1px solid #dde3ec', fontSize: 13, color: '#1a2e4a' },
  btnPrimary: { padding: '8px 16px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSmall: { padding: '4px 10px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 4 },
  btnDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
}