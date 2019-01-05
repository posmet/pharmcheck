const sql = require('mssql');
const pool = require('../boot/sql');
const middleware = require('../services/Middleware');
const authService = require('../services/Auth');
const messageManager = require('../services/Message');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

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

	app.get('/', function (req, res) {
		console.log(req.body);
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
	app.post('/api/send/', upload.single('batch.json'), function (req, res,next) {
		const request = new sql.Request(pool);
		var sqlString = "";
		console.dir(req.file);
		const batchfile = fs.readFileSync(req.file.path,"utf8");
		const batch = JSON.parse(batchfile);
		console.log(batch.batch);
		batch.batch.remains.forEach(function (item, key, arr) {
			sqlString = "insert into remains values(" + batch.batch.id + ",";
			for (var i = 0; i < 4; i++) {
				sqlString = sqlString + "'" + item[i] + "'";
				if (i < 3) sqlString = sqlString + ",";
			}
			sqlString = sqlString + ")";
			console.log(sqlString);
			const rs = request.query(sqlString);
		});

		batch.batch.sales.forEach(function (item, i, arr) {
			sqlString = "insert into sales values(" + batch.batch.id + ",";
			for (i = 0; i < 9; i++) {
				sqlString = sqlString + "'" + item[i] + "'";
				if (i < 8) sqlString = sqlString + ",";
			}
			sqlString = sqlString + ")";
			console.log(sqlString);
			const rs = request.query(sqlString);
		});

		batch.batch.log.forEach(function (item, i, arr) {
			sqlString = "insert into log values(" + batch.batch.id + ",'" + item[0] + "','" + item[1].replace(/'/g,'"') + "')";
			console.log(sqlString);
			const rs = request.query(sqlString);
		});

		sqlString = "insert into batches values(" + batch.batch.id + ",'" + batch.batch.date + "','" + batch.batch.start_date + "','" + batch.batch.end_date + "',0)";
		console.log(sqlString);
		const rs = request.query(sqlString);
		//console.log(sqlString);
		//const rs = await request.query(sqlString);
		//res.json(rs.recordset);
		res.json({ message: 'ok' });
	});
	app.post('/api/test/', upload.single('photo'),function(req,res,next) {
		console.log(req.body);
		console.log(req.file);
		res.json('ok');
	});
};

