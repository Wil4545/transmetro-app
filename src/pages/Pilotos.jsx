import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Pilotos() {
  const [pilotos, setPilotos] = useState([])
  const [buses, setBuses] = useState([])
  const [municipalidades, setMunicipalidades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(null)
  const [viendoExpediente, setViendoExpediente] = useState(null)
  const [historial, setHistorial] = useState([])
  const [residencia, setResidencia] = useState(null)
  const [tab, setTab] = useState('datos')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre_completo: '', dpi: '', fecha_nacimiento: '',
    licencia: '', telefono: '', correo: '', bus_id: ''
  })
  const [formHist, setFormHist] = useState({
    nivel: '', institucion: '', titulo: '', anio_graduacion: ''
  })
  const [formRes, setFormRes] = useState({
    direccion: '', municipalidad_id: '', telefono_residencia: ''
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: p }, { data: b }, { data: m }] = await Promise.all([
      supabase.from('pilotos').select('*, buses(codigo, lineas(codigo))').order('nombre_completo'),
      supabase.from('buses').select('id, codigo, lineas(codigo)').order('codigo'),
      supabase.from('municipalidades').select('*').order('nombre')
    ])
    setPilotos(p ?? [])
    setBuses(b ?? [])
    setMunicipalidades(m ?? [])
    setCargando(false)
  }

  async function guardar() {
    setError('')
    if (!form.nombre_completo.trim() || !form.dpi.trim() || !form.licencia.trim()) {
      setError('Nombre, DPI y licencia son obligatorios.')
      return
    }
    const payload = {
      nombre_completo: form.nombre_completo,
      dpi: form.dpi,
      fecha_nacimiento: form.fecha_nacimiento || null,
      licencia: form.licencia,
      telefono: form.telefono || null,
      correo: form.correo || null,
      bus_id: form.bus_id || null
    }
    if (editando) {
      await supabase.from('pilotos').update(payload).eq('id', editando)
    } else {
      await supabase.from('pilotos').insert(payload)
    }
    cancelar()
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este piloto?')) return
    await supabase.from('pilotos').delete().eq('id', id)
    cargar()
  }

  function iniciarEdicion(p) {
    setEditando(p.id)
    setError('')
    setForm({
      nombre_completo: p.nombre_completo,
      dpi: p.dpi,
      fecha_nacimiento: p.fecha_nacimiento ?? '',
      licencia: p.licencia,
      telefono: p.telefono ?? '',
      correo: p.correo ?? '',
      bus_id: p.bus_id ?? ''
    })
  }

  function cancelar() {
    setEditando(null)
    setError('')
    setForm({ nombre_completo: '', dpi: '', fecha_nacimiento: '', licencia: '', telefono: '', correo: '', bus_id: '' })
  }

  async function verExpediente(piloto) {
    setViendoExpediente(piloto)
    setTab('datos')
    const [{ data: h }, { data: r }] = await Promise.all([
      supabase.from('historial_educativo').select('*').eq('piloto_id', piloto.id).order('anio_graduacion'),
      supabase.from('residencias').select('*, municipalidades(nombre)').eq('piloto_id', piloto.id).single()
    ])
    setHistorial(h ?? [])
    setResidencia(r ?? null)
    setFormRes({
      direccion: r?.direccion ?? '',
      municipalidad_id: r?.municipalidad_id ?? '',
      telefono_residencia: r?.telefono_residencia ?? ''
    })
  }

  async function agregarHistorial() {
    if (!formHist.nivel.trim() || !formHist.institucion.trim()) return
    await supabase.from('historial_educativo').insert({
      piloto_id: viendoExpediente.id,
      nivel: formHist.nivel,
      institucion: formHist.institucion,
      titulo: formHist.titulo || null,
      anio_graduacion: formHist.anio_graduacion ? parseInt(formHist.anio_graduacion) : null
    })
    setFormHist({ nivel: '', institucion: '', titulo: '', anio_graduacion: '' })
    verExpediente(viendoExpediente)
  }

  async function eliminarHistorial(id) {
    await supabase.from('historial_educativo').delete().eq('id', id)
    verExpediente(viendoExpediente)
  }

  async function guardarResidencia() {
    if (!formRes.direccion.trim() || !formRes.municipalidad_id) return
    const payload = {
      piloto_id: viendoExpediente.id,
      direccion: formRes.direccion,
      municipalidad_id: formRes.municipalidad_id,
      telefono_residencia: formRes.telefono_residencia || null
    }
    if (residencia) {
      await supabase.from('residencias').update(payload).eq('piloto_id', viendoExpediente.id)
    } else {
      await supabase.from('residencias').insert(payload)
    }
    verExpediente(viendoExpediente)
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Pilotos</h1>

      {/* Formulario */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>{editando ? 'Editar piloto' : 'Registrar piloto'}</h2>
        {error && <div style={styles.errorBox}>{error}</div>}
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre completo</label>
            <input style={styles.input} placeholder="Nombre completo" value={form.nombre_completo} onChange={e => setForm({ ...form, nombre_completo: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>DPI</label>
            <input style={styles.input} placeholder="DPI" value={form.dpi} onChange={e => setForm({ ...form, dpi: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Licencia</label>
            <input style={styles.input} placeholder="No. de licencia" value={form.licencia} onChange={e => setForm({ ...form, licencia: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Fecha de nacimiento</label>
            <input style={styles.input} type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Teléfono</label>
            <input style={styles.input} placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Correo</label>
            <input style={styles.input} type="email" placeholder="Correo" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Bus asignado (opcional)</label>
            <select style={styles.input} value={form.bus_id} onChange={e => setForm({ ...form, bus_id: e.target.value })}>
              <option value="">Sin bus asignado</option>
              {buses.map(b => (
                <option key={b.id} value={b.id}>{b.codigo} {b.lineas ? `— Línea ${b.lineas.codigo}` : '— Sin línea'}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.formActions}>
          <button style={styles.btnPrimary} onClick={guardar}>{editando ? 'Actualizar' : 'Registrar'}</button>
          {editando && <button style={styles.btnSecondary} onClick={cancelar}>Cancelar</button>}
        </div>
      </div>

      {/* Tabla */}
      <div style={styles.card}>
        {cargando ? <p style={styles.muted}>Cargando...</p> : pilotos.length === 0 ? (
          <p style={styles.muted}>No hay pilotos registrados.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>DPI</th>
                <th style={styles.th}>Licencia</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Bus asignado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pilotos.map(p => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.nombre_completo}</td>
                  <td style={styles.td}>{p.dpi}</td>
                  <td style={styles.td}>{p.licencia}</td>
                  <td style={styles.td}>{p.telefono ?? '—'}</td>
                  <td style={styles.td}>
                    {p.buses ? <span style={styles.badge}>{p.buses.codigo}</span> : <span style={styles.badgeNo}>Sin asignar</span>}
                  </td>
                  <td style={styles.td}>
                    <button style={styles.btnSmall} onClick={() => iniciarEdicion(p)}>Editar</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnInfo }} onClick={() => verExpediente(p)}>Expediente</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminar(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Expediente */}
      {viendoExpediente && (
        <div style={styles.card}>
          <div style={styles.panelHeader}>
            <h2 style={styles.subtitle}>Expediente — {viendoExpediente.nombre_completo}</h2>
            <button style={styles.btnSecondary} onClick={() => setViendoExpediente(null)}>Cerrar</button>
          </div>
          <div style={styles.tabs}>
            <button style={{ ...styles.tab, ...(tab === 'datos' ? styles.tabActive : {}) }} onClick={() => setTab('datos')}>Historial educativo</button>
            <button style={{ ...styles.tab, ...(tab === 'residencia' ? styles.tabActive : {}) }} onClick={() => setTab('residencia')}>Residencia</button>
          </div>

          {tab === 'datos' && (
            <div style={{ marginTop: 16 }}>
              <div style={styles.formGrid4}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nivel</label>
                  <select style={styles.input} value={formHist.nivel} onChange={e => setFormHist({ ...formHist, nivel: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    <option>Primaria</option>
                    <option>Básico</option>
                    <option>Diversificado</option>
                    <option>Universidad</option>
                    <option>Técnico</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Institución</label>
                  <input style={styles.input} placeholder="Nombre del establecimiento" value={formHist.institucion} onChange={e => setFormHist({ ...formHist, institucion: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Título obtenido</label>
                  <input style={styles.input} placeholder="Título (opcional)" value={formHist.titulo} onChange={e => setFormHist({ ...formHist, titulo: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Año de graduación</label>
                  <input style={styles.input} type="number" placeholder="Ej: 2010" value={formHist.anio_graduacion} onChange={e => setFormHist({ ...formHist, anio_graduacion: e.target.value })} />
                </div>
              </div>
              <div style={styles.formActions}>
                <button style={styles.btnPrimary} onClick={agregarHistorial}>Agregar</button>
              </div>
              {historial.length === 0 ? (
                <p style={{ ...styles.muted, marginTop: 12 }}>Sin historial educativo registrado.</p>
              ) : (
                <table style={{ ...styles.table, marginTop: 14 }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nivel</th>
                      <th style={styles.th}>Institución</th>
                      <th style={styles.th}>Título</th>
                      <th style={styles.th}>Año</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(h => (
                      <tr key={h.id}>
                        <td style={styles.td}>{h.nivel}</td>
                        <td style={styles.td}>{h.institucion}</td>
                        <td style={styles.td}>{h.titulo ?? '—'}</td>
                        <td style={styles.td}>{h.anio_graduacion ?? '—'}</td>
                        <td style={styles.td}>
                          <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminarHistorial(h.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'residencia' && (
            <div style={{ marginTop: 16 }}>
              <div style={styles.formGrid3}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Dirección</label>
                  <input style={styles.input} placeholder="Dirección completa" value={formRes.direccion} onChange={e => setFormRes({ ...formRes, direccion: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Municipalidad</label>
                  <select style={styles.input} value={formRes.municipalidad_id} onChange={e => setFormRes({ ...formRes, municipalidad_id: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {municipalidades.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teléfono de residencia</label>
                  <input style={styles.input} placeholder="Teléfono fijo" value={formRes.telefono_residencia} onChange={e => setFormRes({ ...formRes, telefono_residencia: e.target.value })} />
                </div>
              </div>
              <div style={styles.formActions}>
                <button style={styles.btnPrimary} onClick={guardarResidencia}>
                  {residencia ? 'Actualizar residencia' : 'Guardar residencia'}
                </button>
              </div>
              {residencia && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#f4f6f9', borderRadius: 8, fontSize: 13, color: '#1a2e4a' }}>
                  <b>Dirección actual:</b> {residencia.direccion} — {residencia.municipalidades?.nombre} {residencia.telefono_residencia ? `· Tel: ${residencia.telefono_residencia}` : ''}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: 24 },
  title: { fontSize: 20, fontWeight: 500, color: '#1a2e4a', marginBottom: 16 },
  subtitle: { fontSize: 14, fontWeight: 500, color: '#1a2e4a', marginBottom: 0 },
  card: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: 16, marginBottom: 16 },
  panelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  formGrid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  formGrid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 500, color: '#5a6a7e' },
  input: { padding: '8px 12px', borderRadius: 7, border: '1px solid #dde3ec', fontSize: 13, color: '#1a2e4a' },
  formActions: { display: 'flex', gap: 8, marginTop: 14 },
  btnPrimary: { padding: '8px 16px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 7, fontSize: 13, cursor: 'pointer' },
  btnSmall: { padding: '4px 10px', background: '#f4f6f9', color: '#1a2e4a', border: '1px solid #dde3ec', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginRight: 4 },
  btnDanger: { background: '#fcebeb', color: '#a32d2d', borderColor: '#f7c1c1' },
  btnInfo: { background: '#e8eef6', color: '#1a2e4a', borderColor: '#b5d4f4' },
  errorBox: { background: '#fcebeb', color: '#a32d2d', border: '1px solid #f7c1c1', borderRadius: 7, padding: '8px 12px', fontSize: 13, marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  muted: { fontSize: 13, color: '#5a6a7e' },
  badge: { background: '#e8eef6', color: '#1a2e4a', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500 },
  badgeNo: { background: '#f1efe8', color: '#5f5e5a', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #dde3ec', marginTop: 14 },
  tab: { padding: '8px 16px', fontSize: 13, color: '#5a6a7e', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer' },
  tabActive: { color: '#1a2e4a', borderBottomColor: '#1a2e4a', fontWeight: 500 },
}