/* jshint camelcase:false */
var gulp        = require( 'gulp' );
var browserSync = require( 'browser-sync' );
var del         = require( 'del' );
var karma       = require( 'karma' ).server;
var plug        = require( 'gulp-load-plugins' )();

var paths = require( './gulp.config.json' );

var colors = plug.util.colors;
var log    = plug.util.log;
var env    = plug.util.env;

var port = process.env.PORT || 7203;

/**
 * List the available gulp tasks
 */
gulp.task( 'help', plug.taskListing );

/**
 * Create $templateCache from the html templates
 * @return {Stream}
 */
gulp.task( 'templateCache', function () {
    log( 'Creating an AngularJS $templateCache' );

    return gulp
        .src( paths.htmltemplates )
        .pipe( plug.bytediff.start() )
        .pipe( plug.minifyHtml( {
            'empty' : true
        } ) )
        .pipe( plug.bytediff.stop( bytediffFormatter ) )
        .pipe( plug.angularTemplatecache( 'template.js', {
            'module' : 'app.core',
            'standalone' : false,
            'root' : 'app/'
        } ) )
        .pipe( gulp.dest( paths.build ) );

} );

/**
 * Minify and bundle the application
 * @return Stream
 */
gulp.task( 'js', [ 'templateCache' ], function () {

	var source = [].concat( paths.js, paths.build + 'template.js' );

	return gulp
		.src( source )
		.pipe( plug.concat( 'all.min.js' ) )
		.pipe( plug.ngAnnotate( { // angular specific gulp process
			'add'           : true,
			'single_qoutes' : true
		} ) )
		.pipe( plug.bytediff.start() )
		.pipe( plug.uglify( {
			'mangle' : true
		} ) )
		.pipe( plug.bytediff.stop( bytediffFormatter ) )
		.pipe( gulp.dest( paths.build ) );

} );

/**
 * Minify and bundle the Vendor JS
 * @return {Stream}
 */
gulp.task( 'vendorjs', function () {

    return gulp
        .src( paths.vendorjs )
        .pipe( plug.concat( 'vendor.min.js' ) )
        .pipe( plug.bytediff.start() )
        .pipe( plug.uglify() )
        .pipe( plug.bytediff.stop( bytediffFormatter ) )
        .pipe( gulp.dest( paths.build ) );

} );

/**
 * Minify and bundle the CSS
 * @return {Stream}
 */
gulp.task( 'css', function () {
    log( 'Bundling, minifying and copying the app\'s CSS' );

    return gulp
        .src( paths.css )
        .pipe( plug.concat( 'all.min.css' ) )
        .pipe( plug.autoprefixer( 'last 2 version >', '5%' ) )
        .pipe( plug.bytediff.start() )
        .pipe( plug.minifyCss( {} ) )
        .pipe( plug.bytediff.stop( bytediffFormatter ) )
        .pipe( gulp.dest( paths.build + 'content' ) );

} );

/**
 * Minify and bundle the Vendor CSS
 * @return {Stream}
 */
gulp.task( 'vendorcss', function () {
    log( 'Compressing, bundling, copying vendor CSS' );

    var vendorFilter = plug.filter( [ '**/*.css' ] );

    return gulp
        .src( paths.vendorcss )
        .pipe( vendorFilter )
        .pipe( plug.concat( 'vendor.min.css' ) )
        .pipe( plug.bytediff.start() )
        .pipe( plug.minifyCss( {} ) )
        .pipe( plug.bytediff.stop( bytediffFormatter ) )
        .pipe( gulp.dest( paths.build + 'content' ) );

} );

/**
 * Inject all the files into the new index.html
 * rev, but no map
 * @return {Stream}
 */
gulp.task( 'rev-and-inject', [ 'js', 'vendorjs', 'css', 'vendorcss' ], function () {

	var minified    = paths.build + '**/*.min.*';
	var index       = paths.client + '/index.html';
	var minFilter   = plug.filter( [ '**/*.min.*', '!**/*.map' ] );
	var indexFilter = plug.filter( [ 'index.html' ] );

    var stream = gulp
        // Write the revisioned files
        .src( [].concat( minified, index ) ) // add all built min files and index.html
        .pipe( minFilter ) // filter the stream to minified css and js
        .pipe( plug.rev() ) // create files with rev's
        .pipe( gulp.dest( paths.build ) ) // write the rev files
        .pipe( minFilter.restore() ) // remove filter, back to original stream

		// inject the files into index.html
		.pipe( indexFilter ) // filter to index.html
		.pipe( inject( 'content/vendor.min.css', 'inject-vendor' ) ) // empty
		.pipe( inject( 'content/all.min.css' ) ) // empty
		.pipe( inject( 'vendor.min.js', 'inject-vendor' ) )
		.pipe( inject( 'all.min.js' ) )
		.pipe( gulp.dest( paths.build ) ) // write the rev files
		.pipe( indexFilter.restore() ) // remove filter, back to original stream

		// replace the files referenced in index.html with the rev'd files
		.pipe( plug.revReplace() ) // Substitute in new filenames
		.pipe( gulp.dest( paths.build ) ) // write the index.html file changes
		.pipe( plug.rev.manifest() ) // create the manifest (must happen last or we screw up the injection)
		.pipe( gulp.dest( paths.build ) ); // write the manifest

    function inject(path, name) {
        var pathGlob = paths.build + path;
        var options = {
            ignorePath: paths.build.substring(1),
            read: false
        };
        if (name) {
            options.name = name;
        }
        return plug.inject(gulp.src(pathGlob), options);
    }

} );

