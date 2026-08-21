import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext' // Ajuste o caminho conforme seu projeto

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Consome o usuário e a função de logout direto do AuthContext
  const { user, logout } = useAuth()

  // Considera logado se existir o objeto 'user' (ou token, dependendo do seu AuthContext)
  const isAuthenticated = Boolean(user)

  const isBoxOfficeActive = location.pathname.startsWith('/bilheteria')

  const handleLogout = async () => {
    setDropdownOpen(false)
    if (logout) {
      await logout()
    } else {
      localStorage.clear()
    }
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  // Fechar dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-cinema-black/95 backdrop-blur border-b border-cinema-surface-2 px-6 py-4">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
        
        {/* Esquerda: Logo + Campo de Busca */}
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display text-2xl text-marquee-gold font-bold tracking-wider shrink-0">
            CINEAPP
          </Link>

          <form onSubmit={handleSearch} className="relative w-48 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar filme..."
              className="w-full rounded-full border border-cinema-surface-2 bg-cinema-surface px-4 py-1.5 pl-9 text-sm text-cream placeholder-dust focus:border-marquee-gold focus:outline-none focus:ring-1 focus:ring-marquee-gold transition-colors"
            />
            <button
              type="submit"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dust hover:text-marquee-gold transition-colors"
              aria-label="Buscar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Direita: Links de Navegação */}
        <nav className="flex items-center space-x-6">
          {/* SEMPRE VISÍVEL */}
          <Link to="/" className="text-cream hover:text-marquee-gold transition-colors text-sm font-medium whitespace-nowrap">
            Início
          </Link>

          {/* LOGADO: Exibe Sessões, Bilheteria, Sugestões, Minha Biblioteca, Listas, Dashboard e Sair */}
          {isAuthenticated ? (
            <>
              <Link to="/sessoes" className="text-cream hover:text-marquee-gold transition-colors text-sm font-medium whitespace-nowrap">
                Sessões
              </Link>

              {/* Dropdown Bilheteria */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDropdownOpen((prev) => !prev)
                  }}
                  className={`flex items-center space-x-1.5 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap cursor-pointer py-1 ${
                    isBoxOfficeActive ? 'text-marquee-gold' : 'text-cream hover:text-marquee-gold'
                  }`}
                >
                  <span>Bilheteria</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div 
                    className="absolute left-0 mt-2 w-52 rounded-lg border border-cinema-surface-2 bg-cinema-surface p-1.5 shadow-2xl z-50"
                    style={{ backgroundColor: '#121212' }}
                  >
                    <Link
                      to="/bilheteria/em-cartaz"
                      onClick={() => setDropdownOpen(false)}
                      className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                        location.pathname === '/bilheteria/em-cartaz'
                          ? 'bg-cinema-surface-2 text-marquee-gold font-semibold'
                          : 'text-cream hover:bg-cinema-black hover:text-marquee-gold'
                      }`}
                    >
                      🍿 Em Cartaz / Semana
                    </Link>
                    <Link
                      to="/bilheteria/todos-os-tempos"
                      onClick={() => setDropdownOpen(false)}
                      className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                        location.pathname === '/bilheteria/todos-os-tempos'
                          ? 'bg-cinema-surface-2 text-marquee-gold font-semibold'
                          : 'text-cream hover:bg-cinema-black hover:text-marquee-gold'
                      }`}
                    >
                      🏆 Todos os Tempos
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/sugestoes" className="text-cream hover:text-marquee-gold transition-colors text-sm font-medium whitespace-nowrap">
                Sugestões
              </Link>

              <Link to="/biblioteca" className="text-cream hover:text-marquee-gold transition-colors text-sm font-medium whitespace-nowrap">
                Minha Biblioteca
              </Link>

              {/* Ícone e Rota das Listas */}
              <Link 
                to="/listas" 
                className="flex items-center gap-1.5 text-cream hover:text-marquee-gold transition-colors text-sm font-medium whitespace-nowrap"
              >
               
                <span>Listas</span>
              </Link>

              <Link to="/dashboard" className="text-cream hover:text-marquee-gold transition-colors text-sm font-medium whitespace-nowrap">
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="text-velvet hover:text-red-400 transition-colors text-sm font-medium whitespace-nowrap focus:outline-none"
              >
                Sair
              </button>
            </>
          ) : (
            /* DESLOGADO: Exibe APENAS o botão Entrar */
            <Link
              to="/entrar"
              className="rounded-full bg-marquee-gold px-4 py-1.5 text-sm font-semibold text-cinema-black hover:bg-yellow-400 transition-colors whitespace-nowrap"
            >
              Entrar
            </Link>
          )}
        </nav>

      </div>
    </header>
  )
}