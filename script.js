// =====================================
// Braille Studio v0.2.1
// Core Editor Engine
// =====================================


const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const output = document.getElementById("output");
const timeline = document.getElementById("timeline");

const frameLabel = document.getElementById("frameLabel");

const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const fpsInput = document.getElementById("fpsInput");


// Buttons

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");

const playBtn = document.getElementById("playBtn");

const pencilBtn = document.getElementById("pencilBtn");
const eraserBtn = document.getElementById("eraserBtn");

const resizeBtn = document.getElementById("resizeBtn");

const addFrameBtn = document.getElementById("addFrameBtn");
const duplicateBtn = document.getElementById("duplicateBtn");
const deleteFrameBtn = document.getElementById("deleteFrameBtn");

const copyBtn = document.getElementById("copyBtn");

const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const fileInput = document.getElementById("fileInput");




// =====================================
// SETTINGS
// =====================================


let width = 16;
let height = 4;


let frames = [];

let currentFrame = 0;


let currentTool = "pencil";


let drawing = false;


let undoStack = [];
let redoStack = [];


let playing = false;
let timer;






// =====================================
// BRAILLE DATABASE
// =====================================


const brailleDictionary = [];

for(let i = 0; i < 256; i++){

    brailleDictionary[i] =
    String.fromCharCode(
        0x2800 + i
    );

}



const dotMap = [
    0,
    1,
    2,
    6,
    3,
    4,
    5,
    7
];







// =====================================
// FRAME CREATION
// =====================================


function createFrame(){

    return Array.from(
        {
            length:
            width * height
        },

        () =>
        Array(8).fill(false)

    );

}




function resetProject(){

    frames = [
        createFrame()
    ];

    currentFrame = 0;

}







// =====================================
// CANVAS BUILDER
// =====================================


function buildCanvas(){

    canvas.innerHTML = "";


    canvas.style.gridTemplateColumns =
    `repeat(${width},90px)`;


    frames[currentFrame]
    .forEach((cell, cellIndex)=>{


        const cellBox =
        document.createElement("div");


        cellBox.className =
        "cell";



        for(let dot = 0; dot < 8; dot++){


            const dotElement =
            document.createElement("div");


            dotElement.className =
            "dot";



            if(cell[dot]){

                dotElement.classList.add(
                    "active"
                );

            }



            dotElement.onmousedown = (e)=>{


                saveUndo();


                drawing = true;


                paint(
                    cellIndex,
                    dot,
                    dotElement
                );


            };



            dotElement.onmouseenter = ()=>{


                if(drawing){

                    paint(
                        cellIndex,
                        dot,
                        dotElement
                    );

                }

            };



            cellBox.appendChild(
                dotElement
            );


        }



        canvas.appendChild(
            cellBox
        );


    });


    update();

}





document.body.onmouseup = ()=>{

    drawing = false;

};







// =====================================
// DRAWING
// =====================================


function paint(cell, dot, element){


    let value =
    currentTool === "pencil";


    frames[currentFrame][cell][dot]
    =
    value;



    if(value){

        element.classList.add(
            "active"
        );

    }

    else{

        element.classList.remove(
            "active"
        );

    }



    update();

}






// =====================================
// BRAILLE OUTPUT
// =====================================


function getBraille(){


    let result = "";


    frames[currentFrame]
    .forEach(cell=>{


        let value = 0;



        for(let i = 0; i < 8; i++){


            if(cell[i]){

                value +=
                1 << dotMap[i];

            }

        }



        result +=
        brailleDictionary[value];


    });


    return result;

}





function update(){


    let text =
    getBraille();


    preview.textContent =
    text;


    output.textContent =
    text;


    frameLabel.textContent =
    currentFrame + 1;

}







// =====================================
// TIMELINE
// =====================================


function updateTimeline(){


    timeline.innerHTML = "";


    frames.forEach((frame,index)=>{


        const item =
        document.createElement("div");


        item.className =
        "frame";


        if(index === currentFrame){

            item.classList.add(
                "active"
            );

        }


        item.textContent =
        index + 1;



        item.onclick = ()=>{


            currentFrame = index;


            buildCanvas();

            updateTimeline();


        };


        timeline.appendChild(item);


    });


}








// =====================================
// TOOLS
// =====================================


