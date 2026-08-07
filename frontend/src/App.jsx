import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Search from './pages/Search'
import Login from './pages/Login'
import Register from './pages/Register'
import MovieDetail from './pages/MovieDetail'
import Library from './pages/Library'
import BoxOffice from './pages/BoxOffice'
import Dashboard from './pages/Dashboard'
import Suggestions from './pages/Suggestions'
import NearbySessions from './pages/NearbySessions' // 1. IMPORTAR AQUI

function App() {
  return (
    <div className="min-h-screen bg-cinema-black font-body text-cream">
      <Navbar />

      <main>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/sessoes" element={<NearbySessions />} /> {/* 2. REGISTRAR A ROTA AQUI */}
          <Route path="/buscar" element={<Search />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastrar" element={<Register />} />
          <Route path="/filme/:id" element={<MovieDetail />} />
          <Route path="/bilheteria" element={<BoxOffice />} />

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