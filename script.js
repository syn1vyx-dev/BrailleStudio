// ==============================
// Braille Studio v0.2 Engine
// ==============================


// Elements

const canvas =
document.getElementById("canvas");

const preview =
document.getElementById("preview");

const output =
document.getElementById("output");

const timeline =
document.getElementById("timeline");

const frameLabel =
document.getElementById("frameLabel");

const characterCount =
document.getElementById("characterCount");



const widthInput =
document.getElementById("widthInput");

const heightInput =
document.getElementById("heightInput");

const fpsInput =
document.getElementById("fpsInput");



// Buttons

const undoBtn =
document.getElementById("undoBtn");

const redoBtn =
document.getElementById("redoBtn");

const clearBtn =
document.getElementById("clearBtn");

const playBtn =
document.getElementById("playBtn");

const addFrameBtn =
document.getElementById("addFrameBtn");

const resizeBtn =
document.getElementById("resizeBtn");

const copyBtn =
document.getElementById("copyBtn");

const saveBtn =
document.getElementById("saveBtn");

const loadBtn =
document.getElementById("loadBtn");

const fileInput =
document.getElementById("fileInput");



// ==============================
// SETTINGS
// ==============================


let width = 16;
let height = 4;


let frames = [];

let currentFrame = 0;


let drawing = false;

let eraseMode = false;


let undoStack = [];

let redoStack = [];


let playing = false;

let timer;





// ==============================
// BRAILLE DICTIONARY
// ==============================


const brailleDictionary = [];


for(let i = 0; i < 256; i++){

    brailleDictionary[i] =
    String.fromCharCode(0x2800 + i);

}





// ==============================
// FRAME CREATION
// ==============================


function createFrame(){


    let cells =
    width * height;


    return Array.from(
        {length: cells},
        ()=>Array(8).fill(false)
    );

}



function createProject(){


    frames = [
        createFrame()
    ];


    currentFrame = 0;


}







// ==============================
// CANVAS
// ==============================


function buildCanvas(){


    canvas.innerHTML="";


    canvas.style.gridTemplateColumns =
    `repeat(${width}, 90px)`;


    frames[currentFrame]
    .forEach((cell, index)=>{


        let box =
        document.createElement("div");


        box.className="cell";



        for(let i=0;i<8;i++){


            let dot =
            document.createElement("div");


            dot.className="dot";


            if(cell[i])
                dot.classList.add("active");



            dot.onmousedown=(e)=>{


                saveUndo();


                drawing=true;

                eraseMode=e.shiftKey;


                paint(
                    index,
                    i,
                    dot
                );


            };



            dot.onmouseenter=(e)=>{


                if(drawing){


                    eraseMode=e.shiftKey;


                    paint(
                        index,
                        i,
                        dot
                    );


                }

            };



            box.appendChild(dot);

        }



        canvas.appendChild(box);



    });



    update();

}





document.body.onmouseup=()=>{

    drawing=false;

};








function paint(cell,dot,element){


    frames[currentFrame][cell][dot]
    =
    !eraseMode;


    if(eraseMode)

        element.classList.remove("active");

    else

        element.classList.add("active");



    update();


}









// ==============================
// BRAILLE CONVERSION
// ==============================


const map = [
0,1,2,6,
3,4,5,7
];



function getBraille(){


    let result="";


    frames[currentFrame]
    .forEach(cell=>{


        let value=0;



        for(let i=0;i<8;i++){


            if(cell[i])

                value +=
                1 << map[i];


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



    characterCount.textContent =
    width * height;



    frameLabel.textContent =
    currentFrame+1;


}







// ==============================
// TIMELINE
// ==============================


function updateTimeline(){


    timeline.innerHTML="";


    frames.forEach((frame,index)=>{


        let item =
        document.createElement("div");


        item.className="frame";


        if(index===currentFrame)

            item.classList.add("active");



        item.textContent =
        index+1;



        item.onclick=()=>{


            currentFrame=index;

            buildCanvas();

            updateTimeline();


        };



        timeline.appendChild(item);


    });


}






addFrameBtn.onclick=()=>{


    frames.push(
        createFrame()
    );


    currentFrame =
    frames.length-1;


    buildCanvas();

    updateTimeline();


};








// ==============================
// RESIZE
// ==============================


resizeBtn.onclick=()=>{


    width =
    Number(widthInput.value);


    height =
    Number(heightInput.value);



    createProject();


    buildCanvas();

    updateTimeline();


};







// ==============================
// UNDO REDO
// ==============================


function saveUndo(){


    undoStack.push(
        JSON.stringify(frames)
    );


    redoStack=[];


}



undoBtn.onclick=()=>{


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




redoBtn.onclick=()=>{


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







clearBtn.onclick=()=>{


    saveUndo();


    frames[currentFrame]=
    createFrame();


    buildCanvas();


};









// ==============================
// PLAYBACK
// ==============================


playBtn.onclick=()=>{


    playing=!playing;


    if(playing){


        playBtn.textContent =
        "⏸ Pause";


        timer=setInterval(()=>{


            currentFrame++;


            if(currentFrame>=frames.length)

                currentFrame=0;



            buildCanvas();

            updateTimeline();


        },
        1000 /
        Number(fpsInput.value));


    }

    else{


        playBtn.textContent =
        "▶ Play";


        clearInterval(timer);


    }


};








// ==============================
// SAVE LOAD
// ==============================


saveBtn.onclick=()=>{


    let data={

        width,

        height,

        fps:
        fpsInput.value,

        frames

    };


    let blob =
    new Blob(
        [
            JSON.stringify(
                data,
                null,
                2
            )
        ],
        {
            type:
            "application/json"
        }
    );



    let url =
    URL.createObjectURL(blob);



    let a =
    document.createElement("a");


    a.href=url;

    a.download=
    "braille-project.json";


    a.click();


};






loadBtn.onclick=()=>{

    fileInput.click();

};




fileInput.onchange=(e)=>{


    let file =
    e.target.files[0];


    let reader =
    new FileReader();



    reader.onload=()=>{


        let data =
        JSON.parse(
            reader.result
        );


        width=data.width;

        height=data.height;

        frames=data.frames;


        widthInput.value=width;

        heightInput.value=height;


        currentFrame=0;


        buildCanvas();

        updateTimeline();


    };


    reader.readAsText(file);


};








// ==============================
// COPY
// ==============================


copyBtn.onclick=()=>{


    navigator.clipboard.writeText(
        getBraille()
    );


};







// ==============================
// SHORTCUTS
// ==============================


document.addEventListener(
"keydown",
e=>{


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

createProject();

buildCanvas();

updateTimeline();
