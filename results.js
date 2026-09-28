const results = document.querySelector("#results");
const startOver = document.querySelector("#startOver");
const savedChoices = localStorage.getItem("onCueChoices");

if (!savedChoices) {

    results.innerHTML = `
        <p>
            Please complete the check-in first.
        </p>
    `;

} else {

    const choices = JSON.parse(savedChoices);

    getShows(choices);

}


async function getShows(choices) {

    try {

        const response = await fetch(
            "https://api.tvmaze.com/shows?page=1"
        );

        const shows = await response.json();


        const savedFeedback = JSON.parse(
            localStorage.getItem("onCueFeedback") || "[]"
        );


        const now = Date.now();


        const currentFeedback = savedFeedback.filter(function(feedback) {

            if (feedback.response === "not-now") {

                return now - feedback.time < 24 * 60 * 60 * 1000;

            }

            return true;

        });


        localStorage.setItem(
            "onCueFeedback",
            JSON.stringify(currentFeedback)
        );


        const choiceKey =
            choices.genre + "-" +
            choices.mood + "-" +
            choices.watching + "-" +
            choices.attention + "-" +
            choices.runtime;


        let matches = shows.filter(function(show) {

            const fitsPreferences =
                (choices.genre === "any" ||
                 show.genres.includes(choices.genre)) &&
                show.runtime &&
                show.runtime <= choices.runtime;


            if (!fitsPreferences) {
                return false;
            }


            const previousFeedback = currentFeedback.filter(function(feedback) {

                return feedback.showId === show.id;

            });


            const notRightNow = previousFeedback.some(function(feedback) {

                return feedback.response === "not-now" &&
                       now - feedback.time < 24 * 60 * 60 * 1000;

            });


            if (notRightNow) {
                return false;
            }


            const notLookingFor = previousFeedback.some(function(feedback) {

                return feedback.response === "not-looking" &&
                       feedback.choiceKey === choiceKey;

            });


            if (notLookingFor) {
                return false;
            }


            return true;

        });


        matches.forEach(function(show) {

            let score = 0;


            if (choices.genre !== "any" &&
                show.genres.includes(choices.genre)) {

                score += 5;

            }


            if (choices.mood === "happy" &&
                show.genres.includes("Comedy")) {

                score += 4;

            }

            if (choices.mood === "relaxed" &&
                (show.genres.includes("Comedy") ||
                 show.genres.includes("Romance"))) {

                score += 4;

            }

            if (choices.mood === "stressed" &&
                show.genres.includes("Comedy")) {

                score += 4;

            }

            if (choices.mood === "bored" &&
                (show.genres.includes("Action") ||
                 show.genres.includes("Thriller"))) {

                score += 4;

            }

            if (choices.mood === "excited" &&
                (show.genres.includes("Action") ||
                 show.genres.includes("Thriller") ||
                 show.genres.includes("Horror"))) {

                score += 4;

            }


            if (choices.watching === "partner" &&
                (show.genres.includes("Romance") ||
                 show.genres.includes("Comedy"))) {

                score += 2;

            }

            if (choices.watching === "friends" &&
                (show.genres.includes("Comedy") ||
                 show.genres.includes("Action") ||
                 show.genres.includes("Horror"))) {

                score += 2;

            }

            if (choices.watching === "family" &&
                (show.genres.includes("Comedy") ||
                 show.genres.includes("Drama"))) {

                score += 2;

            }


            let contentRating = "General";


            if (show.genres.includes("Horror") ||
                show.genres.includes("Thriller") ||
                show.genres.includes("Crime")) {

                contentRating = "Mature";

            } else if (show.genres.includes("Comedy") ||
                       show.genres.includes("Family") ||
                       show.genres.includes("Children")) {

                contentRating = "Family-friendly";

            }


            show.contentRating = contentRating;


            if (choices.watching === "family") {

                if (contentRating === "Family-friendly") {
                    score += 4;
                }

                if (contentRating === "Mature") {
                    score -= 4;
                }

            }


            if (choices.attention === "casual" &&
                (show.genres.includes("Comedy") ||
                 show.genres.includes("Romance"))) {

                score += 2;

            }

            if (choices.attention === "focused" &&
                (show.genres.includes("Drama") ||
                 show.genres.includes("Thriller") ||
                 show.genres.includes("Horror"))) {

                score += 2;

            }


            score += (show.rating.average || 0) / 2;


            show.onCueScore = score;

        });


        matches.sort(function(a, b) {

            return b.onCueScore - a.onCueScore;

        });


        results.innerHTML = "";


        if (matches.length === 0) {

            results.innerHTML = `
                <p>
                    We couldn't find a match based on your current
                    preferences. Try changing your check-in answers.
                </p>
            `;

            return;

        }


        matches.slice(0, 3).forEach(function(show) {

            const result = document.createElement("div");


            result.innerHTML = `

                ${
                    show.image
                    ? `<img src="${show.image.medium}"
                    alt="Poster for ${show.name}">`
                    : ""
                }

                <h3>${show.name}</h3>

                <p>
                    Genre: ${show.genres.join(", ")}
                </p>

                <p>
                    Runtime: ${show.runtime || "N/A"} minutes
                </p>

                <p>
                    ${show.summary || "No description available."}
                </p>

                <p>
                    Does this recommendation fit what you're looking for?
                </p>

                <button class="feedbackButton"
                        data-show="${show.id}"
                        data-feedback="works">
                    This works for me
                </button>

                <button class="feedbackButton"
                        data-show="${show.id}"
                        data-feedback="not-now">
                    Not right now
                </button>

                <button class="feedbackButton"
                        data-show="${show.id}"
                        data-feedback="not-looking">
                    Not what I'm looking for
                </button>

                <hr>

            `;


            results.appendChild(result);

        });


        const feedbackButtons = document.querySelectorAll(
            ".feedbackButton"
        );


        feedbackButtons.forEach(function(button) {

            button.addEventListener("click", function() {

                const feedback = {
                    showId: Number(this.dataset.show),
                    response: this.dataset.feedback,
                    choiceKey: choiceKey,
                    time: Date.now()
                };


                const feedbackList = JSON.parse(
                    localStorage.getItem("onCueFeedback") || "[]"
                );


                const updatedFeedback = feedbackList.filter(function(item) {

                    return !(
                        item.showId === feedback.showId &&
                        item.choiceKey === feedback.choiceKey
                    );

                });


                updatedFeedback.push(feedback);


                localStorage.setItem(
                    "onCueFeedback",
                    JSON.stringify(updatedFeedback)
                );


                this.parentElement.querySelectorAll(
                    ".feedbackButton"
                ).forEach(function(button) {

                    button.disabled = true;

                });


                const message = document.createElement("p");


                if (feedback.response === "works") {

                    message.textContent =
                        "Great! We'll keep this in mind.";

                } else if (feedback.response === "not-now") {

                    message.textContent =
                        "Got it. We won't recommend this again for 24 hours.";

                } else {

                    message.textContent =
                        "Got it. We'll look for something different.";

                }


                this.parentElement.appendChild(message);

            });

        });


    } catch (error) {

        console.log(error);

        results.innerHTML = `
            <p>
                Sorry, something went wrong while finding your picks.
            </p>
        `;

    }

}


startOver.addEventListener("click", function() {

    localStorage.removeItem("onCueChoices");

    window.location.href = "checkin.html";

});