import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Estaciones() {
  const [estaciones, setEstaciones] = useState([])
  const [municipalidades, setMunicipalidades] = useState([])
  const [lineas, setLineas] = useState([])
  const [form, setForm] = useState({ nombre: '', capacidad_maxima: '', tiene_parqueo: false, municipalidad_id: '' })
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [viendoLineas, setViendoLineas] = useState(null)
  const [lineasEstacion, setLineasEstacion] = useState([])
  const [formAsoc, setFormAsoc] = useState({ linea_id: '', orden: '', distancia_siguiente_km: '' })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: e }, { data: m }, { data: l }] = await Promise.all([
      supabase.from('estaciones').select('*, municipalidades(nombre)').order('nombre'),
      supabase.from('municipalidades').select('*').order('nombre'),
      supabase.from('lineas').select('*').order('codigo')
    ])
    setEstaciones(e ?? [])
    setMunicipalidades(m ?? [])
    setLineas(l ?? [])
    setCargando(false)
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.capacidad_maxima || !form.municipalidad_id) return
    const payload = {
      nombre: form.nombre,
      capacidad_maxima: parseInt(form.capacidad_maxima),
      tiene_parqueo: form.tiene_parqueo,
      municipalidad_id: form.municipalidad_id
    }
    if (editando) {
      await supabase.from('estaciones').update(payload).eq('id', editando)
    } else {
      await supabase.from('estaciones').insert(payload)
    }
    cancelar()
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta estación?')) return
    await supabase.from('estaciones').delete().eq('id', id)
    cargar()
  }

  function iniciarEdicion(e) {
    setEditando(e.id)
    setForm({
      nombre: e.nombre,
      capacidad_maxima: e.capacidad_maxima,
      tiene_parqueo: e.tiene_parqueo,
      municipalidad_id: e.municipalidad_id
    })
  }

  function cancelar() {
    setEditando(null)
    setForm({ nombre: '', capacidad_maxima: '', tiene_parqueo: false, municipalidad_id: '' })
  }

  async function verLineas(estacion) {
    setViendoLineas(estacion)
    const { data } = await supabase
      .from('linea_estacion')
      .select('*, lineas(codigo, nombre)')
      .eq('estacion_id', estacion.id)
      .order('orden')
    setLineasEstacion(data ?? [])
  }

  async function agregarAsociacion() {
    if (!formAsoc.linea_id || !formAsoc.orden) return
    await supabase.from('linea_estacion').insert({
      linea_id: formAsoc.linea_id,
      estacion_id: viendoLineas.id,
      orden: parseInt(formAsoc.orden),
      distancia_siguiente_km: formAsoc.distancia_siguiente_km ? parseFloat(formAsoc.distancia_siguiente_km) : null
    })
    setFormAsoc({ linea_id: '', orden: '', distancia_siguiente_km: '' })
    verLineas(viendoLineas)
  }

  async function eliminarAsociacion(id) {
    await supabase.from('linea_estacion').delete().eq('id', id)
    verLineas(viendoLineas)
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Estaciones</h1>

      {/* Formulario */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>{editando ? 'Editar estación' : 'Nueva estación'}</h2>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre</label>
            <input
              style={styles.input}
              placeholder="Ej: Centra Norte"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Capacidad máxima</label>
            <input
              style={styles.input}
              type="number"
              placeholder="Ej: 200"
              value={form.capacidad_maxima}
              onChange={e => setForm({ ...form, capacidad_maxima: e.target.value })}
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
            <label style={styles.label}>¿Tiene parqueo?</label>
            <select
              style={styles.input}
              value={form.tiene_parqueo}
              onChange={e => setForm({ ...form, tiene_parqueo: e.target.value === 'true' })}
            >
              <option value="false">No</option>
              <option value="true">Sí</option>
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

      {/* Tabla */}
      <div style={styles.card}>
        {cargando ? (
          <p style={styles.muted}>Cargando...</p>
        ) : estaciones.length === 0 ? (
          <p style={styles.muted}>No hay estaciones registradas.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Capacidad</th>
                <th style={styles.th}>Parqueo</th>
                <th style={styles.th}>Municipalidad</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estaciones.map(e => (
                <tr key={e.id}>
                  <td style={styles.td}>{e.nombre}</td>
                  <td style={styles.td}>{e.capacidad_maxima} pas.</td>
                  <td style={styles.td}>
                    <span style={e.tiene_parqueo ? styles.badgeOk : styles.badgeNo}>
                      {e.tiene_parqueo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td style={styles.td}>{e.municipalidades?.nombre ?? '—'}</td>
                  <td style={styles.td}>
                    <button style={styles.btnSmall} onClick={() => iniciarEdicion(e)}>Editar</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnInfo }} onClick={() => verLineas(e)}>Líneas</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminar(e.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Panel de asociación con líneas */}
      {viendoLineas && (
        <div style={styles.card}>
          <div style={styles.panelHeader}>
            <h2 style={styles.subtitle}>Líneas de: {viendoLineas.nombre}</h2>
            <button style={styles.btnSecondary} onClick={() => setViendoLineas(null)}>Cerrar</button>
          </div>
          <div style={styles.formGrid3}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Línea</label>
              <select
                style={styles.input}
                value={formAsoc.linea_id}
                onChange={e => setFormAsoc({ ...formAsoc, linea_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {lineas.map(l => (
                  <option key={l.id} value={l.id}>{l.codigo} — {l.nombre}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Orden en la ruta</label>
              <input
                style={styles.input}
                type="number"
                placeholder="Ej: 1"
                value={formAsoc.orden}
                onChange={e => setFormAsoc({ ...formAsoc, orden: e.target.value })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Distancia a siguiente (km)</label>
              <input
                style={styles.input}
                type="number"
                step="0.01"
                placeholder="Ej: 2.3"
                value={formAsoc.distancia_siguiente_km}
                onChange={e => setFormAsoc({ ...formAsoc, distancia_siguiente_km: e.target.value })}
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button style={styles.btnPrimary} onClick={agregarAsociacion}>Agregar a línea</button>
          </div>
          {lineasEstacion.length === 0 ? (
            <p style={{ ...styles.muted, marginTop: 12 }}>Esta estación no está asociada a ninguna línea aún.</p>
          ) : (
            <table style={{ ...styles.table, marginTop: 14 }}>
              <thead>
                <tr>
                  <th style={styles.th}>Línea</th>
                  <th style={styles.th}>Orden</th>
                  <th style={styles.th}>Dist. siguiente</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {lineasEstacion.map(le => (
                  <tr key={le.id}>
                    <td style={styles.td}><span style={styles.badge}>{le.lineas?.codigo}</span> {le.lineas?.nombre}</td>
                    <td style={styles.td}>{le.orden}</td>
                    <td style={styles.td}>{le.distancia_siguiente_km ? `${le.distancia_siguiente_km} km` : '—'}</td>
                    <td style={styles.td}>
                      <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminarAsociacion(le.id)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: 24 },
  title: { fontSize: 20, fontWeight: 500, color: '#1a2e4a', marginBottom: 16 },
  subtitle: { fontSize: 14, fontWeight: 500, color: '#1a2e4a', marginBottom: 14 },
  card: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: 16, marginBottom: 16 },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 },
  formGrid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#5a6a7e' },
  input: { padding: '8px 12px', borderRadius: 7, border: '1px solid #dde3ec', fontSize: 13, color: '#1a2e4a' },
  formActions: { display: 'flex', gap: 8, marginTop: 14 },
  btnPrimary: { padding: '8px 16px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSmall: { padding: '4px 10px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 4 },
  btnDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  btnInfo: { background: '#e8eef6', color: '#1a2e4a', borderColor: '#b5d4f4' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
  badge: { background: '#e8eef6', color: '#1a2e4a', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500 },
  badgeOk: { background: '#eaf3de', color: '#3b6d11', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeNo: { background: '#f1efe8', color: '#5f5e5a', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
}