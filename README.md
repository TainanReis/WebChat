# WebChat
Easy private webchat with file transfer (check version 1st)

How to use:
 - Install the dependencies:
    - install Node.js
    - Open Node.js console and go to the webchat folder
    - run: npm install
 - Run the index.js: node index.js

I am doing this for my own learning purposes. Since I'm sharing it to whoever may be interested, I commented the code for easy understanding.

TODO:
  - Broadcast a message to connected users when someone connects or disconnects
  - Change the $().click() to .keyup()
  - Allow the user to run functions using "\", ex.: \nickname John Doe
  - Add support for nicknames
  - Don’t send the same message to the user that sent it himself. Instead, append the message directly as soon as he presses enter.
  - Add “{user} is typing” functionality
  - Show who’s online
  - Add private messaging
  - Add file transfer support
  - Hyperlinks
  - Implement locked chatroom requiring a password to login
