const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const timeline = document.getElementById("timeline");

const frameNumber = document.getElementById("frameNumber");

const fpsInput = document.getElementById("fps");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");

const addFrameBtn = document.getElementById("addFrameBtn");
const playBtn = document.getElementById("playBtn");



/*
    BRAILLE DATA
*/


const CELLS = 8;

const DOT_MAPPING = [
    0,
    1,
    2,
    6,
    3,
    4,
    5,
    7
];



function createFrame() {

    return Array.from(
        {length: CELLS},
        () => Array(8).fill(false)
    );

}



let frames = [
    createFrame()
];


let currentFrame = 0;



let undoStack = [];
let redoStack = [];



let drawing = false;
let erase = false;

let playing = false;
let playTimer;





/*
    CREATE CANVAS
*/


function buildCanvas(){

    canvas.innerHTML = "";


    frames[currentFrame].forEach((cell,index)=>{


        const element =
            document.createElement("div");


        element.className="cell";



        for(let dot=0;dot<8;dot++){


            const d =
                document.createElement("div");


            d.className="dot";



            if(cell[dot]){
                d.classList.add("active");
            }



            d.onmousedown=(e)=>{

                saveUndo();

                drawing=true;
                erase=e.shiftKey;

                toggleDot(
                    index,
                    dot,
                    d
                );

            };



            d.onmouseenter=(e)=>{

                if(drawing){

                    erase=e.shiftKey;

                    toggleDot(
                        index,
                        dot,
                        d
                    );

                }

            };



            element.appendChild(d);

        }


        canvas.appendChild(element);


    });



    updatePreview();

}





document.body.onmouseup=()=>{

    drawing=false;

};







/*
    DRAWING
*/


function toggleDot(cell,dot,element){


    frames[currentFrame][cell][dot]=!erase;


    if(erase){

        element.classList.remove(
            "active"
        );

    }

    else{

        element.classList.add(
            "active"
        );

    }


    updatePreview();

}








/*
    BRAILLE CONVERTER
*/


function getBraille(){


    let output="";


    frames[currentFrame].forEach(cell=>{


        let value=0;


        for(let i=0;i<8;i++){


            if(cell[i]){

                value +=
                    1 << DOT_MAPPING[i];

            }

        }



        output += String.fromCharCode(
            0x2800 + value
        );


    });



    return output;

}






function updatePreview(){

    preview.textContent =
        getBraille();


    frameNumber.textContent =
        currentFrame + 1;

}







/*
    TIMELINE
*/


function updateTimeline(){


    timeline.innerHTML="";


    frames.forEach((frame,index)=>{


        const button =
            document.createElement("div");


        button.className="frame";


        if(index===currentFrame){

            button.classList.add(
                "active"
            );

        }



        button.textContent =
            index+1;



        button.onclick=()=>{


            currentFrame=index;

            buildCanvas();

            updateTimeline();


        };



        timeline.appendChild(button);



    });



}








/*
    FRAMES
*/


addFrameBtn.onclick=()=>{


    frames.push(
        createFrame()
    );


    currentFrame =
        frames.length-1;


    buildCanvas();

    updateTimeline();


};






clearBtn.onclick=()=>{


    saveUndo();


    frames[currentFrame]=
        createFrame();


    buildCanvas();


};







/*
    UNDO REDO
*/


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








/*
    PLAYBACK
*/


playBtn.onclick=()=>{


    playing=!playing;


    playBtn.textContent =
        playing
        ? "⏸ Pause"
        : "▶ Play";



    if(playing){


        playTimer=setInterval(()=>{


            currentFrame++;



            if(currentFrame>=frames.length){

                currentFrame=0;

            }



            buildCanvas();


        },
        1000 /
        Number(fpsInput.value)
        );


    }

    else{


        clearInterval(playTimer);


    }



};








/*
    START
*/


buildCanvas();

updateTimeline();

/*
    EXPORT / IMPORT
*/


const copyBtn =
    document.getElementById("copyBtn");


const exportBtn =
    document.getElementById("exportBtn");


const importBtn =
    document.getElementById("importBtn");


const importInput =
    document.getElementById("importInput");





/*
    COPY BRAILLE
*/


copyBtn.onclick = async()=>{


    await navigator.clipboard.writeText(
        getBraille()
    );


    copyBtn.textContent =
        "Copied!";


    setTimeout(()=>{

        copyBtn.textContent =
            "Copy Braille";

    },1000);


};








/*
    EXPORT PROJECT
*/


exportBtn.onclick=()=>{


    const project={

        name:
            "Braille Studio Project",


        version:
            "0.1",


        fps:
            Number(fpsInput.value),


        frames:
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


    link.href=url;


    link.download =
        "braille-project.json";


    link.click();



    URL.revokeObjectURL(url);


};








/*
    IMPORT PROJECT
*/


importBtn.onclick=()=>{


    importInput.click();


};





importInput.onchange=(event)=>{


    const file =
        event.target.files[0];


    if(!file)
        return;



    const reader =
        new FileReader();



    reader.onload=()=>{


        const project =
            JSON.parse(
                reader.result
            );



        frames =
            project.frames;



        fpsInput.value =
            project.fps || 12;



        currentFrame=0;



        buildCanvas();

        updateTimeline();


    };



    reader.readAsText(file);


};










/*
    KEYBOARD SHORTCUTS
*/


document.addEventListener(
"keydown",
(event)=>{


    /*
        CTRL + Z
    */

    if(
        event.ctrlKey &&
        event.key==="z"
    ){

        undoBtn.click();

    }



    /*
        CTRL + Y
    */

    if(
        event.ctrlKey &&
        event.key==="y"
    ){

        redoBtn.click();

    }



    /*
        SPACE PLAY
    */

    if(
        event.code==="Space"
    ){

        event.preventDefault();

        playBtn.click();

    }



    /*
        DELETE CLEAR
    */

    if(
        event.key==="Delete"
    ){

        clearBtn.click();

    }


});
