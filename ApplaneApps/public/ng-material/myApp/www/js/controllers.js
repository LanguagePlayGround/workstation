var pl = (pl === undefined) ? angular.module('starter.controllers', ['ngMaterial', 'ngMessages']) : pl;


pl.config(function ($compileProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
});

pl.controller('loginCtrl', function ($scope, $compile, $timeout, $http) {
    // To avoid old token usage from localstorage
    ApplaneDB.$http = $http;
    if (localStorage && localStorage.userdb) {
        delete localStorage.userdb;
    }
    $scope.username = "";
    $scope.password = "";
    $scope.database = "";
    $scope.errorMessage = "";
    $scope.busyMessageOptions = {};

    var cURL = window.location;
    if (cURL) {
        cURL = cURL.toString();
        var httpString = "http://";
        cURL = cURL.toString().substring(httpString.length);
        var indexOfDot = cURL.indexOf(".");
        if (indexOfDot > 0) {
            var firstPart = cURL.substring(0, indexOfDot);
            if (cURL.indexOf("beta.mcgm.applane.com") >= 0) {
                firstPart = "mcgm";
            }
            if (firstPart === "mcgm") {
                $scope.showCustomLink = true;
            }
            if (firstPart === "127" || firstPart == 'business' || firstPart == 'daffodilsw' || firstPart == 'beta' || firstPart === "beta1" || firstPart === "beta2" || firstPart === "beta3" || firstPart === "beta4" || firstPart === "beta5") {
                $scope.enableGoogleOauth = true;
            }
            if (cURL.indexOf(".beta.") >= 0) {
                $scope.showDB = true;
            } else if ((firstPart === "127" || firstPart === "192" || firstPart === "106") || firstPart === "porting" || firstPart === "beta" || firstPart === "beta1" || firstPart === "beta2" || firstPart === "beta3" || firstPart === "beta4" || firstPart === "beta5") {
                $scope.showDB = true;
            } else if (firstPart === "sandbox") {
                cURL = cURL.substring(indexOfDot + 1);
                indexOfDot = cURL.indexOf(".");
                var secondpart = cURL.substring(0, indexOfDot);
                $scope.database = secondpart + "_sb";
            } else {
                $scope.database = firstPart;
            }
        }
    }

    function submitFormToRememberUsernameAndDatabase(username, dbName) {//worked for remembering username and database in the browser
        ensureIframe();
        ensureForm(username, dbName);
        submitIframe();
    }

    function submitIframe() {//worked for remembering username and database in the browser
        try {
            var iFrameWindow = document.getElementById("myframe").contentWindow;
            iFrameWindow.document.body.appendChild(document.getElementById("newForm").cloneNode(true));
            var frameForm = iFrameWindow.document.getElementById("newForm");
            frameForm.onsubmit = null;
            frameForm.submit();
            return false;
        } catch (e) {
            //ignore the error
        }
    }

    function ensureIframe() {//worked for remembering username and database in the browser
        try {
            var newFrameId = "myframe";
            if (!document.getElementById(newFrameId)) {
                var ifrm = document.createElement("IFRAME");
                ifrm.id = newFrameId;
                ifrm.width = 0;
                ifrm.height = 0;
                document.body.appendChild(ifrm);
            }
        } catch (e) {
            //ignore the error
        }
    }

    function ensureForm(username, dbName) {//worked for remembering username and database in the browser
        try {
            var formId = "newForm";
            if (!document.getElementById(formId)) {
                var newForm = document.createElement("form");
                newForm.id = formId;
                newForm.method = 'POST';
                newForm.style.display = "none";
                var usernameInput = document.createElement('INPUT');
                usernameInput.type = 'TEXT';
                usernameInput.name = 'applane_user';
                usernameInput.value = username;
                newForm.appendChild(usernameInput);

                var dbInput = document.createElement('INPUT');
                dbInput.type = 'TEXT';
                dbInput.name = 'applane_database';
                dbInput.value = dbName;
                newForm.appendChild(dbInput);
                document.body.appendChild(newForm);
            }
        } catch (e) {
            //ignore the error
        }
    }

    $scope.login = function () {

        var userName = $scope.username;
        var password = $scope.password;
        var database = $scope.database;
        delete $scope.userBlank;
        delete $scope.passBlank;
        delete $scope.dbBlank;
        if (userName == null || userName.trim().length == 0) {
            $scope.errorMessage = 'Enter your Username';
            return false;
        }
        if (password == null || password.trim().length == 0) {
            $scope.errorMessage = 'Enter your Password';
            return false;
        }
//        if (database == null || database.trim().length == 0) {
//            $scope.dbBlank = 'Enter your Database';
//            return false;
//        }


        submitFormToRememberUsernameAndDatabase(userName, database);//worked for remembering username and database in the browser

        $scope.processingImage = true;
        ApplaneDB.connect("", database, {username: userName, password: password, cachekey: "userdb"}).then(
            function (db) {

                delete $scope.processingImage;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }

                if (!db) {
                    alert("db could not be created");
                    return;
                }
                if (!db.token) {
                    alert("user could not be connected");
                    return;
                }
                localStorage.token = db.token;
                window.location.href = "/ng-material/myApp/www/index.html";


            }).fail(function (err) {
                $scope.errorMessage = err.message;
                $scope.processingImage = false;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            })


    }


});

