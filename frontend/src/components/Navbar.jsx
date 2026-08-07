import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleSearch(event) {
    event.preventDefault()
    if (!query.trim()) return
    navigate(`/buscar?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-10 bg-cinema-black">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link
          to="/"
          className="font-display text-2xl tracking-[0.2em] text-marquee-gold"
        >
          MOVIEHUB
        </Link>

        <form onSubmit={handleSearch} className="flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar filmes..."
            className="w-full max-w-md rounded-full border border-cinema-surface-2 bg-cinema-surface px-4 py-2 text-sm text-cream placeholder-dust outline-none focus:border-marquee-gold"
          />
        </form>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-dust hover:text-cream">
            Em cartaz
          </Link>
          <Link to="/sessoes" className="text-dust hover:text-cream">
            Sessões
          </Link>
          <Link to="/bilheteria" className="text-dust hover:text-cream">
            Bilheteria
          </Link>

          {user ? (
            <>
              {/* NOVO ITEM ADICIONADO AQUI */}
              <Link to="/sugestoes" className="text-dust hover:text-cream">
                Sugestões
              </Link>
              <Link to="/biblioteca" className="text-dust hover:text-cream">
                Minha biblioteca
              </Link>
              <Link to="/dashboard" className="text-dust hover:text-cream">
                Dashboard
              </Link>
              <span className="text-cream">Olá, {user.name.split(' ')[0]}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-velvet px-3 py-1.5 text-velvet hover:bg-velvet hover:text-cream"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/entrar"
                className="text-dust hover:text-cream"
              >
                Entrar
              </Link>
              <Link
                to="/cadastrar"
                className="rounded-full bg-marquee-gold px-3 py-1.5 font-medium text-cinema-black hover:bg-marquee-gold-dim"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="marquee-lights h-1 w-full opacity-70" />
    </header>
  )
}