const { randomInt } = require('crypto');
const { response } = require('express');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const { Server } = require('socket.io');
const io = new Server(server); 

app.use('/js', express.static(__dirname + '/js'));
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/css', express.static(__dirname + '/css'));

app.get('/', (require, response) => {
    response.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 8081, () => {
    console.log('Listening on ' + server.address().port);
});

server.playerNumber = 0;
server.playersOnGame = [];
server.pwList = [];

//handling socket events
io.on('connection', function(socket){

    socket.on('askConnect', () => {
        socket.player = {
            id: server.playerNumber
        };
        server.playerNumber+=1;
        socket.emit('connected', socket.player.id);
        console.log(`user #${socket.player.id} connected`);
    })

    socket.on('askEnter', ()=>{
        if (server.playersOnGame.length === 0){
            server.playersOnGame.push(socket.player.id);
            socket.emit('wait');
        }else if  (server.playersOnGame.length === 1){
            server.playersOnGame.push(socket.player.id);
            socket.emit('joined');
            socket.broadcast.emit('challenged', server.playersOnGame[0]);
        }else{
            socket.emit('denied');
        }
    })

    socket.on('pick', (hero)=>{
        socket.broadcast.emit('enemyPicked', hero);
    })

    //receive input&control data and send it to another player
    socket.on('playerUpdate', (data)=>{
        socket.broadcast.emit('playerUpdate', data);
    })
    socket.on('disconnect', () => {
        console.log(`user #${socket.player.id} disconnected`);
        for (let i=0; i<server.playersOnGame.length; i++){
            if (server.playersOnGame[i]===socket.player.id){
                server.playersOnGame.splice(i,1);
            }
        }
    })
});