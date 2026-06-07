import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Lineas from './pages/Lineas'
import Estaciones from './pages/Estaciones'
import Buses from './pages/Buses'
import Pilotos from './pages/Pilotos'
import Guardias from './pages/Guardias'
import Operadores from './pages/Operadores'
import Alertas from './pages/Alertas'
import Reportes from './pages/Reportes'
import Layout from './components/Layout'
import Municipalidades from './pages/Municipalidades'

function RutaProtegida({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, color: '#1a2e4a' }}>Cargando...</div>
  return user ? children : <Navigate to="/" />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lineas" element={<Lineas />} />
        <Route path="/estaciones" element={<Estaciones />} />
        <Route path="/buses" element={<Buses />} />
        <Route path="/pilotos" element={<Pilotos />} />
        <Route path="/guardias" element={<Guardias />} />
        <Route path="/operadores" element={<Operadores />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/reportes" element={<Reportes />} />
	<Route path="/municipalidades" element={<Municipalidades />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App