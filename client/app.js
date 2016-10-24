console.log('app.js loaded');

var peep = new PeepGenerator();

function socketIO(token) {
  var socket = io.connect('http://localhost:8000', {
    query: 'token=' + token
  });

  socket.on('connect', function () {
    console.log('connection');
    logScreen('Connection!');
    socket.send('Hello');
  });

  socket.on('message', logScreen);

  var ouput = document.getElementById('output');

  function logScreen(text) {
    var date = new Date().toISOString(),
      line = date + ' ' + text + '<br/>';

    output.innerHTML = line + output.innerHTML;
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

var toggle = true;

function startAudio (e) {
  peep.init();

  if (toggle) {
    peep.startPeep(1400);
    toggle = false;
  } else {
    peep.stopPeep();
    toggle = true;
  }

}