/**
 * Build the optimized app
 * @return {Stream}
 */
gulp.task( 'build', [ 'rev-and-inject' ], function () {
    log( 'Build the optimized app' );

    return gulp
        .src( '' )
        .pipe( plug.notify( {
            'onLast'  : true,
            'message' : 'App deployed'
        } ) );
} );

/**
 * Backwards compatible call to make stage and build equivalent
 */
gulp.task( 'stage', [ 'build' ], function () {} );

/**
 * Remove all files from the build folder
 * One way to run clean before all the tasks is to run
 * from the cmd line: gulp clean && gulp build
 * @return {Stream}
 */
gulp.task( 'clean', function ( cb ) {
    log( 'Cleaning:' + plug.util.colors.blue( paths.build ) );

    var delPaths = [].concat( paths.build, paths.report );
    del( delPaths, cb );
} );

/**
 * Watch files and build
 */
gulp.task( 'watch', function () {

    log( 'Watching all files' );

    var css    = [ 'gulpfile.js' ].concat( paths.css, paths.vendorcss );
    var images = [ 'gulpfile.js' ].concat( paths.images );
    var js     = [ 'gulpfile.js' ].concat( paths.js );

    gulp
        .watch( js, [ 'js', 'vendorjs' ] )
        .on( 'change', logWatch );
    gulp
        .watch( css, [ 'css', 'vendorCss' ] )
        .on( 'change', logWatch );
    gulp
        .watch( images, [ 'images' ] )
        .on( 'change', logWatch );

    function logWatch ( event ) {
        log( '*** File ' + event.path + ' was ' + event.type + ', running tasks...' );
    }

} );

/**
 * Run specs once and exit 
 * To start servers and run midway specs as well:
 *     gulp test --startServers
 *@return {Stream}
 */
gulp.task( 'test', function ( done ) {
    startTests( false /*singleRun*/, done );
} );

gulp.task( 'serve-dev', function () {
	serve( {
		'mode' : 'dev'
	} );
} );

/**
 * serve the build environment
 */
gulp.task( 'serve-build', function() {
    serve( {
        'mode' : 'build'
    } );
});

/**
 * Formatter for bytediff to display the size changes after processing
 * @param  {Object} data - byte data
 * @return {String}      Difference in bytes, formatted
 */
function bytediffFormatter( data ) {
    var difference = ( data.savings > 0 ) ? ' smaller.' : ' larger.';
    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' + (data.endSize / 1000).toFixed(2) + ' kB' +
        ' and is ' + formatPercent(1 - data.percent, 2) + '%' + difference;
}

/**
 * Format a number as a percentage
 * @param  {Number} num       Number to format as a percent
 * @param  {Number} precision Precision of the decimal
 * @return {String}           Formatted percentage
 */
function formatPercent(num, precision) {
    return (num * 100).toFixed(precision);
}

/**
 * Start the node server using nodemon.
 * Optionally start the node debugging.
 * @param  {Object} args - debugging arguments
 * @return {Stream}
 */
function serve( args ) {
    var options = {
        'script'    : paths.server + '/app.js',
        'delayTime' : 1,
        'env'       : {
            'NODE_ENV' : args.mode,
            'PORT'     : port
        },
        'watch' : [ paths.server ]
    };

    var exec;
    if ( args.debug ) {
        log( 'Running node-inspector. Browse to http://localhost:8080/debug?port=5858' );
        exec = require( 'child_process' ).exec;
        exec( 'node-inspector' );
        options.nodeArgs = [ args.debug + '=5858' ];
    }

    return plug.nodemon( options )
        .on( 'start', function() {
            startBrowserSync();
        } )
        //.on('change', tasks)
        .on( 'restart', function() {
            log( 'restarted!' );
            setTimeout(function () {
                browserSync.reload( { stream: false } );
            }, 1000 );
        } );
}

/**
 * Start BrowserSync
 */
function startBrowserSync() {
    if(!env.browserSync || browserSync.active) {
        return;
    }

    log('Starting BrowserSync on port ' + port);
    browserSync({
        proxy: 'localhost:' + port,
        port: 3000,
        files: [paths.client + '/**/*.*'],
        ghostMode: { // these are the defaults t,f,t,t
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 5000
    });
}

/**
 * Start the tests using karma.
 * @param {boolean} singleRun - True means run once and end(CI), or keep running (dev)
 * @param {Funciton} done - callback to fire when karma is done
 * @return {undefined}
 */
function startTests ( singleRun, done ) {
    var child;
    var fork = require( 'child_process' ).fork;
    var excludedFiles = [];

    if ( env.startServers ) {
        log( 'Starting servers' );
        var savedEnv = process.env;

        savedEnv.NODE_ENV = 'dev';
        savedEnv.PORT     = 8888;

        child = fork( 'src/server/app.js', childProcessCompleted );
    } else {
        excludedFiles.push( './src/client/test/midway/**/*.spec.js' );
    }

    karma.start( {
        'configFile' : __dirname + '/karma.conf.js',
        'exclude'    : excludedFiles,
        'singleRun'  : !!singleRun
    }, karmaCompleted );

    function childProcessCompleted ( error, stdout, stderr ) {
        log( 'stdout: ' + stdout );
        log( 'stderr: ' + stderr );
        if ( error !== null ) {
            log( 'exec error:' + error );
        }
    }

    function karmaCompleted () {
        if ( child ) {
            child.kill();
        }
        done();
    }

}