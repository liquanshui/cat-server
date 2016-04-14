var path = require('path');
var webpack = require('gulp-webpack');
var named = require('vinyl-named');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var LiveReloadPlugin = require('webpack-livereload-plugin');

var cwd = process.cwd(),
    package = require(path.join(cwd, 'package.json')),
    alias = {};
    alias[package.name] = path.join(cwd, package.src);
var paths = {
      script: [path.join(cwd, '/examples/**/*.jsx'), path.join(cwd, '/examples/**/*.js')],
      scriptDest: path.resolve(__dirname, '../build/')
    };

var webpackConfig = {
        watch: true,
        module: {
            loaders: [
                { test: /\.(es6|js|jsx)$/, loader: 'babel?stage=0' },
                { test: /\.less$/, loader: 'style!css!less' }
            ]
        },
        output: {
            filename: '[name].js'
        },
        resolve: {
            alias: alias,
            extensions: ['', '.js', '.jsx'],
        },
        devtool: 'source-map',
        plugins:[new LiveReloadPlugin()]
    };

gulp.task('webpack', function() {
  gulp.src(paths.script)
    .pipe(named())
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(paths.scriptDest));
});

runSequence(['webpack']);
