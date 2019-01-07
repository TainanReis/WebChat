/* handles the communication between client-server-client and clientA-clientA */
window.addEventListener('load',function() {
  const messageBoardElement = document.querySelector('.container .messageboard');
  const textareaElement = document.querySelector('.container .textarea #textarea');

    function autoScroll(){ //scrolls to the most recent message
      messageBoardElement.scrollIntoView(false);

        /*var scrollSize = $('.messageboard')[0].scrollHeight;
        $('.messageboard').animate({ scrollTop: scrollSize}, 0);
        */
    }
    //handles communication between client&user
    var clientObj = {
        userSettings: {
            autoScroll: '',
            toFix: '',
            track: ''
        },
        fromUser: function(msg){
            let msgObj = { //I'll let this open
                message: msg
            };
            socket.emit('message', msgObj); //send to server
        },
        toUser: function(msg){
          /* The messages take a form like this:
            <p>
            <label class="normal-msg-received" name="39">39: </label>
            Cool message!
            </p>
          */
          let newLine = document.createElement('p'); //every message is put inside a <p></p>
          let newLabel = document.createElement('label'); //every <p> has a <label>
          newLabel.textContent = msg.subject; //Adds the subject to the label
          newLine.textContent = msg.message; //Adds the message to the new line
          newLabel.setAttribute("class", msg.classVar); //It always has a class
          msg.name ? newLabel.setAttribute("name", msg.name) : ''; //It only defines the name if it exists. _
          msg.id ? newLabel.setAttribute("id", msg.id) : ''; //_without this it shows something like <label class="some_value" id name>
          let newMessage = messageBoardElement.appendChild(newLine); //Every new message has a newline (a <p>)
          newMessage.insertAdjacentElement('afterbegin', newLabel); //adds the label to the new line. "afterbegin"_
          //_ inserts the label before the msg.message
            //check if autoscrolling is enabled
            if(clientObj.userSettings.autoScroll === 'enabled'){
              //^Improve this
                autoScroll();
            }
        },
        labelParser: function(type, classVar, id, message){
        //labels that are shown @messageboard
            let label = {};
            function labelConstructor (att1, att2, att3, att4){
              //<label class="classVar" att1 att2> att3 </label> att4
              label = {'classVar': classVar, 'name': att1, 'id': att2, 'message': att3, 'subject': att4};
            };
            switch(type){
                case 'sent':
                labelConstructor(id, '', message, 'You: ');
                    break;
                case 'received':
                    if(id == clientObj.userSettings.track){
                      labelConstructor(id, "track-on", message, `${id}: `);
                    } else {
                      labelConstructor(id, '', message, `${id}: `);
                    }
                    break;
                case 'system':
                  labelConstructor('', '', message, `${id}: `);
                    break;
                default:
                //empty
            }
            clientObj.toUser(label);
        },
        appendEnabledOptions: function(arg1, arg2){
            //appends a label with the enabled function
            $('.enabled-options').append('<label class="' +
                                         arg1 + '">' +
                                         arg1 + ': ' +
                                         arg2 + '</label> '
                                        );
        },
        removeEnabledOptions: function(option){
            var labels = document.getElementsByClassName("enabled-options").getElementsByClassName(option);
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
            if(msg.slice(0,1) === '\\'){ //Check if it's a command. The commands start with '/'
                var commandArray = msg.split(' '); // example: \to user msg > [\to,user,msg] > [1] = user ... [0] = \to
                clientObj.commandList(commandArray, msg); //parse the command
            } else { //if it's not a command, it's a normal message
                if(clientObj.userSettings.toFix.length > 0){ //if there's a to-fix user defined
                    var msgObj = {
                        message: msg,
                        user: clientObj.userSettings.toFix
                    };
                    clientObj.labelParser('sent', 'pm-send', socket.id, msgObj.message);
                    socket.emit('privateMessage', msgObj);
                } else {//if there's no to-fix user defined, it's for everyone
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
            txtBefore: "",
            txtAfter: "",
            previousSelectionStart: 0,
            currentArrayPosition: 0,
            storedCommandMatches: []
        },
        commandValues:
            ['\\to', '\\to-fix', '\\to-unfix', '\\track', '\\track-off', '\\scroll', '\\scroll-off', '\\test1'],
        changeValue:
          function(elmId, arrayPosition){
            let settings = autoComplete.settings;
            elmId.value = settings.storedCommandMatches[arrayPosition] + settings.txtAfter; //completes the "\sc" with the 1st match
            elmId.setSelectionRange(settings.txtBefore.length, settings.storedCommandMatches[arrayPosition].length);
            ++settings.currentArrayPosition;
          },
        highestLength:
          function(){ //as the name says...
                //gets the highest length value in the array and return it's length
                let highestLengthValue = (accumulator, currentValue) => accumulator.length > currentValue.length ? accumulator : currentValue;
                return autoComplete.commandValues.reduce(highestLengthValue).length;
          },
        new:
            function(elmId, position){
                if(position <= autoComplete.highestLength()){
                    autoComplete.settings.txtBefore = txtBefore = (elmId.value).substring(0, position); //what is before the cursor
                    autoComplete.settings.txtAfter = txtAfter = (elmId.value).substring(position, elmId.value.length); //what is after the cursor
                    var commandMatches = function(){ //return all the matches, e.g., "\sc" matches with \scroll and \scroll-off
                        let matches = []; //store all the matches
                        autoComplete.commandValues.map(currentValue => currentValue.slice(0, position) === txtBefore ? matches.push(currentValue) : '');
                        matches.push(txtBefore); //pushes the txtBefore, i.e., in this case/example "\sc"
                        return matches;
                    };
                    if(commandMatches().length > 0){//if theres a match in the array update the .settings values
                        autoComplete.settings.storedCommandMatches = commandMatches(); //stores the found matches
                        autoComplete.changeValue(elmId, 0);

                    }
                }
            },
        update: function(elmId){
          let settings = autoComplete.settings;
          if(settings.currentArrayPosition >= settings.storedCommandMatches.length) {
            settings.currentArrayPosition = 0;
          }
          autoComplete.changeValue(elmId, settings.currentArrayPosition);
        }
    };

    //the keyup event: if Enter key is pressed
    //The message is sent when the Enter Key is pressed Up
    textareaElement.addEventListener('keyup', (keyVal) => {
      if(keyVal.key === "Enter"){
          let msg = textareaElement.value.slice(0,-1); //takes out the enter_char @the_end
          if(msg.length > 0){
            clientObj.messageHandler(msg);
          }
          textareaElement.value = "";
      }
    });

    textareaElement.addEventListener('keydown', (keyVal) => {
      if(keyVal.key === "Tab"){
        let position = textareaElement.selectionEnd; //gets the input cursor (End) position
        if(textareaElement.value.slice(0,1) === '\\' && position > 0){
          let incompleteCommand = (textareaElement.value).substring(0, position); // e.g., "\sc|" the result can be "\scroll*" but the incompleteCommand is always this one
          if(autoComplete.settings.storedCommandMatches.indexOf(incompleteCommand) > -1) {//if TAB is pressed +1 for "\sc|" it will run through the array of already found matches
            autoComplete.update(textareaElement);
          } else { //if it's the 1st time the TAB is pressed, it creates a new array with the matches
            autoComplete.new(textareaElement, position); //Later I'll export this, that's why it's parsing textareaElement
          }
        }
        keyVal.preventDefault(); //it cancels the default TAB function so it won't change focus
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
    clientObj.commandList(['\\scroll'], ''); //enables scroll when page loads
});
