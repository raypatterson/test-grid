var package = require('./package');
var config = require('./config');

var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var filter = require('gulp-filter');
var ignore = require('gulp-ignore');
var bytediff = require('gulp-bytediff');
var swig = require('gulp-swig');
var template = require('gulp-template');
var rev = require('gulp-rev');
var gzip = require('gulp-gzip');
var minify_html = require('gulp-minify-html');
var sass = require('gulp-sass');
var myth = require('gulp-myth');
var autoprefixer = require('gulp-autoprefixer');
var minify_css = require('gulp-csso');
var jshint = require('gulp-jshint');
var minify_js = require('gulp-uglify');
var refresh = require('gulp-livereload');
var open_browser = require('gulp-open');
var vinyl_map = require('vinyl-map');

var rework = require('rework');
var rework_importer = require('rework-importer');

/* Env */

var production = (gulp.env.production === true);

/* Server */

var connect = require('connect');
var connect_livereload = require('connect-livereload');
var lr_port = config.options.livereload.port;
var lr_server = require('tiny-lr')();
var lh_vars = config.env.localhost;
var lh_port = lh_vars.url.port;
var lh_url = lh_vars.url.protocol + '://' + lh_vars.url.domain + (lh_port ? (':' + lh_port) : '/');

/* Path */

var bower_dir = JSON.parse(fs.readFileSync('./.bowerrc')).directory;

var base = config.path.base;

var source_base = config.path.source.base;

var build_dir = (production !== true) ? config.path.build.dev : config.path.build.dist;

/* Utils */

function getMainJSON() {
  return JSON.parse(fs.readFileSync(config.path.source.json));
}

(function() {
  var src = source_base + '/colors/';
  var arr;
  var i;
  var line;
  var lines = [];
  fs.readdirSync(src).forEach(function(file) {
    arr = fs.readFileSync(src + file).toString().split("\n");
    for (i in arr) {
      line = arr[i];
      if (line.charAt(0) === '$') {
        line = line
          .replace(/\s/g, '')
          .replace(/\$/g, '"')
          .replace(/\!default/g, '')
          .replace(/:/g, '"\t')
          .replace(/;/g, '');
        lines.push(line);
      }
    }
  });
  // console.log('lines', lines);
  var stream = fs.createWriteStream(source_base + '/_color-list.scss');
  stream.once('open', function(fd) {
    stream.write('$color-list:\r' + lines.join(',\r') + '\r;');
    stream.end();
  });
}());

/* Task */

var production_stream = function(stream, minify, rev_file) {

  return stream.pipe(bytediff.start())
    .pipe(gulpif(production, minify))
    .pipe(gulpif(production, bytediff.stop()))
    .pipe(gulpif((production && rev_file), rev()))
    .pipe(gulpif(production, gzip()));
};

gulp.task('swig', function() {

  var swig_opts = config.options.swig;

  swig_opts.defaults.locals = getMainJSON().swig.locals;

  var stream = gulp.src(config.path.source.swig)
    .pipe(swig(swig_opts));

  return stream
    .pipe(production_stream(stream, minify_html()))
    .pipe(gulp.dest(build_dir))
    .pipe(refresh(lr_server));
});

gulp.task('html', function() {

  var stream = gulp.src(config.path.source.html);

  return stream
    .pipe(production_stream(stream, minify_html()))
    .pipe(gulp.dest(build_dir))
    .pipe(refresh(lr_server));
});

gulp.task('css', function() {

  var css_import = vinyl_map(function(contents, filename) {
    return rework(contents.toString()).use(rework_importer({
      path: source_base
    })).toString();
  });

  var stream = gulp.src(config.path.source.css)
    .pipe(sass({
      errLogToConsole: true,
      includePaths: [source_base, bower_dir]
    }))
    .pipe(css_import)
    .pipe(myth())
    .pipe(autoprefixer.apply(undefined, config.options.autoprefixer.browsers));

  return stream
    .pipe(production_stream(stream, minify_css(), true))
    .pipe(gulp.dest(build_dir))
    .pipe(refresh(lr_server));
});

gulp.task('js', function() {

  var stream = gulp.src(config.path.source.js)
    .pipe(jshint())
    .pipe(jshint.reporter());

  return stream
    .pipe(production_stream(stream, minify_js(), true))
    .pipe(gulp.dest(build_dir))
    .pipe(refresh(lr_server));
});

gulp.task('lr_server', function() {
  lr_server.listen(lr_port, function(err) {
    if (err) return gutil.log(err);
  });
});

gulp.task('server', function() {
  connect()
    .use(connect_livereload({
      port: lr_port
    }))
    .use(connect.static(build_dir))
    .listen(lh_port);
});

gulp.task('open_browser', function() {
  return gulp.src(config.path.source.index)
    .pipe(open_browser('', {
      url: lh_url
    }));
});

gulp.task('default', function() {

  gulp.run('swig', 'html', 'css', 'js', 'lr_server', 'server');
  gulp.run('open_browser');

  var watch = config.path.watch;

  gulp.watch(watch.swig, function() {
    gulp.run('swig');
  });

  gulp.watch(watch.html, function() {
    gulp.run('html');
  });

  gulp.watch(watch.css, function() {
    gulp.run('css');
  });

  gulp.watch(watch.js, function() {
    gulp.run('js');
  });
});

// gulp.task('compass', function() {

//   var stream = gulp.src(source_scss)
//     .pipe(compass({
//       project: base,
//       css: build_dir,
//       sass: source_base
//     }))
//     .pipe(autoprefixer.apply(undefined, config.options.autoprefixer.browsers));

//   return stream
//     .pipe(production_stream(stream, minify_css(), true))
//     .pipe(gulp.dest(build_dir))
//     .pipe(refresh(lr_server));
// });


// gulp.watch(watch_css, function() {
//   gulp.run('css');
// });

// gulp.task('css', function() {

//   var test_rework_import = vinyl_map(function(contents, filename) {
//     return rework(contents.toString()).use(rework_importer({
//       path: source_base
//     })).toString();
//   });

//   return gulp.src(source_css)
//     .pipe(test_rework_import)
//     .pipe(myth())
//     .pipe(autoprefixer.apply(undefined, config.options.autoprefixer.browsers))
//     .pipe(size({
//       showFiles: true
//     }))
//     .pipe(gulpif(production, minify_css()))
//     .pipe(gulpif(production, size({
//       showFiles: true
//     })))
//     .pipe(gulp.dest(build_dir))
//     .pipe(refresh(lr_server));
// });