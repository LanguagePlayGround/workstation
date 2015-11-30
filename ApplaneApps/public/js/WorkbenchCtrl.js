/***** move to app-workbench.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

pl.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
        template:'',
        controller:'historyCtrl'
    }).otherwise({
            template:'',
            controller:'historyCtrl'
        });

//    $locationProvider.html5Mode(true);
    /*to remove hashbang form URL and get clean URL*/
}]);


pl.controller('historyCtrl', function ($scope, $location) {
    try {
        var pageId = $location.path();

        function getSlectedMenuIdByLabel(menus, uris, selectedMenu) {
            if (menus == undefined || uris == undefined || selectedMenu == undefined) {
                return;
            }
            var isFound = false;
            for (var i = 0; i < menus.length; i++) {
                var menu = menus[i];
                for (var j = 0; j < uris.length; j++) {
                    var label = uris[j];
                    if (menu.uri == label) {
                        uris.splice(j, 1);
                        if (menu.menus) {
                            getSlectedMenuIdByLabel(menu.menus, uris, selectedMenu);
                        } else if (menu.qviews && menu.qviews.length > 0) {
                            selectedMenu.menu = angular.copy(menu);
                            for (var k = 0; k < menu.qviews.length; k++) {
                                if (menu.qviews[k].uri == uris[uris.length - 1]) {
                                    selectedMenu.menu.selectedQView = menu.qviews[k].id;
                                    break;
                                }
                            }
                        }
                        isFound = true;
                    }
                }
                if (isFound) {
                    break;
                }
            }
        }

        if ($scope.workbenchOptions && $scope.workbenchOptions.applications) {
            if ($scope.workbenchOptions.currentView) {
                var currentView = $scope.workbenchOptions.currentView;
                $scope.workbenchOptions.currentView = undefined;
                $scope.openView(currentView);
            } else {
                var pageIdArray = pageId.split('/');
                pageIdArray.splice(0, 1);
                var selectedMenu = {};
                getSlectedMenuIdByLabel($scope.workbenchOptions.applications, pageIdArray, selectedMenu);
                if (selectedMenu.menu) {
                    selectedMenu.menu.manageHistory = false;
                    $scope.onApplicationMenuClick(selectedMenu.menu);
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                } else {
                    if ($scope.workbenchOptions.selectedMenuLabels && $scope.workbenchOptions.selectedMenuLabels.length > 0) {
                        var selecetedMenuLabel = '';
                        for (var i = 0; i < $scope.workbenchOptions.selectedMenuLabels.length; i++) {
                            selecetedMenuLabel = selecetedMenuLabel + '/' + $scope.workbenchOptions.selectedMenuLabels[i].label;
                        }
                        if (selecetedMenuLabel) {
                            $location.path(selecetedMenuLabel);
                        }
                    }
                }
            }
        }
    } catch (e) {
        $scope.workbenchOptions.warningOptions.error = e;
    }
});


