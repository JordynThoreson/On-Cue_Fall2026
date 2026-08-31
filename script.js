const genre = document.querySelector("#genre");
const runtime = document.querySelector("#runtime");
const button = document.querySelector("#findButton");
const results = document.querySelector("#results");

button.addEventListener("click", getShows);

async function getShows() {

    const selectedGenre = genre.value;
    const maxRuntime = Number(runtime.value);

    results.innerHTML = "<p>Finding your picks...</p>";

    try {

        const response = await fetch(
            "https://api.tvmaze.com/shows?page=1"
        );

        const shows = await response.json();

        const matches = shows.filter(function(show) {

            return show.genres.includes(selectedGenre) &&
                   show.runtime <= maxRuntime;

        });

        matches.sort(function(a, b) {

            return (b.rating.average || 0) -
                   (a.rating.average || 0);

        });

        results.innerHTML = "";

        matches.slice(0, 3).forEach(function(show) {

            const result = document.createElement("div");

            result.innerHTML = `
                <h3>${show.name}</h3>
                <p>Rating: ${show.rating.average || "N/A"}/10</p>
                <p>Runtime: ${show.runtime || "N/A"} minutes</p>
                <p>${show.summary || "No description available."}</p>
            `;

            results.appendChild(result);

        });

    } catch (error) {

        console.log(error);

        results.innerHTML =
            "<p>Sorry, something went wrong.</p>";
    }
}