window.addEventListener('load', () => {
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext('2d');
    var undoStack = []
    var redoStack = []
    
    resizeWindow();
    
    let painting = false;
    
    function startPosition(e){
        painting = true;
        undoStack.push(canvas.toDataURL())
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        
        draw(e);
    }
    function finishedPosition(){
        painting = false;
        ctx.closePath();
        
    }
    function draw(e){
        if(!painting){
            return;
        }
        
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        ctx.moveTo(e.clientX, e.clientY);
        ctx.closePath();
    }
    
    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mousemove", draw);
    document.addEventListener('keydown', function(event) {
      if (event.ctrlKey && event.key === 'z') {
        if(undoStack.length){
            redoStack.push(canvas.toDataURL());
            let oldImage = new Image();
            oldImage.src = undoStack.pop();
            oldImage.onload = function (){
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(oldImage, 0, 0, canvas.width, canvas.height);
            }
        }
      }
      if (event.ctrlKey && event.key === 'y') {
          if(redoStack.length){
              undoStack.push(canvas.toDataURL());
              let oldImage = new Image();
              oldImage.src = redoStack.pop();
              oldImage.onload = function (){
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(oldImage, 0, 0, canvas.width, canvas.height);
          }
        }
      }
    });
});

 window.addEventListener('resize', resizeWindow())
function resizeWindow(){
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}