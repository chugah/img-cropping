(function() {
  // var needed for image cropping
  var el, lastActive, object;

  // var needed to redo/undo cropping
  var config = {
    canvasState             : [],
    currentStateIndex       : -1,
    undoStatus              : false,
    redoStatus              : false,
    undoFinishedStatus      : 1,
    redoFinishedStatus      : 1
  };

  // bounding box characteristics
  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.padding = 5;
  fabric.Object.prototype.transparentCorners = false;

  //jquery handler
  var $ = function(id){return document.getElementById(id)};

  // canvas set-up
  var canvas = this.__canvas = new fabric.Canvas('c');
  canvas.backgroundColor = '#ffffff';
  canvas.on({
     'object:modified': function () {
      updateModifications();  
    },

    'object:added': function () {
      updateModifications();  
    }
  });

  //upload images
  fabric.Image.fromURL(document.getElementById('gingerbread-house').src, function(img) {
    var oImg = img.set({ left: 25, top: 50, angle: 0, id: 'gingerbread-house' }).scale(0.9);
    canvas.add(oImg).renderAll();
    canvas.setActiveObject(oImg);
  });

  fabric.Image.fromURL('./images/Pavlova.jpg', function(img) {
    var oImg = img.set({ left: 300, top: 300, angle: 0  }).scale(0.9);
    canvas.add(oImg).renderAll();
    canvas.setActiveObject(oImg);
  });

  // crop image handlers
  $('startCropRect').onclick = function(){ startCropRect(); };
  $('endCropRect').onclick = function(){ endCropRect(); };
  $('startCropEl').onclick = function(){ startCropEl(); };
  $('endCropEl').onclick = function(){ endCropEl(); };
  $('undoCrop').onclick = function(){ undoCrop(); };
  $('redoCrop').onclick = function(){ redoCrop(); };

  // initiate crop function with rectangle
  function startCropRect(){
    canvas.remove(el);
    if(canvas.getActiveObject()) {  
      object=canvas.getActiveObject();      
      if (lastActive && lastActive !== object) {
        lastActive.clipTo = null;    
      }   
      el = new fabric.Rect({
        fill: 'transparent',
        originX: 'left',
        originY: 'top',
        stroke: '#ccc',
        strokeDashArray: [2, 2],
        opacity: 1,
        width: 1,
        height: 1,
        borderColor: '#36fd00',
        cornerColor: 'green',
        hasRotatingPoint:false,
        objectCaching: false
      });  
      el.left=canvas.getActiveObject().left;
      el.top=canvas.getActiveObject().top;
      el.width=canvas.getActiveObject().width*canvas.getActiveObject().scaleX;
      el.height=canvas.getActiveObject().height*canvas.getActiveObject().scaleY;    
      canvas.add(el);
      canvas.setActiveObject(el)
    }  
    else {
      alert("Please select an object or layer");
    }
  }

  // end crop function with rectangle
  function endCropRect(){
    var left = el.left - object.left;
    var top = el.top - object.top;    
    var width = el.width;
    var height = el.height;    
    object.clipTo = function (ctx) {  
      if (left < 0 || top < 0 || left > object.width/2 || top > object.height/2) { 
        alert('Crop guides can not extend beyond image.');
        location.reload();
      } else {
        ctx.rect(-(width/2)+left, -(height/2)+top, parseInt(width*el.scaleX), parseInt(height*el.scaleY));   
      }      
    }   
    canvas.remove(canvas.getActiveObject(el));
    lastActive = object;
    canvas.renderAll();   
  }

  // initiate crop function with circle
  function startCropEl(){
    canvas.remove(el);
    if(canvas.getActiveObject()) {  
      object=canvas.getActiveObject();
      if (lastActive && lastActive !== object) {
        lastActive.clipTo = null;    
      }  
      el = new fabric.Ellipse({
        fill: 'transparent',
        originX: 'left',
        originY: 'top',
        stroke: 'yellow',
        strokeDashArray: [5, 4],
        rx: object.width/3,
        ry: object.width/3,
        opacity: 1,
        borderColor: '#36fd00',
        cornerColor: 'green',
        hasRotatingPoint:false,
        objectCaching: false
      });  
      el.left=canvas.getActiveObject().left;
      el.top=canvas.getActiveObject().top;
      el.width=canvas.getActiveObject().width*canvas.getActiveObject().scaleX;
      el.height=canvas.getActiveObject().height*canvas.getActiveObject().scaleY;    
      canvas.add(el);
      canvas.setActiveObject(el)
    }  
    else {
      alert("Please select an object or layer");
    }
  }

  // end crop function with circle
  function endCropEl(){
    var left = Math.floor(el.left - object.left);
    var top = Math.floor(el.top - object.top);
    var width = el.rx;
    var height = el.ry; 
    object.clipTo = function (ctx) { 
      // Ensures crop guides do not extend beyond image & crop is in the shape of a circle
      if (left < 0 || top < 0 || width*el.scaleX > width || height*el.scaleY > width) {        
        alert('Crop guides can not extend beyond image.');
        location.reload();
      } else if ((left > width && -(width/2)+left > width) || (top > width && -(height/2)+top > width)) {
        alert('Crop guides can not extend beyond image.');
        location.reload();
      } else if (el.scaleX !== el.scaleY) { 
        ctx.ellipse(left, top, parseInt(width*el.scaleX), parseInt(height*el.scaleY), Math.PI/180, 0, 2 * Math.PI);
        alert('Can only crop with a circle');
        location.reload();
      } // image crop  
        else if (parseInt(width*el.scaleX) === width || parseInt(height*el.scaleY) === width){
        ctx.ellipse(left, top, parseInt(width*el.scaleX), parseInt(height*el.scaleY), 45 * Math.PI/180, 0, 2 * Math.PI);
      } else if (left > 0 || top > 0 || (el.scaleX === el.scaleY)) { 
        ctx.ellipse(-(width/2)+left, -(height/2)+top, parseInt(width*el.scaleX), parseInt(height*el.scaleY), 45 * Math.PI/180, 0, 2 * Math.PI);
      }  else {
        alert('Please try again.');
        location.reload();
      }
    }
    canvas.remove(canvas.getActiveObject(el));
    lastActive = object;
    canvas.renderAll();   
  }

  // undo redo state change function
  var updateModifications = function() {
    if((config.undoStatus == false && config.redoStatus == false)){
      var jsonData = canvas.toJSON();
      var canvasAsJson = JSON.stringify(jsonData);
      if(config.currentStateIndex < config.canvasState.length-1){
        var indexToBeInserted = config.currentStateIndex+1;
        config.canvasState[indexToBeInserted] = canvasAsJson;
        var numberOfElementsToRetain = indexToBeInserted+1;
        config.canvasState = config.canvasState.splice(0, numberOfElementsToRetain);
      } else {
        config.canvasState.push(canvasAsJson);
      }
      config.currentStateIndex = config.canvasState.length-1;
     }
  }
 
  // undo crop function
  var undoCrop = function() {
    if(config.undoFinishedStatus){
      if(config.currentStateIndex == -1){
        config.undoStatus = false;
      } else {
        if (config.canvasState.length >= 1) {
            config.undoFinishedStatus = 0;
          if(config.currentStateIndex != 0){
            config.undoStatus = true;
            canvas.loadFromJSON(config.canvasState[config.currentStateIndex-1],function(){
                var jsonData = JSON.parse(config.canvasState[config.currentStateIndex-1]);
                lastActive = object;
                canvas.renderAll();   
                config.undoStatus = false;
                config.currentStateIndex -= 1;
                config.undoFinishedStatus = 1;
            });
          }
          else if(config.currentStateIndex == 0){
            canvas.clear();
            config.undoFinishedStatus = 1;
            config.currentStateIndex -= 1;
          }
        }
      }
    }
  }

  // redo crop function but not working properly
  var redoCrop = function() {
    if(config.redoFinishedStatus){
      if (config.canvasState.length > config.currentStateIndex && config.canvasState.length != 0){
          config.redoFinishedStatus = 0;
          config.redoStatus = true;
          canvas.loadFromJSON(config.canvasState[config.currentStateIndex+1], function(){
            var jsonData = JSON.parse(config.canvasState[config.currentStateIndex+1]);
            canvas.renderAll();
            config.redoStatus = false;
            config.currentStateIndex += 1;
            config.redoFinishedStatus = 1;
        });
      }
    }
  } 
})();