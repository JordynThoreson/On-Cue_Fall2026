const genre = document.querySelector("#genre");
const mood = document.querySelector("#mood");
const watching = document.querySelector("#watching");
const attention = document.querySelector("#attention");
const runtime = document.querySelector("#runtime");
const button = document.querySelector("#findButton");

button.addEventListener("click", function() {

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