const _ = require('lodash');
const nconf = require('nconf');

nconf
  .env()
  .file({ file: './config/config.json' });

const all = {
  mssql: {
    connectionTimeout: 180000,
    requestTimeout: 180000,
    options: {
      encrypt: false,
      connectionTimeout: 180000,
      requestTimeout: 180000
    },
    pool: {
      max: 10000,
      min: 0,
      idleTimeoutMillis: 30000
    }
  },
  session: {
    secret: "secret12345Qwe",
    resave: true,
    saveUninitialized: true,
    expire: 60 * 60 * 24 * 30 //expiresIn in seconds, 30 days
  }
};

const merged = _.merge(
  all,
  require('./' + nconf.get('NODE_ENV') + '.js') || {});

for (let key in merged) {
  nconf.set(key, merged[key]);
}

module.exports = merged;