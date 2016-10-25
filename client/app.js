console.log('app.js loaded');

var peep = new PeepGenerator();

var socket;
var ouput = document.getElementById('output');
var startButton = document.getElementById('button-start');

var URL = 'https://83c65cf1.ngrok.io';
// var URL = 'localhost:8000';

peep.init();

function socketIO(token) {
  socket = io.connect(URL, {
    query: 'token=' + token
  });

  socket.on('connect', function () {
     console.log('Connected');
  });

  socket.on('next_task', updateScreen);

  socket.on('no_more_tasks', reset);

  function updateScreen (task) {

    console.log('update Screen', task);

    peep.startPeep(1400);

    var text;

    console.log(task);

    if (task) {
      switch (task.type) {
        case 'read':
            text = '<h2>Präsentiere:</h2><p>' + task.msg + '</p>';
          break;
        case 'click':
            text = '<h2>Gehe zur nächsten Folie°</h2>';
          break;

      }
    output.innerHTML = text;
    }
  }

  function reset () {
    peep.stopPeep();

    output.innerHTML = 'Klicke zur nächsten Folie und bedanke dich!';
    startButton.className = '';
  }
}

function login(){
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if(request.readyState !== 4 || request.status !== 200) return socketIO(request.responseText)
  };
  request.open('GET', '/login', true);
  request.send(null);
}
login();

function startPresentation () {
  socket.emit('start_presentation');
  startButton.className = 'hidden';
}