// ======================================================
// BRAILLE STUDIO
// Core Engine
// ======================================================


// ================= BRAILLE =================


const DOT_BITS = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80]
];



function createGrid(rows, cols){

    return Array.from(
        {length:rows},
        ()=>Array(cols).fill(0)
    );

}



function cloneGrid(grid){

    return grid.map(row=>[...row]);

}




// Convert pixel grid -> braille characters

function gridToBraille(grid, cellCols, cellRows){

    const output=[];


    for(let cy=0; cy<cellRows; cy++){

        let line="";


        for(let cx=0; cx<cellCols; cx++){

            let mask=0;


            for(let y=0;y<4;y++){

                for(let x=0;x<2;x++){

                    const gy=cy*4+y;
                    const gx=cx*2+x;


                    if(
                        grid[gy] &&
                        grid[gy][gx]
                    ){

                        mask |= DOT_BITS[y][x];

                    }

                }

            }


            line += String.fromCodePoint(
                0x2800 + mask
            );

        }


        output.push(line);

    }


    return output;

}





// Braille -> pixels


function decodeBraille(char){


    const mask =
        char.codePointAt(0)-0x2800;


    const grid=createGrid(4,2);



    for(let y=0;y<4;y++){

        for(let x=0;x<2;x++){


            if(mask & DOT_BITS[y][x]){

                grid[y][x]=1;

            }

        }

    }


    return grid;

}





// ================= STATE =================



const state={


    cellCols:2,

    cellRows:1,


    frames:[
        createGrid(4,4)
    ],


    currentFrame:0,


    mode:"draw",


    fps:4,


    loop:true,

    bounce:false,


    playing:false,


    timer:null,


    undo:[],


    redo:[],


    pointerDown:false,


    paintValue:1,


    onion:false


};





function pixelRows(){

    return state.cellRows*4;

}



function pixelCols(){

    return state.cellCols*2;

}



function currentGrid(){

    return state.frames[state.currentFrame];

}





// ================= UNDO =================



function saveUndo(){


    state.undo.push({

        frames:
        state.frames.map(cloneGrid),

        cols:
        state.cellCols,

        rows:
        state.cellRows,

        frame:
        state.currentFrame

    });


    if(state.undo.length>100)

        state.undo.shift();



    state.redo=[];

}





function undo(){


    if(!state.undo.length)

        return;



    state.redo.push({

        frames:
        state.frames.map(cloneGrid),

        cols:
        state.cellCols,

        rows:
        state.cellRows,

        frame:
        state.currentFrame

    });



    const s=state.undo.pop();


    state.frames=s.frames;

    state.cellCols=s.cols;

    state.cellRows=s.rows;

    state.currentFrame=s.frame;


    renderAll();

}





function redo(){


    if(!state.redo.length)

        return;



    state.undo.push({

        frames:
        state.frames.map(cloneGrid),

        cols:
        state.cellCols,

        rows:
        state.cellRows,

        frame:
        state.currentFrame

    });



    const s=state.redo.pop();


    state.frames=s.frames;

    state.cellCols=s.cols;

    state.cellRows=s.rows;

    state.currentFrame=s.frame;


    renderAll();

}
// ======================================================
// BRAILLE STUDIO
// Editor + Drawing Engine
// ======================================================



// ================= RENDER GRID =================


function renderGrid(){


    const container =
        document.getElementById("dot-grid");


    container.innerHTML="";


    const grid=currentGrid();


    for(let r=0;r<pixelRows();r++){


        const row=document.createElement("div");

        row.className="grid-row";



        for(let c=0;c<pixelCols();c++){


            const dot=document.createElement("div");


            dot.className="dot";


            dot.dataset.r=r;

            dot.dataset.c=c;



            if(grid[r][c]){

                dot.classList.add("on");

            }



            row.appendChild(dot);


        }


        container.appendChild(row);


    }



    document.getElementById("grid-label").textContent =

        `${pixelCols()} × ${pixelRows()} pixels — ${state.cellCols * state.cellRows} chars`;



}






// ================= DRAW DOT =================



function paintDot(r,c,value){


    const grid=currentGrid();


    if(
        grid[r] &&
        grid[r][c] !== undefined
    ){

        grid[r][c]=value;

    }


}






// ================= POINTER DRAWING =================


function setupDrawing(){



const gridEl=document.getElementById("dot-grid");



gridEl.addEventListener(
"pointerdown",
e=>{


const dot=e.target.closest(".dot");


if(!dot)return;



saveUndo();


state.pointerDown=true;


gridEl.setPointerCapture(
e.pointerId
);



const r=Number(dot.dataset.r);

const c=Number(dot.dataset.c);



state.paintValue =
(
e.shiftKey ||
state.mode==="erase"
)
?0:1;



paintDot(
r,
c,
state.paintValue
);



renderGrid();


});






gridEl.addEventListener(
"pointermove",
e=>{


if(!state.pointerDown)
return;



const dot=document.elementFromPoint(
e.clientX,
e.clientY
)?.closest(".dot");



if(!dot)
return;



paintDot(
Number(dot.dataset.r),
Number(dot.dataset.c),
state.paintValue
);



renderGrid();



});






gridEl.addEventListener(
"pointerup",
()=>{

state.pointerDown=false;

});



}







// ================= RESIZE =================



function resizeGrid(cols,rows){



saveUndo();



const newRows=rows*4;

const newCols=cols*2;



state.frames =
state.frames.map(old=>{


const next=createGrid(
newRows,
newCols
);



for(
let y=0;
y<Math.min(old.length,newRows);
y++
){


for(
let x=0;
x<Math.min(old[0].length,newCols);
x++
){


next[y][x]=old[y][x];


}


}



return next;



});



state.cellCols=cols;

state.cellRows=rows;



renderAll();


}







