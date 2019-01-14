var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 3000;
var path = require('path');

//socket.IO
//it parses the http object
var io = require('socket.io')(http);

var usersArray = []; //to store users info

//----- references
//allow the css file reference
//no need to set the full path @href (see style.css reference @main.html)
app.use(express.static(path.join(__dirname + '/public/style')));

//script
app.use(express.static(path.join(__dirname + '/public/script')));

//page to open on connection
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/main.html');
});
//----- end of references
var getUserId = socketId => usersArray.indexOf(socketId);

function getSocketById(userId){ // "\to 4 message" for now, without nicknames, it simply returns usersArray[4]
  return usersArray[userId];
}
function labelObj (type, classVar, id, message){ //Creates a new labelObj to be sent back to the client.
  this.labelType = type;
  this.classVar = classVar;
  this.id = id;
  this.message = message;
}
//handling connection
io.on('connection', function(socket){
  function userId(){
      return getUserId(socket.id);
  }
  function confirmUser(user){ //checks if the user is on the array
    if(!getSocketById(user)){ //if the user is not found, sends an error message
    //Important: for now, when a user disconnects he remains on the array
      let label = new labelObj('system', 'server-message-bad', '', `User ${user} doesn't exist or is offline`);
      io.to(socket.id).emit('message', label);
    } else {
        return true;
    }
  }
    socket.on('message', function(msgObj){
      console.log('ID ' + userId() + ': ' + msgObj.message);
      var label = new labelObj('received', 'normal-msg-received', userId(), msgObj.message);
      socket.broadcast.emit('message', label);
    });
    socket.on('newConnection', function(data){ //when new connection
      usersArray.push(socket.id); //add new user to users array
      console.log(userId() + ' connected');
      var label = new labelObj('system', 'server-message-good', userId(), 'connected');
      socket.broadcast.emit('message', label);
    });
    socket.on('disconnect', function(){ //when user disconnects
      console.log(userId() + ' has Disconnected');
      var label = new labelObj('system', 'server-message-bad', userId(), 'disconnected');
      io.emit('message', label);
    });
    socket.on('privateMessage', function(msgObj){
      if(confirmUser(msgObj.user)){
        var label = new labelObj('received', 'pm-receive', userId(), msgObj.message);
        io.to(getSocketById(msgObj.user)).emit('message', label);
      }
    });
    socket.on('confirmUser', function(functionObj){
      if(confirmUser(functionObj.user)){//if true, i.e., if user exists
        io.to(socket.id).emit('confirmedUser', functionObj); //returns the obj to the client so it can complete the request
      }
    });
});

http.listen(port, function(){
  console.log('Listening on *:3000');
});
