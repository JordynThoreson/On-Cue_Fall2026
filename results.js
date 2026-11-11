const results = document.querySelector("#results");
const startOver = document.querySelector("#startOver");
const showDialog = document.querySelector("#showDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogSummary = document.querySelector("#dialogSummary");
const closeDialog = document.querySelector("#closeDialog");
const savedChoices = localStorage.getItem("onCueChoices");


function getContentCategory(show) {
    const genres = show.genres || [];

    const matureGenres = [
        "Adult",
        "Horror",
        "Crime",
        "Thriller"
    ];

    if (matureGenres.some(function(genre) {
        return genres.includes(genre);
    })) {
        return "Potentially mature";
    }

    if (
        genres.includes("Family") ||
        genres.includes("Children")
    ) {
        return "Family-oriented";
    }

    return "Unclassified";
}


if (!savedChoices) {
    results.innerHTML = `
        <p>Please complete the check-in first.</p>
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

        if (!response.ok) {
            throw new Error("Unable to retrieve shows.");
        }

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

            const contentCategory = getContentCategory(show);

            if (
                choices.watching === "family" &&
                contentCategory !== "Family-oriented"
            ) {
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

            if (
                choices.genre !== "any" &&
                show.genres.includes(choices.genre)
            ) {
                score += 5;
            }

            if (
                choices.mood === "happy" &&
                show.genres.includes("Comedy")
            ) {
                score += 4;
            }

            if (
                choices.mood === "relaxed" &&
                (
                    show.genres.includes("Comedy") ||
                    show.genres.includes("Romance")
                )
            ) {
                score += 4;
            }

            if (
                choices.mood === "stressed" &&
                show.genres.includes("Comedy")
            ) {
                score += 4;
            }

            if (
                choices.mood === "bored" &&
                (
                    show.genres.includes("Action") ||
                    show.genres.includes("Thriller")
                )
            ) {
                score += 4;
            }

            if (
                choices.mood === "excited" &&
                (
                    show.genres.includes("Action") ||
                    show.genres.includes("Thriller") ||
                    show.genres.includes("Horror")
                )
            ) {
                score += 4;
            }

            if (
                choices.watching === "partner" &&
                (
                    show.genres.includes("Romance") ||
                    show.genres.includes("Comedy")
                )
            ) {
                score += 2;
            }

            if (
                choices.watching === "friends" &&
                (
                    show.genres.includes("Comedy") ||
                    show.genres.includes("Action") ||
                    show.genres.includes("Horror")
                )
            ) {
                score += 2;
            }

            if (
                choices.watching === "family" &&
                (
                    show.genres.includes("Comedy") ||
                    show.genres.includes("Drama")
                )
            ) {
                score += 2;
            }

            if (
                choices.attention === "casual" &&
                (
                    show.genres.includes("Comedy") ||
                    show.genres.includes("Romance")
                )
            ) {
                score += 2;
            }

            if (
                choices.attention === "focused" &&
                (
                    show.genres.includes("Drama") ||
                    show.genres.includes("Thriller") ||
                    show.genres.includes("Horror")
                )
            ) {
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

            const result = document.createElement("section");
            result.className = "recommendation-card";

            const showInfo = document.createElement("div");
            showInfo.className = "recommendation-info";


            if (show.image && show.image.medium) {

                const poster = document.createElement("img");

                poster.className = "show-poster";
                poster.src = show.image.medium;
                poster.alt = "Poster for " + show.name;


                poster.width = 210;
                poster.height = 295;

                poster.decoding = "async";

                result.appendChild(poster);

            }


            const details = document.createElement("div");
            details.className = "show-details";

            const title = document.createElement("h3");
            title.textContent = show.name;

            const genre = document.createElement("p");
            genre.textContent = "Genre: " + (
                show.genres.length ? show.genres.join(", ") : "Not listed"
            );

            const runtime = document.createElement("p");
            runtime.textContent = "Runtime: " +
                (show.runtime || "N/A") + " minutes";

            details.appendChild(title);
            details.appendChild(genre);
            details.appendChild(runtime);

            showInfo.appendChild(details);
            result.appendChild(showInfo);


            // Learn More button

            const learnMore = document.createElement("button");

            learnMore.className = "learn-more";
            learnMore.type = "button";
            learnMore.textContent = "Learn More";

            learnMore.addEventListener("click", function() {

                dialogTitle.textContent = show.name;

                dialogSummary.textContent = show.summary
                    ? show.summary
                        .replace(/<[^>]*>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim()
                    : "No description available.";

                showDialog.showModal();

            });

            showInfo.appendChild(learnMore);

            const feedbackLabel = document.createElement("label");

            feedbackLabel.className = "feedback-label";
            feedbackLabel.htmlFor = "feedback-" + show.id;
            feedbackLabel.textContent = "Rate this recommendation";

            const feedbackSelect = document.createElement("select");

            feedbackSelect.id = "feedback-" + show.id;
            feedbackSelect.className = "feedback-select";

            const placeholder = document.createElement("option");

            placeholder.value = "";
            placeholder.textContent = "Choose an answer";
            placeholder.selected = true;
            placeholder.disabled = true;

            feedbackSelect.appendChild(placeholder);

            const feedbackOptions = [
                {
                    value: "works",
                    text: "This works for me"
                },
                {
                    value: "not-now",
                    text: "Not right now"
                },
                {
                    value: "not-looking",
                    text: "Not what I'm looking for"
                }
            ];

            feedbackOptions.forEach(function(option) {

                const optionElement = document.createElement("option");

                optionElement.value = option.value;
                optionElement.textContent = option.text;

                feedbackSelect.appendChild(optionElement);

            });

            result.appendChild(feedbackLabel);
            result.appendChild(feedbackSelect);


            // Save feedback

            feedbackSelect.addEventListener("change", function() {

                const feedback = {
                    showId: show.id,
                    response: this.value,
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

                this.disabled = true;

                const message = document.createElement("p");
                message.className = "feedback-message";

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

                result.appendChild(message);

            });


            results.appendChild(result);

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

closeDialog.addEventListener("click", function() {
    showDialog.close();
});


showDialog.addEventListener("click", function(event) {

    if (event.target === showDialog) {
        showDialog.close();
    }

});

startOver.addEventListener("click", function() {

    localStorage.removeItem("onCueChoices");

    window.location.href = "checkin.html";

});