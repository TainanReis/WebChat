var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 3000;
var path = require('path');

//socket.IO
//it parses the http object
var io = require('socket.io')(http);
//to store users info
var usersArray = [];

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
var getUserId = function(socketId){ //to run the usersArray
    for(var i in usersArray){
            if (usersArray[i] == socketId){
                return ++i; //Return user position @array AKA userId
            }
        }
};

//handling connection
io.on('connection', function(socket){
    function userId(){
        return getUserId(socket.id);
    }
    socket.on('message', function(msgObj){
        console.log('ID ' + userId() + ': ' + msgObj.message);
        socket.broadcast.emit('message', '<label class="normal-msg-received" name="' + userId() + '">' + userId() + ':</label> ' + msgObj.message);
    });
    socket.on('newConnection', function(data){ //when new connection
        usersArray.push(socket.id); //add new user to users array
        console.log(userId() + ' has connected');
        socket.broadcast.emit('message', '<label class="server-message-good">' + userId() + ' connected' + "</label>")
    });
    socket.on('disconnect', function(){ //when user disconnects
        console.log(userId() + ' has Disconnected');
        io.emit('message', '<label class="server-message-bad">' + userId() + ' disconnected' + "</label>");
    });
    socket.on('privateMessage', function(msgObj){
        io.to(usersArray[msgObj.sendTo]).emit('message', '<label class="pm-receive" name="' + userId() + '">' + userId() + ':</label> ' + msgObj.message);
    });
});

http.listen(port, function(){
    console.log('Listening on *:3000');
});