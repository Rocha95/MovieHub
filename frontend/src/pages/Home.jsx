import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../api/client'
import MovieCard from '../components/MovieCard'


function MovieSection({ title, movies, loading }) {

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">

      <h2 className="font-display text-2xl tracking-wide text-cream">
        {title}
      </h2>


      {loading ? (

        <p className="mt-4 text-sm text-dust">
          Carregando...
        </p>

      ) : (

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

          {movies.map((movie) => (

            <MovieCard
              key={movie.id}
              movie={movie}
            />

          ))}

        </div>

      )}

    </section>
  )
}


export default function Home() {


  const [nowPlaying, setNowPlaying] = useState([])
  const [popular, setPopular] = useState([])
  const [topRated, setTopRated] = useState([])
  const [upcoming, setUpcoming] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)



  useEffect(() => {


    async function loadMovies() {


      try {


        const [
          nowPlayingRes,
          popularRes,
          topRatedRes,
          upcomingRes

        ] = await Promise.all([


          api.get('/movies/now-playing'),

          api.get('/movies/popular'),

          api.get('/movies/top-rated'),

          api.get('/movies/upcoming')


        ])


        setNowPlaying(nowPlayingRes.data)

        setPopular(popularRes.data)

        setTopRated(topRatedRes.data)

        setUpcoming(upcomingRes.data)



      } catch (err) {


        console.error(err)

        setError(
          'Não foi possível carregar os filmes.'
        )


      } finally {

        setLoading(false)

      }


    }


    loadMovies()


  }, [])



  const featured = nowPlaying[0]



  if (error) {

    return (

      <div className="p-10 text-center text-red-400">

        {error}

      </div>

    )

  }



  return (

    <div>


      {featured && (

        <section

          className="relative bg-cover bg-center py-24"

          style={{

            backgroundImage:

              `
              linear-gradient(
                to top,
                var(--color-cinema-black),
                rgba(18,14,26,0.4)
              ),
              url(${featured.poster})
              `

          }}

        >


          <div className="mx-auto max-w-6xl px-6">


            <p className="font-display tracking-[0.3em] text-marquee-gold">

              EM CARTAZ AGORA

            </p>



            <h1 className="mt-2 max-w-xl font-display text-5xl leading-tight text-cream">

              {featured.title}

            </h1>



            <p className="mt-4 max-w-lg text-sm text-dust">

              {featured.overview}

            </p>



            <Link

              to={`/filme/${featured.id}`}

              className="
                mt-6
                inline-block
                rounded-md
                bg-marquee-gold
                px-6
                py-3
                font-semibold
                text-cinema-black
              "

            >

              Ver detalhes

            </Link>


          </div>


        </section>

      )}



      <MovieSection

        title="🔥 Em cartaz"

        movies={nowPlaying}

        loading={loading}

      />



      <MovieSection

        title="⭐ Populares"

        movies={popular}

        loading={loading}

      />



      <MovieSection

        title="🏆 Melhores avaliados"

        movies={topRated}

        loading={loading}

      />



      <MovieSection

        title="🎬 Próximos lançamentos"

        movies={upcoming}

        loading={loading}

      />


    </div>

  )

}
