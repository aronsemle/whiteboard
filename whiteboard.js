window.addEventListener('load', () => {
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext('2d');

    var redoStack = []
    var canvasObjects = []

    // Temporary cache for points in a drawn line
    var linePoints = []
    
    resizeWindow();
    
    let painting = false;

    setInterval(drawLoop, 10);
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
                    if(squareCord.style == "bold"){
                        drawContex.lineWidth = "2";
                    }
                    drawContex.rect(squareCord.x, squareCord.y, squareCord.width, squareCord.height);
                    drawContex.stroke();

                    if(squareCord.text != null){
                        drawContex.font = "16px Arial";
                        drawContex.textAlign="center"; 
                        drawContex.textBaseline = "middle"
                        drawContex.fillText(squareCord.text, squareCord.x + squareCord.width/2, squareCord.y + squareCord.height/2);
                    }

                    drawContex.closePath();
                    break;

            }

        // Reset defaults
        drawContex.lineWidth = "1";
        }
    }
    
    var dragRect = null
    var dragOffset = {x: 0, y: 0};
    resizeRect = null;
    resizeRectOffset = {x: 0, y: 0, width: 0, height:0};
    function mouseDown(e){
        if(activeTextInput){
            // Clear any active text inputs
            if(activeTextInput.text == 'type..'){
                activeTextInput.text = '';
            }
            activeTextInput = null;
        }

        if(dragRect){
            dragRect = null;
            return;
        }

        rect = hitDetection(e);
        if(rect){
            // drag or resize?
            newRect = {type: 'rect', x: rect.x + 20, y: rect.y + 20, width: rect.width - 40, height: rect.height - 40}
            mouse = {x: e.offsetX, y: e.offsetY}
            if(!isHit(mouse, newRect)){
                resizeRect = rect;
                resizeRectOffset.x = mouse.x;
                resizeRectOffset.y = mouse.y;
                resizeRectOffset.width = rect.width;
                resizeRectOffset.height = rect.height;

            }else{
                mouse = getMousePos(canvas, e)
                dragRect = rect;
                dragOffset.x = mouse.x - rect.x;
                dragOffset.y = mouse.y - rect.y;
            }
            return;
        }

        painting = true;        
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.beginPath();
    }


    activeTextInput = null;
    function mouseUp(e){
        if(dragRect){

            activeTextInput = dragRect;
           
            dragRect = null
            redraw = true;
            return;
        }

        if(resizeRect){
            // Check if the shape was flipped and adjust it
            if(resizeRect.width < 0){
                resizeRect.x = resizeRect.x + resizeRect.width;
                resizeRect.width = Math.abs(resizeRect.width);
            }
            if(resizeRect.height < 0){
                resizeRect.y = resizeRect.y + resizeRect.height;
                resizeRect.height = Math.abs(resizeRect.height);
            }

            resizeRect = null;
            return;
        }
        
        painting = false;
        
        ctx.closePath();
        
        // Check for a square
        squareCord = isSquare(linePoints, ctx);
        if(squareCord){
            rect = {type: 'rect', x: squareCord.x, y: squareCord.y, width: squareCord.width, height: squareCord.height, style: 'bold', text: 'type..'};
            canvasObjects.push(rect)
            redraw = true;
            
            // We want to select the rectangle to allow the user to move it around
            mouse = getMousePos(canvas, e)
            dragRect = rect;
            activeTextInput = dragRect;
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

    hoverRect = null
    function mouseMove(e){
        if(dragRect){
            mouse = getMousePos(canvas, e);
            dragRect.x = mouse.x - dragOffset.x;
            dragRect.y = mouse.y - dragOffset.y;
            redraw = true;
            return;
        }
        if(resizeRect){
            mouse = getMousePos(canvas, e);
            resizeRect.width = resizeRectOffset.width + (mouse.x - resizeRectOffset.x);
            resizeRect.height = resizeRectOffset.height + (mouse.y - resizeRectOffset.y);

            redraw = true;
            return;
        }
        if(!painting){
            let activeRect = hitDetection(e);

            if(activeRect){
                // Check if we're on the edge
                newRect = {type: 'rect', x: activeRect.x + 20, y: activeRect.y + 20, width: activeRect.width - 40, height: activeRect.height - 40}
                mouse = {x: e.offsetX, y: e.offsetY}
                if(isHit(mouse, newRect)){
                    document.body.style.cursor = "default";
                }else{
                    document.body.style.cursor = "pointer";
                }
                redraw = true;
            }else{
                document.body.style.cursor = "default";
            }

            if(hoverRect != activeRect){
                if(!activeRect){
                    hoverRect.style = "normal"
                }
                if(!hoverRect){
                    activeRect.style = "bold"
                }
                hoverRect = activeRect;
                redraw = true;
            }
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
                if(isHit(mouse, rect)){
                    return rect;
                }
            }
        }
       return null;
    }

    function isHit(mouse, rect){
        return (rect.x <= mouse.x && mouse.x <= rect.x + rect.width && rect.y <= mouse.y && mouse.y <= rect.y + rect.height);   
    }
    
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("mousemove", mouseMove);
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'z') {
            undo();
        }
        if (event.ctrlKey && event.key === 'y') {
            redo();
        }
        else{
            if(activeTextInput){
                if(activeTextInput.text == 'type..'){
                    activeTextInput.text = '';
                }

                if(event.keyCode == 8 || event.keyCode == 46){
                    activeTextInput.text = activeTextInput.text.substring(0, activeTextInput.text.length - 1);
                }
                else if (event.keyCode == 13){
                    activeTextInput = null;
                }else{
                    activeTextInput.text += event.key;
                }
                redraw = true;
            }
        }
    });

    // Touch events for phones
    canvas.addEventListener("touchstart", function (e) {
        let mousePos = getTouchPos(canvas, e);
        let touch = e.touches[0];
        let mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
            });
        canvas.dispatchEvent(mouseEvent);
    }, false);
    canvas.addEventListener("touchend", function (e) {
        let mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
    }, false);
    canvas.addEventListener("touchmove", function (e) {
        let touch = e.touches[0];
        let mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, false);
    function getTouchPos(canvasDom, touchEvent) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: touchEvent.touches[0].clientX - rect.left,
          y: touchEvent.touches[0].clientY - rect.top
        };
    }
    // Prevent scrolling when touching the canvas
    document.body.addEventListener("touchstart", function (e) {
        if (e.target == canvas) {
        e.preventDefault();
        }
    }, { capture: false, passive: false });
    document.body.addEventListener("touchend", function (e) {
        if (e.target == canvas) {
        e.preventDefault();
        }
    }, { capture: false, passive: false });
    document.body.addEventListener("touchmove", function (e) {
        if (e.target == canvas) {
        e.preventDefault();
        }
    }, { capture: false, passive: false });
});

window.addEventListener('resize', resizeWindow())
function resizeWindow(){
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}

// Try and figure out if they drew a square
function isSquare(queue, ctx){
    if(queue.length < 15){
        return null;
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
            return null;
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