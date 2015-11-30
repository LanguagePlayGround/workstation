var app = angular.module('mgcrea.ngStrapDocs', ['ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']);

app.controller('MainCtrl', function($scope) {
});

'use strict';

angular.module('mgcrea.ngStrapDocs')

    .config(function($modalProvider) {
        angular.extend($modalProvider.defaults, {
            html: true
        });
    })

    .controller('ModalDemoCtrl', function($scope) {
        $scope.modal = {title: 'Title', content: 'Hello Modal<br /><b>This is a multiline message!</b>'};
    });

