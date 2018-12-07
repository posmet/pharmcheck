const sql = require('mssql');
const nconf = require("nconf");
const pool = new sql.ConnectionPool(nconf.get("mssql"));
let connection = null;

const connect = () => {
  pool
    .connect()
    .then(pool => {
      console.log('pool connected');
    }).catch(err => {
      setTimeout(() => connect, 5000);
      console.error('Error creating connection pool', err);
    });
};

connect();

sql.on('error', err => {
  console.error('Потеря коннекта с SQL сервером, попытка реконнекта');
  connect();
});

module.exports = pool;