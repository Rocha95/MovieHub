import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Não foi possível entrar. Confira seus dados.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-8">
        <h1 className="font-display text-3xl tracking-wide text-marquee-gold">
          Entrar
        </h1>
        <p className="mt-1 text-sm text-dust">
          Acesse sua conta para continuar no MovieHub.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-cinema-surface-2 bg-cinema-black px-3 py-2 text-cream outline-none focus:border-marquee-gold"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Senha
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-cinema-surface-2 bg-cinema-black px-3 py-2 text-cream outline-none focus:border-marquee-gold"
            />
          </label>

          {error && <p className="text-sm text-velvet">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-marquee-gold py-2 font-semibold text-cinema-black hover:bg-marquee-gold-dim disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-dust">
          Ainda não tem conta?{' '}
          <Link to="/cadastrar" className="text-marquee-gold hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
