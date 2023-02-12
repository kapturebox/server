
const gulp  = require('gulp');
const gls   = require('gulp-live-server');
const del   = require('del');

const localConfig = './app/config/config/local.yml';

function clean() {
  return del([localConfig]);
}

function serve() {
  const server = gls('app/app.js', {env: process.env});
  const watcher = gulp.watch(['app/**/*', `!${localConfig}`]);
  server.start();

  watcher.on('all', function(event, path, stats) {
    console.log('File ' + path + ' got event ' + event + ', restarting ...');
    server.start.bind(server)();
  });

  return watcher;
}

exports.clean = clean;
exports.serve = serve;
exports.default = gulp.series(clean, serve);
