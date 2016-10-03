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
            toFix: '',
            track: ''
        },
        fromUser: function(msg){
            var msgObj = { //I'll let this open
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
        labelParser: function(type, classVar, id, message){
        //labels that are shown @chat_board
            var label = '';
            switch(type){
                case 'sent':
                //<label class="" name="">You:</label> message
                    label = '<label class="' + classVar + 
                            '" name="' + id + 
                            '">You:</label> ' + message;
                    break;
                case 'received':
                //<label class="" name="">user:</label> message
                    if(id == clientObj.userSettings.track){
                        label = '<label class="' + classVar + 
                            '" name ="' + id + 
                            '" id="track-on">' + id + 
                            ':</label> ' + message;
                    } else {
                        label = '<label class="' + classVar + 
                            '" name ="' + id + 
                            '">' + id + 
                            ':</label> ' + message;
                    }
                    break;
                case 'system':
                    label = '<label class="' + classVar +
                            '">' + id + ' ' +
                            message + '</label>';
                    break;
                default:
                //empty
            }
            clientObj.toUser(label);
        },
        appendEnabledOptions: function(functionObj){
            //appends a label with the enabled function
            $('#enabled-options').append('<label class="' + 
                                         functionObj.functionType + '">' + 
                                         functionObj.functionType + ': ' + 
                                         functionObj.user + '</label> '
                                        );
        },
        messageHandler: function(msg){
            if(msg.slice(0,1) === '\\'){
            //if it's a command. "\" as the first char
                var commandArray = msg.split(' ');
                // example: \to user msg > [\to,user,msg] > [1] = user ... [0] = \to
                clientObj.commandList(commandArray, msg);
            } else {
                if(clientObj.userSettings.toFix.length > 0){
                    //if there's a to-fix user defined
                    var msgObj = {
                        message: msg,
                        sendTo: clientObj.userSettings.toFix
                    };
                    clientObj.labelParser('sent', 'pm-send', socket.id, msgObj.message);
                    socket.emit('privateMessage', msgObj);
                } else {
                    //if it's a normal message
                    clientObj.labelParser('sent', 'normal-msg-sent', socket.id, msg);
                    clientObj.fromUser(msg);   
                }
            }
        },
        commandList: function(commandArray, msg){
            switch(commandArray[0]){
                case '\\to':
                    if(commandArray[1] && commandArray[2]){
                    //if there's a user and a message
                        var commandLength = commandArray[0].length + commandArray[1].length;
                        //takes the total length of command+userId
                        var msgObj = {
                            message: msg.slice(commandLength+2),
                            //takes out the command and username + two spaces _
                            //_ between [0]&[1] and [1]&[2]. So it leaves only the message 
                            sendTo: commandArray[1] //[1] = user
                        };
                        //***IMPORTANT
                        //in the future, separate this nex code. [see messagehandler:tofix ]
                        clientObj.labelParser('sent', 'pm-send', socket.id, msgObj.message);
                        socket.emit('privateMessage', msgObj);
                    }
                    
                    break;
                case '\\to-fix':
                    //sends the messages to a defined user
                    if(commandArray[1]){
                    //if user is defined
                        
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
                    //it allows the user to highlight his sent messages
                        var messages = document.getElementsByName(socket.id);
                        for(var i = 0; i < messages.length; i++){
                            messages[i].setAttribute("id", "track-on");
                        }
                    } else {
                        var functionObj = {
                            user: commandArray[1],
                            functionType: 'track'
                        };
                        socket.emit('confirmUser', functionObj);
                    }
                    
                    break;
                case '\\track-off':
                    //clears highlights
                    var messages = document.getElementById("result").getElementsByTagName("label");
                    for(var i = 0; i < messages.length; i++){
                        messages[i].setAttribute("id", "");
                    }
                    //takes the enabled option label out
                    var labels = document.getElementById("enabled-options").getElementsByClassName("track");
                            for(var i = 0; i < labels.length; i++){
                                labels[i].parentElement.removeChild(labels[i]);
                            }
                    clientObj.userSettings.track = '';
                    break;
                case '\\scroll':
                    clientObj.userSettings.autoScroll = 'enabled';
                    autoScroll();
                    break;
                case '\\scroll-off':
                    clientObj.userSettings.autoScroll = '';
                    break;
                case '\\test1':
                    //to test autoscroll
                    for(var i=0; i<100; i++){
                        clientObj.toUser('spamming');
                    }
                    break;
                default:
                        alert('command not recognized');
            }
        }
    };

    //start the socket
    var socket = (function(){ //left in a function in case of need to add something else
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
            $('#message').val('');
            //clears the text_box.
            //The Enter_key counts as a char.
            // If not cleared in the 1st keyup it could _
            // be sent on the 2nd
        }
    });
    //server communication
    socket.on('connect', function(){ //When user first connects
        clientObj.labelParser('system', 'server-message-good', '', 'Connected');
        socket.emit('newConnection');//goes to the server to broadcast _
        //_ to the others
    });
    socket.on('message', function(obj){ //receive message
        clientObj.labelParser(obj.labelType, obj.classVar, obj.id, obj.message);
    });
    socket.on('confirmedUser', function(functionObj){
        switch(functionObj.functionType){
            case 'to-fix':
                var labels = document.getElementById("enabled-options").getElementsByClassName("to-fix");
                for(var i = 0; i < labels.length; i++){
                    labels[i].parentElement.removeChild(labels[i]);
                }
                if(functionObj.serverAnswer === true){
                    clientObj.userSettings.toFix = functionObj.user;
                    clientObj.appendEnabledOptions(functionObj);
                } else {
                    clientObj.userSettings.toFix = '';
                }
                break;
            case 'track':
                var messages = document.getElementById("result").getElementsByTagName("label");
                    for(var i = 0; i < messages.length; i++){
                        messages[i].setAttribute("id", "");
                    }
                //if there's already a track user defined, removes the label
                var labels = document.getElementById("enabled-options").getElementsByClassName("track");
                for(var i = 0; i < labels.length; i++){
                    labels[i].parentElement.removeChild(labels[i]);
                }
                if(functionObj.serverAnswer === true){
                //this is different because it only defines a tracking user if he exists. _
                //if the user logged out we can still track all the messages he sent. By V0.4.0 we don't take _
                //users out of the array. But this sets the structre for when it'll be implemented.
                //so, if TRUE, tracks also new messages, else it tracks only all the past messages
                    clientObj.userSettings.track = functionObj.user;
                    //^defines @userSetiings who's being tracked
                    clientObj.appendEnabledOptions(functionObj);
                } else {
                    clientObj.userSettings.track = '';
                }
                //creates a node list of the element on messages
                var messages = document.getElementsByName(functionObj.user);
                for(var i = 0; i < messages.length; i++){
                //parses each one adding an attribute (see CSS file)
                    messages[i].setAttribute("id", "track-on");
                }
                break;
            default:
                alert('error: eventClient>socketOn>confirmedUser');
        }
    });
    /*$('#test-button').click(function(){
        //empty
    });*/
    
})