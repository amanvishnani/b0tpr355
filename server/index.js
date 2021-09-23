const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const FileManager = require('./FileManager')
const [node, fileName, ...directories] = process.argv;

console.log(`${directories.length}`)


async function main() {
    const filemanager = await FileManager.newInstance(directories);
    io.on('connection', (socket) => {
        console.log('a user connected', socket.id);
        socket.emit('message', filemanager.fileMap);
        filemanager.subscribe(socket);
    });

    io.on('disconnect', (socket) => {
        console.log('A user disconnected', socket.id);
        filemanager.unsubscribe(socket);
    })
}



server.listen(5000, () => {
    console.log('listening on *:5000');
    main();
});