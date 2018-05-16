/**
 * Express configuration
 */

'use strict';

const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const errorHandler = require('errorhandler');
const path = require('path');
const winstonExpress = require('express-winston');

const config = require('./config/environment');


module.exports = function( app ) {
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.set('x-powered-by', false);
  app.set('json spaces', true);
  app.use(
    winstonExpress.logger({
      winstonInstance: config.logger,
      meta: false,
      expressFormat: true,
      colorize: true
    })
  );

  if( 'development' === app.get('env') ) {
    app.use(require('connect-livereload')());
  }

  // support old v0 urls
  require('./routes.v0')(app);

  // new swagger based url system
  require('./routes.v1')(app);

  app.use(
    winstonExpress.errorLogger({
      winstonInstance: config.logger,
      json: true
    })
  );

};
