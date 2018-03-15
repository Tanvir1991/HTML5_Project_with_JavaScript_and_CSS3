var http = require('http');
var express = require('express');
var io = require('socket.io');
var app = express();
var server = http.createServer(app);
var ioServer = io.listen(server);
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/main.html')
})
var users = [];
var rooms = [];
ioServer.sockets.on("connection", function (socket) {
    console.log("A new client connected");
    socket.on("adduser", function (userName) {
        socket.username = userName.name;
        socket.room = userName.group;
        socket.join(userName.group);
        users.push(userName.name);
        rooms.push(userName.group);
        ioServer.sockets.emit("updateUser", users);
        socket.emit('message', { from: "Server ", content: socket.username + "  just joined " + socket.room });
        socket.broadcast.to(socket.room).emit('message', {
            from: "Server ", content: socket.username + 
                '  has connected to ' + socket.room
        });
    });
    socket.on("chat", function (data) {    
        socket.broadcast.in(socket.room).emit("message", { from: socket.username, content: data })     
        socket.emit("message", { from: "You", content: data });
    });
    socket.on('userImage', function (data) {
        socket.broadcast.to(socket.room).emit("addimage", { from: socket.username, content: data })
        socket.emit("addimage", { from: "You ", content: data });
    });

    socket.on("disconnect", function () {
        console.log("A user disonnected");
        users.splice(users.indexOf(socket.username), 1);
        socket.broadcast.to(socket.room).emit('message', {
            from: "Server ", content: socket.username +
                '  just disconnected from ' + socket.room
        })
        socket.disconnect();
        ioServer.sockets.emit("updateUser", users);
        socket.leave(socket.room);
    });
});
server.listen(3000);
console.log("Server running on 3000")
