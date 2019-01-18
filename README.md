#WebChat V1.0
##Information
###What is this?
This project is a simple browser based chat made with Javascript (and CSS for styling) and uses the following technologies: Node.js, express.js, socket.io.
This version has a rudimentary look, but it's working fine.

###Why?
I am doing this for my own learning purposes. I'm sharing this project to the world, that's why the code is very well commented/explained, so everyone can understand what's going on.

###What's next for this project?
I'll keep adding new functionalities that I believe it's useful for a webchat.

##How to use:
###Install
- Install the dependencies:
  - install Node.js
  - Open Node.js console and go to the webchat folder
  - run: npm install
- Run the index.js typing: node index.js
- You can openning by accessing the followinga address on you Browser: 127.0.0.1:3000
###Using the Chat
- Send messages pressing Enter:
  - With `\` **as 1st char**, if you press tab it'll complete with a command. You can also write something
  right after and it'll also complete with a command, it there's any that matches, e.g.: `\sc` [press tab] [it turns into: `\scroll`] [if I press tab again it will complete and show `\scroll-off`]
  - `\to userId` sends a message to userId, e.g.: `\to 2 cool!`
  - `\to-fix userId` send all messages to this user (`\to userId` will still work when this function is
  enabled)
  - `\to-unfix` disables the function above
  - `\track userId` highlight all the messages from userId. You can track a second user without the need to disable \track
  - `\track-off` clear highlights and disables tracking
  - `\scroll` or `\scroll-off` enables or disables autoscroll
###For external connections
- go to your router administration page and:
  - Choose the internal host (internal IP of your computer that is running the Node.js server)
  - Protocol: TCP
  - External Port Nr: 80 - 80
  - Internal Port Nr: 3000 - 3000 (defined in index.js)
  - Now you should be able to open it by typing your *externalIpAddress*:3000

##TODO:
###More important:
- [ ] When a private message is sent, show who it was to.
- [ ] Inform everybody when someone changed the name
- [ ] Allow the messages to be copied
- [ ] Show who’s online
- [ ] Show a message when the connection is lost
- [ ] Display `\help`
- [ ] Implement SPAM control
###Less important:
- [ ] Disable enabled-options by double-clicking them
- [ ] Allow tracking an user by double-clicking his name
- [ ] By clicking an user name, add `\to userName `
- [ ] Give it a nice look
- [ ] Add admin support
- [ ] Add password support for chat&admin
- [ ] Enable/Disable autoscroll according to the scroll position.
- [ ] Add file transfer support
- [ ] Hyperlinks
- [ ] Instead of groups, configure express routes to create a new chatroom from the link, e.g., `ip:3000\chatroom` 
