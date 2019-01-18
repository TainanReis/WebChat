var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 3000;
var path = require('path');

//socket.IO
//it parses the http object
var io = require('socket.io')(http);

var usersArray = []; //to store users info
var predefinedUserName = 0; //when a new user is connected, he'll get a predefinedUserName
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
function arrayParser(entry, type){ //get user position/confirm that it exists. entry=the value, socket or name. type=the 2 object entries, socketId or name
  return usersArray.findIndex(e => e[type].toString().toLowerCase() === entry.toString().toLowerCase());
}

function labelObj (type, classVar, name, socket, message){ //Creates a new labelObj to be sent back to the client.
  this.labelType = type;
  this.classVar = classVar;
  this.name = name;
  this.socket = socket;
  this.message = message;
}

//handling socket connections
io.on('connection', (socket) => {
  function getUserName(){ //returns the username searching by the socket.id
    return usersArray[arrayParser(socket.id, "socketId")].name;
  }
  function getUserSocket(name){ //returns the user socketId by searching for a given name
    return usersArray[arrayParser(name, "name")].socketId;
  }
  function newUser(){ //adds a new user to the usersArray
    let userObj = {"socketId": socket.id, "name": predefinedUserName++ /*usersArray.length*/}; //the object to be moved
    usersArray.push(userObj); //move it!
  }
  function confirmUser(entry, type){ //checks if the user is on the array type="name" || "socketId"
    if(arrayParser(entry, type) < 0){ //if the user is not found, sends an error message
      let label = new labelObj('system', 'server-message-bad', '', '', `User ${entry} doesn't exist or is offline`);
      io.to(socket.id).emit('message', label);
    } else {
      return true;
    }
  }
  socket.on('message', (msgObj) => { //normal message
    let label = new labelObj('received', 'normal-msg-received', getUserName(), socket.id, msgObj.message);
    socket.broadcast.emit('message', label);
  });
  socket.on('newConnection', (data) => { //when new connection
    newUser();
    console.log(getUserName() + ' connected');
    let label = new labelObj('system', 'server-message-good', getUserName(), socket.id, 'Connected');
    socket.broadcast.emit('message', label);
  });
  socket.on('disconnect', () => { //when user disconnects
    console.log(getUserName() + ' has Disconnected');
    let label = new labelObj('system', 'server-message-bad', getUserName(), socket.id, 'Disconnected');
    usersArray.splice(arrayParser(socket.id, "socketId"), 1); //removes the disconnected user from the array
    io.emit('message', label);
  });
  socket.on('privateMessage', (msgObj) => { //private messages
    if(confirmUser(msgObj.socketId, "socketId")){
      let label = new labelObj('received', 'pm-receive', getUserName(), socket.id, msgObj.message);
      io.to(msgObj.socketId).emit('message', label);
    }
  });
  socket.on('confirmUser', (functionObj) => { //returns a confirmation
    if(confirmUser(functionObj.user, "name")){ //if true, i.e., if user exists
      functionObj.socketId = getUserSocket(functionObj.user); //adds a new entry to the functionObj. The user respective socket will be needed @eventClient
      io.to(socket.id).emit('confirmedUser', functionObj); //returns the obj to the client so it can complete the request
    }
  });
  socket.on('changeName', (newName) => { //changes the username
    let label;
    if(arrayParser(newName, "name") < 0){ //if the same name is not found in the usersArray
      usersArray[arrayParser(socket.id, "socketId")].name = newName; //defines the new username
      label = new labelObj('system', 'server-message-good', '', '', `Your new username: "${newName}"`);
    } else {
      label = new labelObj('system', 'server-message-bad', '', '', `Username "${newName}" already taken`);
    }
    io.to(socket.id).emit('message', label);
  });
});

http.listen(port, () => { //the http server will be listening to the specified port
  console.log('Listening on *:3000'); //this message will be shown @console
});
