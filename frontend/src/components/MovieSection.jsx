import MovieCard from "./MovieCard";


function MovieSection({title, movies}) {

    return (

        <section>

            <h2>
                {title}
            </h2>


            <div>

                {
                    movies.map(movie => (

                        <MovieCard
                            key={movie.id}
                            movie={movie}
                        />

                    ))
                }

            </div>

        </section>

    );

}

export default MovieSection;