import { Link } from 'react-router-dom'

const FALLBACK_POSTER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
       <rect width="100%" height="100%" fill="#1c1626"/>
       <text x="50%" y="50%" fill="#948fa3" font-family="sans-serif"
             font-size="16" text-anchor="middle">sem pôster</text>
     </svg>`
  )

export default function MovieCard({ movie }) {
  const year = movie.releaseDate ? movie.releaseDate.slice(0, 4) : '—'
  const rating = movie.voteAverage ? movie.voteAverage.toFixed(1) : '—'

  return (
    <Link
      to={`/filme/${movie.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-cinema-surface"
    >
      <div className="relative">
        <img
          src={movie.poster || FALLBACK_POSTER}
          alt={`Pôster de ${movie.title}`}
          className="aspect-[2/3] w-full object-cover"
          loading="lazy"
        />
        <span className="absolute right-2 top-2 rounded-full bg-cinema-black/80 px-2 py-0.5 text-xs font-semibold text-marquee-gold">
          ★ {rating}
        </span>
      </div>

      <div className="ticket-notch relative border-t border-dashed border-cinema-surface-2 px-3 py-3">
        <h3 className="truncate font-display text-lg tracking-wide text-cream">
          {movie.title}
        </h3>
        <p className="text-xs text-dust">{year}</p>
      </div>
    </Link>
  )
}
