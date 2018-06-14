/**
 * Main application routes
 */



const path = require('path');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/plugin',   require('./api/plugin'));
  app.use('/api/series',   require('./api/series'));
  app.use('/api/download', require('./api/download'));
  app.use('/api/search',   require('./api/search'));
  app.use('/api/settings', require('./api/settings'));

  // deprecated
  // app.use('/api/remote',   require('./api/remote'));
  // app.use('/api/ansible',  require('./api/ansible'));

  return app;
};
