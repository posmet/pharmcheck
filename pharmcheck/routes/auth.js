//routes/auth.js
const passport = require('passport');
const messageService = require('../services/Message');
const authService = require('../services/Auth');
const nconf = require('nconf');

module.exports = function (app) {

  app.post('/api/login', function(req, res, next) {
    passport.authenticate('local', function (err, user, info) {
      if (err) return messageService.sendMessage(res, err);
      if (!user) return messageService.sendMessage(res, "Неверный логин или пароль");

      res.json({
        token: authService.signToken(user)
      });
    })(req, res, next);
  });

};