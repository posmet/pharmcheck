const path = require('path');
const dist = path.join(__dirname + "/..", 'dist');

module.exports = function (app) {
	//require("./auth")(app);
	require("./api")(app);
	app.get('/login', function (req, res, next) {
		res.sendFile(path.join(dist, 'index.html'));
	});
};
