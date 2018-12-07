const sql = require('mssql');
const pool = require('../boot/sql');
const middleware = require('../services/Middleware');
const authService = require('../services/Auth');
const messageManager = require('../services/Message');

const addwhere = function (conds) {
  let sqlString = '';
  if (conds.length > 0) {
    sqlString = sqlString + ' where ';
    sqlString = sqlString + conds.reduce(function (prev, curr) {
      var Whr = prev;
      if (prev != '')
        Whr = Whr + ' and ';
      Whr = Whr + curr.field;
      switch (curr.cond) {
        case 'eq':
          Whr = Whr + " = '" + curr.value + "'";
          break;
        case 'neq':
          Whr = Whr + " <> '" + curr.value + "'";
          break;
        case 'cn':
          Whr = Whr + " Like '%" + curr.value + "%'";
          break;
        case 'ncn':
          Whr = Whr + " = '" + curr.value + "'";
          break;
        case 'nl':
          Whr = Whr + " = ''";
          break;
        case 'nnl':
          Whr = Whr + " <> ''";
          break;
        case 'gt':
          Whr = Whr + " > '" + curr.value + "'";
          break;
        case 'lt':
          Whr = Whr + " < '" + curr.value + "'";
          break;
      }
      return Whr;

    }, "");
    return sqlString;
  }

};

module.exports = function (app) {

  app.get('/api/name', authService.isAuthenticated(), middleware.asyncMiddleware(async (req, res) => {
    const request = new sql.Request(pool);
    const sqlString = `SELECT * from ref_users where userid=${req.user.id}`;
    const rs = await request.query(sqlString);
    if (!rs.recordset.length) {
      return messageManager.sendMessage(res, "Пользователь не найден", 401);
    }
    res.json(rs.recordset[0]);
  }));

  app.get('/api/sentupdate', function(req,res) {
    res.json({
      name: 'test'
    });
  });

  app.post('/api/resultmtrxn/', authService.isAuthenticated(), middleware.asyncMiddleware(async (req, res) => {
    const request = new sql.Request(pool);
    const sqlString = 'SELECT * from matrix_cez_n'+addwhere(req.body.conds);
    console.log(sqlString);
    const rs = await request.query(sqlString);
    res.json(rs.recordset);
  }));


};

