const express = require('express');
const app = express();

require('dotenv').config();
//require('./utils/cronJobs'); // Chạy cron job tự động

const helmet = require('helmet') 
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const http = require('http');
const path = require('path');
const cors = require('cors');
const server = http.createServer(app);
const socketIO = require('socket.io');

const routes = require('./routes/index')

const {requireAuth, checkUser, verifyConnectSocket} = require('./middleware/auth.middleware');
const {errorHandler} = require('./middleware/error.middleware')
//const socketHandler = require('./socket/socketHandler');
const {setupSocket, initSocket} = require('./socket/index')
const compression = require('compression');

//Init middleware

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
//     res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
//     res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next();
// });
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

const io = socketIO(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        methods: ['GET', 'POST'],
        credentials: true,
        allowEIO3: true // Allow Engine.IO version 3
    },
    transports: ['websocket']
});

verifyConnectSocket(io)
initSocket(io)

app.set('io', io);

//Init dbs
require('./databases/init.mongodb');
const client = require('./databases/init.redis');

const {countConnect, checkOverload} = require('./helpers/check.connect'); 
countConnect()
//checkOverload()

//Handle routers

app.get('/redis', async (req, res) => {
    await client.set('message', 'Hello Redis from Express!');
    const message = await client.get('message');
    res.send(message);
});
app.get('/signup', (req, res) => {res.render('signup')})
app.get('/signin', (req, res) => {res.render('signin')})

app.use('', (req, res, next) => {req.io = app.get('io'); next();}, routes)

//Handle error
app.use(errorHandler);

module.exports = {app, server, io};