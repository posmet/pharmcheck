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
	if (conds) {
		if (conds.length > 0) {
			sqlString = sqlString + ' where ';
			sqlString = sqlString + conds.reduce(function (prev, curr) {
				var Whr = prev;
				if (prev !== '')
					Whr = Whr + ' and ';
				Whr = Whr + curr.key;
				switch (curr.condition) {
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
		}
	}
	return sqlString;
  

};

module.exports = function (app) {

  app.get('/api/profile', authService.isAuthenticated(), middleware.asyncMiddleware(async (req, res) => {
    /*const request = new sql.Request(pool);
    const sqlString = `SELECT * from ref_users where userid=${req.user.id}`;
    const rs = await request.query(sqlString);
    if (!rs.recordset.length) {
      return messageManager.sendMessage(res, "Пользователь не найден", 401);
    }
    res.json(rs.recordset[0]);*/
    res.json(req.user);
  }));

	app.get('/api/reports', authService.isAuthenticated(), middleware.asyncMiddleware(async (req, res) => {
		const reports = [
			{
				id: 1,
				name: 'Продажи',
				description: 'Поиск по Продажам',
				fields: [
					{ id: 1, name: 'Сеть', key: 'Group_Name' },
					{ id: 2, name: 'Аптека', key: 'Ph_Name' },
					{ id: 3, name: 'Дата', type: 'date', key: 'dat' },
					{ id: 4, name: 'Наименование', key: 'G_name' },
					{ id: 5, name: 'ШК', key: 'Barcode' },
					{ id: 6, name: 'Количество', type: 'number', key: 'Qty' },
					{ id: 7, name: 'Цена', type: 'number', key: 'Price' },
					{ id: 8, name: 'Сумма', type: 'number', key: 'Sm' },
					{ id: 9, name: 'Позиций', type: 'number', key: 'QtyPos' }
				]
			},
			{
				id: 2,
				name: 'Остатки',
				description: 'Поиск по Остаткам',
				fields: [
					{ id: 1, name: 'Сеть', key: 'Group_Name' },
					{ id: 2, name: 'Аптека', key: 'Ph_Name' },
					{ id: 3, name: 'Дата', type: 'date', key: 'Dat' },
					{ id: 4, name: 'Наименование', key: 'G_name' },
					{ id: 5, name: 'Количество', type: 'number', key: 'Qty' },
					{ id: 6, name: 'ШК', key: 'Barcode' }
				]
			}
		];
		res.json(reports);
	}));

  app.post('/api/reports/:repid',  middleware.asyncMiddleware(async (req, res) => {
	  const request = new sql.Request(pool);
	  let sqlString = "";
	  console.log(req.body.filter);
		if (req.params.repid == '1') {
				sqlString = 'SELECT * from sales_view' + addwhere(req.body.filter);
		} else {
				sqlString = 'SELECT * from remains_view' + addwhere(req.body.filter);
		}
    console.log(sqlString);
    const rs = await request.query(sqlString);
    res.json(rs.recordset);
  }));

	app.post('/api/requests/:reqid', middleware.asyncMiddleware(async (req, res) => {
		const request = new sql.Request(pool);
		const sqlString = "insert into requests(tp,reptp,name,description,fields,filter,created,status) values(1," + req.params.reqid + ",'" + req.body.name + "','" + req.body.description + "','" + JSON.stringify(req.body.fields) + "','" + JSON.stringify(req.body.filter) + "',getdate(),'Сохранен')";
		console.log(sqlString);
		await request.query(sqlString);
		res.json(messageManager.buildSuccess());
	}));

  app.get('/api/requests/:reqid', middleware.asyncMiddleware(async (req, res) => {
    const request = new sql.Request(pool);
    const sqlString = `select * from requests where id=${req.params.reqid}`;
    console.log(sqlString);
    const rs = await request.query(sqlString);
    if (!rs.recordset.length) {
    	return messageManager.sendMessage(res, "Запрос не найден", 404);
		}
		try {
      rs.recordset[0].fields = rs.recordset[0].fields ? JSON.parse(rs.recordset[0].fields) : [];
      rs.recordset[0].filter = rs.recordset[0].filter ? JSON.parse(rs.recordset[0].filter) : [];
		} catch (e) {}
    res.json(rs.recordset[0]);
  }));

	app.get('/api/requests', middleware.asyncMiddleware(async (req, res) => {
		const request = new sql.Request(pool);
		const sqlString = "select * from requests where tp=1";
		console.log(sqlString);
		const rs = await request.query(sqlString);
		res.json(rs.recordset);
	}));
	app.get('/api/requests/:reqid', middleware.asyncMiddleware(async (req, res) => {
		const request = new sql.Request(pool);
		const sqlString = "select * from requests where tp=1 and id=" + req.params.reqid;
		console.log(sqlString);
		const rs = await request.query(sqlString);
		res.json(rs.recordset);
	}));

	app.delete('/api/requests/:reqid', middleware.asyncMiddleware(async (req, res) => {
		const request = new sql.Request(pool);
		const sqlString = "delete from requests where id = " + req.params.reqid; 
		console.log(sqlString);
		await request.query(sqlString);
		res.json(messageManager.buildSuccess());
	}));

	app.post('/api/savedReports/:reqid', middleware.asyncMiddleware(async (req, res) => {
		const request = new sql.Request(pool);
		const sqlString = "insert into requests(tp,reptp,name,description,fields,filter,format,created,status) values(2," + req.params.reqid + ",'" + req.body.name + "','" + req.body.description + "','" + JSON.stringify(req.body.fields) + "','" + JSON.stringify(req.body.filter) + "','" + req.body.format + "',getdate(),'Сохранен')";
		console.log(sqlString);
		await request.query(sqlString);
		res.json(messageManager.buildSuccess());
	}));

	app.get('/api/savedReports', middleware.asyncMiddleware(async (req, res) => {
		const request = new sql.Request(pool);
		const sqlString = "select * from requests where tp=2";
		console.log(sqlString);
		const rs = await request.query(sqlString);
		res.json(rs.recordset);
	}));

	app.delete('/api/savedReports/:reqid', middleware.asyncMiddleware(async (req, res) => {
		const request = new sql.Request(pool);
		const sqlString = "delete from requests where id = " + req.params.reqid;
		console.log(sqlString);
		await request.query(sqlString);
		res.json(messageManager.buildSuccess());
	}));

	app.post('/api/send/', upload.single('batch.json'), middleware.asyncMiddleware(async (req, res) => {
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
	}));

	app.post('/api/test/', upload.single('photo'),function(req,res,next) {
		console.log(req.body);
		console.log(req.file);
		res.json(messageManager.buildSuccess());
	});

};

