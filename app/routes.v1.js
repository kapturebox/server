const swaggerRoutes = require('swagger-routes')

module.exports = function(app) {
  // the main router of the app, we rely on swagger spec to define endpoints
  // and this will wire it up to functions
  return swaggerRoutes(app, {
    api: 'app/oas/main.oas2.yml',
    handlers:  'app/endpoints/',
    // authorizers: './src/handlers/security'
  });
}
