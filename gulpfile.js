const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync').create();
const dotenv = require('dotenv');

// 환경 변수 설정
const env = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: env });

const PORT = process.env.PORT || 3000;

// Nodemon 태스크
gulp.task('nodemon', (cb) => {
    let started = false;
  
    return nodemon({
      script: 'server.js',
      watch: ['src', 'server.js'],
      env: { 'NODE_ENV': process.env.NODE_ENV }
    }).on('start', () => {
      if (!started) {
        cb();
        started = true;
      }
    }).on('restart', () => {
      setTimeout(() => {
        browserSync.reload();
      }, 500);
    });
});

// Browser-Sync 태스크
gulp.task('browser-sync', gulp.series('nodemon', () => {
    browserSync.init(null, {
      proxy: `http://localhost:${PORT}`,
      files: ['src/**/*.{js,css,html}'],
      port: 4000,
      open: false,
      notify: false,
      reloadOnRestart: true
    });
}));

// 기본 태스크
gulp.task('default', gulp.series('browser-sync', () => {
    gulp.watch(['src/**/*.{js,css,html}'], browserSync.reload);
}));

