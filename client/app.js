console.log('app.js loaded');

var peep = new PeepGenerator();

var socket;
var ouput = document.getElementById('output');
var startButton = document.getElementById('button-start');

peep.init();

function socketIO(token) {
  socket = io.connect('http://localhost:8000', {
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

    if (task) {
      switch (task.type) {
        case 'read':
            text = 'Lies laut vor:\n' + task.msg;
          break;
        case 'click':
            text = 'Klicke auf die nächste Folie!';
          break;

      }
    output.innerHTML = 'Anweisung:\n' + text;
    }
  }

  function reset () {
    peep.stopPeep();

    output.innerHTML = '';
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