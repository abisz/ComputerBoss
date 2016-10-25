console.log('presentation.js loaded');

// var URL = 'https://83c65cf1.ngrok.io';
var URL = 'localhost:8000';

var currentPage = -1;
var config;

var statusLine = document.getElementById('statusLine');
var backgroundImage = document.getElementById('background');
var title = document.getElementById('title');
var text = document.getElementById('text');

function socketIO(token) {
  socket = io.connect(URL, {
    query: 'token=' + token
  });

  socket.on('connect', function () {
    console.log('Connected');
  });

  socket.on('presentation_loading', () => {
    statusLine.innerHTML = 'Presentation is loading...';
  });

  socket.on('presentation_config', renderPresentation);


  function renderPresentation (c) {

    console.log(c);


    config = c;

    updatePresentation();

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

function nextPage () {
  currentPage++;
  updatePresentation();
}

function prevPage () {
  currentPage--;
  currentPage = Math.max(-1, currentPage);
  updatePresentation();
}

function updatePresentation () {
  statusLine.innerHTML = '';

  if (currentPage === -1) {
    title.innerHTML = config.title;
    backgroundImage.setAttribute('src', config.cover_img);
    backgroundImage.className = '';
  } else if (currentPage >= config.chapters.length) {
    title.innerHTML = 'Danke für Ihre Aufmerksamkeit';
    text.innerHTML = '';
  } else {
    var chapter = config.chapters[currentPage];
    title.innerHTML = chapter.title;
    backgroundImage.className = 'hidden';
    text.innerHTML = chapter.content.replace(/\[\d+\]/g, '');
  }

}

document.addEventListener('keydown', (e) => {
  console.log(e);

  // Right
  if (e.keyCode === 39) {
    nextPage();
  } else if (e.keyCode === 37) {
    prevPage();
  }
  
});