const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const FileManager = require('./FileManager')
const [node, fileName, ...directories] = process.argv;

console.log(`${directories.length}`)

function attachListeners(socket, filemanager) {
    socket.on('expand', async (node) => {
        await filemanager.expandPath(node.absolutePath)
        socket.emit('message', filemanager.fileMap);
    });

    socket.on('collapse', async (node) => {
        await filemanager.collapsePath(node.absolutePath)
        socket.emit('message', filemanager.fileMap);
    });
}


async function main() {
    // Root
    const filemanager = await FileManager.newInstance(directories);
    // await filemanager.expandPath('d:\\Projects\\b0tpr355\\server');
    // await filemanager.expandPath('d:\\Projects\\b0tpr355');
    // await filemanager.expandPath('d:\\Projects\\b0tpr355\\.git');
    // console.log(filemanager.fileIndex)
    // await filemanager.collapsePath('d:\\Projects\\b0tpr355\\.git');
    // console.log(filemanager.fileMap)
    // console.log(filemanager.fileIndex)
    io.on('connection', (socket) => {
        console.log('a user connected', socket.id);
        socket.emit('message', filemanager.fileMap);
        attachListeners(socket, filemanager);
    });
}



server.listen(5000, () => {
    console.log('listening on *:5000');
    main();
});