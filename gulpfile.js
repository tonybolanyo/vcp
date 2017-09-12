var browserSync = require("browser-sync").create();
var gulp = require("gulp");
var gutil = require('gulp-util');
var notify = require("gulp-notify");
var size = require('gulp-size');
var sourcemaps = require("gulp-sourcemaps");

// For JSON Server
var jsonServer = require("gulp-json-srv");
var server = jsonServer.create({
    port: 3003,
    baseUrl: "/api",
    static: './dist'
});

// for html
var htmlmin = require("gulp-htmlmin");
var twig = require("gulp-twig");

// for css
var autoprefixer = require("autoprefixer");
var cssnano = require("cssnano");
var postcss = require("gulp-postcss");
var purifycss = require("gulp-purifycss");
var sass = require("gulp-sass");
var stylelint = require('stylelint');

// for JavaScript
var browserify = require("browserify");
var buffer = require("gulp-buffer");
var tap = require("gulp-tap");
var uglify = require("gulp-uglify");

// for images
var imagemin = require("gulp-imagemin");


// default task for development
gulp.task("default", ["build", "server"], function () {
    // launch develop local server
    browserSync.init({
        proxy: "http://127.0.0.1:3003/"
    });

    // watch html files to reload browser
    gulp.watch(["src/*.html", "src/**/*.html"], ["html"]);

    // watch styles folder to compile sass files
    gulp.watch(["src/styles/*.scss", "src/styles/**/*.scss"], ["sass"]);

    // watch js folder to compile JavaScript files
    gulp.watch(["src/js/*.js", "src/js/**/*.js"], ["js"]);
});

gulp.task("build", ["images", "videos", "html", "sass", "js"]);

gulp.task("server", function () {
    return gulp.src("db.json")
        .pipe(server.pipe());
})

// compile html files
gulp.task("html", function () {
    gulp.src("src/*.html")
        // process template
        .pipe(twig())
        // minimize html files
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        // copy to dist folder
        .pipe(gulp.dest("dist"))
        /// and reload browsers
        .pipe(browserSync.stream());
});

// compile css styles from sass files
gulp.task("sass", ["sass:lint"], function () {
    gulp.src("src/styles/*.scss")
        // capture sourcemaps
        .pipe(sourcemaps.init())
        // compile sass
        .pipe(sass().on("error", sass.logError))
        .pipe(size({
            showFiles: true
        }))
        .pipe(size({
            gzip: true,
            showFiles: true
        }))
        .pipe(purifycss(["src/js/*.js", "src/js/**/*.js", "src/*.html", "src/components/*.html", "src/layouts/*.html", "src/includes/*.html"]))
        .pipe(postcss([
            // add prefixes to old browsers compatibility
            autoprefixer(),
            // compress compiled css
            cssnano()
        ]))
        .pipe(size({
            showFiles: true
        }))
        .pipe(size({
            gzip: true,
            showFiles: true
        }))
        // save sourcemaps in css folder
        .pipe(sourcemaps.write("./"))
        // copy to dist folder
        .pipe(gulp.dest("dist/css/"))
        // and reload browsers
        .pipe(browserSync.stream());
});

// lint scss styles
gulp.task("sass:lint", function () {
    gulp.src(["src/styles/*.scss", "src/styles/**/*.scss"])
        .pipe(postcss([
            // lint style files
            stylelint()
        ]))
});

// compile and generate inly one js file
gulp.task("js", function () {
    gulp.src("src/js/main.js")
        // tap allows to apply a function to every file
        .pipe(tap(function (file) {
            // replace content file with browserify result
            file.contents = browserify(file.path, {
                    debug: true
                }) // new browserify instance
                .transform("babelify", {
                    presets: ["es2015"]
                }) // ES6 -> ES5
                .bundle() // compile
                .on("error", (error) => notify().write(error)) // treat errors
        }))
        // back file to gulp buffer to apply next pipe
        .pipe(buffer())
        .on("finish", () => gutil.log('Original size:'))
        .pipe(size({
            showFiles: true
        }))
        .pipe(size({
            gzip: true,
            showFiles: true
        }))
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        // minimize and ofuscate JavaScript file
        .pipe(uglify())
        .on("finish", () => gutil.log('Size after uglify:'))
        .pipe(size({
            showFiles: true
        }))
        .pipe(size({
            gzip: true,
            showFiles: true
        }))
        // write sourcemap o same directory
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest("dist/js/"))
        // and reload browsers
        .pipe(browserSync.stream())
});

// images
gulp.task("images", function() {
    gulp.src(["src/images/*", "src/images/**/*", "!src/images/*.svg"])
        .pipe(imagemin())
        .pipe(gulp.dest("dist/img/"));
    gulp.src(["src/images/*.svg"])
        .pipe(imagemin())
        .pipe(gulp.dest("dist/img/"));
});

// videos
gulp.task("videos", function() {
    gulp.src(["src/videos/*", "src/videos/**/*"])
        .pipe(gulp.dest("dist/videos/"));
})