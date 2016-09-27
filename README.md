# WebChat
Easy private webchat with file transfer (check version 1st)

How to use:
 - Install the dependencies:
    - install Node.js
    - Open Node.js console and go to the webchat folder
    - run: npm install
 - Run the index.js: node index.js

I am doing this for my own learning purposes. Since I'm sharing it to whoever may be interested, I commented the code for easy understanding.

TODO (not organized):
    - Add functions to the command list
    - lock the private message so the user don't need to type "\to username" on sequential
    private messages to the same user. Maybe an extra funtionality like "\to_lock" and
    "to_unlock"
    - Add support for nicknames
    - Add “{user} is typing” functionality
    - Show something when everybody received a message and something different when not
    everyone received the message
    - Show who’s online
    - Add file transfer support
    - Hyperlinks
    - Implement locked chatroom requiring a password to login
    - Format HTML for better look
Version notes:
    - As you may have guessed, this is not ready for use (V0.2.0).
    - To send a private message: \to user message. Where nessage is the user allocation
    on the usersArray. Example:
        - 1 has connected
        - This user position on usersArray=0
        - 2 has connected
        - This user position on usersArray=1
        - user 2 to send a message to user one: \to 0 Message from user 2 to user 1
    I'll implement support to Nicknames, so what we have is only for tests/get the structure ready.