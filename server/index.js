const Http = require('http'),
  fs = require('fs'),
  IOServer = require('socket.io'),
  JWT = require('jsonwebtoken'),
  Chance = require('chance').Chance(),
  SocketIOJWT = require('socketio-jwt');

const JWT_SECRET = 'my dirty little secret',
  PORT = 8000;


// SERVER
server = Http.createServer(router);

server.listen(PORT, () => {
  console.log('Listening on Port ', PORT);
});


// SOCKET
const io = new IOServer(server);

io.use(SocketIOJWT.authorize({secret: JWT_SECRET, handshake:true}));

io.on('connection', (socket) => {

  const payload = socket.decoded_token,
    name = payload.name;
  // socket.emit('message', 'Hello ' + name + '!');

  socket.on('message', function (msg) {
    console.log(msg);
    socket.send(msg);
  });

  var room = 'room';

  socket.join( room, function (error) {
    if(error) return console.log(error);
    console.log('Joined room!');

    socket.to(room)
      .emit('message', name + ' joined the room!');
  });

  // function leave(){
  //   console.log('leave: ', name);
  //   socket.to(room)
  //     .emit('message', name+ ' is leaving the room');
  //   socket.leave(room);
  // }

});

// ROUTER
function router(req, res) {

  let staticPage;

  switch (req.url) {
    case '/login':
      return generateToken(res);
    case '/app.js':
      staticPage = fs.readFileSync(__dirname + '/../client/app.js').toString();
      break;
    case '/PeepGenerator.js':
      staticPage = fs.readFileSync(__dirname + '/../client/PeepGenerator.js').toString();
      break;
    default:
      staticPage = fs.readFileSync(__dirname + '/../client/index.html').toString();
  }
  
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': Buffer.byteLength(staticPage)
  });

  res.end(staticPage);
}

// JWT
function generateToken(res){
  var payload = {
      email: Chance.email(),
      name: Chance.first() + ' ' + Chance.last()
    },
    token = JWT.sign(payload, JWT_SECRET);

  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(token)
  });
  res.end(token);
}
