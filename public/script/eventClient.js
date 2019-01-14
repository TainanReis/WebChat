/* handles the communication between client-server-client and clientA-clientA */
window.addEventListener('load',function() {
  const messageBoardElement = document.querySelector('.container .messageboard');
  const textareaElement = document.querySelector('.container .textarea #textarea');
  const enabledOptionsElement = document.querySelector('.container .enabled-options');

  var observerOptions = { //this will be the conditions to trigger the observer
    childList: true //the MutationObserver will be trigerred when a new child is added to the messageBoardElement
  };
  var observer = new MutationObserver((mutationCallback) => { //create the MutationObserver. This will be executed everytime the observer is trigerred
    scrollFunction();
  });
  function scrollFunction(){ //get the coordinates of the last child @messageBoardElement and scrolls to it
    try {
      let lastChildCoords = messageBoardElement.lastChild.getBoundingClientRect(); //get the coordinates of the lastChild
      messageBoardElement.scrollBy(0, lastChildCoords.y); //scrolls the necessary ammount to get to the lastChild
    } catch (e) {
      //console.log(e); //I'll leave this here so you can see what it shows when the document is 1st loaded
    }
  }
    //handles communication between client&user
    var clientObj = {
      userSettings: {toFix: '', track: ''},
      fromUser: function(msg){
        let msgObj = { //I'll let this open
          message: msg
        };
        socket.emit('message', msgObj); //send to server
      },
      toUser: function(msg){
        /* The messages have this structure:
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
      },
      labelParser: function(type, classVar, id, message){ //labels that are shown @messageboard
        let label = {};
        function labelConstructor (att1, att2, att3, att4, att5){
          //<label class="classVar" att1 att2> att3 </label> att4 | att5 adds a second class value
          label = {'classVar': classVar + att5, 'name': att1, 'id': att2, 'message': att3, 'subject': att4};
        };
        switch(type){
          case 'sent': //The sent message is appended to the messageBoardElement, even if is not received by anyone. No need to send it to the server so it can be shown to the sender
            labelConstructor(id, '', message, 'You: ', '');
            break;
          case 'received': //deals with the received messages
            if(id == clientObj.userSettings.track){ //if the user is tracking someone
              labelConstructor(id, '', message, `${id}: `, " track-on");
            } else {
              labelConstructor(id, '', message, `${id}: `, '');
            }
            break;
          case 'system': //system messages
            labelConstructor('', '', message, `${id}: `, '');
            break;
          default:
          //empty
        }
        clientObj.toUser(label);
      },
      appendEnabledOptions: function(arg1, arg2){
        //appends a label with the enabled function
        //<label class="arg1"> arg1: arg2 </label>
        let newLabel = document.createElement('label');
        newLabel.setAttribute("class", arg1);
        newLabel.textContent = `${arg1}: ${arg2}`;
        enabledOptionsElement.appendChild(newLabel);
      },
      removeEnabledOptions: function(option){
        try { //In case the user tries to remove something that's is already not there
          let label = document.querySelector(`.${option}`);
          enabledOptionsElement.removeChild(label);
        } catch(typeError) {
          clientObj.labelParser('system', 'server-message-bad', '', 'Option already disabled');
        }
      },
      trackFunction: function(state, user){ //this is called when an user wants to track/stoptracking another user
        if(state === "on"){ //to enable tracking
          let trackElements = function(){return Object.values(document.getElementsByName(user))}; //returns an object with all the elements found
          trackElements().map(element => element.setAttribute("class", element.getAttribute("class") + " track-on")); //run through each element and and another value to the "class" attribute
          clientObj.appendEnabledOptions("track-on", user);
          clientObj.userSettings.track = user; //defines the user to be tracked
        } else { //to disabled it
          let trackElements = function(){return Object.values(messageBoardElement.getElementsByTagName("label"))};
          trackElements().map(element => { //run through each element and replaces " track-on" (with the space) with '' (nothing)
            let classValues = (element.getAttribute("class")).replace(" track-on", ''); //for simplicity sake (below), it stores the changes
            element.setAttribute("class", classValues); //apply the changes
          });
          clientObj.removeEnabledOptions('track-on');
          clientObj.userSettings.track = '';
        }
      },
      messageHandler: function(msg){
        if(msg.slice(0,1) === '\\'){ //Check if it's a command. The commands start with '/'
          let commandArray = msg.split(' '); // example: \to user msg > [\to,user,msg] > [1] = user ... [0] = \to
          clientObj.commandList(commandArray, msg); //parse the command
        } else { //if it's not a command, it's a normal message
            if(clientObj.userSettings.toFix !== ''){ //if there's a to-fix user defined
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
      commandList: function(commandArray, msg){ //the Switch:Case values have to be also @autoComplete.commandValues
        switch(commandArray[0]){
          case '\\to': //sends a message to a certain user
            if(commandArray[1] && commandArray[2]){
              //if there's a user and a message
              let commandLength = commandArray[0].length + commandArray[1].length;
              //takes the total length of command+userId
              let functionObj = {
                message: msg.slice(commandLength+2),
                  //takes out the command and username + two spaces _
                  //_ between [0]&[1] and [1]&[2]. So it leaves only the message
                  user: commandArray[1], //[1] = user
                  functionType: 'to'
              };
              clientObj.labelParser('sent', 'pm-send', socket.id, functionObj.message);
              socket.emit('confirmUser', functionObj);
              //appends the message anyway but confirms the user (existence) before sending
            }
            break;
          case '\\to-fix': //fix the messages, so they are all sent to a certain defined user
            if(commandArray[1]){ //[0] = "\to-fix" [1] = "message"
              let functionObj = { //creates an object to be parsed
                user: commandArray[1],
                functionType: 'to-fix'
              };
              socket.emit('confirmUser', functionObj); //confirms that the user exists
            } else { //if no username was specified
              clientObj.labelParser('system', 'server-message-bad', '', `Wrong syntax. Try: \\to-fix username`);
            }
            break;
          case '\\to-unfix': //removes the fixed user (see the entry above)
            clientObj.removeEnabledOptions('to-fix');
            clientObj.userSettings.toFix = '';
            break;
          case '\\track': //tracks all the messages sent by a specified user
            if(!(commandArray[1])){ //if there's no username specified
              clientObj.labelParser('system', 'server-message-bad', '', `Wrong syntax. Try: \\track username`);
            } else {
                let functionObj = {
                  user: commandArray[1],
                  functionType: 'track'
                };
                socket.emit('confirmUser', functionObj);
              }
            break;
          case '\\track-off':
            clientObj.trackFunction('off', '');
            break;
          case '\\scroll': //enables auto scroll
            clientObj.appendEnabledOptions('scroll', 'on');
            observer.observe(messageBoardElement, observerOptions);//starts the MutationObserver
            scrollFunction(); //if it's disabled and enabled again, this will scroll to the last message without the need to wait for something to be appended to the messageBoardElement
            break;
          case '\\scroll-off': //disables auto scroll
            clientObj.removeEnabledOptions('scroll');
            observer.disconnect();
            break;
          case '\\test': //to test autoscroll
            for(let i=0; i<100; i++){
              clientObj.labelParser('system', 'server-message-bad', '', 'spamming');
            }
            break;
          default:
            clientObj.labelParser('system', 'server-message-bad', '', 'Error: Command not recognized.');
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
      ['\\to', '\\to-fix', '\\to-unfix', '\\track', '\\track-off', '\\scroll', '\\scroll-off', '\\test'],
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
    update: function(elmId, position){
      let settings = autoComplete.settings;
      settings.txtAfter = txtAfter = (elmId.value).substring(position, elmId.value.length); //what is after the cursor
      if(settings.currentArrayPosition >= settings.storedCommandMatches.length) {
        settings.currentArrayPosition = 0;
      }
      autoComplete.changeValue(elmId, settings.currentArrayPosition);
    }
    };

    //the keyup event: if Enter key is pressed
    //The message is sent when the Enter Key is pressed Up
    textareaElement.addEventListener('keyup', keyVal => {
      if(keyVal.key === "Enter"){
        //let msg = textareaElement.value.slice(0,-1); //takes out the enter_char @the_end
        textareaElement.setSelectionRange(0, 0)
        let msg = textareaElement.value;
        console.log(msg);
        if(msg.length > 0){
          clientObj.messageHandler(msg);
        }
        textareaElement.value = "";
      }
    });

    textareaElement.addEventListener('keydown', keyVal => {
      if(keyVal.key === "Tab"){
        let position = textareaElement.selectionEnd; //gets the input cursor (End) position
        if(textareaElement.value.slice(0,1) === '\\' && position > 0){
          let incompleteCommand = (textareaElement.value).substring(0, position); // e.g., "\sc|" the result can be "\scroll*" but the incompleteCommand is always this one
          if(autoComplete.settings.storedCommandMatches.indexOf(incompleteCommand) > -1) {//if TAB is pressed +1 for "\sc|" it will run through the array of already found matches
            autoComplete.update(textareaElement, position);
          } else { //if it's the 1st time the TAB is pressed, it creates a new array with the matches
            autoComplete.new(textareaElement, position); //Later I'll export this, that's why it's parsing textareaElement
          }
        }
        keyVal.preventDefault(); //it cancels the default TAB function so it won't change focus
      } else if(keyVal.key === "Enter"){
        keyVal.preventDefault(); //prevents a massive span and you can TAB for a command and press Enter and it will not replace the selection for ""
      }
    });

    //server communication
    //initiate the socket
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
          socket.emit('privateMessage', functionObj);
          break;
        case 'to-fix':
          if(clientObj.userSettings.toFix !== '') { //if it's already defined _
            clientObj.removeEnabledOptions('to-fix'); //_remove the already existent label. For now, "to-fix" only allows 1 user defined
          }
          clientObj.userSettings.toFix = functionObj.user; //update it's valuewith the new username
          clientObj.appendEnabledOptions(functionObj.functionType, functionObj.user); //appends the new label
          break;
        case 'track':
          if(clientObj.userSettings.track !== ''){
            clientObj.trackFunction("off", '');
          }
          clientObj.trackFunction("on", functionObj.user);
          break;
        default:
          clientObj.labelParser('system', 'server-message-bad', '', 'error: eventClient>socketOn>confirmedUser');
      }
    });
  clientObj.commandList(['\\scroll'], ''); //enables scroll when page loads
});
