/*
 * Starts a HTTP server
 */


var express         = require('express');
var log             = require('fancy-log');
var session         = require('express-session');
var bodyparser      = require('body-parser');

var app             = express();
var server          = require('http').createServer(app);

var controller = {
    index: require('./controllers/index.js'),
    logout: require('./controllers/logout.js'),
    cacerts: require('./controllers/cacerts.js')
}



app.set('views', __dirname + '/views')
app.set('view engine', 'pug')
app.use(express.static(__dirname + '/public'))
app.use(session({ secret: 'comebskfjevskn4inc8h3k', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false}))
app.use(bodyparser.urlencoded({ extended: true }))
app.use('/static', express.static('static'));

server.listen(5000, function () {
    console.log('Server listening at port %d', 5000);
});



app.get('/', function (req, res) {
    page = controller.index(req, res);
    res.render('index', page)
});


app.post('/', function(req, res) {
    page = controller.index(req, res);
    res.render('index', page)
});


app.get('/logout', function(req, res) {
    controller.logout(req, res)
});



app.get('/cacerts', function(req, res) {
    page = controller.cacerts(req, res)
    res.render('cacerts', page)
});
