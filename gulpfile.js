/* jshint camelcase:false */
var gulp = require( 'gulp' );
var plug = require( 'gulp-load-plugins' )();

var paths = require( './gulp.config.json' );

var log = plug.util.log;

/**
 * List the available gulp tasks
 */
gulp.task( 'help', plug.taskListing );

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