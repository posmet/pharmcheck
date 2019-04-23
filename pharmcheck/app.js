'use strict';
var debug = require('debug');
const express = require('express');
const app = express();

const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const nconf = require("nconf");
const http = require("http");
const cors = require('cors');
const messageManager = require('./services/Message');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/public', express.static(path.join(__dirname, 'reports')));
app.use(cors());
require('./config');
require('./boot')(app);
require('./routes')(app);

app.use(function (err, req, res, next) {
  console.log(err);
  if (err.name === 'UnauthorizedError') {
    return messageManager.sendMessage(res, "Неверный токен авторизации", 401);
  }
  const contentType = req.headers['content-type'];
  if (req.xhr || (!contentType || contentType && contentType.indexOf('json') > -1)) {
    messageManager.sendMessage(res, err);
  } else {
    next(err);
  }
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
