const config = require("nconf");
const express = require('express');
const morgan = require('morgan'); //был express.logger('dev')
const methodOverride = require('method-override'); //был express.methodOverride()
const cookieParser = require('cookie-parser'); //был express.cookieParser()
const session = require('express-session');
const errorhandler = require('errorhandler'); //был express.errorHandler()
const passport = require('passport');
const path = require('path');
const flash = require('connect-flash');
const timeout = require('connect-timeout');
const cors = require('cors');
const bodyParser = require('body-parser'); //был express.json()

module.exports = function (app) {

    app.set('port', config.get("app:port") || 3000);
    app.set('views', path.join(__dirname + "/..", 'views'));
    app.set('view engine', 'jade');

    // const sessionOptions = config.get("session");
    // if ('production' === app.get('env')) {
    //     const MemcachedStore = require('connect-memcached')(session);
    //     sessionOptions.store = new MemcachedStore(config.get("memcached"));
    // }

    //if behind a reverse proxy such as Varnish or Nginx
    app.enable('trust proxy');
    app.use(morgan('dev'));
    app.use('/', express.static(path.join(__dirname + "/..", 'dist')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(methodOverride());
    app.use(cookieParser('secret'));
    // app.use(session(sessionOptions));
    app.use(flash());
    app.use(timeout('600s'));
    app.use(cors());

    app.use(passport.initialize());
    app.use(passport.session());

    if ('development' === app.get('env')) {
        app.use(errorhandler());
    }

};
