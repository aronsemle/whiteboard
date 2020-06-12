window.addEventListener('load', () => {
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext('2d');
    var undoStack = []
    var redoStack = []
    var linePoints = []
    
    resizeWindow();
    
    let painting = false;
    
    function startPosition(e){
        painting = true;
        saveUndo();
        
        // Hack to remove the jagged line, and replace it with a smooth one
        saveUndo();
        
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        
        draw(e);
    }
    function finishedPosition(){
        painting = false;
        ctx.closePath();
        
        // Hack to replace the line with a smooth one
        undo (true);
        drawSmoothLine(linePoints, ctx);
        linePoints = []
        
    }
    function draw(e){
        if(!painting){
            return;
        }
        
        linePoints.push({x: e.clientX, y: e.clientY});
        
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        ctx.moveTo(e.clientX, e.clientY);
        ctx.closePath();
    }
    
    function saveUndo(){
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
    function saveRedo(){
        redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
    
    function undo(skipRedo){
        if(undoStack.length){
            if(!skipRedo){
                saveRedo();
            }
            ctx.putImageData(undoStack.pop(), 0, 0);
        }
    }
    
    function redo(){
        if(redoStack.length){
              saveUndo();
              ctx.putImageData(redoStack.pop(), 0, 0);
        }
    }
    
    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mousemove", draw);
    document.addEventListener('keydown', function(event) {
      if (event.ctrlKey && event.key === 'z') {
        undo();
      }
      if (event.ctrlKey && event.key === 'y') {
          redo();
        }
    });
});

window.addEventListener('resize', resizeWindow())
function resizeWindow(){
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}

// Smooth out a line given the points
function drawSmoothLine(queue, currentCanvas){
        if(queue.length < 5){
            return;
        }
    
        currentCanvas.beginPath();
        currentCanvas.moveTo(queue[0].x, queue[0].y);

        var tempQueue1 = [queue[0]];
        for (var i = 1; i < queue.length - 1;  i = i+1) {
            var c = (queue[i].x + queue[i + 1].x) / 2;
            var d = (queue[i].y + queue[i + 1].y) / 2;
            tempQueue1.push({x:c, y:d});
        }

        var tempQueue2 = [tempQueue1[0]];
        for (var i = 1; i < tempQueue1.length - 1;  i = i+1) {
            var c = (tempQueue1[i].x + tempQueue1[i + 1].x) / 2;
            var d = (tempQueue1[i].y + tempQueue1[i + 1].y) / 2;
            tempQueue2.push({x:c, y:d});
        }

        var tempQueue = [tempQueue2[0]];
        for (var i = 1; i < tempQueue2.length - 1;  i = i+1) {
            var c = (tempQueue2[i].x + tempQueue2[i + 1].x) / 2;
            var d = (tempQueue2[i].y + tempQueue2[i + 1].y) / 2;
            tempQueue.push({x:c, y:d});
        }

        for (var i = 1; i < tempQueue.length - 2;  i = i+1) {
            var c = (tempQueue[i].x + tempQueue[i + 1].x) / 2;
            var d = (tempQueue[i].y + tempQueue[i + 1].y) / 2;
            currentCanvas.quadraticCurveTo(tempQueue[i].x, tempQueue[i].y, c, d);
        }

        // For the last 2 points
        currentCanvas.quadraticCurveTo(
        tempQueue[i].x,
        tempQueue[i].y,
        tempQueue[i+1].x,
        tempQueue[i+1].y
        );
        currentCanvas.stroke();
        queue = [];
        currentCanvas.closePath();
}