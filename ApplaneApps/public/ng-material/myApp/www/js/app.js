// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var taskapp = (taskapp === undefined) ? angular.module('starter', ['ionic', 'starter.controllers', 'ngMaterial', 'ngMessages']) : taskapp;

angular.module('pllogin', ['ionic', 'starter.controllers'])

    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

taskapp.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
})


taskapp.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
})

taskapp.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

        .state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/starter.html",
            controller: 'AppCtrl'
        })
        .state('app.workbench', {
            url: "/workbench",
            views: {
                'menuContent': {
                    templateUrl: "templates/workbench.html",
                    controller: 'WorkbenchCtrl'
                }
            }
        })
        .state('app.view', {
            url: "/view",
            views: {
                'menuContent': {
                    templateUrl: "templates/view.html",
                    controller: 'ViewCtrl'
                }
            }
        })
        .state('app.menus', {
            url:"/menus/:id",
            views:{
                'menuContent':{
                    templateUrl:'templates/menus.html'
                }
            }
        });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/workbench');
});