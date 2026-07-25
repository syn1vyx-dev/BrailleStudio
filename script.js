const grid = document.querySelector(".grid");

for (let i = 0; i < 64; i++) {
    const dot = document.createElement("div");

    dot.className = "dot";

    dot.onclick = () => {
        dot.classList.toggle("active");
    };

    grid.appendChild(dot);
}
