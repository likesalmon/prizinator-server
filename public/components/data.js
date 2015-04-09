(function (angular) {
'use strict';

angular.module('prizinator.data', ['prizinator.config'])
  .factory('meetup', meetup)
  .factory('eventData', eventData);

function meetup($http, $document, $window) {
  var ls = window.localStorage;
  var redirectUri = window.location.href;
  var clientId;
  var scopes = [];
  var popup;

  var service = {
    setClient: setClient,
    login: login,
    logout: logout,
    getRsvps: getRsvps
  }

  return service;

  function jsonp(uri, params) {
    params = params || {};
    params.callback = 'JSON_CALLBACK';
    return $http.jsonp('https://api.meetup.com/' + uri, {params: params});
  }

  /** Get using available method of authentication. */
  function getRsvps(params) {
    if (params.clientId) {
      oauth(params);
    } else if (params.key && params.key.length > 0) {
      return jsonp('2/rsvps', params);
    }
  }

  angular.element($window).bind('message', function (event) {
    if (event.source == popup && event.origin == window.location.origin) {
      $rootScope.$apply(function() {
        if (event.data.access_token) {
          deferred.resolve(event.data)
        } else {
          deferred.reject(event.data)
        }
      })
    }
  });

  function openWindow(authUrl) {
    var height = 420;
    var width = 600;
    var top = (screen.height - height) / 2;
    var left = (screen.width - width) / 2;

    popup = window.open(authUrl, 'MeetUp',
        'height=' + height + ',' +
        'width=' + width + ',' +
        'top=' + top + ',' +
        'left=' + left + ',' +
        'scrollbars=false,resizable=false'
    );
  }

  function storeOnAuth(token) {
    ls.put('mu_token', token);
  }

  function requestAuthorization() {
    var authUrl =
        'https://secure.meetup.com/oauth2/authorize/' +
        '?response_type=token' +
        '&client_id=' + clientId +
        '&scope=' + scopes.join(',') +
        '&redirect_uri=' + redirectUri;

    openWindow(authUrl);
  }

  function setClient(p) {

    /* Page loaded within popup. */
    if (window.opener) {
      localStorage.data = window.location;
      window.close();
    } else {
            
      angular.element($window).bind('storage', function () {

        console.log(localStorage.data);
      });
    }

    if (p.clientId) clientId = p.clientId;
    if (p.scopes) scopes = p.scopes;
    if (p.redirectUri) redirectUri = p.redirectUri;
  }

  function logout() {
    window.localStorage.removeItem('mu_auth');
    window.localStorage.removeItem('mu_data');
  }

  function login() {
    requestAuthorization();
  }
}

function eventData(meetup, config) {
  var eventId;
  var members;
  var selectedMember;
  var prizes = [];
  var selectedPrize = prizes[0];

  var service = {
    getMembers: getMembers,
    setPrizes: setPrizes,
    getPrizes: getPrizes,
    setEventId: setEventId,
    getEventId: getEventId,
    setSelectedMember: setSelectedMember,
    getSelectedMember: getSelectedMember,
    setSelectedPrize: setSelectedPrize,
    getSelectedPrize: getSelectedPrize
  };

  return service;

  function getMembers() {
    if (!members) {
      members = meetup.getRsvps({
        'sign': true,
        'event_id': eventId,
        'rsvp': 'yes',
        'key': config.KEY,
      }).then(
        function (res) {
          console.info(res.data.meta);

          if (res.data.results && res.data.results.length > 0) {
            return {
              all: res.data.results,
              filtered: angular.extend([], res.data.results),
              selected: []
            };
          } else if (res.data.status) {
            return res.data;
          } else {
            members = undefined;
          }
        }, function (res) {
          return res;
        }
      );
    }
    return members;
  }

  function setPrizes(data) {
    prizes = data;

    /* Filter out incomplete entries. */
    for (var i = 0, len = prizes.length; i < len; i++) {
      var isNum = typeof prizes[i].quantity === 'number';
      var isFilled = prizes[i].name && prizes[i].name.trim().length > 0;
      if (!(isFilled && isNum)) {
        prizes.splice(i, 1);
        len--, i--;
      }
    }
  }

  function getPrizes() {
    return prizes;
  }

  function setEventId(data) {
    eventId = data;
  }

  function getEventId(data) {
    return eventId;
  }

  function setSelectedMember(data) {
    selectedMember = data;
  }

  function getSelectedMember() {
    return selectedMember;
  }

  function setSelectedPrize(data) {
    selectedPrize = data;
  }

  function getSelectedPrize() {
    return selectedPrize;
  }
}

})(angular);
