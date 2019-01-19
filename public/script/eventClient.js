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
    fromUser: (msg) => {
      let msgObj = { //I'll let this open
        message: msg
      };
      socket.emit('message', msgObj); //send to server
    },
    toUser: (attVals) => {
      /* The messages have this structure:
        <p>
          <label class="normal-msg-received" name="39">39: </label>
          Cool message!
        </p>
      */
      let newLine = document.createElement('p'); //every message is put inside a <p></p>
      let newLabel = document.createElement('label'); //every <p> has a <label>
      newLabel.textContent = attVals.subject; //Adds the subject to the label
      newLine.textContent = attVals.message; //Adds the message to the new line
      newLabel.setAttribute("class", attVals.classVar); //It always has a class
      newLine.setAttribute("class", (attVals.classVar).replace("track-on", ""));
      attVals.name ? newLabel.setAttribute("name", attVals.name) : ''; //It only defines the name if it exists. _
      attVals.id ? newLabel.setAttribute("id", attVals.id) : ''; //_without this it shows something like <label class="some_value" id name>
      let newMessage = messageBoardElement.appendChild(newLine); //Every new message has a newline (a <p>)
      newMessage.insertAdjacentElement('afterbegin', newLabel); //adds the label to the new line. "afterbegin" inserts the label before the msg.message
    },
    labelParser: (type, classVar, name, socket, message) => { //labels that are shown @messageboard
      let attVals = {};
      function labelConstructor (att1, att2, att3, att4, att5){
        //<label class="classVar att5" att1 att2> att3 </label> att4
        attVals = {'classVar': classVar + att5, 'name': att1, 'id': att2, 'subject': att3, 'message': att4};
      };
      switch(type){
        case 'sent': //The sent message is appended to the messageBoardElement, even if is not received by anyone. No need to send it to the server so it can be shown to the sender
          labelConstructor(socket, '', 'You: ', message, '');
          break;
        case 'received': //deals with the received messages
          if(socket == clientObj.userSettings.track.socketId){ //if the user is tracking someone
            labelConstructor(socket, '', `${name}: `, message, " track-on");
          } else {
            labelConstructor(socket, '', `${name}: `, message, '');
          }
          break;
        case 'system': //system messages
          labelConstructor('', '', `${name}: `, message, '');
          break;
        default:
        //empty
      }
      clientObj.toUser(attVals);
    },
    appendEnabledOptions: (arg1, arg2) => { //appends a label with the enabled function: <label class="arg1"> arg1: arg2 </label>
      let newLabel = document.createElement('label');
      newLabel.setAttribute("class", arg1);
      newLabel.textContent = `${arg1}: ${arg2}`;
      enabledOptionsElement.appendChild(newLabel);
    },
    removeEnabledOptions: (option) => { //in case the user tries to remove something that's is already not there
      try {
        let label = document.querySelector(`.${option}`);
        enabledOptionsElement.removeChild(label);
      } catch(typeError) {
        clientObj.labelParser('system', 'server-message-bad', '', '', 'Option already disabled');
      }
    },
    trackFunction: (state, user, socket) => { //this is called when an user wants to track/stoptracking another user
      if(state === "on"){ //to enable tracking
        let trackElements = function(){return Object.values(document.getElementsByName(socket))}; //returns an object with all the elements found
        trackElements().map((element) => element.setAttribute("class", element.getAttribute("class") + " track-on")); //run through each element and and another value to the "class" attribute
        clientObj.appendEnabledOptions("track-on", user);
        clientObj.userSettings.track = {name: user,socketId: socket}; //defines the user socket to be tracked
      } else { //to disabled it
        let trackElements = function(){return Object.values(messageBoardElement.getElementsByTagName("label"))};
        trackElements().map((element) => { //run through each element and replaces " track-on" (with the space) with '' (nothing)
          let classValues = (element.getAttribute("class")).replace(" track-on", ''); //for simplicity sake (below), it stores the changes
          element.setAttribute("class", classValues); //apply the changes
        });
        clientObj.removeEnabledOptions('track-on');
        clientObj.userSettings.track = '';
      }
    },
    messageHandler: (msg) => {
      if(msg.slice(0,1) === '\\'){ //Check if it's a command. The commands start with '/'
        let commandArray = msg.split(' '); // example: \to user msg > [\to,user,msg] > [1] = user ... [0] = \to
        clientObj.commandList(commandArray, msg); //parse the command
      } else { //if it's not a command, it's a normal message
        if(clientObj.userSettings.toFix){ //if there's a to-fix user defined
          var msgObj = {
            message: msg,
            user: clientObj.userSettings.toFix.name,
            socketId: clientObj.userSettings.toFix.socketId
          };
          clientObj.labelParser('sent', 'pm-send', '', socket.id, msgObj.message);
          socket.emit('privateMessage', msgObj);
        } else {//if there's no to-fix user defined, it's for everyone
          clientObj.labelParser('sent', 'normal-msg-sent', '', socket.id, msg);
          clientObj.fromUser(msg);
        }
      }
    },
    commandList: (commandArray, msg) => { //the Switch:Case values have to be also @autoComplete.commandValues
      switch(commandArray[0]){
        case '\\to': //sends a message to a certain user
          if(commandArray[1] && commandArray[2]){ //if there's a user and a message
            let commandLength = commandArray[0].length + commandArray[1].length; //takes the total length of command+username
            let functionObj = {
              message: msg.slice(commandLength+2), //takes out the command and username + two spaces, between [0]&[1] and [1]&[2]. So it leaves only the message
              user: commandArray[1], //[1] = user
              functionType: 'to'
            };
            //appends the message anyway but confirms the user (if it exists) before sending
            clientObj.labelParser('sent', 'pm-send', '', socket.id, functionObj.message);
            socket.emit('confirmUser', functionObj);
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
            clientObj.labelParser('system', 'server-message-bad', '', '', `Wrong syntax. Try: \\to-fix username`);
          }
          break;
        case '\\to-unfix': //removes the fixed user (see the entry above)
          clientObj.removeEnabledOptions('to-fix');
          clientObj.userSettings.toFix = '';
          break;
        case '\\track': //tracks all the messages sent by a specified user
          if(!(commandArray[1])){ //if there's no username specified
            clientObj.labelParser('system', 'server-message-bad', '', '', `Wrong syntax. Try: \\track username`);
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
        case '\\name': //changes the username
          if(!(commandArray[1])){ //if there is no name specified
            clientObj.labelParser('system', 'server-message-bad', '', '', `Wrong syntax. Try: \\name username`);
          } else {
            socket.emit('changeName', commandArray[1]);
          }
          break;
        /*case '\\test': //created to test autoscroll. I'll let this here for now to test whatever may be useful. It has to be added to commandValues
          for(let i=0; i<100; i++){
            clientObj.labelParser('system', 'server-message-bad', '', '', 'spamming');
          }*/
          break;
        default:
          clientObj.labelParser('system', 'server-message-bad', '', '', 'Error: Command not recognized.');
      }
    }
  };

  //autoComplete object
  var autoComplete = {
    settings: { //stores some values we'll need in the entries bellow
      txtBefore: "",
      txtAfter: "",
      previousSelectionStart: 0,
      currentArrayPosition: 0,
      storedCommandMatches: []
    },
    commandValues: //it will find matches according to these values
      ['\\to', '\\to-fix', '\\to-unfix', '\\track', '\\track-off', '\\scroll', '\\scroll-off', '\\name'],
    changeValue: //the changes in the element happens from here
      (elmId, arrayPosition) => { //the elmId is where everything is happening, the arrayPosition is the position @the storedCommandMatches array
        let settings = autoComplete.settings; //for simplicity sake
        elmId.value = settings.storedCommandMatches[arrayPosition] + settings.txtAfter; //completes the "\sc" with the 1st match
        elmId.setSelectionRange(settings.txtBefore.length, settings.storedCommandMatches[arrayPosition].length); //what's added stays selected
        ++settings.currentArrayPosition; //so next time, the next array value is shown
      },
    highestLength: () => {
      let highestLengthValue = (accumulator, currentValue) => accumulator.length > currentValue.length ? accumulator : currentValue;
      return autoComplete.commandValues.reduce(highestLengthValue).length;
    },
    new: (elmId, position) => { //when a new autoComplete is created
      if(position <= autoComplete.highestLength()){ //if the supposed command size (according to "position") has an higher length than the ones @commandValues, it's unnecessary to process the code bellow.
        autoComplete.settings.txtBefore = txtBefore = (elmId.value).substring(0, position); //what is before the cursor
        autoComplete.settings.txtAfter = txtAfter = (elmId.value).substring(position, elmId.value.length); //what is after the cursor
        var commandMatches = function(){ //return all the matches, e.g., "\sc" matches with \scroll and \scroll-off
          let matches = []; //store all the matches
          autoComplete.commandValues.map((currentValue) => currentValue.slice(0, position) === txtBefore ? matches.push(currentValue) : ''); //pushes the matches to the array
          matches.push(txtBefore); //pushes the txtBefore, i.g., "\sc". This is the text before the completed command: "\sc[roll]"
          return matches;
        };
        if(commandMatches().length > 0){//if theres a match in the array update the .settings values
          autoComplete.settings.storedCommandMatches = commandMatches(); //stores the found matches
          autoComplete.changeValue(elmId, 0);
        }
      }
    },
    update: (elmId, position) => { //to proceed moving through the storedCommandMatches
      let settings = autoComplete.settings; //for simplicity sake
      settings.txtAfter = txtAfter = (elmId.value).substring(position, elmId.value.length); //what is after the cursor
      if(settings.currentArrayPosition >= settings.storedCommandMatches.length) { //if we got to the end of the storedCommandMatches
        settings.currentArrayPosition = 0; //sets the currentArrayPosition to 0 so we can run it again from start
      }
      autoComplete.changeValue(elmId, settings.currentArrayPosition); //changes the value in the element, in this case textareaElement
    }
  };

    //the keyup event: if Enter key is pressed
    //The message is sent when the Enter Key is pressed Up
    textareaElement.addEventListener('keyup', (keyVal) => {
      if(keyVal.key === "Enter"){ //if Enter key is pressed
        textareaElement.setSelectionRange(0, 0) //puts the cursor @the beginning so the enter Key won't change the selected value for ''. This was a problem that was happening when navigating through commands using TAB
        let msg = textareaElement.value;
        if(msg.length > 0){ //if there's indeed a message it's length is > 1
          clientObj.messageHandler(msg); //from here the message is parsed
        }
        textareaElement.value = "";
      }
    });

    textareaElement.addEventListener('keydown', (keyVal) => {
      if(keyVal.key === "Tab"){ //if Tab key is pressed
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
      } else if(keyVal.key === "Enter"){ //if Enter key is pressed
        keyVal.preventDefault(); //prevents a massive span and you can TAB for a command and press Enter and it will not replace the selection for ""
      }
    });

    textareaElement.addEventListener('focusout', () => textareaElement.focus()); //the textareaElement will always be focused

    //server communication
    //initiate the socket
    var socket = (function(){ //left in a function in case of need to add something else
      return io();
    })();

    socket.on('connect', () => { //When user first connects
      clientObj.labelParser('system', 'server-message-good', '', '', 'Connected');
      socket.emit('newConnection');//goes to the server to be broadcasted to the others
    });

    socket.on('message', (obj) => { //when a message is received
      clientObj.labelParser(obj.labelType, obj.classVar, obj.name, obj.socket, obj.message);
    });

    socket.on('confirmedUser', (functionObj) => { //deals with the returned user confirmation value
      switch(functionObj.functionType){  //the user confirmation was asked by a specific command request. Here we move on with the same request
        case 'to':
          socket.emit('privateMessage', functionObj);
          break;
        case 'to-fix':
          if(clientObj.userSettings.toFix) { //if it's already defined _
            clientObj.removeEnabledOptions('to-fix'); //_remove the already existent label. For now, "to-fix" only allows 1 user defined
          }
          clientObj.userSettings.toFix = {name: functionObj.user, socketId: functionObj.socketId}; //update it's valuewith the new username
          clientObj.appendEnabledOptions(functionObj.functionType, functionObj.user); //appends the new label
          break;
        case 'track':
          if(clientObj.userSettings.track){ //if the user is already tracking someone it calls the function bellow. Doing this conditional statement, the function bellow only runs when needed, avoiding unnecessary work
            clientObj.trackFunction("off", '', ''); //This function will take off the track-on value from the labels class and removes the appended-option.
          }
          clientObj.trackFunction("on", functionObj.user, functionObj.socketId); //enables the tracking
          break;
        default:
          clientObj.labelParser('system', 'server-message-bad', '', '','error: eventClient>socketOn>confirmedUser');
      }
    });

  clientObj.commandList(['\\scroll'], ''); //enables scroll when page loads
  textareaElement.focus(); //stays focused since the load
});
