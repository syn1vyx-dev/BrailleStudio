const grid = document.querySelector(".grid");

let drawing = false;
let eraseMode = false;

for (let i = 0; i < 64; i++) {
    const dot = document.createElement("div");

    dot.className = "dot";

    dot.addEventListener("mousedown", (event) => {
        drawing = true;
        eraseMode = event.shiftKey;

        toggleDot(dot);
    });

    dot.addEventListener("mouseenter", (event) => {
        if (drawing) {
            eraseMode = event.shiftKey;

            toggleDot(dot);
        }
    });

    grid.appendChild(dot);
}


document.addEventListener("mouseup", () => {
    drawing = false;
});


function toggleDot(dot) {
    if (eraseMode) {
        dot.classList.remove("active");
    } else {
        dot.classList.add("active");
    }
}
