import { useEffect, useState, useMemo } from 'react'
import { 
  Film, 
  Clock, 
  Star, 
  Bookmark, 
  Trophy, 
  TrendingUp, 
  Clapperboard,
  Calendar
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import api from '../api/client'

// Componente para Cards KPI
function MetricCard({ icon: Icon, label, value, subtext, highlight }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-cinema-surface border border-white/5 p-5 transition-all duration-300 hover:border-marquee-gold/30 hover:shadow-lg hover:shadow-marquee-gold/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-dust">{label}</p>
        <div className="rounded-lg bg-marquee-gold/10 p-2 text-marquee-gold">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-cream">
        {value}
      </p>
      {subtext && (
        <p className={`mt-1 text-xs ${highlight ? 'text-marquee-gold font-medium' : 'text-dust/70'}`}>
          {subtext}
        </p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('all') // 'all' | 'year' | 'month'

  useEffect(() => {
    api
      .get('/library/stats', { params: { timeframe } })
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Erro ao carregar estatísticas:', err))
      .finally(() => setLoading(false))
  }, [timeframe])

  // Cores cinematográficas elegantes para os gráficos
  const CHART_COLORS = ['#e5a00d', '#a855f7', '#ef4444', '#3b82f6', '#10b981', '#64748b']

  // Converte minutos acumulados em formato Legível (ex: 298h / 12d 10h)
  const formattedRuntime = useMemo(() => {
    if (!stats?.totalRuntimeMinutes) return '0 min'
    const totalHours = Math.floor(stats.totalRuntimeMinutes / 60)
    if (totalHours < 24) return `${totalHours} horas`
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24
    return `${days}d ${hours}h em tela`
  }, [stats?.totalRuntimeMinutes])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-marquee-gold border-t-transparent" />
        <p className="mt-4 text-sm text-dust">Calculando suas métricas cinefílicas...</p>
      </div>
    )
  }

  if (!stats || stats.watchedCount === 0) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cinema-surface text-marquee-gold">
          <Clapperboard className="h-8 w-8" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-wide text-cream">
          Sua biblioteca está silenciosa
        </h1>
        <p className="mt-2 text-sm text-dust max-w-md mx-auto">
          Adicione filmes assistidos, atribua notas e organize suas listas para desbloquear gráficos avançados sobre seu perfil de espectador.
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      
      {/* CABEÇALHO COM SELEÇÃO DE PERÍODO */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wide text-marquee-gold flex items-center gap-3">
            <Trophy className="h-7 w-7 text-marquee-gold" />
            Dashboard Cinefílico
          </h1>
          <p className="mt-1 text-sm text-dust">
            Análise detalhada do seu hábito de consumo e preferências cinematográficas.
          </p>
        </div>

        {/* Filtro de Período */}
        <div className="flex items-center gap-1 rounded-lg bg-cinema-surface p-1 border border-white/5 self-start md:self-auto">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'year', label: 'Este Ano' },
            { id: 'month', label: '30 Dias' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeframe(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                timeframe === item.id
                  ? 'bg-marquee-gold text-cinema-black shadow-md'
                  : 'text-dust hover:text-cream'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Film}
          label="Filmes Assistidos"
          value={stats.watchedCount ?? 0}
          subtext="Total registrado na conta"
        />
        <MetricCard
          icon={Clock}
          label="Tempo de Tela"
          value={stats.totalRuntimeMinutes ? Math.floor(stats.totalRuntimeMinutes / 60) + ' hrs' : '0 hrs'}
          subtext={formattedRuntime}
          highlight
        />
        <MetricCard
          icon={Star}
          label="Média Pessoal"
          value={stats.averageRating ? `★ ${stats.averageRating.toFixed(1)}` : '—'}
          subtext="Média de notas atribuídas"
        />
        <MetricCard
          icon={Bookmark}
          label="Quero Assistir"
          value={stats.watchlistCount ?? 0}
          subtext="Filmes na sua Watchlist"
        />
      </div>

      {/* SEÇÃO PRINCIPAL DE GRÁFICOS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* GRÁFICO 1: Distribuição de Gêneros (Pie/Donut Chart) */}
        <div className="rounded-xl bg-cinema-surface border border-white/5 p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-xl text-cream font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-marquee-gold" />
              Gêneros Mais Assistidos
            </h2>
            <p className="text-xs text-dust mt-1">Proporção dos seus gêneros favoritos</p>
          </div>

          {stats.topGenres && stats.topGenres.length > 0 ? (
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topGenres}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {stats.topGenres.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18141f', borderColor: '#332a40', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-dust py-10 text-center">Sem dados suficientes de gêneros.</p>
          )}

          {/* Legenda Customizada */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {stats.topGenres?.slice(0, 6).map((genre, idx) => (
              <div key={genre.name} className="flex items-center gap-2">
                <span 
                  className="h-2.5 w-2.5 rounded-full" 
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                />
                <span className="text-cream truncate">{genre.name}</span>
                <span className="ml-auto text-dust font-mono">{genre.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICO 2: Distribuição de Notas (Bar Chart) */}
        <div className="rounded-xl bg-cinema-surface border border-white/5 p-6 lg:col-span-7 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-xl text-cream font-bold flex items-center gap-2">
              <Star className="h-5 w-5 text-marquee-gold" />
              Sua Distribuição de Notas
            </h2>
            <p className="text-xs text-dust mt-1">Frequência de notas atribuídas (1 a 10 estrelas)</p>
          </div>

          {stats.ratingDistribution && stats.ratingDistribution.length > 0 ? (
            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ratingDistribution}>
                  <XAxis dataKey="rating" stroke="#8c829e" fontSize={12} tickLine={false} />
                  <YAxis stroke="#8c829e" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#18141f', borderColor: '#332a40', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#e5a00d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-dust py-10 text-center">Avalie filmes para gerar seu histograma de notas.</p>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-dust border-t border-white/5 pt-3">
            <span>Nota mais comum: <strong className="text-cream">{stats.mostCommonRating ?? '—'} ★</strong></span>
            <span>Taxa de Aclamação (Nota 9-10): <strong className="text-marquee-gold">{stats.acclaimPercentage ?? 0}%</strong></span>
          </div>
        </div>

      </div>

      {/* SEÇÃO INFERIOR: DIRETORES E DESTAQUES */}
      {stats.topDirectors && stats.topDirectors.length > 0 && (
        <div className="rounded-xl bg-cinema-surface border border-white/5 p-6">
          <h2 className="font-display text-xl text-cream font-bold mb-4">
            Diretores Mais Assistidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {stats.topDirectors.slice(0, 4).map((director, index) => (
              <div 
                key={director.name} 
                className="flex items-center gap-4 rounded-lg bg-white/5 p-3 border border-white/5 hover:border-marquee-gold/20 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marquee-gold/10 font-display text-lg font-bold text-marquee-gold">
                  #{index + 1}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-cream truncate">{director.name}</p>
                  <p className="text-xs text-dust">{director.count} filme(s) visto(s)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  )
}