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

//handling connection
io.on('connection', function(socket){
    socket.on('message', function(msgObj){
        for(var i in usersArray){
            if (usersArray[i] == msgObj.userId){
                var userId = ++i; //show userID as a number, not as socket
                console.log('Message fromId ' + userId + ': ' + msgObj.message);
            }
        }
        io.emit('message', msgObj.message);
    });
    socket.on('newConnection', function(data){ //when new connection
        usersArray.push(data); //add new user to users array
    });
});

http.listen(port, function(){
    console.log('Listening on *:3000');
});