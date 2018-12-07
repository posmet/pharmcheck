//boot/passport.js
const passport = require('passport');
const sql = require('mssql');
const pool = require('./sql');
const AuthLocalStrategy = require('passport-local').Strategy;

passport.use('local', new AuthLocalStrategy(
    function (username, password, done) {

      let sqlString = "SELECT u.userid,user_name,full_name,p.ph_id,ph_name from ref_users u inner join roles r on r.userid=u.userid inner join pharms p on p.ph_id = r.ph_id where user_name='" + username + "' and pwd = '" + password + "'";
      const request = new sql.Request(pool);
      console.log(sqlString);
      request.query(sqlString, function (err, rs) {
        if (err) {
          console.log(err);
          return done(err);
        }
        if (rs.recordset.length > 0) {
          return done(null, {
            username: username,
            full_name: rs.recordset[0].full_name,
            profileUrl: "url_to_profile",
            userid: rs.recordset[0].userid,
            ph_id: rs.recordset[0].ph_id,
            ph_name: rs.recordset[0].ph_name
          });
        }
        return done(null, null, 'Неверный логин или пароль');
      });
    }
));



passport.serializeUser(function (user, done) {
    done(null, JSON.stringify(user));
});


passport.deserializeUser(function (data, done) {
    try {
        done(null, JSON.parse(data));
    } catch (e) {
        done(err)
    }
});

module.exports = function (app) {
};