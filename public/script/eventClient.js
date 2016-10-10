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
        appendEnabledOptions: function(arg1, arg2){
            //appends a label with the enabled function
            $('#enabled-options').append('<label class="' + 
                                         arg1 + '">' + 
                                         arg1 + ': ' + 
                                         arg2 + '</label> '
                                        );
        },
        removeEnabledOptions: function(option){
            var labels = document.getElementById("enabled-options").getElementsByClassName(option);
                for(var i = 0; i < labels.length; i++){
                    labels[i].parentElement.removeChild(labels[i]);
                }
        },
        trackOnOff: function(type, user){
        //in the future the name of this entry may be changed and the code inside can have something more_
        //_related to the highlights of chat_board messages
            if(type === 'on'){
            //highlights messages   
                var messages = document.getElementsByName(user);
                for(var i = 0; i < messages.length; i++){
                    messages[i].setAttribute("id", "track-on");
                }
            } else {
            //clears highlights
                var messages = document.getElementById("result").getElementsByTagName("label");
                //we set the ID to differentiate it from the enabled-options
                for(var i = 0; i < messages.length; i++){
                    messages[i].setAttribute("id", "");
                }
            }
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
                        user: clientObj.userSettings.toFix
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
        commandList: function(commandArray, msg){ //do not forget to update autocomplete command list
            switch(commandArray[0]){
                case '\\to':
                    if(commandArray[1] && commandArray[2]){
                    //if there's a user and a message
                        var commandLength = commandArray[0].length + commandArray[1].length;
                        //takes the total length of command+userId
                        var functionObj = {
                            message: msg.slice(commandLength+2),
                            //takes out the command and username + two spaces _
                            //_ between [0]&[1] and [1]&[2]. So it leaves only the message 
                            user: commandArray[1], //[1] = user
                            functionType: 'to'
                        };
                        clientObj.labelParser('sent', 'pm-send', socket.id, functionObj.message);
                        socket.emit('confirmUser', functionObj);
                        //appends the message anyway but confirms the user before sending
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
                    clientObj.removeEnabledOptions('to-fix');
                    clientObj.userSettings.toFix = '';
                    break;
                case '\\track':
                    if(!(commandArray[1])){ //if there's no user defined
                    //it allows the user to highlight his sent messages
                        clientObj.trackOnOff('on', socket.id);
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
                    clientObj.trackOnOff('off', '');
                    //takes the enabled option label out
                    clientObj.removeEnabledOptions('track');
                    clientObj.userSettings.track = '';
                    break;
                case '\\scroll':
                    clientObj.userSettings.autoScroll = 'enabled';
                    clientObj.appendEnabledOptions('scroll', 'on');
                    autoScroll();
                    break;
                case '\\scroll-off':
                    clientObj.removeEnabledOptions('scroll');
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
    //autoComplete object
    var autoComplete = {
        settings: {
            previousSelectionStart: 0,
            currentArrayPosition: 0,
            storedCommandMatches: [],
            previousTextAfter: '',
            previousTextBefore: ''
        },
        commandValues:
            ['\\to', '\\to-fix', '\\to-unfix', '\\track', '\\track-off', '\\scroll', '\\scroll-off', '\\test1'],
        highestLength:
            function(){ //as the name says...
                var highestLength = 0;
                for(var i in autoComplete.commandValues){
                    if(autoComplete.commandValues[i].length > highestLength){
                        highestLength = autoComplete.commandValues[i].length;
                    }
                }
                return highestLength;
            },
        new: 
            function(elmId, position){
                if(position <= autoComplete.highestLength()){
                    var txtBefore = (elmId.value).substring(0, position); //what is before the cursor
                    var txtAfter = (elmId.value).substring(position, elmId.value.length); //what is after the cursor
                    var commandMatches = function(){
                        var matches = [];
                        for(var i in autoComplete.commandValues){
                            var sliced = autoComplete.commandValues[i].slice(0, position); //to find a match
                            if(sliced === txtBefore){ //if a match is found
                                matches.push(autoComplete.commandValues[i]);
                            }
                        }
                        matches.push(txtBefore);
                        return matches;
                    };
                    if(commandMatches().length > 0){//if theres a match in the array
                        autoComplete.settings.storedCommandMatches = commandMatches();
                        elmId.value = autoComplete.settings.storedCommandMatches[0] + txtAfter;
                        elmId.selectionEnd = autoComplete.settings.storedCommandMatches[0].length;
                        autoComplete.settings.previousSelectionStart = elmId.selectionEnd;
                        autoComplete.settings.previousTextAfter = txtAfter;
                        autoComplete.settings.previousTextBefore = (elmId.value).substring(0, elmId.selectionStart);
                    }
                }
            },
        update:
            function(elmId){
                elmId.value = autoComplete.settings.storedCommandMatches[autoComplete.settings.currentArrayPosition] + autoComplete.settings.previousTextAfter;
                elmId.selectionEnd = autoComplete.settings.storedCommandMatches[autoComplete.settings.currentArrayPosition].length;
                autoComplete.settings.previousSelectionStart = elmId.selectionEnd;
                autoComplete.settings.previousTextAfter = (elmId.value).substring(elmId.selectionStart, elmId.value.length);
                autoComplete.settings.previousTextBefore = (elmId.value).substring(0, elmId.selectionStart);
            }
    };

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
    //the keydown event to use the TAB for autocomplete
    $('body').keydown(function(keyVal){
    //if it was keyup/keypress it would first change and only then do the rest
    //in this case it first parses when the key is pressed and only then _
    //it does what it's supposed to do.
        if(keyVal.which == 9 && $('#message').is(':focus')){
            var elmId = document.getElementById('message');
            var position = elmId.selectionStart; //gets the input cursor position
            if(elmId.value.slice(0,1) === '\\'){
                if(position !== autoComplete.settings.previousSelectionStart){
                    autoComplete.new(elmId, position);
                } else {
                    if(
                        (elmId.value).substring(0, elmId.selectionStart) === autoComplete.settings.previousTextBefore
                        &&
                        (elmId.value).substring(position, elmId.value.length) === autoComplete.settings.previousTextAfter
                    ){
                        if(autoComplete.settings.currentArrayPosition < (autoComplete.settings.storedCommandMatches.length-1)){
                            autoComplete.settings.currentArrayPosition++;
                            autoComplete.update(elmId);
                        } else {
                            autoComplete.settings.currentArrayPosition = 0;
                            autoComplete.update(elmId);
                        }
                    } else {
                        autoComplete.new(elmId, position);
                    }
                }
            keyVal.preventDefault(); //it cancels the default TAB function so it won't change focus
            }
        }
    });
    //server communication
    //start the socket
    var socket = (function(){ //left in a function in case of need to add something else
        return io();
    })();
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
            case 'to':
                if(functionObj.serverAnswer === true){
                    socket.emit('privateMessage', functionObj);
                }
                break;
            case 'to-fix':
                clientObj.removeEnabledOptions('to-fix'); //removes the label
                if(functionObj.serverAnswer === true){
                    clientObj.userSettings.toFix = functionObj.user;
                    clientObj.appendEnabledOptions(functionObj.functionType, functionObj.user);
                } else {
                    clientObj.userSettings.toFix = '';
                }
                break;
            case 'track':
                clientObj.trackOnOff('off', '');
                //if there's already a track user defined, clears the highlights
                clientObj.removeEnabledOptions('track'); //removes the label
                if(functionObj.serverAnswer === true){
                //this is different because it only defines a tracking user if he exists. _
                //if the user logged out we can still track all the messages he sent. By V0.4.0 we don't take _
                //users out of the array. But this sets the structre for when it'll be implemented.
                //so, if TRUE, tracks also new messages, else it tracks only all the past messages
                    clientObj.userSettings.track = functionObj.user;
                    //^defines @userSetiings who's being tracked
                    clientObj.appendEnabledOptions(functionObj.functionType, functionObj.user);
                } else {
                    clientObj.userSettings.track = '';
                }
                //creates a node list of the element on messages
                clientObj.trackOnOff('on', functionObj.user);
                break;
            default:
                alert('error: eventClient>socketOn>confirmedUser');
        }
    });
    /*$('#test-button').click(function(){
        //empty
    });*/
    
})