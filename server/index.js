const Http = require('http'),
  fs = require('fs'),
  cheerio = require('cheerio'),
  request = require('request'),
  IOServer = require('socket.io'),
  JWT = require('jsonwebtoken'),
  Chance = require('chance').Chance(),
  SocketIOJWT = require('socketio-jwt');

const JWT_SECRET = 'my dirty little secret',
  PORT = 8000,
  OPERATION_ROOM = 'operation',
  ROOM = 'room';

const MINIMUM_CHAPTERS = 5;

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

    fetchPresentation( (config) => {

        io.sockets.in(ROOM).emit('presentation_config', config);
      });
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
    case '/getPresentation':
      fetchPresentation( (config ) => {
          return res.end(JSON.stringify(config));
        });
      return;
    case '/presentation':
      staticPage = fs.readFileSync(__dirname + '/../client/presentation.html');
      break;
    case '/presentation.js':
      staticPage = fs.readFileSync(__dirname + '/../client/presentation.js');
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

function fetchPresentation (cb) {

  console.log('starting fetching wikipedia article');

  const url = 'https://de.wikipedia.org/wiki/Spezial:Zufällige_Seite?printable=yes';
  // const url = 'https://de.wikipedia.org/w/index.php?title=Quendel-Seide&printable=yes';

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {

      let $ = cheerio.load(body);

      try {

        const title = $('h1#firstHeading').text();

        let cover_img = 'http:' + $('.image img')[0].attribs.src;
        cover_img = cover_img.replace(/\d+px/, '1000px');

        request(cover_img, (error, response, body) => {
          if (error || response.statusCode !== 200) return fetchPresentation(cb);

          const intro = $('p:not(.noexcerpt)', '#mw-content-text').slice(0,1).text();

          const chaptersRaw = $('.mw-headline', 'h2').map( (i, e) => {
            return $(e).text();
            // console.log(e.text());
            // chaptersRaw[i] = $(e);
          });

          console.log('chaptersRaw:', chaptersRaw.length);

          if (chaptersRaw.length < MINIMUM_CHAPTERS) return fetchPresentation(cb);

          let chapters = [];

          for (let i = 0; i < chaptersRaw.length; i++) {

            console.log(chaptersRaw[i]);

            let content;

            content = $('.mw-headline', 'h2').slice(i, i+1).parent().next('p').text();

            if ($('.mw-headline', 'h2').slice(i, i+1).parent().next().is('ul')) {
              console.log('ul');
              const li = $('.mw-headline', 'h2')
                .slice(i, i+1)
                .parent()
                .next('ul')
                .children('li')
                .map( (i, e) =>  $(e).text() );

              content = [];
              for (let j = 0; j < li.length; j++) {
                content.push(li[j]);
              }
            }

            console.log(typeof content);

            if (typeof content !== 'string' || ! content) {
              console.log('Removed chapter:', chaptersRaw[i]);
              // let counter = 0;
              // while ( counter < 4) {
              //   console.log('no content');
              //   content = $('.mw-headline', 'h2').slice(i, i+1).parent().find('p').slice(0,1).text();//.next().next('p').tex();
              //
              //   console.log('CONTNENT:', content);
              //
              //   if ( ! content.next().is('p') ) {
              //     for (let k = 0; k < counter; k++) {
              //       console.log('next');
              //       content = content.next();
              //     }
              //   } else {
              //     console.log('success');
              //     content = $('.mw-headline', 'h2').slice(i, i+1).parent().next().next('p').text();
              //     break;
              //   }
              //
              //   counter++;
              // }
            } else {
              chapters.push({
                title: chaptersRaw[i],
                content: content
              })
            }
          }

          return cb({
            title: title,
            intro: intro,
            cover_img: cover_img,
            chapters: chapters
          });

        });
      } catch (e) {
        console.log('no attribs');
        // console.log(e);
        return fetchPresentation(cb);
      }



    }
  });



}