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

// Start Server
let { port } = config;
app.listen(port, () => console.log(`APP running on port ${port}`));