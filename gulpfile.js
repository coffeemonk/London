const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');

// gulp plugins and utils
var livereload = require('gulp-livereload');
var postcss = require('gulp-postcss');
var zip = require('gulp-zip');
var uglify = require('gulp-terser-js');
var beeper = require('beeper');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');

// postcss plugins
// var postcssPresetEnv = require('postcss-preset-env');
var autoprefixer = require('autoprefixer');
// var colorFunction = require('postcss-color-function');
var customProperties = require('postcss-custom-properties');
var easyimport = require('postcss-easy-import');
var nested = require('postcss-nested');

function serve(done) {
    livereload.listen();
    done();
}

const handleError = (done) => {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs', '!node_modules/**/*.hbs']),
        livereload()
    ], handleError(done));
}

function css(done) {
    processors = [
        easyimport(),
        nested(),
        customProperties({preserve: true}),
        autoprefixer()
        // colorFunction(),
    ]

    pump([
        src(['assets/css/*.css', 'assets/css/*.pcss'], {sourcemaps: true}),
        postcss(processors),
        rename({extname: '.css'}),
        cleanCSS(),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function js(done) {
    pump([
        src(['assets/js/*.js', 'assets/js/vendor/*.js'], {sourcemaps: true}),
        uglify(),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function zipper(done) {
    var targetDir = 'dist/';
    var themeName = require('./package.json').name;
    var filename = themeName + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**'
        ]),
        zip(filename),
        dest(targetDir)
    ], handleError(done));
}

const cssWatcher = () => watch('assets/css/**', css);
const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs', '!node_modules/**/*.hbs'], hbs);
const jsWatcher = () => watch(['assets/js/**'], js);
const watcher = parallel(cssWatcher, hbsWatcher, jsWatcher);
const build = series(css, js);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
