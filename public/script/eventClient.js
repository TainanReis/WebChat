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
    //the keyup event
    $('#message').keyup(function(keyVal){ //user sends a message by pressing up enter_key
        if(keyVal.which == 13){
            var msg = $('#message').val().slice(0,-1); //takes out the enter_char @the_end
            var msgChar = msg.length;
            if(msgChar !== 0){
                clientObj.toUser('You: ' + msg);
                clientObj.fromUser(msg);
            }
            $('#message').val(''); //clear the text_box _
            //_ Enter counts as char. If not cleared in the 1st keyup it could _
            // be sent on the 2nd
        }
    });
    //server communication
    socket.on('connect', function(){ //When user first connects
        clientObj.toUser('Connected'); //the user sees this message
        socket.emit('newConnection', socket.id); //goes to server to broadcast _
        //to the others
    });
    socket.on('message', function(str){ //receive message
        clientObj.toUser(str);
    });
    $('#test-button').click(function(){
        socket.emit('test', 'Private message');
    });
    
})