pencilBtn.onclick = ()=>{


    currentTool =
    "pencil";


    pencilBtn.classList.add(
        "active"
    );


    eraserBtn.classList.remove(
        "active"
    );


};





eraserBtn.onclick = ()=>{


    currentTool =
    "eraser";


    eraserBtn.classList.add(
        "active"
    );


    pencilBtn.classList.remove(
        "active"
    );


};







// =====================================
// FRAMES
// =====================================


addFrameBtn.onclick = ()=>{


    frames.push(
        createFrame()
    );


    currentFrame =
    frames.length - 1;


    buildCanvas();

    updateTimeline();


};





duplicateBtn.onclick = ()=>{


    frames.splice(

        currentFrame + 1,

        0,

        JSON.parse(
            JSON.stringify(
                frames[currentFrame]
            )
        )

    );


    currentFrame++;


    buildCanvas();

    updateTimeline();


};





deleteFrameBtn.onclick = ()=>{


    if(frames.length <= 1)
        return;



    frames.splice(
        currentFrame,
        1
    );


    currentFrame =
    Math.max(
        0,
        currentFrame - 1
    );


    buildCanvas();

    updateTimeline();


};








// =====================================
// RESIZE
// =====================================


resizeBtn.onclick = ()=>{


    width =
    Number(widthInput.value);


    height =
    Number(heightInput.value);



    resetProject();


    buildCanvas();

    updateTimeline();


};








// =====================================
// UNDO / REDO
// =====================================


function saveUndo(){

    undoStack.push(
        JSON.stringify(frames)
    );


    redoStack = [];

}





undoBtn.onclick = ()=>{


    if(!undoStack.length)
        return;


    redoStack.push(
        JSON.stringify(frames)
    );


    frames =
    JSON.parse(
        undoStack.pop()
    );


    buildCanvas();

    updateTimeline();


};





redoBtn.onclick = ()=>{


    if(!redoStack.length)
        return;


    undoStack.push(
        JSON.stringify(frames)
    );


    frames =
    JSON.parse(
        redoStack.pop()
    );


    buildCanvas();

    updateTimeline();


};






clearBtn.onclick = ()=>{


    saveUndo();


    frames[currentFrame] =
    createFrame();


    buildCanvas();


};







// =====================================
// PLAYBACK
// =====================================


playBtn.onclick = ()=>{


    playing =
    !playing;



    if(playing){


        playBtn.textContent =
        "⏸ Pause";



        timer =
        setInterval(()=>{


            currentFrame++;


            if(currentFrame >= frames.length){

                currentFrame = 0;

            }


            buildCanvas();

            updateTimeline();


        },


        1000 /
        Number(fpsInput.value)

        );


    }

    else{


        playBtn.textContent =
        "▶ Play";


        clearInterval(timer);

    }


};







// =====================================
// FILES
// =====================================


copyBtn.onclick = ()=>{


    navigator.clipboard.writeText(
        getBraille()
    );


};





saveBtn.onclick = ()=>{


    const project = {

        width,

        height,

        fps:
        fpsInput.value,

        frames

    };


    const blob =
    new Blob(
        [
            JSON.stringify(
                project,
                null,
                2
            )
        ],

        {
            type:
            "application/json"
        }

    );



    const url =
    URL.createObjectURL(blob);



    const link =
    document.createElement("a");


    link.href = url;


    link.download =
    "braille-project.json";


    link.click();


};





loadBtn.onclick = ()=>{

    fileInput.click();

};





fileInput.onchange = (e)=>{


    const file =
    e.target.files[0];


    if(!file)
        return;



    const reader =
    new FileReader();



    reader.onload = ()=>{


        const project =
        JSON.parse(
            reader.result
        );


        width =
        project.width;


        height =
        project.height;


        frames =
        project.frames;



        widthInput.value =
        width;


        heightInput.value =
        height;



        currentFrame = 0;


        buildCanvas();

        updateTimeline();


    };


    reader.readAsText(file);


};







// =====================================
// SHORTCUTS
// =====================================


document.addEventListener(
"keydown",
(e)=>{


    if(e.ctrlKey && e.key==="z")
        undoBtn.click();



    if(e.ctrlKey && e.key==="y")
        redoBtn.click();



    if(e.code==="Space"){

        e.preventDefault();

        playBtn.click();

    }



    if(e.key==="Delete")
        clearBtn.click();


});







// START


resetProject();

buildCanvas();

updateTimeline();
