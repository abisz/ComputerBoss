const Http = require('http'),
  fs = require('fs'),
  IOServer = require('socket.io'),
  JWT = require('jsonwebtoken'),
  Chance = require('chance').Chance(),
  SocketIOJWT = require('socketio-jwt');

const JWT_SECRET = 'my dirty little secret',
  PORT = 8000,
  OPERATION_ROOM = 'operation',
  ROOM = 'room';

const TASKS = [
  {
    type: 'read',
    msg: 'Some Text to read. Please'
  },
  {
    type: 'click'
  },
  {
    type: 'read',
    msg: 'That was the presentation'
  }
];

let task_counter = 0,
  presentation_started = false;

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
    name = payload.name,
    operator = payload.operator;

  // Add Client to Room
  // var room = operator ? OPERATION_ROOM : ROOM;
  var room = ROOM;

  socket.join( room, function (error) {
    if(error) return console.log(error);
    console.log('Joined room!');
  });

  // Socket Events
  socket.on('start_presentation', (msg) => {
    task_counter = 0;

    presentation_started = true;

    io.sockets.in(ROOM).emit('next_task', TASKS[task_counter]);
    io.sockets.in(ROOM).emit('presentation_started');

    task_counter++;
  });

  socket.on('task_done', (msg) => {
    if ( ! presentation_started ) {
      io.sockets.in(ROOM).emit('presentation_didnt_start');
    } else if (task_counter >= TASKS.length) {
      io.sockets.in(ROOM).emit('no_more_tasks');
      presentation_started = false;
    } else {
      const task = TASKS[task_counter];
      io.sockets.in(ROOM).emit('next_task', task);
      task_counter++;
    }

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
    case '/operator/login':
      return generateToken(res, true);
    case '/app.js':
      staticPage = fs.readFileSync(__dirname + '/../client/app.js').toString();
      break;
    case '/PeepGenerator.js':
      staticPage = fs.readFileSync(__dirname + '/../client/PeepGenerator.js').toString();
      break;
    case '/operator':
      staticPage = fs.readFileSync(__dirname + '/../client/operator.html').toString();
      break;
    case '/operator.js':
      staticPage = fs.readFileSync(__dirname + '/../client/operator.js').toString();
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
function generateToken (res, operator) {
  var payload = {
      email: Chance.email(),
      name: Chance.first() + ' ' + Chance.last(),
      operator: operator ? true : false
    },
    token = JWT.sign(payload, JWT_SECRET);

  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': Buffer.byteLength(token)
  });
  res.end(token);
}
