const express = require('express')
const bodyParser = require('body-parser')
const flash = require('express-flash')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const app = express()
const port = 3000
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

require('dotenv').config()

const database = require("./config/database");
database.connect();

const routeClient = require("./routes/client/index.route");

app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')
app.use(express.static(`${__dirname}/public`))

app.use(cookieParser('keyboard cat'));
app.use(session({ cookie: { maxAge: 60000 } }));
app.use(flash());

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

// Khai báo biến toàn cục cho file js backend
global._io = io;

routeClient(app);

server.listen(port, () => {
  console.log(`App listening on port ${port}`)
})