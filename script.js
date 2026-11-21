const genre = document.querySelector("#genre");
const mood = document.querySelector("#mood");
const watching = document.querySelector("#watching");
const attention = document.querySelector("#attention");
const runtime = document.querySelector("#runtime");
const button = document.querySelector("#findButton");
const message = document.querySelector("#message");

button.addEventListener("click", function() {

    const requiredFields = [
        genre,
        mood,
        watching,
        attention,
        runtime
    ];

    const firstMissingField = requiredFields.find(
        field => field.value === ""
    );

    if (firstMissingField) {
        message.textContent = "Please complete all questions before continuing.";
        firstMissingField.focus();
        return;
    }

    message.textContent = "";

    const userChoices = {
        genre: genre.value,
        mood: mood.value,
        watching: watching.value,
        attention: attention.value,
        runtime: Number(runtime.value)
    };

    localStorage.setItem(
        "onCueChoices",
        JSON.stringify(userChoices)
    );

    window.location.href = "results.html";

});