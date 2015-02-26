// Karma configuration
// Generated on Sun Jul 13 2014 09:06:13 GMT-0400 (EDT)

module.exports = function ( config ) {

	config.set( {

		// base path that will be used to resolve all patterns (eg. files, exclude)
		'basePath' : './',

        // frameworks to use
        // some available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		'frameworks' : [ 'mocha', 'chai', 'sinon', 'chai-sinon' ],

		// list of files / patterns to load in the browser
		'files' : [
			'./node_modules/ng-midway-test/src/ngMidwayTester.js',
			'./bower_components/angular/angular.js',
			'./bower_components/angular-mocks/angular-mocks.js',
			'./bower_components/angular-animate/angular-animate.js',
			'./bower_components/angular-route/angular-route.js',
			'./bower_components/angular-sanitize/angular-sanitize.js',
			'./bower_components/bootstrap/dist/js/bootstrap.js',
			'./bower_components/toastr/toastr.js',

			'./src/client/app/app.module.js',
			'./src/client/app/**/*.module.js',
			'./src/client/app/**/*.js',

			/* MOCHA */
			'./src/client/test/lib/specHelper.js',
			'./src/client/test/lib/mockData.js',

			'./src/client/test/basics/**/*.src.js',
			'./src/client/test/basics/**/*.spec.js',

			'./src/client/test/**/*.spec.js'
		]
	} );

};