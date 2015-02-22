/* jshint camelcase:false */
var gulp = require( 'gulp' );
var plug = require( 'gulp-load-plugins' )();

var paths = require( './gulp.config.json' );

var log = plug.util.log;

/**
 * List the available gulp tasks
 */
gulp.task( 'help', plug.taskListing );

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
 * Minify and bundle the application
 * @return Stream
 */
gulp.task( 'js', function () {

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
 * Inject all the files into the new index.html
 * rev, but no map
 * @return {Stream}
 */
gulp.task( 'rev-and-inject', [ 'js', 'vendorjs' ], function () {

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
		.pipe(indexFilter) // filter to index.html
		.pipe( inject( 'content/vendor.min.css', 'inject-vendor' ) )
		.pipe( inject( 'content/all.min.css' ) )
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