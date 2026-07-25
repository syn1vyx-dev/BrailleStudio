const grid = document.querySelector(".braille-grid");
const preview = document.querySelector("#preview");


let cells = [];


// Create 4 Braille cells
for (let c = 0; c < 4; c++) {

    let cell = {
        dots: Array(8).fill(false)
    };

    cells.push(cell);


    const element = document.createElement("div");
    element.className = "cell";


    for (let d = 0; d < 8; d++) {

        const dot = document.createElement("div");

        dot.className = "dot";


        dot.onmousedown = (event) => {

            toggleDot(cell, d, dot, event.shiftKey);

        };


        element.appendChild(dot);
    }


    grid.appendChild(element);
}



function toggleDot(cell, index, element, erase) {

    if (erase) {
        cell.dots[index] = false;
        element.classList.remove("active");
    }

    else {

        cell.dots[index] = true;
        element.classList.add("active");

    }


    updatePreview();

}




function updatePreview() {

    let text = "";


    for (const cell of cells) {

        let value = 0;


        const mapping = [
            0, // dot 1
            1, // dot 2
            2, // dot 3
            6, // dot 7
            3, // dot 4
            4, // dot 5
            5, // dot 6
            7  // dot 8
        ];


        for (let i = 0; i < 8; i++) {

            if (cell.dots[i]) {
                value += 1 << mapping[i];
            }

        }


        text += String.fromCharCode(0x2800 + value);

    }


    preview.textContent = text;

}
