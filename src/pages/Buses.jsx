import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Buses() {
  const [buses, setBuses] = useState([])
  const [lineas, setLineas] = useState([])
  const [parqueos, setParqueos] = useState([])
  const [form, setForm] = useState({ codigo: '', placa: '', capacidad_pasajeros: '', linea_id: '', parqueo_id: '' })
  const [editando, setEditando] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: b }, { data: l }, { data: p }] = await Promise.all([
      supabase.from('buses').select('*, lineas(codigo, nombre), parqueos(nombre)').order('codigo'),
      supabase.from('lineas').select('*, linea_estacion(id)').order('codigo'),
      supabase.from('parqueos').select('*').order('nombre')
    ])
    setBuses(b ?? [])
    setLineas(l ?? [])
    setParqueos(p ?? [])
    setCargando(false)
  }

  async function validarCapacidadLinea(linea_id, busIdExcluir = null) {
    if (!linea_id) return true
    const linea = lineas.find(l => l.id === linea_id)
    if (!linea) return true
    const numEstaciones = linea.linea_estacion?.length ?? 0
    const maxBuses = numEstaciones * 2
    let query = supabase.from('buses').select('id').eq('linea_id', linea_id)
    if (busIdExcluir) query = query.neq('id', busIdExcluir)
    const { data } = await query
    const busesActuales = data?.length ?? 0
    if (busesActuales >= maxBuses) {
      return `La línea ya tiene ${busesActuales} buses asignados (máximo permitido: ${maxBuses} para ${numEstaciones} estaciones).`
    }
    return true
  }

  async function guardar() {
    setError('')
    if (!form.codigo.trim() || !form.placa.trim() || !form.capacidad_pasajeros || !form.parqueo_id) {
      setError('Código, placa, capacidad y parqueo son obligatorios.')
      return
    }
    const validacion = await validarCapacidadLinea(form.linea_id, editando)
    if (validacion !== true) {
      setError(validacion)
      return
    }
    const payload = {
      codigo: form.codigo,
      placa: form.placa,
      capacidad_pasajeros: parseInt(form.capacidad_pasajeros),
      linea_id: form.linea_id || null,
      parqueo_id: form.parqueo_id
    }
    if (editando) {
      await supabase.from('buses').update(payload).eq('id', editando)
    } else {
      await supabase.from('buses').insert(payload)
    }
    cancelar()
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este bus?')) return
    await supabase.from('buses').delete().eq('id', id)
    cargar()
  }

  function iniciarEdicion(b) {
    setEditando(b.id)
    setError('')
    setForm({
      codigo: b.codigo,
      placa: b.placa,
      capacidad_pasajeros: b.capacidad_pasajeros,
      linea_id: b.linea_id ?? '',
      parqueo_id: b.parqueo_id
    })
  }

  function cancelar() {
    setEditando(null)
    setError('')
    setForm({ codigo: '', placa: '', capacidad_pasajeros: '', linea_id: '', parqueo_id: '' })
  }

  function busesEnLinea(linea_id) {
    return buses.filter(b => b.linea_id === linea_id).length
  }

  function estacionesEnLinea(linea_id) {
    const linea = lineas.find(l => l.id === linea_id)
    return linea?.linea_estacion?.length ?? 0
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Buses</h1>

      {/* Resumen por línea */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Capacidad por línea</h2>
        {lineas.length === 0 ? (
          <p style={styles.muted}>No hay líneas registradas.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Línea</th>
                <th style={styles.th}>Estaciones</th>
                <th style={styles.th}>Buses mín.</th>
                <th style={styles.th}>Buses asignados</th>
                <th style={styles.th}>Buses máx.</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map(l => {
                const est = estacionesEnLinea(l.id)
                const asignados = busesEnLinea(l.id)
                const min = est
                const max = est * 2
                let estado = 'ok'
                if (asignados < min) estado = 'bajo'
                if (asignados >= max) estado = 'lleno'
                return (
                  <tr key={l.id}>
                    <td style={styles.td}><span style={styles.badge}>{l.codigo}</span> {l.nombre}</td>
                    <td style={styles.td}>{est}</td>
                    <td style={styles.td}>{min}</td>
                    <td style={styles.td}>{asignados}</td>
                    <td style={styles.td}>{max}</td>
                    <td style={styles.td}>
                      {estado === 'ok' && <span style={styles.badgeOk}>Normal</span>}
                      {estado === 'bajo' && <span style={styles.badgeWarn}>Bajo mínimo</span>}
                      {estado === 'lleno' && <span style={styles.badgeDanger}>Máximo alcanzado</span>}
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
        <h2 style={styles.subtitle}>{editando ? 'Editar bus' : 'Registrar bus'}</h2>
        {error && <div style={styles.errorBox}>{error}</div>}
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Código</label>
            <input
              style={styles.input}
              placeholder="Ej: #107"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Placa</label>
            <input
              style={styles.input}
              placeholder="Ej: P-210-GTM"
              value={form.placa}
              onChange={e => setForm({ ...form, placa: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Capacidad (pasajeros)</label>
            <input
              style={styles.input}
              type="number"
              placeholder="Ej: 80"
              value={form.capacidad_pasajeros}
              onChange={e => setForm({ ...form, capacidad_pasajeros: e.target.value })}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Parqueo asignado *</label>
            <select
              style={styles.input}
              value={form.parqueo_id}
              onChange={e => setForm({ ...form, parqueo_id: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {parqueos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Línea asignada (opcional)</label>
            <select
              style={styles.input}
              value={form.linea_id}
              onChange={e => setForm({ ...form, linea_id: e.target.value })}
            >
              <option value="">Sin línea asignada</option>
              {lineas.map(l => (
                <option key={l.id} value={l.id}>{l.codigo} — {l.nombre}</option>
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

      {/* Tabla de buses */}
      <div style={styles.card}>
        {cargando ? (
          <p style={styles.muted}>Cargando...</p>
        ) : buses.length === 0 ? (
          <p style={styles.muted}>No hay buses registrados.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Placa</th>
                <th style={styles.th}>Capacidad</th>
                <th style={styles.th}>Línea</th>
                <th style={styles.th}>Parqueo</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {buses.map(b => (
                <tr key={b.id}>
                  <td style={styles.td}><b>{b.codigo}</b></td>
                  <td style={styles.td}>{b.placa}</td>
                  <td style={styles.td}>{b.capacidad_pasajeros} pas.</td>
                  <td style={styles.td}>
                    {b.lineas
                      ? <span style={styles.badge}>{b.lineas.codigo}</span>
                      : <span style={styles.badgeNo}>Sin asignar</span>}
                  </td>
                  <td style={styles.td}>{b.parqueos?.nombre ?? '—'}</td>
                  <td style={styles.td}>
                    <button style={styles.btnSmall} onClick={() => iniciarEdicion(b)}>Editar</button>
                    <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => eliminar(b.id)}>Eliminar</button>
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
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12 },
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
  badge: { background: '#e8eef6', color: '#1a2e4a', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500 },
  badgeOk: { background: '#eaf3de', color: '#3b6d11', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeWarn: { background: '#faeeda', color: '#854f0b', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeDanger: { background: '#fcebeb', color: '#a32d2d', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeNo: { background: '#f1efe8', color: '#5f5e5a', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
}