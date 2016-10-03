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
function getSocketById(userId){ //this function is for when I have nicknames working
    return usersArray[userId-1];
}
function labelObj (type, classVar, id, message){
//Creates a new labelObj to be sent back to the client.
//This is because the labels are set in only one place (compare to V0.3.0, for example)
    this.labelType = type; //the type of label
    this.classVar = classVar;
    this.id = id;
    this.message = message;
}
//handling connection
io.on('connection', function(socket){
    function userId(){
        return getUserId(socket.id);
    }
    function confirmUser(user){
    //checks if the user is on the array
        if(!getSocketById(user)){
        //if the user is not found, gives error message
        //I'll associate user ID/name to the socket when implement nicknames _
        //so now, when a user disconnects he remains on the array
            var label = new labelObj('system', 'server-message-bad', '', 'User (' + user + ') doesn\'t exist ot isn\'t online');
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
        console.log(userId() + ' has connected');
        var label = new labelObj('system', 'server-message-good', userId(), 'connected');
        socket.broadcast.emit('message', label);
    });
    socket.on('disconnect', function(){ //when user disconnects
        console.log(userId() + ' has Disconnected');
        var label = new labelObj('system', 'server-message-bad', userId(), 'disconnected');
        io.emit('message', label);
    });
    socket.on('privateMessage', function(msgObj){
        if(confirmUser(msgObj.sendTo) === true){
            var label = new labelObj('received', 'pm-receive', userId(), msgObj.message);
            io.to(getSocketById(msgObj.sendTo)).emit('message', label);
        }
    });
    socket.on('confirmUser', function(functionObj){
        if(confirmUser(functionObj.user) === true){
            functionObj.serverAnswer = true;
            io.to(socket.id).emit('confirmedUser', functionObj);
            //now that the user is confirmed, it returns the obj to the client so it can complete_
            //_ the request
        } else {
            functionObj.serverAnswer = false;
            //parses a new object value (false) cause needed like it is on \track username
            //on this specific case (track) we send to the server a request to confirm username _
            //_ and we  receive an answer somewhere on the client. Instead of creating a new socket.on @client or _
            //_ adding a new property for specific functionObj.functionType, we automate it so all the _
            //_ remaining cases are left to the client.
            io.to(socket.id).emit('confirmedUser', functionObj);
        }
    });
});

http.listen(port, function(){
    console.log('Listening on *:3000');
});