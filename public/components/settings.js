(function () {
'use strict';

angular
  .module('prizinator')
  .controller('settingsCtrl', settingsCtrl)
  .factory('settingsState', state);

function state(config) {
  var disabled = config.KEY.length === 0;

  var service = {
    setDisabled: setDisabled,
    getDisabled: getDisabled
  };

  return service;

  function setDisabled(data) {
    disabled = data;
  }

  function getDisabled() {
    return disabled;
  }
}

function settingsCtrl($scope, $state, settingsState, meetup, config, eventData) {
  $scope.eventId = eventData.getEventId();
  $scope.prizes = eventData.getPrizes();
  $scope.disabled = settingsState.getDisabled();
  $scope.login = meetup.login;

  meetup.setClient({
    'clientId': config.CLIENT_ID,
  });

  /* Instead of a button, always add an extra field for adding new entries. */
  function init() {
    var prize = $scope.prizes[$scope.prizes.length - 1];
    if (!prize || prize.name.length > 0) {
      $scope.prizes.push({});
    }
  }

  init();

  $scope.removeEntry = function (prize) {
    var index = $scope.prizes.indexOf(prize);
    $scope.prizes.splice(index, 1);
  }

  $scope.isRemovable = function (prize) {
    var removable = !prize.used || prize.used === 0;
    var index = $scope.prizes.indexOf(prize);
    removable = removable && index < $scope.prizes.length - 1;
    return removable;
  }

  $scope.addEmptyEntry = function (prize) {
    if ($scope.prizes[$scope.prizes.length - 1] === prize) {
      $scope.prizes.push({});
    }
  };

  $scope.submit = function () {
    for (var i = 0, len = $scope.prizes.length; i < len; i++) {
      var prize = $scope.prizes[i];
      if (!prize.used) prize.used = 0;
      if (prize.used > prize.quantity) {
        prize.quantity = prize.used;
      }
    }

    eventData.setPrizes(angular.extend([], $scope.prizes));
    eventData.setEventId($scope.eventId);

    if (eventData.getPrizes().length > 0) {
      eventData.getMembers().then(
        function (data) {
          if (data && data.problem) {
            $scope.error = data.status + " — " + data.problem;
          } else if (data) {
            settingsState.setDisabled(true);
            $state.go('selectorState');
          } else {
            $scope.error = 'Error — Response is empty'
          }
        }
      );
    } else {
      $scope.error = 'Error — No prizes'
    }
  };
}

})();
