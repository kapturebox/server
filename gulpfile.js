
const gulp  = require('gulp');
const gls   = require('gulp-live-server');
const del   = require('del');

function clean() {
  return del([
    './app/config/config/local.yml'
  ])
}

function serve() {
  const server = gls('app/app.js', {env: process.env});
  server.start();

  return gulp.watch('app/**/*', function (file) {
    server.start.bind(server)();
  });
}

exports.clean = clean;
exports.serve = serve;
exports.default = gulp.series(clean, serve);
