(function module() {
'use strict';

angular
  .module('prizinator')
  .controller('selectorCtrl', selectorCtrl)
  .directive('piMain', mainDir)
  .directive('piList', listDir)
  .directive('piHide', hideDir)
  .directive('piEnter', enterDir);

function selectorCtrl($scope, $rootScope, eventData) {
  $scope.prizes = eventData.getPrizes();
  $scope.nameSearch = false;
  $scope.winners = [];

  function createSearchList(members) {
    var result = [];
    for (var i = 0, len = members.length; i < len; i++) {
      result.push({
        'name': members[i].member.name,
        'ref': members[i]
        }
      );
    }
    return result;
  }

  var members = [];
  eventData.getMembers()
    .then(function (data) {
      members = data;
      $scope.selected = data.selected;
      $scope.names = createSearchList(members.all);
    }
  );

  $scope.setSelectedPrize = function (active) {
    $scope.selectedPrize = active;
    eventData.setSelectedPrize(active);
  }

  /** Switch to an available prize. */
  function switchPrize(prize, prizes) {
    if (prizes.indexOf(prize) === -1) prize = prizes[0];
    if (prize.used >= prize.quantity) {
      for (var i = 0, len = prizes.length; i < len; i++) {
        prize = prizes[i];
        if (prize.used < prize.quantity) {
          break;
        }
      }
    }
    return prize;
  }

  function init() {
    var prize = switchPrize($scope.selectedPrize, $scope.prizes);
    if (prize.quantity === prize.used) {
      $scope.selectedMember = undefined;
    } else {
      $scope.selectedMember = eventData.getSelectedMember();
    }
    $scope.setSelectedPrize(prize);
  }

  init();

  $scope.prizesRemaining = function () {
    var prizes = $scope.prizes;
    for (var i = 0, len = prizes.length; i < len; i++) {
      if (prizes[i].used < prizes[i].quantity) {
        return true;
      }
    }
    return false;
  }

  function addMember(member) {
    var prize = $scope.selectedPrize = eventData.getSelectedPrize();

    if (member) {
      prize.used++;
      member.prize = prize;
      $scope.selected.push(angular.extend({}, member));
      $rootScope.$broadcast('memberAdded');
    }

    prize = switchPrize(prize, $scope.prizes);
    eventData.setSelectedPrize(prize);
    $scope.selectedPrize = prize;
  }

  $scope.selectRandom = function () {
    /* Don't add the member to the list until another member is picked. */
    addMember($scope.selectedMember);

    if (!$scope.prizesRemaining()) {
      $scope.selectedMember = undefined;
      eventData.setSelectedMember(undefined);
      return;
    }

    /* Prizes left but no more members left. */
    if (members.filtered.length === 0) {
      angular.extend(members.filtered, members.all);
    }

    var len = members.filtered.length;
    var random = Math.floor(Math.random() * len);

    $scope.selectedMember = members.filtered[random];
    members.filtered.splice(random, 1);
    eventData.setSelectedMember($scope.selectedMember);

    $scope.nameSearch = false;
  };

  $scope.removeFromSelected = function (member) {
    var index = $scope.selected.indexOf(member);
    $scope.selected[index].prize.used--;
    $scope.selected.splice(index, 1);
  };

  $scope.removeMember = function () {
    $scope.selectedMember = undefined;
    eventData.setSelectedMember(undefined);
  };

  $scope.addToSelected = function () {
    addMember($scope.selectedMember);
    var a = members.filtered;
    a.splice(a.indexOf($scope.selectedMember, 1));
    $scope.removeMember();
  }

  $scope.setActivePrize = function (prize) {
    if (prize.quantity >= prize.used) {
      prize = switchPrize(prize, $scope.prizes);
    }
    $scope.selectedPrize = prize;
    eventData.setSelectedPrize(prize);
  };

  $scope.searchNames = function (event) {
    if (event) {
      event.stopPropagation();
    }

    if (!event || event.type !== 'click') {
      $scope.selectedMember = this.nameSelected.ref;
      eventData.setSelectedMember($scope.selectedMember);
      $scope.nameSearch = false;
    } else if (event.target.tagName == 'INPUT') {
     $scope.nameSearch = true;
   } else if ($scope.prizesRemaining()) {
      $scope.addToSelected($scope.selectedMember);
      if ($scope.prizesRemaining()) {
        $scope.selectedMember = undefined;
        $scope.nameSearch = true;

        /* Focus INPUT once angular makes it visible. */
        var elem = event.currentTarget;
        setTimeout(function () {
          elem.children[0].focus();
        });
      }
    }
  };
}

function mainDir($interval, $document, $rootScope) {
  return function (scope, elem, attr) {
    $rootScope.$on('$stateChangeStart', function () {
      $document.unbind('keypress', keyActions);
    });

    function keyActions(e) {
      if (e.which === 13) { /* [enter] */
        scope.addToSelected();
        scope.$digest();
      } else if (e.which === 127) { /* [del] */
        scope.removeMember();
        scope.$digest();
      } else if (e.which === 32) { /* [space] */
        scope.selectRandom();
        scope.$digest();
      }
    }

    $document.bind('keypress', keyActions);

    function disableNameSearch(event) {
      scope.nameSearch = false;
      scope.$digest();
    }

    elem.bind('click', disableNameSearch);
  };
}

function listDir() {
  return function(scope, elem, attr) {
    scope.$on('memberAdded', function () {
      elem[0].scrollTop = elem[0].scrollHeight;
    });
  };
}

function hideDir($interval, $document, $rootScope) {
  return function (scope, elem, attr) {
    var interval;
    var paused = false;

    elem[0].classList.add('transition');

    $rootScope.$on('$stateChangeStart', function () {
      paused = false;
    });

    $document.unbind('mousemove', hide);
    $document.bind('mousemove', hide);

    function hide(e) {
      if (!paused) {
        $interval.cancel(interval);
        elem[0].classList.remove('hidden');
        interval = $interval(function () {
          elem[0].classList.add('hidden');
        }, 5000);
      }
    }

    function pause() {
      paused = true;
      elem[0].classList.remove('hidden');
      $interval.cancel(interval);
    }

    function unpause() {
      paused = false;
    }

    elem.bind('mouseenter', pause);
    elem.bind('mouseover', pause);
    elem.bind('mouseleave', unpause);
    hide();
  };
}

function enterDir() {
  return function (scope, elem, attr) {
    elem.bind('keydown keypress', function (event) {
      if(event.which === 13) {
        scope.$apply(function () {
          scope.$eval(attr.piEnter);
        });

        event.preventDefault();
      }
    });
  };
}

})();