// ================= FRAMES =================



function addFrame(){



saveUndo();



state.frames.splice(
state.currentFrame+1,
0,
createGrid(
pixelRows(),
pixelCols()
)
);



state.currentFrame++;



renderAll();


}




function duplicateFrame(){



saveUndo();



state.frames.splice(
state.currentFrame+1,
0,
cloneGrid(
currentGrid()
)
);



state.currentFrame++;



renderAll();


}





function deleteFrame(){



if(state.frames.length<=1)
return;



saveUndo();



state.frames.splice(
state.currentFrame,
1
);



if(
state.currentFrame>=state.frames.length
){

state.currentFrame=
state.frames.length-1;

}



renderAll();


}






// ================= TIMELINE =================



function renderTimeline(){


const strip=
document.getElementById(
"frame-strip"
);



strip.innerHTML="";



state.frames.forEach(
(frame,index)=>{


const item=
document.createElement("div");



item.className=
"frame-thumb";



if(index===state.currentFrame)

item.classList.add("active");




item.textContent =
gridToBraille(
frame,
state.cellCols,
state.cellRows
)[0];



item.onclick=()=>{


state.currentFrame=index;


renderAll();


};



strip.appendChild(item);



});



document.getElementById(
"frame-counter"
).textContent =
`${state.currentFrame+1} / ${state.frames.length}`;



}





// ================= RENDER ALL =================



function renderAll(){


renderGrid();


renderTimeline();


renderOutputs?.();


}







// ================= OUTPUT =================



function renderOutputs(){


const braille=
gridToBraille(
currentGrid(),
state.cellCols,
state.cellRows
);



const out=
document.getElementById(
"out-braille"
);


if(out)

out.textContent=
braille.join("\n");



}
// ======================================================
// BRAILLE STUDIO
// Final Systems
// ======================================================


// ================= PLAYBACK =================


function play(){


    if(state.playing){

        stop();

        return;

    }


    if(state.frames.length<=1)
        return;



    state.playing=true;



    state.timer=setInterval(()=>{


        state.currentFrame++;


        if(state.currentFrame>=state.frames.length){


            if(state.bounce){

                state.frames.reverse();


                state.currentFrame=0;


            }

            else if(state.loop){

                state.currentFrame=0;

            }

            else{

                stop();

            }


        }



        renderAll();


    },1000/state.fps);



}





function stop(){


    state.playing=false;


    clearInterval(state.timer);


    state.timer=null;


}







// ================= EXPORT =================



function exportBraille(){


    return state.frames.map(frame=>{


        return gridToBraille(
            frame,
            state.cellCols,
            state.cellRows
        ).join("\n");


    }).join("\n\n");


}





function exportJSON(){


    return JSON.stringify({

        cols:state.cellCols,

        rows:state.cellRows,

        fps:state.fps,

        frames:state.frames


    },null,2);


}





function downloadFile(text,name,type){


    const blob=
    new Blob(
        [text],
        {type:type}
    );


    const a=document.createElement("a");


    a.href=
    URL.createObjectURL(blob);


    a.download=name;


    a.click();


}








// ================= IMPORT =================



function importJSON(file){


const reader=new FileReader();



reader.onload=e=>{


const data=
JSON.parse(e.target.result);



state.cellCols=data.cols;

state.cellRows=data.rows;


state.frames=data.frames;


state.currentFrame=0;



renderAll();



};



reader.readAsText(file);



}







// ================= CLIPBOARD =================



function copyBraille(){


navigator.clipboard.writeText(
exportBraille()
);


}





// ================= KEYBINDS =================



document.addEventListener(
"keydown",
e=>{


if(
e.target.tagName==="INPUT"
)
return;



switch(e.key){


case " ":

e.preventDefault();

play();

break;



case "z":

undo();

break;



case "y":

redo();

break;



case "Delete":

deleteFrame();

break;



case "n":

addFrame();

break;



case "d":

state.mode="draw";

break;



case "e":

state.mode="erase";

break;



}



});







// ================= CONNECT UI =================



function connectUI(){



// resize


const cols=
document.getElementById(
"cell-cols"
);



const rows=
document.getElementById(
"cell-rows"
);



if(cols)

cols.onchange=()=>{


resizeGrid(
Number(cols.value),
state.cellRows
);


};



if(rows)

rows.onchange=()=>{


resizeGrid(
state.cellCols,
Number(rows.value)
);


};






// buttons


const buttons={


"btn-play":play,


"btn-new-frame":addFrame,


"btn-dup-frame":duplicateFrame,


"btn-del-frame":deleteFrame,


"btn-undo":undo,


"btn-redo":redo,


"btn-copy":copyBraille



};



Object.keys(buttons).forEach(id=>{


const el=document.getElementById(id);


if(el)

el.onclick=buttons[id];


});





// save


const save=
document.getElementById(
"btn-save"
);



if(save)

save.onclick=()=>{


downloadFile(

exportJSON(),

"braille-project.json",

"application/json"

);


};





// load


const load=
document.getElementById(
"btn-load"
);



if(load)


load.onclick=()=>{


const input=
document.createElement("input");


input.type="file";


input.accept=".json";


input.onchange=e=>
importJSON(
e.target.files[0]
);


input.click();


};






}





// ================= START =================



window.addEventListener(
"DOMContentLoaded",
()=>{


connectUI();


setupDrawing();


renderAll();


});
