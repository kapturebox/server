/**
 * Main application file
 */

'use strict';


const express = require('express');

// Set default node environment to production
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const config = require('./config/environment');

// Setup server
var app = express();

require('./express')( app );
require('./makedirs')( config );

// Start server
app.listen(config.port, config.ip, function () {
  config.logger.info('Express server listening on http://%s:%d, in %s mode', config.ip, config.port, app.get('env'));
});

// Expose app
exports = app;
