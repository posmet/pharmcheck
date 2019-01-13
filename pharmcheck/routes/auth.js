//routes/auth.js
const passport = require('passport');
const messageService = require('../services/Message');
const authService = require('../services/Auth');
const middleware = require('../services/Middleware');

const sql = require('mssql');
const pool = require('../boot/sql');
const nconf = require('nconf');

const testReq = async () => {
  let sqlString = `WAITFOR DELAY '00:00:0${Math.floor(Math.random() * 3)}'; SELECT * from roles`;
  const request = new sql.Request(pool);
  return await request.query(sqlString);
};

const testReq2 = async () => {
  let sqlString = `WAITFOR DELAY '00:00:0${Math.floor(Math.random() * 3)}'; SELECT * from roles`;
  try {
    let connection = await new sql.ConnectionPool(nconf.get("mssql")).connect();
    return await connection.request()
      .query(sqlString);
  } catch(e) {
    throw e;
  }
};

module.exports = function (app) {

  app.get('/api/logout', function (req, res) {
    req.logout();
    req.user = {};
    res.redirect('/');
  });

  app.post('/api/auth', function(req, res, next) {
    passport.authenticate('local', function (err, user, info) {
      if (err) return messageService.sendMessage(res, err);
      if (!user) return messageService.sendMessage(res, "Неверный логин или пароль");

      res.json({
        token: authService.signToken(user)
      });
    })(req, res, next);
  });

  app.get('/api/test', middleware.asyncMiddleware(async (req, res, next) => {
    let begin = new Date().getTime();
    const promises = [];
    for (let i = 0; i < 2; i++) {
      promises.push(testReq);
    }
    let errors = 0;
    let errors2 = 0;
    let results = await Promise.all(promises.map(async (fn) => await fn().catch(() => errors++)));
    results.forEach(r => {
      if (!r.recordset) {
        errors2++;
      } else if (!r.recordset.length) {
        errors2++;
      }
    });
    const time = (new Date().getTime() - begin) / 1000;
    console.log(time, errors, errors2, results.length);
    res.json({errors, errors2, time, ln: results.length});
  }));

  app.get('/api/test2', middleware.asyncMiddleware(async (req, res, next) => {
    let begin = new Date().getTime();
    const promises = [];
    for (let i = 0; i < 10000; i++) {
      promises.push(testReq2);
    }
    let errors = 0;
    let errors2 = 0;
    let results = await Promise.all(promises.map(async (fn) => await fn()));
    results.forEach(r => {
      if (!r.recordset) {
        errors2++;
      } else if (!r.recordset.length) {
        errors2++;
      }
    });
    const time = (new Date().getTime() - begin) / 1000;
    console.log(time, errors, errors2, results.length);
    res.json({errors, errors2, time, ln: results.length});
  }));

};