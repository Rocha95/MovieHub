import { useEffect, useState, useMemo } from 'react';
import api from '../api/client';

function formatRuntime(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) {
    return { days: 0, hours: 0, minutes: 0, formatted: '0m' };
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingMinutesAfterDays = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return {
    days,
    hours,
    minutes,
    formatted: parts.join(' '),
  };
}

function parseDate(rawValue) {
  if (!rawValue) return null;
  const raw = typeof rawValue === 'string' ? rawValue.replace('Z', '') : rawValue;
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
}

function extractGenres(item) {
  if (Array.isArray(item.genres)) return item.genres;
  if (typeof item.genre === 'string') return item.genre.split(',').map((g) => g.trim());
  if (typeof item.genres === 'string') return item.genres.split(',').map((g) => g.trim());
  return [];
}

function relativeLabel(date) {
  const diffDays = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} sem.`;
  return `Há ${Math.floor(diffDays / 30)} meses`;
}

const DONUT_COLORS = [
  '#e5a00d', // Gold
  '#991b1b', // Red / Velvet
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#64748b', // Slate
];

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function TrendBadge({ deltaPercent }) {
  if (deltaPercent === null) return null;
  const isUp = deltaPercent > 0;
  const isFlat = deltaPercent === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isFlat
          ? 'bg-cinema-surface-2 text-dust'
          : isUp
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-red-500/10 text-red-400'
      }`}
    >
      {isFlat ? '—' : isUp ? '▲' : '▼'} {Math.abs(deltaPercent)}%
    </span>
  );
}

