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
    - \track highlights all your messages.
    - \track userId highlights all it's messages
    - \track-off clear highlights

I am doing this for my own learning purposes. Since I'm sharing it to whoever may be interested, I commented the code for easy understanding.

TODO (not organized):
 - lock the private message so the user don't need to type "\to username" on sequential
 private messages to the same user. Maybe an extra funtionality like "\to_lock" and
 "to_unlock"
 - Add support for nicknames
 - Add “{user} is typing” functionality
 -Show something when everybody received a message and something different when not
 everyone received the message
 - Show who’s online
 - Add file transfer support
 - Hyperlinks
 - Implement locked chatroom requiring a password to login
 - Format HTML for better look
TODO V0.4.0:
    - fix functions
        - to-fix
        - track-fix
    - autocomplete
 
Version notes V0.3.0:
 - Some HTML changes
 - Implemented track command. It highlights all messages from a specific user or own.