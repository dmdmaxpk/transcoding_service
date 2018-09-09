const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const config = require('./config');
const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Importing Index Routes
app.use('/', routes);

// Setting Port from config file
app.set('port', config.port);

// Run server
const server = app.listen(app.get('port'), () => {
	console.log(`Express running → PORT ${server.address().port}`); 
});

module.exports = app;
