(function () {
'use strict';

angular
  .module('prizinator', [
    'prizinator.config',
    'prizinator.data',
    'ngAnimate',
    'ui.router',
    'ui.bootstrap'
  ])
  .config(router)
  .run(run);

/*
 * Without server side:
 * MeetUp Key: https://secure.meetup.com/meetup_api/key/
 * Signed Requests: http://www.meetup.com/meetup_api/auth/#keysign
 */

angular
  .module('prizinator.config', [])
  .constant('config', {
    'KEY': '',
    'SIG_URL': 'https://api.meetup.com/2/rsvps?offset=0&format=json&rsvp=yes&event_id=220113222&callback=angular.callbacks._0&page=200&fields=&order=event&desc=false&sig_id=183934967&sig=a6b04789296097cfe1afacdb314d2c772b8c8167'
  });

function router($stateProvider, $locationProvider) {
  $locationProvider.html5Mode({
    enabled: true
  });

  $stateProvider
    .state('settingsState', {
      templateUrl: 'components/settings.html'
    }).state('selectorState', {
      templateUrl: 'components/selector.html'
    });
}

function run($state) {
  $state.transitionTo('settingsState');
}

})();
