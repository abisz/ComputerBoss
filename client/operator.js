console.log('Operation script loaded');

var socket;

// var URL = 'localhost:8000';
var URL = 'https://83c65cf1.ngrok.io';


function socketIO(token) {
  socket = io.connect(URL, {
    query: 'token=' + token
  });

  socket.on('connect', function () {
    console.log('Operator connected!');
  });

  // socket.on('presentation_started', function () {
  //   console.log('presentation started');
  // });

  socket.on('next_task', updateScreen);

  function updateScreen(task) {

    console.log('update Screen', task);

    var text;

    if (task) {
      switch (task.type) {
        case 'read':
          text = 'Präsentiere:\n' + task.msg;
          break;
        case 'click':
          text = 'Klicke auf die nächste Folie!';
          break;

      }
      output.innerHTML = text;
    }
  }

}

function login(){
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if(request.readyState !== 4 || request.status !== 200) return socketIO(request.responseText)
  };
  request.open('GET', '/operator/login', true);
  request.send(null);
}
login();

function taskDone () {
  socket.emit('task_done');
}