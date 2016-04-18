var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var babel = require('gulp-babel');
var less = require('gulp-less');
var clean = require('gulp-clean');
var runSequence = require('run-sequence');
var through2 = require('through2');
var webpack = require('gulp-webpack');
var named = require('vinyl-named');
var uglify = require('gulp-uglify');
var highlight = require('highlight').Highlight;
var marked = require('marked');

var cwd = process.cwd(),
    package = require(path.join(cwd, 'package.json')),
    alias = {};
    alias[package.name] = path.join(cwd, package.src);
var paths = {
        script: [path.join(cwd, '/src/**/*.jsx'), path.join(cwd, '/src/**/*.js')],
        dest: path.join(cwd, '/build/'),
        css: [path.join(cwd, '/assets/index.less')],
        examples: path.join(cwd, '/examples/**/*.jsx'),
        examplesDest: path.join(cwd, '/build/examples/'),
        assets: path.join(__dirname, '../assets/**/*'),
        assetsDest: path.join(cwd, '/build/examples/assets/')
    },
    webpackConfig = {
        resolve: {
            alias: alias
        },
        module: {
            loaders: [
                { test: /\.(es6|js|jsx)$/, loader: 'babel?stage=0' },
                { test: /\.less$/, loader: 'style!css!less' }
            ]
        },
        output: {
          filename: '[name].html'
        }
    };

gulp.task('clean', function() {
    deleteFolderRecursive(paths.dest);
    function deleteFolderRecursive(path) {
        if (fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                  deleteFolderRecursive(curPath);
                } else { // delete file
                  fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
})

gulp.task('prepare-js', function() {
    gulp.src(paths.script)
        .pipe(babel({stage:0}))
        .pipe(gulp.dest(paths.dest));
})

gulp.task('prepare-css', function () {
    gulp.src(paths.css)
        .pipe(less())
        .pipe(gulp.dest(paths.dest));
});

gulp.task('prepare-examples', function() {
    var template = _.template(fs.readFileSync(path.join(__dirname, 'example.html')));
    gulp.src(paths.examples)
        .pipe(named())
        .pipe(webpack(webpackConfig))
        .pipe(uglify())
        .pipe(through2.obj(function (file, enc, cb) {

            var filePath = path.join(cwd, 'examples', path.basename(file.path, '.html') + '.jsx');
            var readmeFileName = path.join(cwd, 'examples', path.basename(file.path, '.html') + '.md');
            var readme = fs.existsSync(readmeFileName) ? fs.readFileSync(readmeFileName, 'utf8') : '';

            file.contents = new Buffer(template({
                code: highlight(fs.readFileSync(filePath, 'utf8')),
                readme: marked(readme),
                script: file.contents.toString(),
                name: path.basename(file.path, '.html'),
                title: package.name + ' @' + package.version + ' ' + path.basename(file.path, '.html')
            }));
            this.push(file);
            cb();
        }))
        .pipe(gulp.dest(paths.examplesDest));
    gulp.src(paths.assets)
        .pipe(gulp.dest(paths.assetsDest));
});

runSequence(['clean', 'prepare-js', 'prepare-css', 'prepare-examples']);
