import { Route, Routes, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Search from './pages/Search'
import Login from './pages/Login'
import Register from './pages/Register'
import MovieDetail from './pages/MovieDetail'
import Library from './pages/Library'
import BoxOffice from './pages/BoxOffice'
import AllTimeBoxOffice from './pages/AllTimeBoxOffice'
import Dashboard from './pages/Dashboard'
import Suggestions from './pages/Suggestions'
import NearbySessions from './pages/NearbySessions'
import Listas from './pages/Listas'
import ListaDetalhes from './pages/ListDetails' // Import do componente de detalhes da lista

function App() {
  return (
    <div className="min-h-screen bg-cinema-black font-body text-cream">
      <Navbar />

      <main>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/sessoes" element={<NearbySessions />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastrar" element={<Register />} />
          <Route path="/filme/:id" element={<MovieDetail />} />

          {/* Rotas de Bilheteria */}
          <Route path="/bilheteria" element={<Navigate to="/bilheteria/em-cartaz" replace />} />
          <Route path="/bilheteria/em-cartaz" element={<BoxOffice />} />
          <Route path="/bilheteria/todos-os-tempos" element={<AllTimeBoxOffice />} />

          {/* Rotas Protegidas */}
          <Route
            path="/sugestoes"
            element={
              <ProtectedRoute>
                <Suggestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/biblioteca"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listas"
            element={
              <ProtectedRoute>
                <Listas />
              </ProtectedRoute>
            }
          />
          {/* Nova Rota para visualizar os detalhes e filmes de uma lista específica */}
          <Route
            path="/listas/:id"
            element={
              <ProtectedRoute>
                <ListaDetalhes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App