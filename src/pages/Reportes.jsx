import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Reportes() {
  const [lineas, setLineas] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [buses, setBuses] = useState([])
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: l }, { data: e }, { data: b }, { data: a }] = await Promise.all([
      supabase.from('lineas').select('*, municipalidades(nombre), linea_estacion(id), buses(id)').order('codigo'),
      supabase.from('estaciones').select('*, municipalidades(nombre), accesos(id), linea_estacion(id)').order('nombre'),
      supabase.from('buses').select('*, lineas(codigo, nombre), parqueos(nombre)').order('codigo'),
      supabase.from('alertas').select('*').eq('resuelta', false)
    ])
    setLineas(l ?? [])
    setEstaciones(e ?? [])
    setBuses(b ?? [])
    setAlertas(a ?? [])
    setCargando(false)
  }

  function exportarCSV(datos, nombreArchivo) {
    if (!datos.length) return
    const encabezados = Object.keys(datos[0]).join(',')
    const filas = datos.map(d => Object.values(d).map(v => `"${v ?? ''}"`).join(','))
    const csv = [encabezados, ...filas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nombreArchivo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function datosLineasCSV() {
    return lineas.map(l => ({
      Codigo: l.codigo,
      Nombre: l.nombre,
      Municipalidad: l.municipalidades?.nombre ?? '—',
      Estaciones: l.linea_estacion?.length ?? 0,
      Buses_asignados: l.buses?.length ?? 0,
      Buses_minimo: l.linea_estacion?.length ?? 0,
      Buses_maximo: (l.linea_estacion?.length ?? 0) * 2,
      Distancia_km: l.distancia_total_km ?? '—'
    }))
  }

  function datosEstacionesCSV() {
    return estaciones.map(e => ({
      Nombre: e.nombre,
      Municipalidad: e.municipalidades?.nombre ?? '—',
      Capacidad_maxima: e.capacidad_maxima,
      Tiene_parqueo: e.tiene_parqueo ? 'Sí' : 'No',
      Accesos: e.accesos?.length ?? 0,
      Lineas: e.linea_estacion?.length ?? 0
    }))
  }

  function datosBusesCSV() {
    return buses.map(b => ({
      Codigo: b.codigo,
      Placa: b.placa,
      Capacidad: b.capacidad_pasajeros,
      Linea: b.lineas?.codigo ?? 'Sin asignar',
      Parqueo: b.parqueos?.nombre ?? '—'
    }))
  }

  if (cargando) return <div style={{ padding: 24, color: '#1a2e4a' }}>Cargando reportes...</div>

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Reportes</h1>

      {/* Resumen general */}
      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total líneas</div>
          <div style={styles.statValue}>{lineas.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total estaciones</div>
          <div style={styles.statValue}>{estaciones.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total buses</div>
          <div style={styles.statValue}>{buses.length}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: alertas.length > 0 ? '3px solid #e24b4a' : '3px solid #2dd10f' }}>
          <div style={styles.statLabel}>Alertas pendientes</div>
          <div style={{ ...styles.statValue, color: alertas.length > 0 ? '#a32d2d' : '#3b6d11' }}>{alertas.length}</div>
        </div>
      </div>

      {/* Reporte de líneas */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.subtitle}>Reporte de líneas</h2>
            <p style={styles.hint}>Resumen de líneas, estaciones y buses asignados</p>
          </div>
          <button style={styles.btnExport} onClick={() => exportarCSV(datosLineasCSV(), 'reporte_lineas')}>
            ⬇ Exportar CSV
          </button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Código</th>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Municipalidad</th>
              <th style={styles.th}>Estaciones</th>
              <th style={styles.th}>Buses asig.</th>
              <th style={styles.th}>Mín.</th>
              <th style={styles.th}>Máx.</th>
              <th style={styles.th}>Distancia</th>
              <th style={styles.th}>Estado flota</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map(l => {
              const est = l.linea_estacion?.length ?? 0
              const asig = l.buses?.length ?? 0
              const min = est
              const max = est * 2
              let estadoFlota = 'ok'
              if (asig < min) estadoFlota = 'bajo'
              if (asig >= max) estadoFlota = 'lleno'
              return (
                <tr key={l.id}>
                  <td style={styles.td}><span style={styles.badge}>{l.codigo}</span></td>
                  <td style={styles.td}>{l.nombre}</td>
                  <td style={styles.td}>{l.municipalidades?.nombre ?? '—'}</td>
                  <td style={styles.td}>{est}</td>
                  <td style={styles.td}>{asig}</td>
                  <td style={styles.td}>{min}</td>
                  <td style={styles.td}>{max}</td>
                  <td style={styles.td}>{l.distancia_total_km ? `${l.distancia_total_km} km` : '—'}</td>
                  <td style={styles.td}>
                    {estadoFlota === 'ok' && <span style={styles.badgeOk}>Normal</span>}
                    {estadoFlota === 'bajo' && <span style={styles.badgeWarn}>Bajo mínimo</span>}
                    {estadoFlota === 'lleno' && <span style={styles.badgeDanger}>Máximo</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Reporte de estaciones */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.subtitle}>Reporte de estaciones</h2>
            <p style={styles.hint}>Accesos, capacidad y líneas por estación</p>
          </div>
          <button style={styles.btnExport} onClick={() => exportarCSV(datosEstacionesCSV(), 'reporte_estaciones')}>
            ⬇ Exportar CSV
          </button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Municipalidad</th>
              <th style={styles.th}>Capacidad máx.</th>
              <th style={styles.th}>Parqueo</th>
              <th style={styles.th}>Accesos</th>
              <th style={styles.th}>Líneas</th>
            </tr>
          </thead>
          <tbody>
            {estaciones.map(e => (
              <tr key={e.id}>
                <td style={styles.td}>{e.nombre}</td>
                <td style={styles.td}>{e.municipalidades?.nombre ?? '—'}</td>
                <td style={styles.td}>{e.capacidad_maxima} pas.</td>
                <td style={styles.td}>
                  <span style={e.tiene_parqueo ? styles.badgeOk : styles.badgeGray}>
                    {e.tiene_parqueo ? 'Sí' : 'No'}
                  </span>
                </td>
                <td style={styles.td}>{e.accesos?.length ?? 0}</td>
                <td style={styles.td}>{e.linea_estacion?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reporte de buses */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.subtitle}>Reporte de buses</h2>
            <p style={styles.hint}>Flota completa con línea y parqueo asignado</p>
          </div>
          <button style={styles.btnExport} onClick={() => exportarCSV(datosBusesCSV(), 'reporte_buses')}>
            ⬇ Exportar CSV
          </button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Código</th>
              <th style={styles.th}>Placa</th>
              <th style={styles.th}>Capacidad</th>
              <th style={styles.th}>Línea asignada</th>
              <th style={styles.th}>Parqueo</th>
              <th style={styles.th}>Estado</th>
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
                    ? <span style={styles.badge}>{b.lineas.codigo} — {b.lineas.nombre}</span>
                    : <span style={styles.badgeGray}>Sin asignar</span>}
                </td>
                <td style={styles.td}>{b.parqueos?.nombre ?? '—'}</td>
                <td style={styles.td}>
                  {b.lineas
                    ? <span style={styles.badgeOk}>En servicio</span>
                    : <span style={styles.badgeGray}>En espera</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 24 },
  title: { fontSize: 20, fontWeight: 500, color: '#1a2e4a', marginBottom: 16 },
  subtitle: { fontSize: 14, fontWeight: 500, color: '#1a2e4a', marginBottom: 4 },
  hint: { fontSize: 12, color: '#5a6a7e' },
  card: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: 16, marginBottom: 16 },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', padding: '14px 16px' },
  statLabel: { fontSize: 12, color: '#5a6a7e', marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 500, color: '#1a2e4a' },
  btnExport: { padding: '7px 14px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#5a6a7e', textAlign: 'left', borderBottom: '1px solid #dde3ec', textTransform: 'uppercase' },
  td: { padding: '10px 12px', fontSize: 13, color: '#1a2e4a', borderBottom: '1px solid #f4f6f9' },
  badge: { background: '#e8eef6', color: '#1a2e4a', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500 },
  badgeOk: { background: '#eaf3de', color: '#3b6d11', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeWarn: { background: '#faeeda', color: '#854f0b', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeDanger: { background: '#fcebeb', color: '#a32d2d', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
  badgeGray: { background: '#f1efe8', color: '#5f5e5a', padding: '2px 8px', borderRadius: 10, fontSize: 12 },
}