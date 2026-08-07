import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import api from '../api/client'
import MovieCard from '../components/MovieCard'


export default function MovieDetails() {

  const { id } = useParams()

  const [movie, setMovie] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  const [loading, setLoading] = useState(true)



  useEffect(() => {

    async function loadMovie() {

      try {

        const [
          movieResponse,
          recommendationsResponse
        ] = await Promise.all([

          api.get(`/movies/${id}`),

          api.get(`/movies/${id}/recommendations`)

        ])


        setMovie(movieResponse.data)

        setRecommendations(
          recommendationsResponse.data
        )


      } catch (error) {

        console.error(
          'Erro ao carregar filme:',
          error
        )

      } finally {

        setLoading(false)

      }

    }


    loadMovie()


  }, [id])



  if (loading) {

    return (

      <div className="p-10 text-center text-dust">

        Carregando filme...

      </div>

    )

  }



  if (!movie) {

    return (

      <div className="p-10 text-center text-dust">

        Filme não encontrado.

      </div>

    )

  }



  return (

    <div>


      {/* Banner principal */}

      <section

        className="
          relative
          bg-cover
          bg-center
          py-20
        "

        style={{

          backgroundImage:

          `
          linear-gradient(
            to top,
            var(--color-cinema-black),
            rgba(18,14,26,0.5)
          ),
          url(${movie.poster})
          `

        }}

      >


        <div className="mx-auto max-w-6xl px-6">


          <div className="grid gap-8 md:grid-cols-3">


            {/* Poster */}

            <div>

              <img

                src={movie.poster}

                alt={movie.title}

                className="
                  rounded-lg
                  shadow-xl
                "

              />

            </div>



            {/* Informações */}

            <div className="md:col-span-2">


              <h1

                className="
                  font-display
                  text-5xl
                  text-cream
                "

              >

                {movie.title}

              </h1>



              <div className="mt-4 flex gap-4 text-sm text-dust">


                <span>

                  ⭐ {movie.voteAverage}

                </span>



                <span>

                  {movie.releaseDate}

                </span>


              </div>



              <p className="mt-6 text-dust leading-relaxed">

                {movie.overview}

              </p>



              {movie.director && (

                <p className="mt-4 text-cream">

                  Diretor:

                  <span className="text-dust">

                    {' '}
                    {movie.director}

                  </span>

                </p>

              )}



              <button

                className="
                  mt-8
                  rounded-md
                  bg-marquee-gold
                  px-6
                  py-3
                  font-semibold
                  text-cinema-black
                "

              >

                + Adicionar à biblioteca

              </button>


            </div>


          </div>


        </div>


      </section>





      {/* Recomendações */}

      <section className="mx-auto max-w-6xl px-6 py-10">


        <h2

          className="
            font-display
            text-2xl
            text-cream
          "

        >

          Filmes semelhantes

        </h2>



        <div

          className="
            mt-6
            grid
            grid-cols-2
            gap-4
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-6
          "

        >

          {recommendations.map((item) => (

            <MovieCard

              key={item.id}

              movie={item}

            />

          ))}


        </div>


      </section>



      <div className="px-6 pb-10">

        <Link

          to="/"

          className="
            text-marquee-gold
          "

        >

          ← Voltar

        </Link>

      </div>


    </div>

  )

}