pl.controller('AppCtrl', function ($scope, $ionicSideMenuDelegate, $location) {
    $scope.workbenchOptions = {};
    $scope.workbenchOptions.menuCounter = 0;
    $scope.showMenuList = function (application) {
        if (!application) {
            return;
        }
        $scope.workbenchOptions.menuCounter ++;
        if (application.menus && application.menus.length > 0) {
            $scope.workbenchOptions.menus = application.menus;
            $location.path('app/menus/id='+$scope.workbenchOptions.menuCounter);
        } else if(application.qviews && application.qviews.length> 0){
            $scope.workbenchOptions.nestedMenus = application.menus;
            $location.path('/app/nestedMenus');
        }


        if($ionicSideMenuDelegate.isOpenLeft()){
            $ionicSideMenuDelegate.toggleLeft();

        }
    };

    $scope.showNestedMenuList = function(menu){
        if(!menu){
            return;
        }
        if(menu.menus && menu.menus.length > 0){
            $scope.workbenchOptions.nestedMenus = menu.menus;
            $location.path('/app/nestedMenus');
        } else if(menu.qviews && menu.qviews.length> 0){
            $scope.workbenchOptions.nestedMenus = menu.menus;
            $location.path('/app/nestedMenus');
        }
    }
});

pl.controller('WorkbenchCtrl', function ($scope, $compile, $timeout, $parse, $q, $location, $http, $ionicSideMenuDelegate) {
    ApplaneDB.$http = $http;


    function getUserDB() {

        var userDb = ApplaneDB.connection("userdb");
        if (userDb) {
            var D = Q.defer();
            D.resolve(userDb);
            return D.promise;
        } else {
            var D = Q.defer();
            D.resolve();
            return D.promise;
        }
    }

    $scope.getUserState = function (userState) {
        var userDb = undefined;

        // this method will connect any user with daffodilsw in case of roadmap  --Rajit


        return getUserDB().then(
            function (userDb) {
                if (userDb) {
                    return userDb.invokeFunction("getUserState", [
                        userState
                    ])
                }
            }).then(
            function (userInfo) {
                if (!userInfo) {
                    // To avoid old token usage from localstorage
                    if (localStorage && localStorage.userdb) {
                        delete localStorage.userdb;
                    }
                    window.location.href = "/login";
                    return;
                }
                userInfo = userInfo.response;
                $scope.workbenchOptions.user = userInfo.user;

                if (userInfo.applications && userInfo.applications.length > 0) {
                    for (var i = userInfo.applications.length - 1; i >= 0; i--) {
                        userInfo.applications[i].isApplication = true;  //same directive is used for application and menu, so for identification of application on selection
                        //show application, only if menus available in it, require for darcl case.-- Rajit garg
                        if (!userInfo.applications[i].menus || userInfo.applications[i].menus.length == 0) {
                            userInfo.applications.splice(i, 1)
                        }
                    }
                    $scope.workbenchOptions.applications = userInfo.applications;
//                    $scope.setCurrentApplication(userInfo.selectedApplication, userInfo.selectedMenu);


                }

//                populateWhenInMenus($scope.workbenchOptions.applications);
                var views = userInfo.views;
                $scope.workbenchOptions.views = [];

                var selectedMenuIndex = userInfo.selectedMenu;
                $scope.workbenchOptions.defaultSelectedMenu = userInfo.selectedMenu;
                $scope.workbenchOptions.selectedQView = userInfo.selectedQView;
                var qViews = userInfo.qviews;
                if (qViews && qViews.length > 0) {
                    for (var i = 0; i < qViews.length; i++) {
                        qViews[i].manageHistory = true;
                    }
                }

                if (views && views.length > 0) {
                    for (var i = 0; i < views.length; i++) {
                        if (qViews && views[i].viewOptions) {
                            views[i].viewOptions.qviews = qViews;
                            views[i].viewOptions.manageHistory = true;
                        }
//                        $scope.openV(views[i]);
                    }
                    $scope.workbenchOptions.views = views;
                }
//                $scope.workbenchOptions.selectedMenuInfo = [];
//                $scope.populateMenus($scope.workbenchOptions.applications, $scope.workbenchOptions.selectedMenuInfo, 0, userInfo.selectedMenu);
//                $scope.$watch("workbenchOptions.processGroup.processInitiated", function (newValue, oldValue) {
//                    $scope.getProcesses();
//                })
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        ).fail(function (err) {
                // To avoid old token usage from localstorage
                if (localStorage && localStorage.userdb) {
                    delete localStorage.userdb;
                }
                // deleting all cookies before redirecting to login page otherwise, recursion occurs because current session token already exist      -- Rajit garg 06/04/2015
                window.location.href = "/login.html?errorMessage=" + err.message;
            });
    }
    $scope.getUserState({});
});


pl.controller('ViewCtrl', function ($scope) {
});
pl.controller('menuCtrl', function ($scope) {

});