pl.controller('WorkbenchCtrl', function ($scope, $compile, $timeout, $parse, $q, $cookies, $location) {

    $scope.leftZero = "0px";
    $scope.rightZero = "0px";
    $scope.leftChild = "65%";
    $scope.rightChild = "35%";
    $scope.leftInvisibleLeft = "-1px";
    $scope.leftInvisibleRight = "101%";
    $scope.rightInvisibleLeft = "101%";
    $scope.rightInvisibleRight = "-1px";
    $scope.menuWidth = 190;

    $scope.workbenchOptions = {
        onLogout:"logOut()"
    }

    $scope.getRequestParameters = function () {
        var urlParams;
        var match,
            pl = /\+/g, // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) {
                return decodeURIComponent(s.replace(pl, " "));
            },
            query = window.location.search.substring(1);
        urlParams = {};
        while (match = search.exec(query)) {
            urlParams[decode(match[1])] = decode(match[2]);
        }
        return urlParams;
    }

    if ($scope.workbenchOptions.busyMessageOptions) {
        $scope.workbenchOptions.busyMessageOptions.msg = "Sign Out...";
    }
    $scope.workbenchOptions.warningOptions = {title:"Attention Required!", warnings:[], showWarning:false}
    $scope.workbenchOptions.alertMessageOptions = {};

    $scope.handleClientError = function (e) {
        e.clientError = true;
        $scope.workbenchOptions.warningOptions.error = e;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }

    //this function gives browserName required in case of inserting ClientError in ServiceLogs --- Rajit garg
    $scope.getBrowser = function () {
        var ua = navigator.userAgent, tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE ' + (tem[1] || '');
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    }();

    // value of workbenchOptions.alertMessageOptions.error is set from pl-view----Ritesh bansal
    $scope.$watch("workbenchOptions.alertMessageOptions.error", function (err, oldValue) {
        if (angular.isDefined(err)) {
            if (err.message == Util.NOT_CONNECTED_MESSAGE) {
                $scope.workbenchOptions.alertMessageOptions.title = "Reload view";
                $scope.workbenchOptions.alertMessageOptions.message = "Refresh view by pressing browser refresh button. " + err.message;
//                $scope.workbenchOptions.alertMessageOptions.message = "Refresh view by pressing browser refresh button. " + err.message + "\n" + err.stack;
            } else if (err instanceof BusinessLogicError) {
                $scope.workbenchOptions.alertMessageOptions.message = err.message;
            } else {
                $scope.workbenchOptions.alertMessageOptions.message = Util.UNEXPECTED_ERROR;
                $scope.workbenchOptions.alertMessageOptions.detailMessage = err.message;
            }
        }
    })

    $scope.$watch("workbenchOptions.shortMessageOptions.error", function (err, oldValue) {
        if (angular.isDefined(err)) {
            if (err.message == Util.NOT_CONNECTED_MESSAGE) {
                $scope.workbenchOptions.shortMessageOptions.msg = err.message;
//                $scope.workbenchOptions.shortMessageOptions.msg = "Refresh view by pressing browser refresh button. " + err.message + "\n" + err.stack;
            } else if (err instanceof BusinessLogicError) {
                $scope.workbenchOptions.shortMessageOptions.msg = err.message;
            } else {
                $scope.workbenchOptions.shortMessageOptions.msg = Util.UNEXPECTED_ERROR;
                $scope.workbenchOptions.shortMessageOptions.detailMessage = err.message;
            }
        } else {
            if (angular.isDefined()) {
                $scope.workbenchOptions.shortMessageOptions.msg = undefined;
            }
        }
    })

    $scope.$watch("workbenchOptions.warningOptions.error", function (err, oldValue) {
        if (angular.isDefined(err)) {
            if (err.promptUserWarning) {
                //showing proceed to save on the basis of promptUserWarning  -- Rajit garg 27-mar-2015
                $scope.workbenchOptions.warningOptions.promptUserWarning = true;
            } else {
                $scope.workbenchOptions.warningOptions.promptUserWarning = false;
            }
            var msg = "";
            if (err.message == Util.NOT_CONNECTED_MESSAGE) {
                msg = err.message;
            } else if (err instanceof BusinessLogicError) {
                msg = err.message;
            } else if (err.message == Util.INVALID_TOKEN) {    //Change Not Connected Message, this message is coming when user is already logout, but still doing query/invoke etc. on view.      --Rajit garg 06/04/2015
//                msg = "<span>You are no longer signed into your Account. Please reload this page in order to sign in again and continue working. <a href='/login'>Reload</a></span>"
                msg = "You are no longer signed into your account.";
                $scope.workbenchOptions.warningOptions.askPassword = true;            //is used to reconnect user with the session by getting password, if token destroy due to session timeout -- Rajit garg 11/may/2015
            } else {
                var reqParams = $scope.getRequestParameters()
                if (reqParams && reqParams.developer) {
                    msg = err.stack || err.message;
                } else {
                    msg = err.message || err.stack;
                    /*  msg = Util.UNEXPECTED_ERROR;*/
                }


            }
            //if developer is true in user properties then developer able to see stack of error --Rajit garg 06/04/2015
            if ($scope.workbenchOptions && $scope.workbenchOptions.user && $scope.workbenchOptions.user.developer) {
                $scope.workbenchOptions.warningOptions.showStack = err.stack;
            } else {
                $scope.workbenchOptions.warningOptions.showStack = false;
            }
            $scope.workbenchOptions.warningOptions.showWarningStack = false;
            $scope.workbenchOptions.warningOptions.warnings = Array.isArray(msg) ? msg : [msg];
            $scope.workbenchOptions.warningOptions.showWarning = true;

            if (err && err.clientError) {
                var selectedViewInfo = getInfoForClientError($scope.workbenchOptions);
                var userDb = ApplaneDB.connection("userdb");
                userDb.invokeFunction("Porting.insertClientErrorInServiceLogs", [
                    {"error":{"msg":err.message, "stack":err.stack, "selectedapplication":selectedViewInfo.application, "selectedmenu":selectedViewInfo.menu, selectedqview:selectedViewInfo.qview, "viewIds":selectedViewInfo.viewId}, "errorType":"Client", errorMessage:err.message, browser:$scope.getBrowser}
                ]);
            }
        } else {
            if (angular.isDefined(oldValue)) {
                $scope.workbenchOptions.warningOptions.warnings = [];
                $scope.workbenchOptions.warningOptions.showWarning = false;
            }
        }
    })

    //this function is used to get currentSelectedApplication , menu, qview and id to set this in service logs in case of client error
    function getInfoForClientError(workbenchOptions) {
        var viewId = undefined;
        var selectedApplication = undefined;
        var selectedMenu = undefined;
        var sourceid = undefined;
        if (workbenchOptions.views && workbenchOptions.views.length > 0) {
            var views = workbenchOptions.views;
            var viewIds = [];
            for (var i = 0; i < views.length; i++) {
                if (views[i].viewOptions && views[i].viewOptions.requestView) {
                    if (i === 0) {
                        viewId = views[0].viewOptions.requestView.id;
                        selectedApplication = views[0].viewOptions.requestView.selectedApplication;
                        selectedMenu = views[0].viewOptions.requestView.selectedMenu;
                        sourceid = views[0].viewOptions.requestView.sourceid;
                    }
                    viewIds.push(views[i].viewOptions.requestView.id);
                }
            }
        }
        var applicationLabel = undefined;
        var menuLabel = undefined;
        var qviewLabel = undefined;
        if (workbenchOptions.applications && workbenchOptions.applications.length > 0) {
            var applicationIndex = Util.isExists(workbenchOptions.applications, {_id:selectedApplication}, "_id");
            if (applicationIndex !== undefined) {
                var applicationInfo = workbenchOptions.applications[applicationIndex];
                applicationLabel = applicationInfo.label;
                var menus = applicationInfo.menus;
                var menuIndex = Util.isExists(menus, {_id:selectedMenu}, "_id");
                if (menuIndex !== undefined) {
                    var menuInfo = menus[menuIndex];
                    menuLabel = menuInfo.label;
                    var qviews = menuInfo.qviews;
                    var qviewIndex = Util.isExists(qviews, {_id:sourceid}, "_id");
                    if (qviewIndex !== undefined) {
                        var qviewInfo = qviews[qviewIndex];
                        qviewLabel = qviewInfo.label;
                    }
                }
            }
        }
        return {"application":applicationLabel, "menu":menuLabel, "qview":qviewLabel, "viewId":viewIds}
    }

    $scope.workbenchOptions.userMenuGroupIcon = {menus:[], displayField:"label", class:'app-menu-user defaultUser', menuClass:'pl-default-popup-label', menuPosition:"bottom", hideOnClick:true };
    $scope.workbenchOptions.userMenuGroup = {menus:[], displayField:"label", menuPosition:"bottom", hideOnClick:true, updateLabel:false };
    $scope.workbenchOptions.processGroup = {menus:[], displayField:"label", class:'app-menu-process', menuPosition:"bottom", hideOnClick:true, showProcess:false };
    $scope.workbenchOptions.busyMessageOptions = {};
    $scope.workbenchOptions.shortMessageOptions = {};
    $scope.workbenchOptions.confirmMessageOptions = {};

    $scope.workbenchOptions.applicationSettingGroup = {menus:[

        {label:AppViews.__edituser__.viewOptions.label, viewid:AppViews.__edituser__.viewOptions.id},
        {label:AppViews.__editrole__.viewOptions.label, viewid:AppViews.__editrole__.viewOptions.id},
        {label:AppViews.__editroleprivilege__.viewOptions.label, viewid:AppViews.__editroleprivilege__.viewOptions.id},
        {label:AppViews.__createmenu__.viewOptions.label, viewid:AppViews.__createmenu__.viewOptions.id} ,
        {label:AppViews.__editemenu__.viewOptions.label, viewid:AppViews.__editemenu__.viewOptions.id} ,
        {label:AppViews.__editfunction__.viewOptions.label, viewid:AppViews.__editfunction__.viewOptions.id},
//        {label: AppViews.__editQuery__.viewOptions.label, viewid: AppViews.__editQuery__.viewOptions.id},
        {label:AppViews.__editapplication__.viewOptions.label, viewid:AppViews.__editapplication__.viewOptions.id},
        {label:AppViews.__emailtracker__.viewOptions.label, viewid:AppViews.__emailtracker__.viewOptions.id},
        {label:AppViews.__editServices__.viewOptions.label, viewid:AppViews.__editServices__.viewOptions.id},
        {label:AppViews.__gaeportings__.viewOptions.label, viewid:AppViews.__gaeportings__.viewOptions.id}
    ], displayField:"label", class:"app-menu-setting", onClick:"onApplicationSettingGroup", hideOnClick:true, menuClass:'pl-default-popup-label'};

    $scope.onApplicationClick = function (application) {
        if (application._id) {
            $scope.setCurrentApplication(application._id);
            $scope.selectedMenu = application;
            $scope.resetMenus(1);
        }
    }


    $scope.onApplicationMenuClick = function (menu) {
        if (menu.isApplication) {
            $scope.setCurrentApplication(menu._id);
            return;
        }

        if (menu.application) {
            $scope.setCurrentApplication(menu.application._id, menu._id);
        }
        if (!menu.collection) {
            return;
        }
        var userDb = ApplaneDB.connection("userdb");
        if ($scope.workbenchOptions.shortMessageOptions && $scope.workbenchOptions.shortMessageOptions.msg) {
            delete $scope.workbenchOptions.shortMessageOptions.msg;
        }
        // for App Studio Application : Ashu
        if (menu.__system__) {
            var menuQview = angular.copy(menu.qviews[0]);
            $scope.workbenchOptions.selectedMenuInfo = [];
            $scope.populateMenus($scope.workbenchOptions.applications, $scope.workbenchOptions.selectedMenuInfo, 0, menu._id);
            $scope.openV(menuQview);
            return;
        }
        if ($scope.workbenchOptions.busyMessageOptions) {
            $scope.workbenchOptions.busyMessageOptions.msg = "Loading...";
        }
        menu.selectedApplication = menu.application._id;
        $scope.workbenchOptions.invokeStartTime = new Date();
        var startTime = new Date().getTime();
        userDb.invokeFunction("getMenuState", [menu]).then(
            function (menuInfo) {
                if (menuInfo) {
                    //this function is used to get client render and transfer time info and insert this into pl.servicelogs - -rajit garg
                    getClientTimeInfo(menuInfo, userDb)
                }
                var totalServerTime = new Date().getTime();
                $scope.workbenchOptions.totalResponseTime = "Menu request : " + (totalServerTime - startTime);
                if ($scope.workbenchOptions.busyMessageOptions) {
                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                }

                if (menuInfo.serverTime) {
                    $scope.workbenchOptions.totalServerTime = "Server:" + menuInfo.serverTime;
                }
                var views = menuInfo.response.views;
                var qViews = menuInfo.response.qviews;
                var qViewCount = qViews ? qViews.length : 0;
                for (var i = 0; i < qViewCount; i++) {
                    qViews[i].manageHistory = true;
                }
                $scope.workbenchOptions.selectedMenuInfo = [];
                $scope.populateMenus($scope.workbenchOptions.applications, $scope.workbenchOptions.selectedMenuInfo, 0, menuInfo.response.selectedMenu);
                $scope.closeAllView(function (err) {
                    if (err) {
                        $scope.workbenchOptions.warningOptions.error = err;
                        return;
                    }
                    if (views && views.length > 0) {
                        for (var i = 0; i < views.length; i++) {
                            if (qViews && views[i].viewOptions) {
                                views[i].viewOptions.qviews = qViews;
                            }
                            var manageHistory = menu.manageHistory;
                            if (manageHistory === undefined) {
                                manageHistory = true;
                            }
                            if (views[i].viewOptions) {
                                views[i].viewOptions.manageHistory = manageHistory;
                            }
                            $scope.openV(views[i]);

                        }
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                })

            }).fail(function (err) {
                if ($scope.workbenchOptions.busyMessageOptions) {
                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                }
                $scope.workbenchOptions.warningOptions.error = err;


                if (!$scope.$$phase) {
                    $scope.$apply();
                }
                return;
            })

    }
    //this function is used to get client render and transfer time info and insert this into pl.servicelogs - -rajit garg
    function getClientTimeInfo(info, userDb, setClientTime) {
        var renderStartTime = new Date();
        $timeout(function () {
            var renderEndTime = new Date();
            if (setClientTime) {
                $scope.workbenchOptions.totalRenderTime = "Workbench : " + (renderEndTime - renderStartTime);
                $scope.workbenchOptions.totalResponseTime = "User request : " + (renderStartTime - $scope.workbenchOptions.invokeStartTime);
            }
            if (info && info.serviceLogId) {
                userDb.pendingTime = userDb.pendingTime || {};
                var transferTime = renderStartTime - $scope.workbenchOptions.invokeStartTime;
                if (info.serverTime) {
                    transferTime = transferTime - info.serverTime;
                }
                userDb.pendingTime[info.serviceLogId] = {"renderTime":(renderEndTime - renderStartTime), "transferTime":transferTime};
            }
        }, 10);
    }

    $scope.onEnableLogs = function () {
        var userDb = ApplaneDB.connection("userdb");
        if (userDb) {
            userDb.enableLogs = true;
        }
    }

    $scope.onUserFiltersClick = function (userFilter) {

        var userFilters = $scope.workbenchOptions.userFilters;
        var userFilterState = {};
        var userFilterSpace = userFilter.__filterSpaceId;
        for (var i = 0; i < userFilters.length; i++) {
            var userFilterInfo = userFilters[i];
            var displayField = userFilterInfo.displayField;
            if (userFilterInfo.filterSpaceId === userFilterSpace) {
                userFilterState[userFilterSpace] = {_id:userFilter._id};
                userFilterState[userFilterSpace][displayField] = userFilter[displayField];
                userFilterState[userFilterSpace].collection = userFilter.collection;
                userFilterState[userFilterSpace].recursiveFilterValue = userFilter.recursiveFilterValue;
                userFilterState[userFilterSpace].recursiveFilterField = userFilter.recursiveFilterField;
            } else if (userFilterInfo.parentfilterspace === userFilterSpace) {
                userFilterState[userFilterInfo.filterSpaceId] = {_id:"__all__"};
                userFilterState[userFilterInfo.filterSpaceId][displayField] = "All"
            }
        }
        $scope.getUserState({userFilter:userFilterState});
    }
    $scope.onRecursiveClick = function (menu) {

        var selectedValue = menu.selectedValue;

        selectedValue.collection = menu.collection;
        selectedValue.recursiveFilterValue = !(menu.recursiveFilterValue);
        selectedValue.recursiveFilterField = menu.recursiveFilterField;
        selectedValue.__filterSpaceId = menu.filterSpaceId;

        $scope.onUserFiltersClick(selectedValue)


    }

    $scope.onApplicationSettingGroup = function (menu) {

        if (menu.viewid) {
            var view = angular.copy(AppViews[menu.viewid]);

            if (view) {
                view.popup = true;
                view.viewOptions.popupResize = true;
                var currentApp = $scope.workbenchOptions.selectedApplication
                var userDb = ApplaneDB.connection("userdb");
                var $parameters = {currentappid:currentApp, token:userDb.token, user:{_id:$scope.workbenchOptions.user._id}};
                if (view.viewOptions.queryGrid) {
                    view.viewOptions.queryGrid.$parameters = $parameters;
                }
                if (view.viewOptions.queryForm) {
                    view.viewOptions.queryForm.$parameters = $parameters;
                }

                $scope.openV(view);
            } else {
                $scope.openV({id:menu.viewid, popup:true, popupResize:true, height:"500px", width:"700px", fieldCustomization:false, showLabel:true});
            }


        } else if (menu.type == "invoke") {
            var userDb = ApplaneDB.connection("userdb");
            if ($scope.workbenchOptions.busyMessageOptions) {
                $scope.workbenchOptions.busyMessageOptions.msg = "Invoking...";
            }
            userDb.invokeFunction(menu.function, [menu.parameters]
            ).then(
                function (menuInfo) {
                    if ($scope.workbenchOptions.busyMessageOptions) {
                        delete $scope.workbenchOptions.busyMessageOptions.msg;
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }


                }).fail(function (err) {
                    if ($scope.workbenchOptions.busyMessageOptions) {
                        delete $scope.workbenchOptions.busyMessageOptions.msg;
                    }
                    $scope.workbenchOptions.warningOptions.error = err;

                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                });
        } else {
            var title = "onApplicationSettingGroup in WorkbenchCtrl";
            var message = "Not valid options" + JSON.stringify(menu);
            $scope.workbenchOptions.warningOptions.error = new Error(message + "-" + title);
        }

    }

    $scope.onMenuClick = function (menu) {
    }


    $scope.closeView = function (index) {
        var views = $scope.workbenchOptions.views;
        var viewCount = views ? views.length : 0;
        if (viewCount == 0) {
            var title = "closeView in WorkbenchCtrl";
            var message = "Error: No view found for close in workbench with index[" + index + "]";
            $scope.workbenchOptions.warningOptions.error = new Error(message + "-" + title);
            return;
        }
        if (index === undefined) {
            index = viewCount - 1;
        }
        if (index >= viewCount) {
            return;
        }
        if (index < (viewCount - 1)) {
            $scope.closeView(index + 1);
        }
        views.splice(index, 1);
        viewCount = views.length;
        if (viewCount == 1) {
            var v = views[viewCount - 1];
            v.viewOptions.style.left = $scope.leftZero;
            v.viewOptions.style.right = $scope.rightZero;
            v.viewOptions.viewResized = !v.viewOptions.viewResized;
        } else if (viewCount > 1) {
            var lastView = views[viewCount - 1];
            lastView.viewOptions.style.left = $scope.leftZero;
            lastView.viewOptions.style.right = $scope.rightZero;
            lastView.viewOptions.viewResized = !lastView.viewOptions.viewResized;
            if (lastView.viewOptions.style && lastView.viewOptions.style.left == '65%') {
                lastView.viewOptions.viewClass = 'pl-sub-view';
            }

            var secondLastView = views[viewCount - 2];
            secondLastView.viewOptions.style.left = $scope.leftZero;
            secondLastView.viewOptions.style.right = $scope.rightChild;
        }
    }

    $scope.confirmationView = function (option) {
        $scope.workbenchOptions.confirmationOptions = option;
    }

    $scope.resizeView = function (index, direction) {
        $scope.workbenchOptions.viewResize = !$scope.workbenchOptions.viewResize;
        var views = $scope.workbenchOptions.views;
        var viewCount = views ? views.length : 0;
        if (viewCount == 0) {
            var title = "resizeView in WorkbenchCtrl";
            var message = "Error: No view found for close in workbench with index[" + index + "]";
            $scope.workbenchOptions.warningOptions.error = new Error(message + "-" + title);
            return;
        }
        if (index === undefined) {
            index = viewCount - 1;
        }
        if (index >= viewCount) {
            var title = "resizeView in WorkbenchCtrl";
            var message = "Error: View index found for close in workbench is [" + index + "], but total view count[" + viewCount + "]";
            $scope.workbenchOptions.warningOptions.error = new Error(message + "-" + title);
            return;
        }

        var v = views[index];
        v.viewOptions.viewResized = !v.viewOptions.viewResized;
        if (direction == "right") {
            var currentRight = v.viewOptions.style.right;
            if (currentRight == $scope.rightChild) {
                v.viewOptions.style.right = $scope.rightZero;
                var nextIndex = index + 1;
                if (nextIndex < viewCount) {
                    v = views[nextIndex]
                    v.viewOptions.style.right = $scope.rightInvisibleRight;
                    v.viewOptions.style.left = $scope.rightInvisibleLeft;
                }
            } else {
                v.viewOptions.style.right = $scope.rightChild;
                var nextIndex = index + 1;
                if (nextIndex < viewCount) {
                    v = views[nextIndex]
                    v.viewOptions.style.right = $scope.rightZero;
                    v.viewOptions.style.left = $scope.leftChild;
                }
            }

        } else if (direction == "left") {
            if (v.viewOptions.style && v.viewOptions.style.left == '65%') {
                v.viewOptions.viewClass = undefined;
            } else {
                v.viewOptions.viewClass = 'pl-sub-view';
            }
            var currentLeft = v.viewOptions.style.left;
            if (currentLeft == $scope.leftChild) {
                v.viewOptions.style.left = $scope.leftZero;
                var nextIndex = index - 1;
                if (nextIndex >= 0) {
                    v = views[nextIndex]
                    v.viewOptions.style.right = $scope.leftInvisibleRight;
                    v.viewOptions.style.left = $scope.leftInvisibleLeft;
                }
            } else {
                v.viewOptions.style.left = $scope.leftChild;
                v.viewOptions.style.right = $scope.rightZero;
                //move parent into frame
                var nextIndex = index - 1;
                if (nextIndex >= 0) {
                    v = views[nextIndex]
                    v.viewOptions.style.right = $scope.rightChild;
                    v.viewOptions.style.left = $scope.leftZero;
                }
                //move child out of frame
                var nextIndex = index + 1;
                if (nextIndex < viewCount) {
                    v = views[nextIndex]
                    v.viewOptions.style.right = $scope.rightInvisibleRight;
                    v.viewOptions.style.left = $scope.rightInvisibleLeft;
                }

            }

        } else {
            var title = "resizeView in WorkbenchCtrl";
            var message = "Invalid direction while resizing>>>>" + direction;
            $scope.workbenchOptions.warningOptions.error = new Error(message + "-" + title);
        }


    }

    $scope.closeAllView = function (callback) {
        $scope.workbenchOptions.views = [];
        callback();
    }

    $scope.logOut = function (options) {

        if ($scope.workbenchOptions.busyMessageOptions) {
            $scope.workbenchOptions.busyMessageOptions.msg = "Sign Out...";
        }
        var userDb = ApplaneDB.connection("userdb");
        var loggedInFromGoogle = $cookies.oauthProvider === "google";
        var redirectTo = window.location;
        userDb.removeCache();
        var login_url = "/login";
        if (options && options.redirect_to_url) {
            login_url = options.redirect_to_url;
        }
        if (loggedInFromGoogle && options && options.doNotLogoutFromGoogle) {
            loggedInFromGoogle = false;
        }
        userDb.disconnect().then(
            function () {
                // To avoid old token usage from localstorage

                if ($scope.workbenchOptions.busyMessageOptions) {
                    $scope.workbenchOptions.busyMessageOptions.msg = null;
                }

                if (localStorage && localStorage.userdb) {
                    delete localStorage.userdb;
                }
                if (loggedInFromGoogle) {
                    $scope.workbenchOptions.confirmMessageOptions = $scope.workbenchOptions.confirmMessageOptions || {};
                    $scope.workbenchOptions.confirmMessageOptions.title = "Logout";
                    $scope.workbenchOptions.confirmMessageOptions.message = "Do you want to Logout from Google Account Also?";
                    $scope.workbenchOptions.confirmMessageOptions.options = [
                        {
                            label:"Yes",
                            class:'btn-blue'
                        },
                        {
                            label:"No",
                            'class':'pl-cancel-btn '
                        }
                    ];
                    $scope.workbenchOptions.confirmMessageOptions.callback = function (selectedOptions) {
                        if (selectedOptions.option == "Yes") {
                            window.location.href = "https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=" + redirectTo;
                        } else {
                            window.location.href = login_url;
                        }
                        $scope.workbenchOptions.confirmMessageOptions.title = undefined;
                    }
                } else {
                    window.location.href = login_url;
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }).fail(function (err) {
                if ($scope.workbenchOptions.busyMessageOptions) {
                    $scope.workbenchOptions.busyMessageOptions.msg = null;
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
                // To avoid old token usage from localstorage
                for (var k in localStorage) {
                    delete localStorage[k];
                }
                window.location.href = login_url;
            });

    }


    $scope.changePassword = function () {
    }


    $scope.userNameClick = function () {
    }

    $scope.workbenchOptions.isChildWindowOpen = {};
    $scope.openChildWindow = function (options) {
        var queryString = '?';
        if (options.roadmap) {
            queryString += 'roadmap=' + options.roadmap;
        }
        if ($scope.workbenchOptions.isChildWindowOpen && !$scope.workbenchOptions.isChildWindowOpen.closed && $scope.workbenchOptions.isChildWindowOpen.focus) {
            $scope.workbenchOptions.isChildWindowOpen.focus();
        } else {
            $scope.workbenchOptions.isChildWindowOpen = window.open(window.location.origin + queryString, 'childWindow');
        }
    }

    // This is used to open Report an Issue View using daffodilsw token by using RoadmapConnection.
    $scope.onReportAnIssueClick = function () {
        $scope.sendFeedback({});
//        return ApplaneDB.getRoadMapConnection().then(function (result){
//            if(result && result.response && result.response.token){
//                $scope.openV({id:"issues", ui:"form", resized:true, popup:true, token:result.response.token, limit:0, height:"500px", width:"600px", fieldCustomization:false, showLabel:true});
//            }
//        }).fail(function (err){
//            $scope.workbenchOptions.alertMessageOptions.title = "onReportAnIssueClick";
//            $scope.workbenchOptions.alertMessageOptions.message = err;
//
//            if (!$scope.$$phase) {
//                $scope.$apply();
//            }
//            return;
//        })
    };


    $scope.closePopUpView = function (index) {
        if ($scope.workbenchOptions.popupViews && $scope.workbenchOptions.popupViews.length > 0) {
            if (index >= $scope.workbenchOptions.popupViews.length) {
                return;
            }

            if (index === undefined) {
                index = $scope.workbenchOptions.popupViews.length - 1;
            }
            if (index < ($scope.workbenchOptions.popupViews.length - 1)) {
                $scope.closeView(index + 1);
            }
            $scope.workbenchOptions.popupViews.splice((index), 1);
            if ($scope.workbenchOptions.popupViews.length > 0) {
                var lastView = $scope.workbenchOptions.popupViews[$scope.workbenchOptions.popupViews.length - 1];
                delete lastView.viewOptions.popupStyle.display;
            } else if ($scope.workbenchOptions.popupViews.length == 0) {
                $scope.workbenchOptions.popupViewsStyle.visibility = "hidden";
            }

        }
    }
    $scope.getWorkbenchView = function (index) {
        var views = $scope.workbenchOptions.views;
        var viewCount = views ? views.length : 0
        if (index >= viewCount) {
            return undefined;
        } else {
            return views[index]
        }

    }
    $scope.getWorkbenchPopupView = function (index) {
        var views = $scope.workbenchOptions.popupViews;
        var viewCount = views ? views.length : 0
        if (index >= viewCount) {
            return undefined;
        } else {
            return views[index]
        }
    }
    $scope.openPopUpView = function (v) {
        if (!v.viewOptions) {
            v.popup = true;
            $scope.openV(v);
        } else {
            if (v.viewOptions.closeViewIndex !== undefined) {
                $scope.closePopUpView(v.viewOptions.closeViewIndex);
            }
            $scope.workbenchOptions.popupViewsStyle = $scope.workbenchOptions.popupViewsStyle || {};
            $scope.workbenchOptions.popupViewsStyle.visibility = "visible";
            v.viewOptions.popup = true;
            v.viewOptions.openV = "openPopUpView";
            v.viewOptions.closeV = "closePopUpView";
            v.viewOptions.getV = "getWorkbenchPopupView";
            v.viewOptions.resizeV = "resizeView";
            v.viewOptions.close = true;
            v.viewOptions.warningOptions = $scope.workbenchOptions.warningOptions;
            v.viewOptions.alertMessageOptions = $scope.workbenchOptions.alertMessageOptions;
            v.viewOptions.busyMessageOptions = $scope.workbenchOptions.busyMessageOptions;
            v.viewOptions.shortMessageOptions = $scope.workbenchOptions.shortMessageOptions;
            v.viewOptions.popupStyle = {};
            v.viewOptions.popupStyle.width = v.viewOptions.width || "500px";
            v.viewOptions.popupStyle.height = v.viewOptions.height || "200px";
            $scope.workbenchOptions.popupViews = $scope.workbenchOptions.popupViews || [];
            if ($scope.workbenchOptions.popupViews.length > 0) {
                var lastView = $scope.workbenchOptions.popupViews[$scope.workbenchOptions.popupViews.length - 1];
                lastView.viewOptions.popupStyle.display = "none";
            }
            v.viewOptions.viewIndex = $scope.workbenchOptions.popupViews.length;
            $scope.workbenchOptions.popupViews.push(v);

            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

    }

    $scope.openView = function (v) {
        if (v.viewOptions.closeViewIndex !== undefined) {
            $scope.closeView(v.viewOptions.closeViewIndex);
        }
        v.viewOptions.openV = "openV";
        v.viewOptions.closeV = "closeView";
        v.viewOptions.resizeV = "resizeView";
        v.viewOptions.confirmationV = "confirmationView";
        v.viewOptions.popUpV = "openPopUpView";
        v.viewOptions.getV = "getWorkbenchView";
        v.viewOptions.warningOptions = $scope.workbenchOptions.warningOptions;
        v.viewOptions.alertMessageOptions = $scope.workbenchOptions.alertMessageOptions;
        v.viewOptions.busyMessageOptions = $scope.workbenchOptions.busyMessageOptions;
        v.viewOptions.confirmMessageOptions = $scope.workbenchOptions.confirmMessageOptions;
        v.viewOptions.shortMessageOptions = $scope.workbenchOptions.shortMessageOptions;
        v.viewOptions.processOptions = $scope.workbenchOptions.processGroup;
        v.viewOptions.admin = $scope.workbenchOptions.user.admin;
        v.viewOptions.style = v.viewOptions.style || {};
        v.viewOptions.style.top = $scope.leftZero;
        v.viewOptions.style.bottom = $scope.rightZero;
        v.viewOptions.viewResized = !v.viewOptions.viewResized;
        var noOfCurrentViews = $scope.workbenchOptions.views.length;
        if (noOfCurrentViews == 0) {
            v.viewOptions.style.left = $scope.leftZero;
            v.viewOptions.style.right = $scope.rightZero;
        } else if (noOfCurrentViews == 1) {
            v.viewOptions.style.left = $scope.leftChild;
            v.viewOptions.style.right = $scope.rightZero;
            v.viewOptions.style.background = "#fafafa";
            var lastView = $scope.workbenchOptions.views[noOfCurrentViews - 1];
            lastView.viewOptions.style.right = $scope.rightChild;
            lastView.viewOptions.viewResized = !lastView.viewOptions.viewResized;
        } else {
            v.viewOptions.style.left = $scope.leftChild;
            v.viewOptions.style.right = $scope.rightZero;
            var lastView = $scope.workbenchOptions.views[noOfCurrentViews - 1];
            if (lastView.viewOptions.style && lastView.viewOptions.style.left == '65%') {
                lastView.viewOptions.viewClass = undefined;
            } else {
                lastView.viewOptions.style.right = $scope.rightChild;
                lastView.viewOptions.style.left = $scope.leftZero;
                var superLastView = $scope.workbenchOptions.views[noOfCurrentViews - 2];
                superLastView.viewOptions.style.right = $scope.leftInvisibleRight
                superLastView.viewOptions.style.left = $scope.leftInvisibleLeft;
            }
            lastView.viewOptions.viewResized = !lastView.viewOptions.viewResized;

        }
        v.viewOptions.viewIndex = $scope.workbenchOptions.views.length;
        $scope.workbenchOptions.views.push(v);
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }

    function getMenuLabelHierarchy(menus, selectedMenus, selectedMenuLabels) {
        if (!angular.isDefined(menus)) {
            return;
        }
        for (var i = 0; i < menus.length; i++) {
            var menu = menus[i];
            if (selectedMenus[menu._id]) {
                selectedMenuLabels.push({label:menu.uri});
                if (menu.qviews && menu.qviews.length > 0) {
                    for (var j = 0; j < menu.qviews.length; j++) {
                        var qview = menu.qviews[j];
                        if (qview._id == $scope.workbenchOptions.selectedQView) {
                            selectedMenuLabels.push({label:qview.uri});
                        }
                    }
                }
                if (menu.menus && menu.menus.length > 0) {
                    getMenuLabelHierarchy(menu.menus, selectedMenus, selectedMenuLabels);
                }
                break;
            }
        }
    }

    function handleView($scope, view, v) {
        var isPopup = undefined;
        var closeViewIndex = undefined;
        if (v) {
            isPopup = v.popup;
            closeViewIndex = v.closeViewIndex;
        } else {
            isPopup = view.popup;
            closeViewIndex = v ? v.closeViewIndex : view.closeViewIndex;
        }


//        if (closeViewIndex !== undefined) {
//            if (isPopup) {
//                $scope.closePopUpView(closeViewIndex);
//            } else {
//                $scope.closeView(closeViewIndex);
//            }
//        }


        if (isPopup) {
            $scope.openPopUpView(view)
        } else {
            if (view.viewOptions && view.viewOptions.manageHistory) {

                $scope.workbenchOptions.selectedMenuLabels = [];
                if ($scope.workbenchOptions.defaultSelectedMenu && $scope.workbenchOptions.selectedMenu === undefined) {
                    $scope.workbenchOptions.selectedMenu = $scope.workbenchOptions.selectedMenu || {};
                    getSelectedMenuHierarchy($scope.workbenchOptions.applications, $scope.workbenchOptions.defaultSelectedMenu, $scope.workbenchOptions.selectedMenu);
                }
                if ($scope.workbenchOptions.selectedMenu && view.viewOptions) {
                    $scope.workbenchOptions.selectedQView = view.viewOptions.sourceid;
                    getMenuLabelHierarchy($scope.workbenchOptions.applications, $scope.workbenchOptions.selectedMenu, $scope.workbenchOptions.selectedMenuLabels);
                    var selecetedMenuLabel = '';
                    for (var i = 0; i < $scope.workbenchOptions.selectedMenuLabels.length; i++) {
                        selecetedMenuLabel = selecetedMenuLabel + '/' + $scope.workbenchOptions.selectedMenuLabels[i].label;
                    }
                    var currentPath = $location.path();
                    if (currentPath == selecetedMenuLabel) {
                        $scope.openView(view);
                        /*In case of F5 or enter we dont manage History of view*/
                        return;
                    }
                    $scope.workbenchOptions.currentView = view;
                    $location.path(selecetedMenuLabel);
                }
            } else {
                $scope.openView(view);
            }
        }
    }

    $scope.populateViewOptionProperties = function (v) {
        var newViewOptions = {};
        newViewOptions.saveOptions = v.saveOptions;
        delete v.saveOptions;
        newViewOptions.close = v.close;
        delete v.close;
        newViewOptions.parentSharedOptions = v.parentSharedOptions;
        delete v.parentSharedOptions;
        newViewOptions.parentViewIndex = v.parentViewIndex;
        delete v.parentViewIndex;
        newViewOptions.parentRowActions = v.parentRowActions;
        delete v.parentRowActions;
        newViewOptions.viewPosition = v.viewPosition;
        delete v.viewPosition;
        newViewOptions.qviews = v.qviews;
        delete v.qviews;
        newViewOptions.showLabel = v.showLabel;
        delete v.showLabel;
        newViewOptions.watchParent = v.watchParent;
        delete v.watchParent;
        newViewOptions.closeViewIndex = v.closeViewIndex;
        delete v.closeViewIndex;
        newViewOptions.refreshParentInBackground = v.refreshParentInBackground;
        delete v.refreshParentInBackground;
        newViewOptions.selfInsertView = v.selfInsertView;
        delete v.selfInsertView;
        newViewOptions.height = v.height;
        delete v.height;
        newViewOptions.width = v.width;
        delete v.width;
        newViewOptions.fieldCustomization = v.fieldCustomization;
        delete v.fieldCustomization;
        newViewOptions.fullMode = v.fullMode;
        delete v.fullMode;
        newViewOptions.popupResize = v.popupResize;
        delete v.popupResize;
        newViewOptions.manageHistory = v.manageHistory;
        delete v.manageHistory;
        return newViewOptions;
    };

    $scope.updateViewOptions = function (view, newViewOptions) {
        for (var k in newViewOptions) {
            if (newViewOptions[k] !== undefined) {
                view.viewOptions[k] = newViewOptions[k];
            }
        }
    };

    $scope.openV = function (v, callback) {
        if ((!v.viewOptions) && AppViews.hasOwnProperty(v.id)) {            /*check property using hasOwnProperty for AppsViews as "watch" property gets true due to its parent watch() function(default inherit form Object) */
            var appViewClone = angular.copy(AppViews[v.id]);
            if (v.popup !== undefined) {
                appViewClone.popup = v.popup;
            }

            if (v.$parameters) {
                appViewClone.viewOptions.queryGrid.$parameters = v.$parameters;
            }
            if (v.$parametermappings) {
                appViewClone.viewOptions.$parametermappings = v.$parametermappings;
            }
            var newViewOptions = $scope.populateViewOptionProperties(v);
            $scope.updateViewOptions(appViewClone, newViewOptions);
            v = appViewClone;
        }
        if (!v.viewOptions) {
            if ($scope.workbenchOptions.shortMessageOptions && $scope.workbenchOptions.shortMessageOptions.msg) {
                $scope.workbenchOptions.shortMessageOptions.msg = undefined;
            }
            $scope.workbenchOptions.busyMessageOptions.msg = "Loading...";
            var userDb = ApplaneDB.connection("userdb");
            var newViewOptions = $scope.populateViewOptionProperties(v);
            var options = {};
            if (v.token) {
                options.token = v.token;
            }
            $scope.workbenchOptions.invokeStartTime = new Date();
            var startTime = new Date().getTime();
            userDb.invokeFunction("view.getView", [v], options).then(
                function (view) {
                    if (view) {
                        getClientTimeInfo(view, userDb)
                    }
                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                    var endTime = new Date().getTime();
                    $scope.workbenchOptions.totalResponseTime = "View request : " + (endTime - startTime);
                    if (!view || !view.response) {
                        var title = "openV in WorkbenchCtrl";
                        var message = ">>>View not found >>>" + JSON.stringify(v);
                        $scope.workbenchOptions.warningOptions.error = new Error(message + "-" + title);
                        return;
                    }
                    if (view.serverTime) {
                        $scope.workbenchOptions.totalServerTime = "Server:" + view.serverTime;
                    }
                    view = view.response;

                    $scope.updateViewOptions(view, newViewOptions);

                    if (callback) {
                        callback(view);
                    } else {
                        handleView($scope, view, v);
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
//                    if (v.popup) {
//                     $scope.openPopUpView(view)
//                     } else {
//                     $scope.openView(view);
//                     }

                }).fail(function (err) {
                    if ($scope.workbenchOptions.busyMessageOptions) {
                        delete $scope.workbenchOptions.busyMessageOptions.msg;
                    }
                    $scope.workbenchOptions.warningOptions.error = err;

                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                    return;
                })
        } else {
            handleView($scope, v);
//            if (v.popup) {
//                $scope.openPopUpView(v)
//            } else {
//                $scope.openView(v);
//            }
        }

    }


    $scope.$watch('workbenchOptions.shortMessageOptions.msg', function (newvalue, oldvalue) {
        if (!angular.equals(newvalue, oldvalue)) {
            if (newvalue !== undefined) {
                var time = $scope.workbenchOptions.shortMessageOptions.time;
                if (!time) {
                    time = 5000;
                }
                setTimeout(function () {
                    $scope.workbenchOptions.shortMessageOptions.msg = undefined;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }, time);

            } else {
                $scope.workbenchOptions.shortMessageOptions.error = undefined;

            }
        }
    }, true);


    $scope.populateMenus = function (menus, selectedMenuInfo, levelIndex, selectedId) {

        if (menus && menus.length > 0) {
            var found = false;
            var foundIndex = undefined;
            var selectedMenu = {};
            for (var i = 0; i < menus.length; i++) {
                var menu = menus[i];
                if (menu.menus) {
                    var found = $scope.populateMenus(menu.menus, selectedMenuInfo, levelIndex + 1, selectedId);
                    if (found) {
                        foundIndex = i;
                        selectedMenu.menu = menu;
                        selectedMenu.parentMenu = menus;
                        break;
                    }
                } else if (menu._id == selectedId) {
                    found = true;
                    foundIndex = i;
                    selectedMenu.menu = menu;
                    selectedMenu.parentMenu = menus;
                    break;
                }
            }
            if (found) {
//                selectedMenuInfo[levelIndex] = foundIndex;
                selectedMenuInfo.splice(0, 0, selectedMenu);
            }
            return found;
        }
    }

    $scope.setCurrentApplication = function (applicationId, menuId) {
        $scope.workbenchOptions.selectedApplication = applicationId;
        if ($scope.workbenchOptions.applications) {                                                                     //to set the current selected application as default uiMenus, uiMenus:- will be contains the menus of current application.
            for (var i = 0; i < $scope.workbenchOptions.applications.length; i++) {
                if ($scope.workbenchOptions.applications[i]._id === applicationId) {
                    var userDb = ApplaneDB.connection("userdb");
                    userDb.setContext($scope.workbenchOptions.applications[i].$context);
                    $scope.workbenchOptions.applications[i].uiMenus = $scope.workbenchOptions.applications[i].uiMenus || $scope.workbenchOptions.applications[i].menus
                    break;
                }

            }
        }
        if (!menuId) {
            menuId = applicationId  //consider application as menu for selection
        }
        if (menuId) {
            $timeout(function () {
                $scope.setCurrentMenu(menuId);
            }, 0)  // due to other populate at compile time, we have to apply timeout
        }
    }

    function getSelectedMenuHierarchy(menus, selectedMenuId, selectedMenus) {
        if (!menus || menus.length == 0 || !selectedMenuId) {
            return;
        }
        for (var i = 0; i < menus.length; i++) {
            var menu = menus[i];
            if (menu._id === selectedMenuId) {
                selectedMenus[selectedMenuId] = true;
                return true;
            }
            if (menu.menus) {
                var selected = getSelectedMenuHierarchy(menu.menus, selectedMenuId, selectedMenus)
                if (selected) {
                    selectedMenus[menu._id] = true;
                    return true;
                }
            }

        }
    }

    function populateWhenInMenus(menus) {
        if (!menus || menus.length == 0) {
            return;
        }
        for (var i = 0; i < menus.length; i++) {
            var isVisible = true;

            if (menus[i].when !== undefined) {
                var when = menus[i].when;
                if (when === true || when === false) {
                    isVisible = when;
                } else {
                    when = when.trim();
                    if (when === "true") {
                        isVisible = true
                    } else if (when === "false") {
                        isVisible = false;
                    } else {
                        var getter = $parse(when);
                        var context = {user:$scope.workbenchOptions.user};
                        var resolved = getter(context);
                        if (resolved !== true) {
                            isVisible = false;
                        }
                    }
                }
            }
            menus[i].isVisible = isVisible;

            populateWhenInMenus(menus[i].menus);
        }
    }

    $scope.setCurrentMenu = function (id) {
        $scope.workbenchOptions.selectedMenu = {};
        getSelectedMenuHierarchy($scope.workbenchOptions.applications, id, $scope.workbenchOptions.selectedMenu);
    }

    function getUserDB() {
        var requestParameters = $scope.getRequestParameters();
        var userDb = ApplaneDB.connection("userdb");
        if (userDb) {
            var D = Q.defer();
            D.resolve(userDb);
            return D.promise;
        } else if (requestParameters && requestParameters.token) {
            return ApplaneDB.connect("", undefined, {token:requestParameters.token, cachekey:"userdb"})
        } else if ($cookies.token) {
            return ApplaneDB.connect("", undefined, {token:$cookies.token, cachekey:"userdb"})
        } else {
            var D = Q.defer();
            D.resolve();
            return D.promise;
        }
    }

    $scope.changePasswordPopup = function () {
        var optionsHtml = "<div class='change-pass'>" +
            "<pl-change-password></pl-change-password>" +
            "</div>";
        var popupScope = $scope.$new();
        var p = new Popup({
            autoHide:false,
            deffered:true,
            escEnabled:true,
            hideOnClick:true,
            html:$compile(optionsHtml)(popupScope),
            scope:popupScope,
            element:'body',
            id:'changePass'
        });
        p.showPopup();
    };


    function ensureRoadMapDB(parameters) {
        if (parameters && parameters.roadmap && parameters.roadmap == "true") {
            //it will connect user with daffodilsw(either create new token or reuse one if available in localStorage)  -- Rajit
            return ApplaneDB.getRoadMapConnection().then(
                function (result) {
                    if (result && result.response) {
                        return ApplaneDB.connection("userdb", result.response);
                    }
                })
        } else {
            var D = Q.defer();
            D.resolve();
            return D.promise;
        }
    };


    $scope.onSetupSave = function () {
        var setupView = $scope.workbenchOptions.setupView;
        $scope.getUserState({setup:true, setupViewId:setupView._id});
    };

    $scope.getUserState = function (userState) {
        $('._lm').remove();
        $('#lmm').remove();
        var userDb = undefined;
        $scope.workbenchOptions.busyMessageOptions.msg = "Loading...";
        // this method will connect any user with daffodilsw in case of roadmap  --Rajit
        var parameters = $scope.getRequestParameters();
        return  ensureRoadMapDB($scope.getRequestParameters()).then(
            function () {
                return getUserDB()
            }).then(
            function (userDb1) {
                userDb = userDb1;
                if (userDb) {
                    if (parameters && parameters.roadmap && parameters.roadmap == "true") {
                        userState = userState || {};
                        userState.appLabel = "Roadmap";
                    }


                    $scope.workbenchOptions.totalJSTime = "JS Load : " + (endLoadingTime - startLoadingTime) + " | " + (new Date() - endLoadingTime);
                    $scope.workbenchOptions.userStateStartTime = new Date();
                    $scope.workbenchOptions.invokeStartTime = new Date();
                    if (parameters && parameters.es) {
                        userDb.es = true;
                    }

                    if (parameters && parameters.enableLogs) {
                        userDb.enableLogs = true;
                    }
                    var pathId = $location.path();
                    pathId = pathId.split('/');
                    if (pathId && pathId.length > 0) {
                        pathId.splice(0, 1);
                        /*to remove first blank element from list*/
                        userState.pathId = pathId;
                    }
                    return userDb.invokeFunction("getUserState", [
                        userState
                    ])
                }
            }).then(
            function (userInfo) {
                if (userInfo) {
                    getClientTimeInfo(userInfo, userDb, true)
                }

                var renderStartTime = new Date();
                $timeout(function () {
                    var renderEndTime = new Date();
                    $scope.workbenchOptions.totalRenderTime = "Workbench : " + (renderEndTime - renderStartTime);
                    $scope.workbenchOptions.totalResponseTime = "User request : " + (renderStartTime - $scope.workbenchOptions.userStateStartTime);
                }, 0);

                if (!userInfo) {
                    // To avoid old token usage from localstorage
                    if (localStorage && localStorage.userdb) {
                        delete localStorage.userdb;
                    }
                    window.location.href = "/login";
                    return;
                }
                delete $scope.workbenchOptions.busyMessageOptions.msg;
                if (userInfo.serverTime) {
                    $scope.workbenchOptions.totalServerTime = "Server:" + userInfo.serverTime;
                }
                userInfo = userInfo.response;

                $scope.workbenchOptions.developmentRight = userInfo.developmentRight;
                $scope.workbenchOptions.user = userInfo.user;
                $scope.workbenchOptions.setupView = userInfo.setupView;
                $scope.workbenchOptions.showRenderTime = userInfo.user.showRenderTime;
                if (userInfo && userInfo.googleServicesInfo) {
                    if ((userInfo.googleServicesInfo.mailtrackenabled || userInfo.googleServicesInfo.calenderenabled) && userInfo.googleServicesInfo.googleRefreshToken === undefined) {
                        $scope.workbenchOptions.googleServicesInfo = userInfo.googleServicesInfo;
                        $scope.workbenchOptions.showGoolgeIcon = true;
                    }
                }
                if (userInfo.user) {
                    $scope.workbenchOptions.userIcon = userInfo.user.image;
                    $scope.workbenchOptions.userMenuGroup.label = userInfo.user.fullname || userInfo.user.username;
                }
                $scope.workbenchOptions.userMenuGroup.menus = [

                    //        {label:"Change Password", onClick:"changePassword"},
                    {label:AppViews.__usersetting__.viewOptions.label, viewid:AppViews.__usersetting__.viewOptions.id, onClick:"onApplicationSettingGroup"},
                    {label:AppViews.__processes__.viewOptions.label, viewid:AppViews.__processes__.viewOptions.id, onClick:"onApplicationSettingGroup"},
                    {label:"Change password", onClick:"changePasswordPopup"},
                    {label:"Report an issue", onClick:"reportIssue"},
                    {label:"Issues", onClick:"openChildWindow", roadmap:true},
                    {onClick:"logOut", label:"Logout"}
                ];

                /*$scope.workbenchOptions.userMenuGroup.menus.splice(3, 0, {label:"Enable logs", onClick:"onEnableLogs"});*/

                if (userInfo.user.admin) {
                    $scope.workbenchOptions.userMenuGroup.menus.splice(2, 0, {label:AppViews.__edituser__.viewOptions.label, viewid:AppViews.__edituser__.viewOptions.id, onClick:"onApplicationSettingGroup"});
//                    $scope.workbenchOptions.userMenuGroup.menus.splice(3, 0, {label:AppViews.__editrole__.viewOptions.label, viewid:AppViews.__editrole__.viewOptions.id, onClick:"onApplicationSettingGroup"});
                    $scope.workbenchOptions.userMenuGroup.menus.splice(5, 0, {label:AppViews.__series__.viewOptions.label, viewid:AppViews.__series__.viewOptions.id, onClick:"onApplicationSettingGroup"});
                }
                if (userInfo.orgName) {
//                    $scope.workbenchOptions.userMenuGroup.menus.splice(1, 0, {label: userInfo.orgName});
                    $scope.workbenchOptions.orgName = userInfo.orgName;
                }
                if (userInfo.showOrgName) {
                    $scope.workbenchOptions.showOrgName = userInfo.showOrgName;
                }
                if (userInfo) {
                    var userFilters = userInfo.userFilters;
                    if (userFilters && userFilters.length > 0) {
                        var newUserFilters = [];
                        for (var i = userFilters.length - 1; i >= 0; i--) {
                            var userFilter = userFilters[i];
                            var menus = userFilter.menus;
                            if (menus && menus.length > 0) {
                                for (var j = 0; j < menus.length; j++) {
                                    var menu = menus[j];
                                    menu.onClick = 'onUserFiltersClick';
                                }
                            }
                            newUserFilters.push(userFilter);
                        }
//                        newUserFilters[1].showRecursion = true;
//                        newUserFilters[1].recursionValue = false;
//                        newUserFilters[1].recursionClick = 'onRecursiveClick';
                        $scope.workbenchOptions.userFilters = newUserFilters;
                    }
                }
                $scope.workbenchOptions.userMenuGroup.menus.splice(3, 0, {label:AppViews.__userNotifications__.viewOptions.label, viewid:AppViews.__userNotifications__.viewOptions.id, onClick:"onApplicationSettingGroup"});


                if (userInfo.applications && userInfo.applications.length > 0) {
                    if ($scope.workbenchOptions.developmentRight) {
                        userInfo.applications.push(AppViews.__appstudio__);
                    }
                    for (var i = userInfo.applications.length - 1; i >= 0; i--) {
                        userInfo.applications[i].isApplication = true;  //same directive is used for application and menu, so for identification of application on selection
                        //show application, only if menus available in it, require for darcl case.-- Rajit garg
                        if (!userInfo.applications[i].menus || userInfo.applications[i].menus.length == 0) {
                            userInfo.applications.splice(i, 1)
                        }
                    }
                    $scope.workbenchOptions.applications = userInfo.applications;
                    $scope.setCurrentApplication(userInfo.selectedApplication, userInfo.selectedMenu);


                }

                populateWhenInMenus($scope.workbenchOptions.applications);
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
                var setupView = userInfo.setupView;
                if (views && views.length > 0) {
                    for (var i = 0; i < views.length; i++) {
                        if (qViews && views[i].viewOptions) {
                            views[i].viewOptions.manageHistory = true;
                            if (setupView) {
                                views[i].viewOptions.label = setupView.label;
                                views[i].viewOptions.afterSaveFn = $scope.onSetupSave;
                            } else {
                                views[i].viewOptions.qviews = qViews;
                            }
                        }
                        $scope.openV(views[i]);
                    }
                }
                $scope.workbenchOptions.selectedMenuInfo = [];
                $scope.populateMenus($scope.workbenchOptions.applications, $scope.workbenchOptions.selectedMenuInfo, 0, userInfo.selectedMenu);
                $scope.$watch("workbenchOptions.processGroup.processInitiated", function (newValue, oldValue) {
                    $scope.getProcesses();
                })
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
                deleteAllCookies();
                window.location.href = "/login.html?errorMessage=" + err.message;
                return;
            });
    }
    function deleteAllCookies() {
        if (document && document.cookie) {
            var cookies = document.cookie.split(";");
            if (cookies && cookies.length > 0) {
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    var eqPos = cookie.indexOf("=");
                    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                }
            }
        }
    }

    $scope.workbenchOptions.querString = {};
    $scope.workbenchOptions.querString = $scope.getRequestParameters();
    $scope.getUserState($scope.workbenchOptions.querString);
    $scope.workbenchOptions.pendingProcess = {};
    $scope.getProcesses = function () {
        var userDb = ApplaneDB.connection("userdb");
        if (!userDb) {
            // To avoid old token usage from localstorage
            if (localStorage && localStorage.userdb) {
                delete localStorage.userdb;
            }
            window.location.href = "/login";
            return;
        }
        return userDb.invokeFunction("Porting.getProcessInfo", [$scope.workbenchOptions.pendingProcess], {enablelogs:false}).then(function (processInfo) {
            if (processInfo && processInfo.response && processInfo.response.failedProcesses && processInfo.response.failedProcesses.length > 0) {
                var processes = [];
                for (var i = 0; i < processInfo.response.failedProcesses.length; i++) {
                    if (processInfo.response.failedProcesses[i].name) {
                        processes.push(processInfo.response.failedProcesses[i].name);
                    }
                }
                $scope.workbenchOptions.warningOptions.warnings = ["Process Completed with Error [ " + processes + " ]"];
                $scope.workbenchOptions.warningOptions.showWarning = true;
            }
            if (processInfo && processInfo.response && processInfo.response.processes && processInfo.response.processes.result && processInfo.response.processes.result.length > 0) {
                $scope.workbenchOptions.pendingProcess = processInfo.response.processes;
                var data = processInfo.response.processes.result;
                var menus = [];
                for (var i = 0; i < data.length; i++) {
                    var processedCount = data[i].processed || 0;
                    var total = data[i].total || 0;
                    var percentage = (processedCount / total ) * 100;
                    menus.push({label:data[i].name + "-" + Math.round(percentage) + " % "});
                }
                $scope.workbenchOptions.processGroup.menus = menus;
                $scope.workbenchOptions.processGroup.showProcess = true;
                setTimeout(function () {
                    $scope.getProcesses();
                }, 5000);
            } else {
                $scope.workbenchOptions.pendingProcess = {};
                $scope.workbenchOptions.processGroup.showProcess = false;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });
    }

    $scope.reloadWindow = function () {
        window.location.reload();
    }

    $scope.sendFeedback = function (options) {
        return ApplaneDB.loadFeedbackResources("js/feedback").then(
            function () {
                if ($scope.workbenchOptions.busyMessageOptions) {
                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
                Feedback(options);
            }).fail(function (err) {
                if ($scope.workbenchOptions.busyMessageOptions) {
                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                }
                var title = "Sending feedback error...";
                var message = "There is an error in loading Feedback.js";
                $scope.workbenchOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            })
    }

    $scope.reportIssue = function (err) {
        if ($scope.workbenchOptions.busyMessageOptions) {
            $scope.workbenchOptions.busyMessageOptions.msg = "Loading...";
        }
        if ($scope.workbenchOptions.alertMessageOptions.message) {
            $scope.workbenchOptions.alertMessageOptions.message = null;
        }
        if ($scope.workbenchOptions.alertMessageOptions.html) {
            $scope.workbenchOptions.alertMessageOptions.html = null;
        }
        if ($scope.workbenchOptions.alertMessageOptions.detailMessage) {
            $scope.workbenchOptions.alertMessageOptions.detailMessage = null;
        }
        if ($scope.workbenchOptions.alertMessageOptions.showDetailMessage) {
            $scope.workbenchOptions.alertMessageOptions.showDetailMessage = false;
        }
        if ($scope.workbenchOptions.shortMessageOptions.msg) {
            $scope.workbenchOptions.shortMessageOptions.msg = undefined;
        }
        var errorStack = undefined;
        if (err) {
            errorStack = err.stack;
        } else if ($scope.workbenchOptions.alertMessageOptions.error) {
            errorStack = $scope.workbenchOptions.alertMessageOptions.error.stack;
        }
        $scope.sendFeedback({errorStack:errorStack});
    }

    $scope.googlePlusLogin = function () {
        var options = {};
        options.doNotLogoutFromGoogle = true;
        var scope = "";
        if ($scope.workbenchOptions.googleServicesInfo.mailtrackenabled) {
            scope += " gmail.readonly ";
        }
        if ($scope.workbenchOptions.googleServicesInfo.calenderenabled) {
            scope += "calendar ";
        }
        var __org__ = ApplaneDB.connection("userdb").db;
        options.redirect_to_url = "/rest/oauth/google?scope=" + scope + "&__org__=" + __org__;
        $scope.logOut(options);
    }

    //reconnect user with same view if session timeout -- rajit 09/may/2015
    $scope.reLogin = function (password) {
        return ApplaneDB.connection("userdb").reconnect(password).then(function () {
            $scope.workbenchOptions.warningOptions.showWarning = false;
            $scope.workbenchOptions.warningOptions.warnings = undefined;
            $scope.workbenchOptions.warningOptions.askPassword = false;
            $scope.workbenchOptions.warningOptions.showPassword = false;
        });
    };

    ApplaneDB.loadJs("ApplaneError/lib/BusinessLogicError");
});
