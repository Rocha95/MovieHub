import { useEffect, useState, useMemo } from 'react'
import api from '../api/client'

export default function Dashboard() {
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/library')
      .then((res) => setLibrary(res.data))
      .catch((err) => console.error('Erro ao carregar dados do dashboard:', err))
      .finally(() => setLoading(false))
  }, [])

  // Filtrar apenas itens que foram marcados como assistidos
  const watchedMovies = useMemo(() => {
    return library.filter((item) => item.status === 'WATCHED')
  }, [library])

  // 1. CÁLCULOS DE NOTAS (0 a 10)
  const ratingStats = useMemo(() => {
    // Apenas filmes com nota cadastrada
    const ratedMovies = watchedMovies.filter((item) => typeof item.rating === 'number')

    if (ratedMovies.length === 0) {
      return { average: 0, totalRated: 0, distribution: Array(11).fill(0) }
    }

    const total = ratedMovies.reduce((acc, curr) => acc + curr.rating, 0)
    const average = total / ratedMovies.length

    // Distribuição de frequências por cada nota de 0 a 10
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
      maxFreq: Math.max(...distribution, 1) // Para dimensionar a altura do gráfico
    }
  }, [watchedMovies])

  // 2. ANÁLISE ESTATÍSTICA DE FILMES ASSISTIDOS POR MÊS
  const monthlyStats = useMemo(() => {
    const monthsMap = {}

    watchedMovies.forEach((item) => {
      if (!item.watchedDate) return

      const date = new Date(item.watchedDate)
      if (isNaN(date.getTime())) return

      // Formato da chave: YYYY-MM para ordenação e agrupamento
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

      if (!monthsMap[key]) {
        monthsMap[key] = { label: monthLabel, count: 0, key }
      }
      monthsMap[key].count += 1
    })

    // Ordena do mês mais antigo ao mais recente
    const sortedMonths = Object.values(monthsMap).sort((a, b) => a.key.localeCompare(b.key))
    const counts = sortedMonths.map((m) => m.count)

    if (counts.length === 0) {
      return { list: [], averagePerMonth: 0, maxMonth: 0, totalMonths: 0 }
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
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5">
          <p className="text-xs text-dust font-medium uppercase tracking-wider">Total Assistidos</p>
          <p className="mt-2 font-display text-4xl text-cream">{watchedMovies.length}</p>
        </div>

        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5">
          <p className="text-xs text-dust font-medium uppercase tracking-wider">Média das Notas (0 - 10)</p>
          <p className="mt-2 font-display text-4xl text-marquee-gold">
            {ratingStats.average} <span className="text-sm font-normal text-dust">/ 10</span>
          </p>
        </div>

        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5">
          <p className="text-xs text-dust font-medium uppercase tracking-wider">Média por Mês</p>
          <p className="mt-2 font-display text-4xl text-cream">
            {monthlyStats.averagePerMonth} <span className="text-sm font-normal text-dust">filmes/mês</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Gráfico 1: Distribuição de Notas (0 a 10) */}
        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6">
          <h2 className="font-display text-xl text-cream">Distribuição de Notas</h2>
          <p className="text-xs text-dust mt-1">Frequência de filmes avaliados por pontuação de 0 a 10.</p>

          <div className="mt-6 flex items-end justify-between gap-1.5 h-48 pt-6 pb-2 border-b border-cinema-surface-2">
            {ratingStats.distribution.map((count, score) => {
              const heightPercent = (count / ratingStats.maxFreq) * 100
              return (
                <div key={score} className="flex flex-1 flex-col items-center h-full justify-end group">
                  <span className="text-[10px] text-dust mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full rounded-t bg-marquee-gold/80 group-hover:bg-marquee-gold transition-all min-h-[2px]"
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
          <p className="text-xs text-dust mt-1">Histórico de filmes assistidos por período de tempo.</p>

          {monthlyStats.list.length === 0 ? (
            <p className="mt-12 text-center text-sm text-dust">
              Nenhuma data registrada nos filmes assistidos.
            </p>
          ) : (
            <div className="mt-6 flex items-end justify-between gap-2 h-48 pt-6 pb-2 border-b border-cinema-surface-2 overflow-x-auto">
              {monthlyStats.list.map((item) => {
                const heightPercent = (item.count / monthlyStats.maxMonth) * 100
                return (
                  <div key={item.key} className="flex flex-1 min-w-[36px] flex-col items-center h-full justify-end group">
                    <span className="text-[10px] text-dust mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-t bg-velvet/80 group-hover:bg-velvet transition-all min-h-[2px]"
                    />
                    <span className="mt-2 text-[10px] font-medium text-cream capitalize whitespace-nowrap">
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