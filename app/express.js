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

const config = require('./config');


module.exports = function( app ) {
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.set('x-powered-by', false);
  app.set('json spaces', 2);
  app.use(
    winstonExpress.logger({
      winstonInstance: config.logger,
      meta: false,
      expressFormat: true,
      colorize: true
    })
  );

  // support old v0 urls
  require('./routes.v0')(app);

  // new swagger based url system
  require('./routes.v1')(app);

  // send errors to logger
  app.use(
    winstonExpress.errorLogger({
      winstonInstance: config.logger,
      json: true
    })
  );

  // error response handler to put responses in json
  app.use(function (err, req, res, next) {
    var response = {
      error: {
        message: err.toString(),
        code: err.statusCode
      }
    };
    res.status(err.statusCode || 500).json(response);
    return next(err);
  });

  // if none of the aboe match, throw a 404
  app.use(function(req, res, next) {
    return res.status(404).send();
  })

};
