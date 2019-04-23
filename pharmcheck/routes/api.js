const sql = require('mssql');
const pool = require('../boot/sql');
const middleware = require('../services/Middleware');
const authService = require('../services/Auth');
const messageManager = require('../services/Message');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const util = require('util');
const Excel = require('exceljs');
const path = require('path');

const writeFile = util.promisify(fs.writeFile);

const addwhere = function (conds) {
	let sqlString = '';
	console.log(conds);
	if (conds) {
		if (conds.length > 0) {
			sqlString = sqlString + ' where ';
			sqlString = sqlString + conds.reduce(function (prev, curr) {
				var Whr = prev;
				if (prev !== '') {
					if (curr.common === 'or') {
						Whr = Whr + ' or ';
					} else {
						Whr = Whr + ' and ';
					}
					if (curr.condition === 'nls') {
						Whr = Whr + ' not (';
					}
				}
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
					case 'ls':
						Whr = Whr + " IN ('" + curr.value.join() + "')";
						break;
					case 'nls':
						Whr = Whr + " IN ('" + curr.value.join() + "'))";
						break;
					case 'btw':
						Whr = Whr + " between '" + curr.value + "' and '" + curr.value2 + "'";
				}
				return Whr;

			}, "");
		}
	}
	return sqlString;
  

};

const getReportById = async (repid, req) => {
  const request = new sql.Request(pool);
  let sqlString = "";
  console.log(repid);
  if (repid == 1) {
    sqlString = 'SELECT * from sales_view' + addwhere(req.body.filter);
  }
  if (repid == 2) {
    sqlString = 'SELECT * from remains_view' + addwhere(req.body.filter);
  }
  if (repid == 3) {
    sqlString = 'SELECT * from purchases_view' + addwhere(req.body.filter);
  }
  if (repid == 4) {
    sqlString = 'SELECT * from Items_view' + addwhere(req.body.filter);
  }
  if (repid == 5) {
    sqlString = 'SELECT * from Pharms' + addwhere(req.body.filter);
  }
  console.log(sqlString);
  console.log('Query');
  return await request.query(sqlString);
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
					{ id: 3, name: 'Адрес', key: 'Ph_Addr' },
					{ id: 4, name: 'ФИАС', key: 'Ph_FIAS' },
					{ id: 5, name: 'ИНН Аптеки', key: 'Ph_INN' },
					{ id: 6, name: 'Дата', type: 'date', key: 'dat' },
					{ id: 7, name: 'Код SCU', key: 'G_ID' },
					{ id: 8, name: 'Наименование', key: 'G_name' },
					{ id: 9, name: 'ШК', key: 'Barcode' },
					{ id: 10, name: 'Количество', type: 'number', key: 'Qty' },
					{ id: 11, name: 'Цена', type: 'number', key: 'Price' },
					{ id: 12, name: 'Величина скидки', type: 'number', key: 'Discount' },
					{ id: 13, name: 'Позиций', type: 'number', key: 'QtyPos' },
					{ id: 14, name: 'НФН', key: 'Cap_Number' },
					{ id: 15, name: 'НФД', key: 'Doc_Number' },
					{ id: 16, name: 'ФПД', key: 'Doc_Prop' }

				]
			},
			{
				id: 2,
				name: 'Остатки',
				description: 'Поиск по Остаткам',
				fields: [
					{ id: 1, name: 'Сеть', key: 'Group_Name' },
					{ id: 2, name: 'Аптека', key: 'Ph_Name' },
					{ id: 3, name: 'ИНН Аптеки', key: 'Ph_INN' },
					{ id: 4, name: 'Дата', type: 'date', key: 'Dat' },
					{ id: 5, name: 'Дата на склад', type: 'date', key: 'StockDat' },
					{ id: 6, name: 'Срок годности', type: 'date', key: 'ExpireDat' },
					{ id: 7, name: 'Код SKU', key: 'G_ID' },
					{ id: 8, name: 'Наименование', key: 'G_name' },
					{ id: 9, name: 'Количество', type: 'number', key: 'Qty' },
					{ id: 10, name: 'ШК', key: 'Barcode' }
				]
			},
			{
				id: 2,
				name: 'Приходы',
				description: 'Поиск по Приходам',
				fields: [
					{ id: 1, name: 'Сеть', key: 'Group_Name' },
					{ id: 2, name: 'Аптека', key: 'Ph_Name' },
					{ id: 3, name: 'ИНН Аптеки', key: 'Ph_INN' },
					{ id: 4, name: 'Дата', type: 'date', key: 'Dat' },
					{ id: 5, name: 'Код SKU', key: 'G_ID' },
					{ id: 6, name: 'Наименование', key: 'G_name' },
					{ id: 7, name: 'Количество', type: 'number', key: 'Qty' },
					{ id: 8, name: 'Цена', type: 'number', key: 'Price' },
					{ id: 9, name: 'ШК', key: 'Barcode' },
					{ id: 10, name: 'Поставщик',  key: 'Vendor' },
					{ id: 11, name: 'ИНН Пост',  key: 'VendorINN' }

				]
			},
			{
				id: 4,
			    name: 'Позиции',
			    description: 'Поиск по Позициям',
			    fields: [
				     { id: 1, name: 'Наименование', key: 'G_name' },
				     { id: 2, name: 'ШК', key: 'Barcode' }
			]
			},
			{
				id: 5,
			name: 'Аптеки',
			description: 'Поиск по Аптекам',
			fields: [
				{ id: 1, name: 'Сеть', key: 'Group_Name' },
				{ id: 2, name: 'Аптека', key: 'Ph_Name' }
			]
			}


		];
		res.json(reports);
	}));

  app.post('/api/reports/:repid',  middleware.asyncMiddleware(async (req, res) => {
    const rs = await getReportById(req.params.repid, req);
    res.json(rs.recordset);
  }));
	app.post('/api/table/:key', middleware.asyncMiddleware(async (req, res) => {
		const request = new sql.Request(pool);
		let sqlString = "";
		console.log(req.params.repid);
		if (req.params.key == 'G_name') {
			sqlString = 'SELECT * from Items_view' + addwhere(req.body.filter);
		}
		if (req.params.key == 'Ph_Name') {
			sqlString = 'SELECT * from Pharms' + addwhere(req.body.filter);
		}
		console.log(sqlString);
		console.log('Query');
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
		if (['xls', 'csv'].indexOf(req.body.format) > -1) {
			let key = req.body.format === 'xls' ? 'xlsx' : 'csv';
      try {
      	const rsId = await request.query("select max(id) from requests");
        const rs = await getReportById(req.params.reqid, req);
        let wb = new Excel.Workbook();
        wb.creator = 'Pharmasoft';
        let ws = wb.addWorksheet('Таблица');
        ws.columns = req.body.fields.map(v => ({header: v.title, key: v.key || v.name}));
        ws.getRow(1).font = {
          bold: true
        };
        rs.recordset.forEach(item => {
          ws.addRow(item);
        });
        const filename = `${rsId.recordset[0][0]}.${req.body.format}`;
        await writeFile(filename, '');
        await wb[key].writeFile(path.join(__dirname + "/..", "reports", filename));
      } catch (e) {

      }
    }
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

