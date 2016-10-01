/* handles the communication between client-server-client and clientA-clientA */
$(document).ready(function(){

    function autoScroll(){ //scrolls to the most recent message
        var scrollSize = $('#messageboard')[0].scrollHeight;
        $('#messageboard').animate({ scrollTop: scrollSize}, 0);
    }
    //handles communication between client&user
    var clientObj = {
        userSettings: {
            autoScroll: '',
            toFix: ''
        },
        fromUser: function(msg){
            var msgObj = {
                message: msg
            };
            socket.emit('message', msgObj); //send to server
        },
        toUser: function(msg){
            $('#result').append('<li>' + msg + '</li>');
            //check if autoscrolling is enabled
            if(clientObj.userSettings.autoScroll === 'enabled'){
                autoScroll();
            }
        },
        appendEnabledOptions: function(functionObj){
            //appends a label with the enabled functions
            $('#enabled-options').append('<label class="' + 
                                         functionObj.functionType + '">' + 
                                         functionObj.functionType + ': ' + 
                                         functionObj.user + '</label>'
                                        );
        },
        messageHandler: function(msg){
            if(msg.slice(0,1) === '\\'){
                var commandArray = msg.split(' ');// example: _
                // \to user msg > [\to,user,msg] > [1] = user
                clientObj.commandList(commandArray, msg);
            } else {
                if(clientObj.userSettings.toFix.length > 0){
                    var msgObj = {
                        message: msg,
                        sendTo: clientObj.userSettings.toFix
                    };
                    clientObj.toUser('<label class="pm-send" name="' + socket.id + '">You:</label> ' + msgObj.message);
                    socket.emit('privateMessage', msgObj);
                } else {
                    clientObj.toUser('<label class="normal-msg-sent" name="' + socket.id + '">You:</label> ' + msg);
                    clientObj.fromUser(msg);   
                }
            }
        },
        commandList: function(commandArray, msg){
            switch(commandArray[0]){
                case '\\to':
                    //takes the total length of command+code
                    if(commandArray[1] && commandArray[2]){
                    //if there's a user and a message (not null)
                        var commandLength = commandArray[0].length + commandArray[1].length;
                        var msgObj = {
                            message: msg.slice(commandLength+2), // +two spaces _
                            //_ between [0]&[1] and [1]&[2]
                            sendTo: commandArray[1] //[1] = user
                        };
                        //***IMPORTANT
                        //in the future, separate this nex code. [see messagehandler:tofix ]
                        clientObj.toUser('<label class="pm-send" name="' + socket.id + '">You:</label> ' + msgObj.message);
                        socket.emit('privateMessage', msgObj);
                    }
                    
                    break;
                case '\\to-fix':
                    //sends the messages to this user
                    if(commandArray[1]){
                    //if user is defined
                        if(clientObj.userSettings.toFix.length > 0){
                        //if there's already a toFix user defined
                            var labels = document.getElementById("enabled-options").getElementsByClassName("to-fix");
                            for(var i = 0; i < labels.length; i++){
                                labels[i].parentElement.removeChild(labels[i]);
                            }
                        }
                        var functionObj = {
                            user: commandArray[1],
                            functionType: 'to-fix'
                        };
                        //creates this object. In the future I'm thinking in use _
                        //_ confirmUser in other functions. The object's functionType _
                        //_ will allow me to use the same functions making the separation _
                        //_ inside the confirmedUser socket.
                        socket.emit('confirmUser', functionObj);
                        //sends the user to confirm if it exists
                    }
                    break;
                case '\\to-unfix':
                    var labels = document.getElementById("enabled-options").getElementsByClassName("to-fix");
                    for(var i = 0; i < labels.length; i++){
                        labels[i].parentElement.removeChild(labels[i]);
                    }
                    clientObj.userSettings.toFix = '';
                    break;
                case '\\track':
                    if(!(commandArray[1])){ //if there's no user defined
                        var messages = document.getElementsByName(socket.id);
                        for(var i = 0; i < messages.length; i++){
                            messages[i].setAttribute("id", "track-on");
                        }
                    } else {
                        //creates a node list of the element on messages
                        var messages = document.getElementsByName(commandArray[1]);
                        for(var i = 0; i < messages.length; i++){
                            //parses each one adding an attribute (see CSS file)
                            messages[i].setAttribute("id", "track-on");
                        }
                    }
                    
                    break;
                case '\\track-off':
                    //from main.html tag <ul> get's all labels inside
                    var messages = document.getElementById("result").getElementsByTagName("label");
                    for(var i = 0; i < messages.length; i++){
                        messages[i].setAttribute("id", "");
                    }
                    break;
                case '\\scroll':
                    clientObj.userSettings.autoScroll = 'enabled';
                    autoScroll();
                    break;
                case '\\scroll-off':
                    clientObj.userSettings.autoScroll = '';
                    break;
                case '\\test1':
                    for(var i=0; i<100; i++){
                        clientObj.toUser('spamming');
                    }
                    break;
                case '\\test2':
                    
                    break;
                default:
                        alert('command not recognized');
            }
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
                clientObj.messageHandler(msg);
            }
            $('#message').val(''); //clear the text_box _
            //_ Enter counts as char. If not cleared in the 1st keyup it could _
            // be sent on the 2nd
        }
    });
    //server communication
    socket.on('connect', function(){ //When user first connects
        clientObj.toUser('<label class="server-message-good">Connected</label>'); //the user sees this message
        socket.emit('newConnection'); //goes to server to broadcast _
        //to the others
    });
    socket.on('message', function(str){ //receive message
        clientObj.toUser(str);
    });
    socket.on('confirmedUser', function(functionObj){
        switch(functionObj.functionType){
            case 'to-fix':
                clientObj.userSettings.toFix = functionObj.user;
                clientObj.appendEnabledOptions(functionObj);
                break;
            default:
                alert('error: eventClient>socketOn>confirmedUser');
        }
    });
    /*$('#test-button').click(function(){
        socket.emit('privateMessage', 'Private message');
    });*/
    
})