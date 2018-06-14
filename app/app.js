/**
 * Main application file
 */




const express = require('express');

// Set default node environment to production
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const config = require('./config');

// Setup server
var app = express();

require('./express')( app );
require('./makedirs')( config );

// initialize singleton plugin system
require('./components/plugin_handler');

// Start server
app.listen(config.get('port'), config.get('ip'), function () {
  config.logger.info('Express server listening on http://%s:%d, in %s mode', config.get('ip'), config.get('port'), app.get('env'));
});

// Expose app
exports = app;
