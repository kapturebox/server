
const gulp  = require('gulp');
const gls   = require('gulp-live-server');


 
gulp.task('serve', function () {
    const server = gls('app/app.js', {env: process.env});
    server.start();

    gulp.watch('app/**/*', function (file) {
      server.start.bind(server)();
    });
  });

gulp.task('default', ['serve']);
