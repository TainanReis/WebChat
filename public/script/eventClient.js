/* handles the communication between client-server-client and clientA-clientA */
$(document).ready(function(){

    //handles communication between client&user
    var clientObj = {
        fromUser: function(msg){
            var msgObj = {
                userId: socket.id, //to identify who's sending
                message: msg
            };
            socket.emit('message', msgObj); //send to server
        },
        toUser: function(msg){
            $('#result').append('<li>' + msg + '</li>');
        }
    };

    //start the socket
    var socket = (function(){ //left on function in case of need to add something more
        return io();
    })();
    //the click event
    $('#send-message').click(function(){ //user sends a message
        clientObj.fromUser($('#message').val());
        $('#message').val('');
    });
    //server communication
    socket.on('connect', function(){ //When user first connects
        socket.emit('newConnection', socket.id);
    });
    socket.on('message', function(str){ //receive message
        clientObj.toUser(str);
    });
    
})
