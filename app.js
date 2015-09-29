'use strict';

var express = require('express'),
    http = require('http'),
    bodyParser = require('body-parser'),
    path = require('path'),
    jwt = require('jsonwebtoken'),
    jwtSecret = 'supersecret',
    socketioJwt = require('socketio-jwt');

// Configuration variable
var SOCKET_AUTH_TYPE = process.env.AUTH_IMPLEMENTATION || 'custom';

var app = express();
var server = http.createServer(app);

app.use(express.static( path.join( __dirname, 'public' )));
app.use(bodyParser.urlencoded( { extended: false }) );
app.use(bodyParser.json());

var io = require('socket.io')(server, {
    path: '/socket.io-client',
    serveClient: true
});

server.listen(3000, function() {
    console.log('listening on port 3000');
});

app.post('/auth', function(req, res) {
    var user = {};
    user.username = req.body.username ? req.body.username : 'Anonymous';
    user.password = req.body.password ? req.body.password : 'qwerty';
    if(user.username === 'wrong') {
        return res.json({token: 'wrong_token'});
    }
    var token = jwt.sign(user, jwtSecret, { expiresInMinutes: 1 });
    return res.json({token: token});
});

app.get('/test', function(req, res) {
    var token = req.headers.authorization.split('Bearer ')[1];
    jwt.verify(token, jwtSecret, {}, function(err, data) {
        res.send({
            error: err,
            user: data
        });
    });
});

function onDisconnect() {
    console.log('user disconnected.');
}

if(SOCKET_AUTH_TYPE == 'custom') {
    console.log('Running socket authorization with custom handling...');

    io.on('connection', function(socket) {
        var token = socket.handshake.query.token;
        jwt.verify(token, jwtSecret, {}, function(err, data) {
            if(err) {
                io.emit('unauthed', 'reauthenticate', {status: 'err'});
            } else {
                io.emit('authed', 'reauthenticate', {status: 'OK'});

            }
        });
    })
} else if (SOCKET_AUTH_TYPE == 'socketjwt') {
    io.use(socketioJwt.authorize({
        secret: jwtSecret,
        handshake: true
    }));

    console.log('Running socket authorization via socket-jwt...');
};



module.exports = app;