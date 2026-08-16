import { useEffect, useState, useMemo } from 'react'
import api from '../api/client'

// Utilitário para converter minutos acumulados em Dias, Horas e Minutos
function formatRuntime(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) {
    return { days: 0, hours: 0, minutes: 0, formatted: '0m' }
  }

  const days = Math.floor(totalMinutes / (24 * 60))
  const remainingMinutesAfterDays = totalMinutes % (24 * 60)
  const hours = Math.floor(remainingMinutesAfterDays / 60)
  const minutes = remainingMinutesAfterDays % 60

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)

  return {
    days,
    hours,
    minutes,
    formatted: parts.join(' ')
  }
}

export default function Dashboard() {
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/library')
      .then((res) => setLibrary(res.data))
      .catch((err) => console.error('Erro ao carregar dados do dashboard:', err))
      .finally(() => setLoading(false))
  }, [])

  // Filtrar apenas itens marcados como assistidos
  const watchedMovies = useMemo(() => {
    return library.filter((item) => item.status === 'WATCHED')
  }, [library])

  // 1. CÁLCULO DE TEMPO TOTAL ASSISTIDO
  const timeStats = useMemo(() => {
    const totalMinutes = watchedMovies.reduce((acc, curr) => {
      const runtime = typeof curr.runtime === 'number' ? curr.runtime : 0
      return acc + runtime
    }, 0)

    return formatRuntime(totalMinutes)
  }, [watchedMovies])

  // 2. CÁLCULOS DE NOTAS (0 a 10)
  const ratingStats = useMemo(() => {
    const ratedMovies = watchedMovies.filter((item) => typeof item.rating === 'number')

    if (ratedMovies.length === 0) {
      return { average: 0, totalRated: 0, distribution: Array(11).fill(0), maxFreq: 1 }
    }

    const total = ratedMovies.reduce((acc, curr) => acc + curr.rating, 0)
    const average = total / ratedMovies.length

    const distribution = Array(11).fill(0)
    ratedMovies.forEach((item) => {
      const roundedRating = Math.round(item.rating)
      if (roundedRating >= 0 && roundedRating <= 10) {
        distribution[roundedRating] += 1
      }
    })

    return {
      average: average.toFixed(1),
      totalRated: ratedMovies.length,
      distribution,
      maxFreq: Math.max(...distribution, 1)
    }
  }, [watchedMovies])

  // 3. ANÁLISE ESTATÍSTICA DE FILMES ASSISTIDOS POR MÊS
  const monthlyStats = useMemo(() => {
    const monthsMap = {}

    watchedMovies.forEach((item) => {
      if (!item.watchedAt) return

      const rawDate = typeof item.watchedAt === 'string'
        ? item.watchedAt.replace('Z', '')
        : item.watchedAt
      const date = new Date(rawDate)

      if (isNaN(date.getTime())) return

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const rawLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      const formattedLabel = rawLabel.replace('.', '').replace(' de ', '/')
      const monthLabel = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1)

      if (!monthsMap[key]) {
        monthsMap[key] = { label: monthLabel, count: 0, key }
      }
      monthsMap[key].count += 1
    })

    const sortedMonths = Object.values(monthsMap).sort((a, b) => a.key.localeCompare(b.key))
    const counts = sortedMonths.map((m) => m.count)

    if (counts.length === 0) {
      return { list: [], averagePerMonth: '0.0', maxMonth: 1, totalMonths: 0 }
    }

    const totalCount = counts.reduce((acc, curr) => acc + curr, 0)
    const averagePerMonth = (totalCount / counts.length).toFixed(1)
    const maxMonth = Math.max(...counts, 1)

    return {
      list: sortedMonths,
      averagePerMonth,
      maxMonth,
      totalMonths: counts.length
    }
  }, [watchedMovies])

  if (loading) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-dust">Carregando métricas...</p>
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl text-cream">Dashboard & Estatísticas</h1>
      <p className="mt-1 text-sm text-dust">
        Acompanhe seus hábitos de consumo cinematográfico e métricas pessoais.
      </p>

      {/* Cartões Resumo */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-dust">Total Assistidos</p>
          <p className="mt-2 font-display text-4xl text-cream">{watchedMovies.length}</p>
        </div>

        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-dust">Tempo de Tela</p>
          <p className="mt-2 font-display text-3xl text-cream">
            {timeStats.formatted}
          </p>
          <p className="mt-1 text-[11px] text-dust">
            {timeStats.days > 0 && `${timeStats.days}d e `}{timeStats.hours}h acumuladas
          </p>
        </div>

        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-dust">Média das Notas</p>
          <p className="mt-2 font-display text-4xl text-marquee-gold">
            {ratingStats.average} <span className="text-sm font-normal text-dust">/ 10</span>
          </p>
        </div>

        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-dust">Média por Mês</p>
          <p className="mt-2 font-display text-4xl text-cream">
            {monthlyStats.averagePerMonth} <span className="text-sm font-normal text-dust">filmes/mês</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Gráfico 1: Distribuição de Notas (0 a 10) */}
        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6">
          <h2 className="font-display text-xl text-cream">Distribuição de Notas</h2>
          <p className="mt-1 text-xs text-dust">Frequência de filmes avaliados por pontuação de 0 a 10.</p>

          <div className="mt-6 flex h-48 items-end justify-between gap-1.5 border-b border-cinema-surface-2 pb-2 pt-6">
            {ratingStats.distribution.map((count, score) => {
              const heightPercent = (count / ratingStats.maxFreq) * 100
              return (
                <div key={score} className="group flex h-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1 text-[10px] text-dust opacity-0 transition-opacity group-hover:opacity-100">
                    {count}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="min-h-[2px] w-full rounded-t bg-marquee-gold/80 transition-all group-hover:bg-marquee-gold"
                  />
                  <span className="mt-2 text-xs font-semibold text-cream">{score}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gráfico 2: Filmes Assistidos por Mês */}
        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6">
          <h2 className="font-display text-xl text-cream">Filmes por Mês</h2>
          <p className="mt-1 text-xs text-dust">Histórico de filmes assistidos por período de tempo.</p>

          {monthlyStats.list.length === 0 ? (
            <p className="mt-12 text-center text-sm text-dust">
              Nenhuma data registrada nos filmes assistidos.
            </p>
          ) : (
            <div className="mt-6 flex h-48 items-end justify-between gap-2 overflow-x-auto border-b border-cinema-surface-2 pb-2 pt-6">
              {monthlyStats.list.map((item) => {
                const heightPercent = (item.count / monthlyStats.maxMonth) * 100
                return (
                  <div key={item.key} className="group flex h-full min-w-[48px] flex-1 flex-col items-center justify-end">
                    <span className="mb-1 text-[10px] text-dust opacity-0 transition-opacity group-hover:opacity-100">
                      {item.count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="min-h-[2px] w-full rounded-t bg-velvet/80 transition-all group-hover:bg-velvet"
                    />
                    <span className="mt-2 whitespace-nowrap text-[10px] font-medium text-cream">
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}