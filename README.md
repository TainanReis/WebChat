# WebChat
Easy private webchat with file transfer (check version 1st)

How to use:
 - Install the dependencies:
    - install Node.js
    - Open Node.js console and go to the webchat folder
    - run: npm install
 - Run the index.js: node index.js
 - Users get an ID when connected
 - Send messages pressing Enter:
    - With \ as 1st char it will look for a command
    - \to userId sends a message to this user, ex.: \to 2 cool!
    - \to-fix userId send all messages to this user (\to userId will work when this function is
    enabled)
    - \to-unfix disables the function above
    - \track highlights all your messages.
    - \track userId highlights and tracks all it's messages
    - \track-off clear highlights/disables tracking
    - \scroll or \scroll-off enables or disables autoscroll
    - press TAB to autocomplete the commands (don't forget that it will only look for a command if
    the 1st char is \)

I am doing this for my own learning purposes. Since I'm sharing it to whoever may be interested, I commented the code for easy understanding.

TODO (not organized):
 - Add support for nicknames
 - Add “{user} is typing” functionality
 -Show something when everybody received a message and something different when not
 everyone received the message
 - Show who’s online
 - Add file transfer support
 - Hyperlinks
 - Implement locked chatroom requiring a password to login
 - Format HTML for better look
 
Version notes V0.4.0:
    - fix functions
        - \to-fix
        - \track
    - autoscroll
    - autocomplete
    - code optimization