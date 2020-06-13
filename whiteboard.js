window.addEventListener('load', () => {
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext('2d');

    var redoStack = []
    var canvasObjects = []

    // Temporary cache for points in a drawn line
    var linePoints = []
    
    resizeWindow();
    
    let painting = false;

    setInterval(drawLoop, 20);
    let redraw = false;
    function drawLoop(){
        if(redraw == true){
            // Clear 
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawShapes(ctx);
        }
        redraw = false
    }

    function drawShapes(drawContex){
         // Redraw objects in order
         for(let j=0; j < canvasObjects.length; j++){
            switch(canvasObjects[j].type){
                case 'line':
                    line = canvasObjects[j]

                    drawContex.beginPath();
                    drawContex.moveTo(line.points[0].x, line.points[0].y);

                    for (var i = 1; i < line.points.length - 2;  i = i+1) {
                        var c = (line.points[i].x + line.points[i + 1].x) / 2;
                        var d = (line.points[i].y + line.points[i + 1].y) / 2;
                        drawContex.quadraticCurveTo(line.points[i].x, line.points[i].y, c, d);
                    }
            
                    // For the last 2 points
                    drawContex.quadraticCurveTo(
                        line.points[i].x,
                        line.points[i].y,
                        line.points[i+1].x,
                        line.points[i+1].y
                        );
                    drawContex.stroke();
                    drawContex.closePath();

                    break;

                case 'rect':
                    drawContex.beginPath();
                    squareCord = canvasObjects[j];
                    drawContex.rect(squareCord.x, squareCord.y, squareCord.width, squareCord.height);
                    drawContex.stroke();
                    drawContex.closePath();
                    break;
            }
        }
    }
    
    var dragRect = null
    var dragOffset = {x: 0, y: 0};
    function startPosition(e){
        rect = hitDetection(e);
        if(rect){
            mouse = getMousePos(canvas, e)
            dragRect = rect;
            dragOffset.x = mouse.x - rect.x;
            dragOffset.y = mouse.y - rect.y;
            return;
        }

        painting = true;        
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.beginPath();
        
        draw(e);
    }
    function finishedPosition(e){
        if(dragRect){
            dragRect = null
            redraw = true;
            return;
        }
        
        painting = false;
        
        ctx.closePath();
        
        // Check for a square
        squareCord = isSquare(linePoints, ctx);
        if(squareCord){
            rect = {type: 'rect', x: squareCord.x, y: squareCord.y, width: squareCord.width, height: squareCord.height};
            canvasObjects.push(rect)
            redraw = true;
            
            // We want to select the rectangle to allow the user to move it around
            mouse = getMousePos(canvas, e)
            dragRect = rect;
            dragOffset.x = mouse.x - rect.x;
            dragOffset.y = mouse.y - rect.y;

        }else{
             // Smooth line
            linePoints = makeSmoothLine(linePoints);
            if(linePoints){
                canvasObjects.push({type: 'line', points: linePoints})
                redraw = true;
            }
        }
        
        linePoints = []
        
    }

    function draw(e){
        if(dragRect){
            mouse = getMousePos(canvas, e);
            dragRect.x = mouse.x - dragOffset.x;
            dragRect.y = mouse.y - dragOffset.y;
            redraw = true;
            return;
        }
        if(!painting){
            return;
        }
        
        linePoints.push({x: e.clientX, y: e.clientY});
        
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        ctx.moveTo(e.clientX, e.clientY);
        ctx.closePath();
    }

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
    }
    
    
    function undo(){
        if(canvasObjects.length){
            redoStack.push(canvasObjects.pop());
            redraw = true
        }
    }
    
    function redo(){
        if(redoStack.length){
            canvasObjects.push(redoStack.pop());
            redraw = true;
        }
    }

    function hitDetection (mouse){
        x = mouse.offsetX;
        y = mouse.offsetY;
        for(let i = canvasObjects.length - 1; i >= 0; i--){
            if(canvasObjects[i].type == 'rect'){
                rect = canvasObjects[i]
                if(rect.x <= mouse.x && mouse.x <= rect.x + rect.width &&
                    rect.y <= mouse.y && mouse.y <= rect.y + rect.height){
                        return rect;
                    }
            }
        }
       return null;
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

// Try and figure out if they drew a square
function isSquare(queue, ctx){
    if(queue.length < 15){
        return;
    }    
    
    // Are the start and end point pretty close?
    xdelta = queue[0].x - queue[queue.length-1].x;
    ydelta = queue[0].y - queue[queue.length-1].y;
    distance = Math.sqrt(Math.pow(xdelta, 2) + Math.pow(ydelta, 2));
    if(distance > 75){
        return;
    }
    
    totalPoints = queue.length;
    checkInterval = 1;
        
    // Check if it's a square. We're looking for 3 right angles
    let angleCount = 0;
    let lastAngle = 0;
    angles = []
    for(let i=0; i < queue.length - checkInterval - 1; i+=checkInterval){
        let angle = Math.abs(Math.atan2(queue[i+checkInterval].y - queue[i].y, queue[i+checkInterval].x - queue[i].x) * 180 / Math.PI);
        angles.push(Math.round(angle));
        if(i == 0){
            lastAngle = angle;
        }else{
            if(Math.abs(lastAngle - angle) > 60){
                angleCount++;
                lastAngle = angle;
            }
        }
    }
        
    
    if(angleCount == 3){
        // Get the max X, Y and min X, Y
        let minX = queue[0].x;
        let minY = queue[0].y;
        let maxX = queue[0].x;
        let maxY = queue[0].y;
        for(let i = 0; i < queue.length; i++){
            let x = queue[i].x;
            let y = queue[i].y;
            if(x > maxX){
                maxX = x;
            }
            if(y > maxY){
                maxY = y;
            }
            if(x < minX){
                minX = x;
            }
            if(y < minY){
                minY = y;
            }
        }
        
        return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
    }
    
    return null
        
}

// Smooth out a line given the points
function makeSmoothLine(queue, currentCanvas){
        if(queue.length < 5){
            return [];
        }
    
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
        
        return tempQueue;
}