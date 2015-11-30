/*************************************Controller********************************************************************/

var app = angular.module('applane', [], function () {
    /*$locationProvider.html5Mode(true);*/
});


app.controller('LoginCtrl', function ($scope, $compile, $timeout) {
    // To avoid old token usage from localstorage
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
            if (firstPart === "127" || firstPart == 'business' || firstPart == 'daffodilsw' || firstPart == 'beta' || firstPart === "beta1" || firstPart === "beta2" || firstPart === "beta3" || firstPart === "beta4" || firstPart === "beta5" || firstPart === "45") {
                $scope.enableGoogleOauth = true;
            }
            if (cURL.indexOf(".beta.") >= 0) {
                $scope.showDB = true;
            } else if (firstPart === "porting" || firstPart === "beta" || firstPart === "beta1" || firstPart === "beta2" || firstPart === "beta3" || firstPart === "beta4" || firstPart === "beta5") {
                $scope.showDB = true;
            } else if (new RegExp("^\[0-9]*$").test(firstPart)) {
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
        ApplaneDB.connect("", database, {username:userName, password:password, cachekey:"userdb"}).then(
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
                window.location.href = "/";


            }).fail(function (err) {
                $scope.errorMessage = err.message;
                $scope.processingImage = false;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            })


    }


});
