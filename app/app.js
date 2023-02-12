/**
 * Main application file
 */




const express = require('express');
const dotenv = require('dotenv')
dotenv.config()


// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const config = require('./config');

// Setup server
const app = express();

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
