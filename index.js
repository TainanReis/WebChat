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
    socket.on('message', function(msgObj){
        var userId = getUserId(msgObj.userId);
        console.log('ID ' + userId + ': ' + msgObj.message);
        io.emit('message', userId + ': ' + msgObj.message);
    });
    socket.on('newConnection', function(data){ //when new connection
        usersArray.push(data); //add new user to users array
        var userId = getUserId(data);
        console.log(userId + ' has connected');
        io.emit('message', userId + ' connected')
    });
    socket.on('disconnect', function(){ //when user disconnects
        var socketId = socket.id;
        var userId = getUserId(socketId.slice(2)); //when socket is disconnected _
        //socket.io adds /# to the beggining of socket.id
        console.log(userId + ' has Disconnected');
        io.emit('message', userId + ' disconnected');
    });
});

http.listen(port, function(){
    console.log('Listening on *:3000');
});