export default function Dashboard() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL' | 'YEAR' | '6M'
  const [genreFilter, setGenreFilter] = useState('ALL');

  useEffect(() => {
    api
      .get('/library')
      .then((res) => setLibrary(res.data))
      .catch((err) => console.error('Erro ao carregar dados do dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  // Lista de gêneros disponíveis para o seletor (independe dos filtros ativos)
  const allGenres = useMemo(() => {
    const set = new Set();
    library
      .filter((item) => item.status === 'WATCHED')
      .forEach((item) => extractGenres(item).forEach((g) => g && set.add(g)));
    return Array.from(set).sort();
  }, [library]);

  // Assistidos filtrados por gênero (base para métricas independentes de período, como a tendência de 30 dias)
  const genreFilteredWatched = useMemo(() => {
    let list = library.filter((item) => item.status === 'WATCHED');
    if (genreFilter !== 'ALL') {
      list = list.filter((item) => extractGenres(item).includes(genreFilter));
    }
    return list;
  }, [library, genreFilter]);

  // Filtragem baseada no status, gênero e período selecionado
  const watchedMovies = useMemo(() => {
    let list = genreFilteredWatched;

    if (timeFilter !== 'ALL') {
      const now = new Date();
      const cutoffMonths = timeFilter === 'YEAR' ? 12 : 6;
      const cutoffDate = new Date(now.setMonth(now.getMonth() - cutoffMonths));

      list = list.filter((item) => {
        const watchDate = parseDate(item.watchedAt);
        return watchDate && watchDate >= cutoffDate;
      });
    }

    return list;
  }, [genreFilteredWatched, timeFilter]);

  // 1. Tempo Total Assistido
  const timeStats = useMemo(() => {
    const totalMinutes = watchedMovies.reduce((acc, curr) => {
      const runtime = typeof curr.runtime === 'number' ? curr.runtime : 0;
      return acc + runtime;
    }, 0);

    return formatRuntime(totalMinutes);
  }, [watchedMovies]);

  // 2. Notas (0 a 10)
  const ratingStats = useMemo(() => {
    const ratedMovies = watchedMovies.filter(
      (item) => typeof item.rating === 'number'
    );

    if (ratedMovies.length === 0) {
      return { average: '0.0', totalRated: 0, distribution: Array(11).fill(0), maxFreq: 1 };
    }

    const total = ratedMovies.reduce((acc, curr) => acc + curr.rating, 0);
    const average = total / ratedMovies.length;

    const distribution = Array(11).fill(0);
    ratedMovies.forEach((item) => {
      const roundedRating = Math.round(item.rating);
      if (roundedRating >= 0 && roundedRating <= 10) {
        distribution[roundedRating] += 1;
      }
    });

    return {
      average: average.toFixed(1),
      totalRated: ratedMovies.length,
      distribution,
      maxFreq: Math.max(...distribution, 1),
    };
  }, [watchedMovies]);

  // 3. Assistidos por Mês
  const monthlyStats = useMemo(() => {
    const monthsMap = {};

    watchedMovies.forEach((item) => {
      const date = parseDate(item.watchedAt);
      if (!date) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const rawLabel = date.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      });
      const formattedLabel = rawLabel.replace('.', '').replace(' de ', '/');
      const monthLabel =
        formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);

      if (!monthsMap[key]) {
        monthsMap[key] = { label: monthLabel, count: 0, key };
      }
      monthsMap[key].count += 1;
    });

    const sortedMonths = Object.values(monthsMap).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
    const counts = sortedMonths.map((m) => m.count);

    if (counts.length === 0) {
      return { list: [], averagePerMonth: '0.0', maxMonth: 1, totalMonths: 0 };
    }

    const totalCount = counts.reduce((acc, curr) => acc + curr, 0);
    const averagePerMonth = (totalCount / counts.length).toFixed(1);
    const maxMonth = Math.max(...counts, 1);

    return {
      list: sortedMonths,
      averagePerMonth,
      maxMonth,
      totalMonths: counts.length,
    };
  }, [watchedMovies]);

  // 4. Distribuição por Gênero (+ índice de diversidade)
  const genreStats = useMemo(() => {
    const genreCount = {};
    let totalGenreOccurrences = 0;

    watchedMovies.forEach((movie) => {
      extractGenres(movie).forEach((g) => {
        if (!g) return;
        genreCount[g] = (genreCount[g] || 0) + 1;
        totalGenreOccurrences += 1;
      });
    });

    const sorted = Object.entries(genreCount)
      .map(([name, count]) => ({
        name,
        count,
        percent: totalGenreOccurrences > 0 ? (count / totalGenreOccurrences) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topGenres = sorted.slice(0, 5);
    const otherGenres = sorted.slice(5);

    if (otherGenres.length > 0) {
      const otherCount = otherGenres.reduce((acc, curr) => acc + curr.count, 0);
      topGenres.push({
        name: 'Outros',
        count: otherCount,
        percent: totalGenreOccurrences > 0 ? (otherCount / totalGenreOccurrences) * 100 : 0,
      });
    }

    // Índice de diversidade (entropia de Shannon normalizada entre 0 e 1)
    const distinctGenres = sorted.length;
    let diversityLabel = 'Sem dados';
    if (distinctGenres === 1) {
      diversityLabel = 'Focado';
    } else if (distinctGenres > 1) {
      const entropy = -sorted.reduce((acc, g) => {
        const p = g.count / totalGenreOccurrences;
        return acc + (p > 0 ? p * Math.log2(p) : 0);
      }, 0);
      const maxEntropy = Math.log2(distinctGenres);
      const normalized = maxEntropy > 0 ? entropy / maxEntropy : 0;
      if (normalized < 0.5) diversityLabel = 'Focado';
      else if (normalized < 0.8) diversityLabel = 'Equilibrado';
      else diversityLabel = 'Eclético';
    }

    return {
      list: topGenres,
      total: totalGenreOccurrences,
      topGenreName: sorted[0]?.name || 'N/A',
      diversityLabel,
    };
  }, [watchedMovies]);

  // 5. Sequência de dias assistindo (maior maratona contínua)
  const streakStats = useMemo(() => {
    const uniqueDays = new Set();
    watchedMovies.forEach((item) => {
      const date = parseDate(item.watchedAt);
      if (!date) return;
      uniqueDays.add(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate()
        ).padStart(2, '0')}`
      );
    });

    const sortedDays = Array.from(uniqueDays).sort();
    if (sortedDays.length === 0) return { longest: 0 };

    let longest = 1;
    let current = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const diffDays = Math.round(
        (new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / (24 * 60 * 60 * 1000)
      );
      current = diffDays === 1 ? current + 1 : 1;
      longest = Math.max(longest, current);
    }

    return { longest };
  }, [watchedMovies]);

  // 6. Tendência: últimos 30 dias vs 30 dias anteriores (independente do filtro de período)
  const trendStats = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    let last30 = 0;
    let prev30 = 0;

    genreFilteredWatched.forEach((item) => {
      const date = parseDate(item.watchedAt);
      if (!date) return;
      const diff = now - date.getTime();
      if (diff >= 0 && diff <= 30 * day) last30 += 1;
      else if (diff > 30 * day && diff <= 60 * day) prev30 += 1;
    });

    let deltaPercent = null;
    if (prev30 > 0) {
      deltaPercent = Math.round(((last30 - prev30) / prev30) * 100);
    } else if (last30 > 0) {
      deltaPercent = 100;
    } else {
      deltaPercent = 0;
    }

    return { last30, prev30, deltaPercent };
  }, [genreFilteredWatched]);

  // 7. Atividade por dia da semana
  const weekdayStats = useMemo(() => {
    const counts = Array(7).fill(0);

    watchedMovies.forEach((item) => {
      const date = parseDate(item.watchedAt);
      if (!date) return;
      const jsDay = date.getDay(); // 0 = domingo
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      counts[idx] += 1;
    });

    const max = Math.max(...counts, 1);
    const hasData = counts.some((c) => c > 0);
    const topIdx = counts.indexOf(Math.max(...counts));

    return {
      counts,
      max,
      favoriteDay: hasData ? WEEKDAY_LABELS[topIdx] : 'N/A',
    };
  }, [watchedMovies]);

  // 8. Atividade recente (últimos filmes assistidos)
  const recentActivity = useMemo(() => {
    return [...watchedMovies]
      .map((item) => ({ item, date: parseDate(item.watchedAt) }))
      .filter(({ date }) => date)
      .sort((a, b) => b.date - a.date)
      .slice(0, 6)
      .map(({ item, date }) => ({ ...item, relative: relativeLabel(date) }));
  }, [watchedMovies]);

  // 9. Destaques do Portfólio (Recordes)
  const highlights = useMemo(() => {
    if (watchedMovies.length === 0) return null;

    const longestMovie = [...watchedMovies].sort(
      (a, b) => (b.runtime || 0) - (a.runtime || 0)
    )[0];

    const highestRated = [...watchedMovies].sort(
      (a, b) => (b.rating || 0) - (a.rating || 0)
    )[0];

    return {
      longest: longestMovie ? `${longestMovie.title} (${longestMovie.runtime}m)` : 'N/A',
      highest: highestRated ? `${highestRated.title} (${highestRated.rating}/10)` : 'N/A',
    };
  }, [watchedMovies]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-dust">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-marquee-gold border-t-transparent" />
          <span>Sincronizando estatísticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 transition-all">
      {/* Cabeçalho com Filtros de Período e Gênero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-cream">
            Dashboard & Cinema Analytics
          </h1>
          <p className="mt-1 text-sm text-dust">
            Métricas de consumo cinematográfico, distribuição de preferências e tempo de tela.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de Gênero */}
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded-lg border border-cinema-surface-2 bg-cinema-surface px-3 py-2 text-xs font-medium text-cream focus:border-marquee-gold focus:outline-none"
          >
            <option value="ALL">Todos os gêneros</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Botões de Filtro de Período */}
          <div className="flex items-center gap-1 rounded-lg border border-cinema-surface-2 bg-cinema-surface p-1">
            {[
              { id: 'ALL', label: 'Tudo' },
              { id: 'YEAR', label: 'Último Ano' },
              { id: '6M', label: '6 Meses' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  timeFilter === tab.id
                    ? 'bg-marquee-gold text-black shadow-sm'
                    : 'text-dust hover:text-cream'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cartões de Métrica KPI */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="group rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5 transition-all hover:border-marquee-gold/40 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-dust">
              Total Assistidos
            </p>
            <span className="rounded-full bg-cinema-surface-2 p-2 text-marquee-gold">
              🎬
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="font-display text-4xl font-bold text-cream">
              {watchedMovies.length}
            </p>
            <TrendBadge deltaPercent={trendStats.deltaPercent} />
          </div>
          <p className="mt-1 text-[11px] text-dust">vs. 30 dias anteriores</p>
        </div>

        <div className="group rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5 transition-all hover:border-marquee-gold/40 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-dust">
              Tempo de Tela
            </p>
            <span className="rounded-full bg-cinema-surface-2 p-2 text-emerald-400">
              ⏱️
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-cream">
            {timeStats.formatted}
          </p>
          <p className="mt-1 text-[11px] text-dust">
            {timeStats.days > 0 ? `${timeStats.days} dias e ` : ''}
            {timeStats.hours}h acumuladas
          </p>
        </div>

        <div className="group rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5 transition-all hover:border-marquee-gold/40 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-dust">
              Média de Avaliações
            </p>
            <span className="rounded-full bg-cinema-surface-2 p-2 text-yellow-400">
              ⭐
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold text-marquee-gold">
            {ratingStats.average}{' '}
            <span className="text-xs font-normal text-dust">/ 10</span>
          </p>
          <p className="mt-1 text-[11px] text-dust">
            Baseado em {ratingStats.totalRated} títulos avaliados
          </p>
        </div>

        <div className="group rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5 transition-all hover:border-marquee-gold/40 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-dust">
              Ritmo Mensal
            </p>
            <span className="rounded-full bg-cinema-surface-2 p-2 text-blue-400">
              📈
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold text-cream">
            {monthlyStats.averagePerMonth}
          </p>
          <p className="mt-1 text-[11px] text-dust">Média de filmes assistidos/mês</p>
        </div>

        <div className="group rounded-xl border border-cinema-surface-2 bg-cinema-surface p-5 transition-all hover:border-marquee-gold/40 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-dust">
              Maior Sequência
            </p>
            <span className="rounded-full bg-cinema-surface-2 p-2 text-orange-400">
              🔥
            </span>
          </div>
          <p className="mt-3 font-display text-4xl font-bold text-cream">
            {streakStats.longest}
            <span className="text-xs font-normal text-dust"> dias</span>
          </p>
          <p className="mt-1 text-[11px] text-dust">Maratona contínua mais longa</p>
        </div>
      </div>

      {/* Grid Principal do Dashboard */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Gráfico 1: Gêneros (Rosca SVG + Legend Dynamic) */}
        <div className="flex flex-col justify-between rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-cream">
                Gêneros Dominantes
              </h2>
              {genreStats.diversityLabel !== 'Sem dados' && (
                <span className="rounded-full bg-cinema-surface-2 px-2 py-0.5 text-[10px] font-medium text-dust">
                  {genreStats.diversityLabel}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-dust">Apetite por categoria cinematográfica.</p>

            {genreStats.list.length === 0 ? (
              <p className="mt-12 text-center text-sm text-dust">Nenhum dado disponível.</p>
            ) : (
              <div className="mt-6 flex flex-col items-center">
                <div className="relative h-44 w-44">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90 transform">
                    {(() => {
                      let accumulatedPercent = 0;
                      return genreStats.list.map((item, idx) => {
                        const strokeDasharray = `${item.percent} ${100 - item.percent}`;
                        const strokeDashoffset = -accumulatedPercent;
                        accumulatedPercent += item.percent;

                        return (
                          <circle
                            key={item.name}
                            cx="18"
                            cy="18"
                            r="15.91549430918954"
                            fill="transparent"
                            stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                            strokeWidth="3.5"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-700 ease-out hover:stroke-[4]"
                          />
                        );
                      });
                    })()}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-display text-2xl font-bold text-cream">
                      {genreStats.total}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-dust">
                      Títulos
                    </span>
                  </div>
                </div>

                <div className="mt-6 w-full space-y-2.5">
                  {genreStats.list.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-md p-1.5 text-xs transition-colors hover:bg-cinema-surface-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                          }}
                        />
                        <span className="font-medium text-cream">{item.name}</span>
                      </div>
                      <span className="font-mono text-xs text-dust">
                        {item.percent.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos de Métricas de Tempo e Avaliações */}
        <div className="grid grid-cols-1 gap-8 lg:col-span-2">
          {/* Gráfico 2: Curva/Distribuição de Notas */}
          <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-cream">
                  Distribuição de Notas
                </h2>
                <p className="mt-1 text-xs text-dust">Frequência de pontuações de 0 a 10.</p>
              </div>
            </div>

            <div className="mt-6 flex h-44 items-end justify-between gap-2 border-b border-cinema-surface-2 pb-2 pt-6">
              {ratingStats.distribution.map((count, score) => {
                const heightPercent = (count / ratingStats.maxFreq) * 100;
                return (
                  <div
                    key={score}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                  >
                    {/* Tooltip Hover */}
                    <div className="absolute -top-7 rounded bg-cinema-surface-2 px-2 py-0.5 text-[10px] text-cream opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {count} {count === 1 ? 'filme' : 'filmes'}
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="min-h-[3px] w-full rounded-t bg-gradient-to-t from-marquee-gold/40 to-marquee-gold transition-all duration-300 group-hover:brightness-125"
                    />
                    <span className="mt-2 text-xs font-semibold text-cream">{score}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico 3: Atividade ao longo dos Meses (linha suave com área) */}
          <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6">
            <h2 className="font-display text-lg font-semibold text-cream">
              Frequência de Consumo por Mês
            </h2>
            <p className="mt-1 text-xs text-dust">Volume de filmes assistidos por período.</p>

            {monthlyStats.list.length === 0 ? (
              <p className="mt-12 text-center text-sm text-dust">
                Sem dados de datas para exibição no período.
              </p>
            ) : (
              <div className="relative mt-6 h-44">
                <svg
                  viewBox="0 0 600 160"
                  preserveAspectRatio="none"
                  className="h-full w-full overflow-visible"
                >
                  <defs>
                    <linearGradient id="monthlyAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e5a00d" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#e5a00d" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {(() => {
                    const list = monthlyStats.list;
                    const n = list.length;
                    const stepX = n > 1 ? 600 / (n - 1) : 0;
                    const points = list.map((m, idx) => {
                      const x = n > 1 ? idx * stepX : 300;
                      const y = 150 - (m.count / monthlyStats.maxMonth) * 130;
                      return { x, y, ...m };
                    });

                    const linePath = points
                      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
                      .join(' ');
                    const areaPath = `${linePath} L ${points[points.length - 1].x},150 L ${points[0].x},150 Z`;

                    return (
                      <>
                        <path d={areaPath} fill="url(#monthlyAreaFill)" />
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#e5a00d"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {points.map((p) => (
                          <circle key={p.key} cx={p.x} cy={p.y} r="4" fill="#e5a00d">
                            <title>
                              {p.label}: {p.count} {p.count === 1 ? 'filme' : 'filmes'}
                            </title>
                          </circle>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                <div className="mt-2 flex justify-between text-[10px] font-medium text-dust">
                  {monthlyStats.list.map((m) => (
                    <span key={m.key} className="flex-1 text-center">
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nova Seção: Hábitos de Consumo (Dia da Semana + Atividade Recente) */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Atividade por Dia da Semana */}
        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6 lg:col-span-1">
          <h2 className="font-display text-lg font-semibold text-cream">
            Dias de Maior Consumo
          </h2>
          <p className="mt-1 text-xs text-dust">
            Dia preferido: <span className="text-cream">{weekdayStats.favoriteDay}</span>
          </p>

          <div className="mt-6 flex h-32 items-end justify-between gap-2">
            {weekdayStats.counts.map((count, idx) => {
              const heightPercent = (count / weekdayStats.max) * 100;
              return (
                <div
                  key={WEEKDAY_LABELS[idx]}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div className="absolute -top-6 rounded bg-cinema-surface-2 px-1.5 py-0.5 text-[10px] text-cream opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {count}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="min-h-[3px] w-full rounded-t bg-gradient-to-t from-blue-900/50 to-blue-500 transition-all duration-300 group-hover:brightness-125"
                  />
                  <span className="mt-2 text-[10px] font-medium text-dust">
                    {WEEKDAY_LABELS[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-cream">
            Assistidos Recentemente
          </h2>
          <p className="mt-1 text-xs text-dust">Últimos títulos marcados como assistidos.</p>

          {recentActivity.length === 0 ? (
            <p className="mt-8 text-center text-sm text-dust">Nenhuma atividade registrada.</p>
          ) : (
            <ul className="mt-4 divide-y divide-cinema-surface-2">
              {recentActivity.map((item) => (
                <li
                  key={`${item.title}-${item.watchedAt}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-cream">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-dust">
                      {extractGenres(item).slice(0, 2).join(' · ') || 'Sem gênero'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {typeof item.rating === 'number' && (
                      <span className="rounded-full bg-cinema-surface-2 px-2 py-0.5 text-[11px] font-semibold text-marquee-gold">
                        {item.rating}/10
                      </span>
                    )}
                    <span className="text-[11px] text-dust">{item.relative}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Seção Extra de Curiosidades / Highlights do Portfólio */}
      {highlights && (
        <div className="mt-8 rounded-xl border border-cinema-surface-2 bg-cinema-surface/50 p-5 backdrop-blur">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-dust">
            Destaques Rápidos
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-dust">Gênero Predileto</p>
              <p className="text-sm font-semibold text-cream">{genreStats.topGenreName}</p>
            </div>
            <div>
              <p className="text-xs text-dust">Filme de Maior Duração</p>
              <p className="truncate text-sm font-semibold text-cream">
                {highlights.longest}
              </p>
            </div>
            <div>
              <p className="text-xs text-dust">Avaliador Exigente</p>
              <p className="truncate text-sm font-semibold text-cream">
                {highlights.highest}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
