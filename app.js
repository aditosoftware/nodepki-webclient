/*
 * Starts a HTTP server
 */


var express         = require('express');
var log             = require('fancy-log');
var session         = require('express-session');
var bodyparser      = require('body-parser');
var fs              = require('fs-extra');
var yaml            = require('js-yaml');

var app             = express();
var server          = require('http').createServer(app);

var controller = {
    index: require('./controllers/index.js'),
    logout: require('./controllers/logout.js'),
    cacerts: require('./controllers/cacerts.js'),
    request: require('./controllers/request.js'),
    list: require('./controllers/list.js'),
    getcert: require('./controllers/getcert.js'),
    revoke: require('./controllers/revoke.js')
}


global.apipath = '/api/v1';


/*
 * Make sure there is a config file config.yml
 */
if(fs.existsSync('data/config/config.yml')) {
    log.info("Reading config file data/config/config.yml ...");
    global.config = yaml.safeLoad(fs.readFileSync('data/config/config.yml', 'utf8'));
} else {
    // There is no config file yet. Create one from config.yml.default and quit server.
    log("No custom config file 'data/config/config.yml' found.")
    fs.ensureDirSync('data/config');
    fs.copySync('config.default.yml', 'data/config/config.yml');
    log("Default config file was copied to data/config/config.yml.");
    console.log("\
**********************************************************************\n\
***   Please customize data/config/config.yml according to your    ***\n\
***            environment and restart NodePKI-Webclient.          ***\n\
**********************************************************************");

    log("Server will quit now.");
    process.exit();
}

global.baseurl = global.config.server.baseurl


app.set('views', __dirname + '/views')
app.set('view engine', 'pug')
app.use(express.static(__dirname + '/public'))
app.use(session({ secret: 'comebskfjevskn4inc8h3k', cookie: { maxAge: 3600000 }, resave: false, saveUninitialized: false})) // Session lifetime: 1h
app.use(bodyparser.urlencoded({ extended: true }))
app.use('/static', express.static('static'));

server.listen(global.config.server.port, global.config.server.ip, function () {
    console.log('Server listening at port %d', global.config.server.port);
});


app.get('/', function(req, res) {
    controller.index(req, res);
});
app.post('/', function(req, res) {
    controller.index(req, res);
});


app.get('/logout', function(req, res) {
    controller.logout(req, res)
});


app.get('/cacerts', function(req, res) {
    controller.cacerts(req, res)
});


app.get('/request', function(req, res) {
    if(req.session.auth && req.session.auth.authed) {
        controller.request(req, res);
    } else {
        res.redirect(302, global.baseurl + '/?reqlogin=1');
    }
});
app.post('/request', function(req, res) {
    if(req.session.auth && req.session.auth.authed) {
        controller.request(req, res);
    } else {
        res.redirect(302, global.baseurl + '/?reqlogin=1');
    }
});


app.get('/list', function(req, res) {
    if(req.session.auth && req.session.auth.authed) {
        controller.list(req, res);
    } else {
        res.redirect(302, global.baseurl + '/?reqlogin=1');
    }
});


app.get('/getcert', function(req, res) {
    if(req.session.auth && req.session.auth.authed) {
        controller.getcert(req, res);
    } else {
        res.redirect(302, global.baseurl + '/?reqlogin=1');
    }
});


app.get('/revoke', function(req, res) {
    if(req.session.auth && req.session.auth.authed) {
        controller.revoke(req, res);
    } else {
        res.redirect(302, global.baseurl + '/?reqlogin=1');
    }
});
app.post('/revoke', function(req, res) {
    if(req.session.auth && req.session.auth.authed) {
        controller.revoke(req, res);
    } else {
        res.redirect(302, global.baseurl + '/?reqlogin=1');
    }
});
