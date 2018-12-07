'use strict';

const config = require('nconf').get('session');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const messageManager = require('./Message');
const validateJwt = expressJwt({ secret: config.secret });
const sql = require('mssql');
const pool = require('../boot/sql');

exports.isAuthenticated = () => {
  return compose()
  // Validate jwt
    .use(function(req, res, next) {
      // allow access_token to be passed through query parameter as well
      if(req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }
      validateJwt(req, res, next);
    })
    // Attach user to request
    .use(function(req, res, next) {
      next();
    });
};

exports.signToken = (user) => {
  return jwt.sign({ id: user.userid, username: user.username }, config.secret, { expiresIn: config.expire}); //expiresIn in seconds, 30 days
};
