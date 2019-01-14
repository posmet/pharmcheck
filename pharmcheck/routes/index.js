const path = require('path');
const dist = path.join(__dirname + "/..", 'dist');

module.exports = function (app) {
  app.get('/*', function (req, res, next) {
    if (req.originalUrl.startsWith('/api')) {
      // skip any /api routes
      next();
    } else {
      res.sendFile(path.join(dist, 'index.html'));
    }
  });
	require("./auth")(app);
	require("./api")(app);
};
