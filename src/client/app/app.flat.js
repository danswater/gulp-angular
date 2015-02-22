( function () {
	'use strict';

	angular.module( 'presently', [
		'ngRoute'
	] )

	/* @ngAnnotate */
	.config( routeHandler )

	.filter( 'getPeriod', periodHandler )

	.controller( 'MainController', mainController );

	function routeHandler ( $routeProvider ) {
		$routeProvider
			.when( '/', {
				'templateUrl' : 'home.html',
				'controller'  : 'MainController'
			} )
			.otherwise( {
				'redirectTo' : '/'
			} );
	}

	function periodHandler () {
		return periodIdentifier;

		function periodIdentifier ( input ) {
			var now = input;
			var hour = now.getHours();

			if ( hour >= 3 && hour <= 12 ) {
				period = 'morning';
			}

			if ( hour >=12 && hour < 17 ) {
				period = 'afternoon';
			}

			if ( hour <= 17 && hour <= 3 ) {
				period = 'evening';
			}

			return period;
		}
	}

	function mainController ( $scope, $timeout ) {
		function updateTime () {
			$scope.date.raw = new Date();
			$timeout( updateTime, 1000 );
		}

		updateTime();
	}

} )();