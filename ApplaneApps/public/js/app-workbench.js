var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

/*WorkbenchCtrl starts form here*/

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


/*pl-workbench starts from here*/
pl.directive('plWorkbench', ["$compile", '$timeout', function ($compile, $timeout) {
    return {
        restrict: "A",
        scope: false,
        compile: function () {
            return {

                pre: function ($scope, iElement, attrs) {
                    function getToken() {
                        var urlParams;
                        var match,
                            pl = /\+/g, // Regex for replacing addition symbol with a space
                            search = /([^&=]+)=?([^&]*)/g,
                            decode = function (s) {
                                return decodeURIComponent(s.replace(pl, " "));
                            },
                            query = window.location.search.substring(1);
                        urlParams = {};
                        while (match = search.exec(query))
                            urlParams[decode(match[1])] = decode(match[2]);

                        return urlParams;
                    }

                    var workbenchOptions = $scope.$eval(attrs.plWorkbench);
                    $scope.crmThemes = getToken();
                    $scope.toggleAppMenu = function ($event, menu, menus) {
                        $event.stopPropagation();
                        $event.preventDefault();
                        menu.open = !menu.open;
                        if (menu && menu.menus && menu._id) {
                            if (menu.isApplication) {
                                menu.uiMenus = menu.uiMenus || menu.menus;                                              // uiMenus will be used to bind with the current active application's menus
                            }
                            $timeout(function () {
                                for (var i = 0; i < menus.length; i++) {
                                    if (menus[i]._id == menu._id) {
                                        $("#" + menu._id).slideToggle('fast');
                                    } else {
                                        menus[i].open = false;
                                        $("#" + menus[i]._id).slideUp('fast');
                                    }
                                }
                            }, 10)

                        } else {
                            $scope.workbenchOptions.enableSliderMenu = undefined;
                            $scope.onApplicationMenuClick(menu);
                            $scope.removeSlideMenu(0);                                                                  //to remove the slide menu without waiting for transition completion.
                        }

                    }

                    $scope.$watch('workbenchOptions.enableSliderMenu', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue) && newValue == undefined) {
                            $scope.removeSlideMenu(300);                                                                //to wait for 300ms to complete the transition effect on slid menu.
                        }
                    });
                    $scope.removeSlideMenu = function (time) {
                        for (var i = 0; i < $scope.workbenchOptions.applications.length; i++) {
                            var app = $scope.workbenchOptions.applications[i];
                            if (app._id == $scope.workbenchOptions.selectedApplication) {
                                continue;
                            }
                            if (app.uiMenus) {
                                app.uiMenus = undefined;
                            }
                        }
                        var sliderWrapper = document.getElementsByClassName('pl-pageslide-wrapper');
                    }
                    $scope.toggleSideMenu = function ($event) {
                        var slidingArea = document.getElementById('slideMenu');
                        if ($scope.workbenchOptions.enableSliderMenu == undefined) {
                            var html = '<pl-slide-menu></pl-slide-menu>';
                            angular.element(slidingArea).html(($compile)(html)($scope));
                        }
                        setTimeout(function () {
                            $scope.workbenchOptions.enableSliderMenu = true;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, 0);

                    }
                    $scope.handleConfirmationActions = function (option) {
                        $scope.workbenchOptions.confirmMessageOptions.callback({"option": option.label});
                        delete $scope.workbenchOptions.confirmMessageOptions.callback;
                    }
                    var userDB = ApplaneDB.connection("userdb");
                    var token = userDB.token;

                    var template = "" +
                        "<section class='app-position-absolute app-top-position-zero app-left-position-zero app-right-position-zero app-bottom-position-zero' ng-class='{\"" + $scope.crmThemes.theme + "\":crmThemes.theme}'>" +
                        "       <header>" +
                        "        <div class='app-position-absolute app-top-position-zero app-left-position-zero app-right-position-zero applane-header'>" +
                        "          <div class='app-header'>" +
//                        "           <div class='applane-logo'></div>" +
                        "           <a class='white-menu' ng-click='toggleSideMenu($event)'><em></em><em></em><em></em></a>" +
                        "               <div class='bread-crumb'>" +
                        "                   <span class='pl-top-app-menu app-position-relative' style='margin-top: 15px;' ng-repeat='breabcrumbInfo in workbenchOptions.selectedMenuInfo'>" +
                        "                       <pl-breadcrumb-menu breadcrumb='breabcrumbInfo'></pl-breadcrumb-menu>" +
                        "                   </span>" +
                        "               </div>" +
                        '               <div id="slideMenu">' +
                        '           </div>' +
                        "           <article>" +
                        "               <div ng-show='workbenchOptions.developmentRight'  pl-menu-group = 'workbenchOptions.applicationSettingGroup' class=' pl-applications-setting' ></div>" +
                        "           </article>" +
                        "           <article class='usermenu slh'>" +
                        "               <div ng-if='!workbenchOptions.userIcon' class='app-float-left'><img class='app-menu-user defaultUser' /> </div>" +
                        "               <div ng-if='workbenchOptions.userIcon' class='app-float-left'><img class='app-menu-user' ng-src='/rest/file/download?token=" + token + "&filekey={{workbenchOptions.userIcon.key}}' /></div>" +
                        "               <div pl-menu-group='workbenchOptions.userMenuGroup'></div>" +
                        "           </article>" +
                        "           <article>" +
                        "               <div class='usermenu slh' ng-repeat='userFilter in workbenchOptions.userFilters'>" +
                        "                   <div pl-menu-group='userFilter'></div>" +
                        "               </div>" +
                        "           </article>" +
                        "           <article ng-show='workbenchOptions.showGoolgeIcon'><div class='usermenu google' ng-click='googlePlusLogin()' title='To Activate Your Goolge Email Tracking and Calender Setting'><i class='icon-google-plus-sign'></i></div></article>" +
                        "           <article ng-show='workbenchOptions.showOrgName'><div class='usermenu slh app-position-relative' ><span ng-bind='workbenchOptions.orgName'></span><span class='pipe-seperator'>|</span></div></article>" +
                        "           <article  ng-show='workbenchOptions.showRenderTime'>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.totalRenderTime'></div>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.gridRenderTime'></div>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.totalServerTime'></div>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.totalResponseTime'></div>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.totalJSTime'></div>" +
                        "           </article>" +
                        "           <article><div ng-show='workbenchOptions.processGroup.showProcess' class='usermenu' pl-menu-group='workbenchOptions.processGroup'></div></article>" +
                        "        <div class='top-search'></div>" +
                        "       </div>" +
                        "    </div>" +
                        "   </header>     " +
                        "   <article>" +
                        "        <div id='view' class='app-position-absolute' style='top:48px;left:0px;right:0px;bottom: 0px;'>" +
                        "            <div pl-view ng-repeat='view in workbenchOptions.views' ng-controller='ViewCtrl' class='app-position-absolute pl-view app-overflow-hiiden app-white-backgroud-color' ng-class='view.viewOptions.viewClass' ng-style='view.viewOptions.style' id='view_{{view.viewOptions.uniqueViewId}}'></div>" +
                        "        </div>" +
                        "   </article>" +
                        "</section>" +

                        "<aside>" +
                        "<div class='app-position-absolute pl-popup-background' ng-style='workbenchOptions.popupViewsStyle' style='top:0px;bottom:0px;right:0px;left:0px;visibility: hidden'>" +
                        "   <div class='popupwrapper app-overflow-auto app-pop-up-view app-mediumn-font' pl-view ng-repeat='view in workbenchOptions.popupViews' ng-class='view.viewOptions.viewClass' ng-controller='ViewCtrl' ng-style='view.viewOptions.popupStyle' id='view_{{view.viewOptions.uniqueViewId}}'></div> " +
                        "</div>" +
                        "</aside>" +

                        "<aside>" +
                        "    <div class='app-busy-message-container-false' ng-show='workbenchOptions.shortMessageOptions.msg' >" +
                        "       <div class='app-busy-message'>" +
                        "           <div ><span ng-bind='workbenchOptions.shortMessageOptions.msg'></span>" +
                        "           </div>" +
                        "       </div>" +
                        "   </div>" +
                        "</aside>" +
                        "<aside>" +
                        "   <div class='app-busy-message-container-true' ng-show='workbenchOptions.busyMessageOptions.msg'>" +
                        "      <div class='app-busy-message' ng-bind='workbenchOptions.busyMessageOptions.msg'></div>" +
                        "   </div>" +
                        "</aside>" +
                        "<aside>" +
                        "   <div class='app-busy-message-container-true' ng-show='workbenchOptions.confirmMessageOptions.title'>" +
                        "      <div class='app-pop-up-view confirm-popup'>" +
                        "           <div class='app-padding-ten-px app-color-white jqte_format_4' style='background: #ff8500;' ng-if='workbenchOptions.confirmMessageOptions.title'>" +
                        "               <span ng-bind='workbenchOptions.confirmMessageOptions.title'></span>" +
                        "               <span ng-click='workbenchOptions.confirmMessageOptions.title = undefined;' class='app-float-right'><i  class='icon-remove'></i></span>" +
                        "           </div>" +
                        "           <div class='app-padding-ten-px app-color-black' style='width: 75%;' ng-bind='workbenchOptions.confirmMessageOptions.message'></div>" +
                        "           <div class='app-padding-ten-px app-busy-message-container-true ' style='top:auto;' ng-if='workbenchOptions.confirmMessageOptions.options'>" +
                        "                <div ng-repeat='option in workbenchOptions.confirmMessageOptions.options' ng-class='option.class' style='min-width: 60px;' ng-click='handleConfirmationActions(option)' ng-bind='option.label'>" +
                        "                </div>" +
                        "           </div>" +
                        "       </div>" +
                        "    </div>" +
                        "</aside>" +

                        "<aside>" +
                        "   <div class='pl-warning-body'  ng-show='workbenchOptions.warningOptions.showWarning==true && workbenchOptions.warningOptions && workbenchOptions.warningOptions.warnings && workbenchOptions.warningOptions.warnings.length>0'>" +
                        "       <div class='pl-warning-title' ng-bind='workbenchOptions.warningOptions.title'></div>" +
                        "       <div ng-click='workbenchOptions.warningOptions.showWarning = false' class='pl-warning-close icon-remove'></div>" +
                        "       <div ng-click='reportIssue(workbenchOptions.warningOptions.error)' class='pl-report-issue'>Report</div>" +
                        "       <div ng-click='workbenchOptions.warningOptions.confirmFunction()' class='pl-report-issue' ng-show='workbenchOptions.warningOptions.promptUserWarning' >Proceed To Save</div>" +
                        "       <div class='pl-warning-content'>" +
                        "           <ul class='app-padding-verticle-five-px'> " +
                        "                 <li ng-repeat='warning in workbenchOptions.warningOptions.warnings track by $index'>" +
                        "                      <span ng-bind-html='warning'></span>" +
                        "                      <span class='pl-stack-detail' ng-click='workbenchOptions.warningOptions.showWarningStack=true' ng-show='workbenchOptions.warningOptions.showStack'>Detail</span>" +
                        "                      <span class='pl-display-block' ng-bind='workbenchOptions.warningOptions.showStack' ng-show='workbenchOptions.warningOptions.showWarningStack'></span>" +
                        "                      <span class='pl-stack-detail' ng-click='workbenchOptions.warningOptions.showPassword=true' ng-show='workbenchOptions.warningOptions.askPassword' >Click Here to Re-login." +
                        "                           <span ng-show='workbenchOptions.warningOptions.showPassword'><input ng-model='password' type='password' value='' placeholder='Enter Password'/><input type='button' value='Login' ng-click='reLogin(password)'  /></span>" +
                        "                       </span>" +
                        "                 </li>" +
                        "           </ul> " +
                        "       </div>" +
                        "   </div>" +
                        "</aside>" +
                        "<aside>" +
                        "   <div class='pl-popup-background' ng-show='workbenchOptions.alertMessageOptions && (workbenchOptions.alertMessageOptions.message || workbenchOptions.alertMessageOptions.html)'>" +
                        "       <div class='pl-popup-alert-body'  ng-show='workbenchOptions.alertMessageOptions && (workbenchOptions.alertMessageOptions.message || workbenchOptions.alertMessageOptions.html)'>" +
                        "           <div class='pl-warning-title' ng-bind='workbenchOptions.alertMessageOptions.title'></div>" +
                        "           <div ng-click='workbenchOptions.alertMessageOptions.message = null;workbenchOptions.alertMessageOptions.html = null;workbenchOptions.alertMessageOptions.detailMessage=null;workbenchOptions.alertMessageOptions.showDetailMessage=false;' class='pl-warning-close icon-remove'></div>" +
                        "           <div class='pl-popup-alert-content' >" +
                        "               <div class='pl-user-select' alert-message-html ng-show='workbenchOptions.alertMessageOptions.html'></div>" +
                        "               <div class='pl-user-select' ng-bind='workbenchOptions.alertMessageOptions.message' ng-show='workbenchOptions.alertMessageOptions.message'></div>" +
                        "               <div class='pl-user-select' ng-bind='workbenchOptions.alertMessageOptions.detailMessage' ng-show='workbenchOptions.alertMessageOptions.showDetailMessage'></div>" +
                        "               <div class='pl-footer-warning-body'>" +
                        "                   <div ng-show='workbenchOptions.alertMessageOptions.detailMessage' >" +
                        "                       <div ng-hide='workbenchOptions.alertMessageOptions.showDetailMessage' ng-click='workbenchOptions.alertMessageOptions.showDetailMessage = true' ><a href='' class='detail_link'>Show the details of this error</a></div>" +
                        "                       <div ng-show='workbenchOptions.alertMessageOptions.showDetailMessage' ng-click='workbenchOptions.alertMessageOptions.showDetailMessage = false' ><a href='' class='detail_link'>Hide the details of this error</a></div>" +
                        "                       <button ng-click='reloadWindow()' class='pl-detail'>Reload View</button>" +
                        "                   </div>" +
                        "                       <div ng-click='reportIssue()' ><a href='' style='clear:left;' class='detail_link'>Report issue</a></div>" +
                        "                   <div ng-show='!workbenchOptions.alertMessageOptions.doNotShowButton' class='app-text-align-right' ng-click='workbenchOptions.alertMessageOptions.message = null;workbenchOptions.alertMessageOptions.html = null;workbenchOptions.alertMessageOptions.detailMessage=null;workbenchOptions.alertMessageOptions.showDetailMessage=false;' >" +
                        "                       <button  class='pl-ok'>ok</button>" +
                        "                   </div>" +
                        "               </div>" +
                        "        </div>" +
                        "   </div>" +
                        "</aside>" +

                        "<aside>" +
                        "   <pl-confirmation-msg></pl-confirmation-msg>" +
                        "</aside>";
                    iElement.append($compile(template)($scope));
                },
                post: function ($scope, iElement) {

                }
            };
        }
    }
}]);

pl.directive('alertMessageHtml', ["$compile", function ($compile) {
    return {
        restrict: "A",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.$watch("workbenchOptions.alertMessageOptions.html", function (newValue, oldValue) {
                        iElement.html("");
                        if (newValue) {
                            iElement.append(($compile)(newValue)($scope));
                        }
                    });

                }
            }
        }
    }
}]);

pl.directive('plBreadcrumbMenu', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var template = "<span class='pl-breadcrumb-menu app-cursor-pointer' >" +
                        "               <span ng-bind='breabcrumbInfo.menu.label'></span>" +
                        "               <span class='app-position-absolute pl-breadcrumb-menu-list'>" +
                        "                   <ul>" +
                        "                       <li ng-repeat='breadcrumbMenu in breabcrumbInfo.parentMenu' ng-bind='breadcrumbMenu.label' ng-click='breadCrumbMenuClick(breadcrumbMenu)' ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[breadcrumbMenu._id] == true}' ng-show='breadcrumbMenu.isVisible'></li>" +
                        "                   </ul>" +
                        "               </span>" +
                        "           </span>" +
                        "           <span class='icon-chevron-right small' ng-show='$index < workbenchOptions.selectedMenuInfo.length - 1'></span>";
                    iElement.append(($compile)(template)($scope));
                    $scope.breadCrumbMenuClick = function (menu) {
                        if (menu.menus && menu.menus.length > 0) {
                            $scope.breadCrumbMenuClick(menu.menus[0]);
                        } else {
                            $scope.onApplicationMenuClick(menu);
                        }
                    }
                }
            }
        }
    }
}]);

pl.directive('plApplications', ['$compile', function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        template: '',
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    $scope.$watch("workbenchOptions.applications", function () {
                        timeout();
                    })

                    $scope.setMenuPlacement = function () {
                        var appOffsetX = iElement.offset().left + iElement.width();
                        var wrapperElm = iElement.find('ul.pl-second-menu');
                        var lastElm = iElement.find('ul.pl-second-menu').find('li.first').last();
                        if (lastElm.offset()) {
                            var rightPos = lastElm.offset().left + lastElm.width();
                            if (rightPos < appOffsetX) {
                                if (wrapperElm.find('li').length <= 1) {
                                    wrapperElm.css({'padding-left': appOffsetX + 'px'});
                                } else {
                                    wrapperElm.css({'padding-left': appOffsetX - rightPos + 50 + 'px'});
                                }
                            }
                        }
                    }

                    function timeout() {
                        var offset = iElement.offset();
                        var elementWidth = iElement.width();
                        var windowWidth = $(window).width();
                        if (offset && (windowWidth > 600) && ((offset.left + elementWidth) > (windowWidth - 300))) {
                            var index = $scope.$index;
                            var menusToPush = [];
                            var otherMenu = undefined;
                            while (index < $scope.workbenchOptions.applications.length) {
                                if ($scope.workbenchOptions.applications[index].others) {
                                    otherMenu = $scope.workbenchOptions.applications[index];
                                    break;
                                }
                                menusToPush.push($scope.workbenchOptions.applications[index]);
                                $scope.workbenchOptions.applications.splice(index, 1);
                            }
                            if (!otherMenu && menusToPush.length > 0) {
                                otherMenu = {label: "Others", others: true, menus: menusToPush, _id: '__others'};
                                $scope.workbenchOptions.applications.push(otherMenu);
                            } else {
                                for (var j = menusToPush.length - 1; j >= 0; j--) {
                                    otherMenu.menus.splice(0, 0, menusToPush[j]);
                                }
                            }

                        }

                    }
                }
            }
        }
    }
}]);

pl.directive('plMenuGroup', ["$compile", '$timeout', function ($compile, $timeout) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        template: "<div class='pl-menus-group-parent app-float-left '>" +
            "       <div ng-if='!menuGroupOptions.showMenus' class='app-float-left'  ng-class=\'{\"selectedmenu\":menuGroupOptions.selectedMenuInfo && ($index == menuGroupOptions.selectedMenuInfo[menuGroupOptions.level-1])}\'>" +
            "           <div ng-if='menuGroupOptions[menuGroupOptions.displayField] && !menuGroupOptions.onHover' ng-class='menuGroupOptions.menuClass' class='app-float-left'>" +
            "              <span class='app-float-left pl-shared flex-box' ng-if='!menuGroupOptions.showOptions' ng-click='onSelectedMenuGroupClick($event)'><span>{{menuGroupOptions[menuGroupOptions.displayField]}}</span> " +
            "                   <span ng-if='menuGroupOptions.recursiveFilter' ng-click='onRecursiveIconClick($event, menuGroupOptions)' >" +
            "                       <i style='font-size: 12px;  font-family: FontAwesome;' ng-if='menuGroupOptions.recursiveFilterValue' class='pl-shared icon-repeat app-padding-left-five-px'></i> " +
            "                       <i style='color: rgb(161, 161, 161);font-size: 12px;  font-family: FontAwesome;' ng-if='!menuGroupOptions.recursiveFilterValue' class='pl-shared icon-repeat app-padding-left-five-px'></i>" +
            "                   </span>" +
            "                   <i class='pl-shared app-padding-left-five-px icon-caret-right-down'></i></span>" +
            "              <span class='app-float-left flex-box' ng-click='onSelectedMenuGroupClick($event)' ng-if='menuGroupOptions.showOptions'>{{menuGroupOptions[menuGroupOptions.displayField]}} </span>" +
            "           </div>" +
            "           <div class='app-float-left pl-dropdown icon' ng-class='menuGroupOptions.iconClass'  ng-if='menuGroupOptions.isDropdown' title='{{menuGroupOptions.title}}' ng-click='onSelectedMenuGroupClick($event)'></div>" +
            "       </div>" +
            "       <div ng-if='menuGroupOptions.image' ng-click='onSelectedMenuGroupClick($event)' class=\"app-action-collection\"  >" +
            "           <img ng-src='{{menuGroupOptions.src}}' ng-class='menuGroupOptions.imgClass' />" +
            "       </div>" +
            "       <div ng-if='menuGroupOptions.class' ng-click='onSelectedMenuGroupClick($event)' class=\"app-action-collection\" ng-class='menuGroupOptions.class' ng-style='menuGroupOptions.style' title='{{menuGroupOptions.title || \"\"}}'>&nbsp;</div>" +
            "       <div ng-if='menuGroupOptions.action' ng-class='menuGroupOptions.actionClass'>" +
            "           <span class='app-float-left' ng-click='onSelectedMenuGroupClick($event)' ng-class='menuGroupOptions.actionInnerClass'>...</span>" +
            "       </div>" +
            "</div>",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.menuGroupOptions = $scope.$eval(attrs.plMenuGroup);
                    $scope.$watch("menuGroupOptions.menuChanged", function (newMenu, oldMenu) {
                        if (!angular.equals(newMenu, oldMenu)) {
                            if ($scope.menuGroupOptions.label && (angular.isUndefined($scope.menuGroupOptions.updateLabel) || $scope.menuGroupOptions.updateLabel)) {
                                $scope.updateLabel($scope.menuGroupOptions.selectedMenu);
                            }
                            var menu = $scope.menuGroupOptions.menus[$scope.menuGroupOptions.selectedMenu];
                            if (menu.onClick !== undefined) {
                                $scope[menu.onClick](menu);
                            } else if ($scope.menuGroupOptions && $scope.menuGroupOptions.onClick) {
                                $scope[$scope.menuGroupOptions.onClick](menu);
                            }
                        }
                    });

                    $scope.updateLabel = function (index) {
                        var menu = $scope.menuGroupOptions.menus[index];
                        $scope.menuGroupOptions.label = menu[$scope.menuGroupOptions.displayField];
                    }
                    if ($scope.menuGroupOptions && $scope.menuGroupOptions.selectedMenu) {
                        $scope.updateLabel($scope.menuGroupOptions.selectedMenu);
                    }
                },
                post: function ($scope, iElement) {
                    $scope.onRecursiveIconClick = function ($event, menu) {
                        $event.preventDefault();
                        $event.stopPropagation();
                        $scope[$scope.menuGroupOptions.recursionClick](menu);
                    }
                    $scope.onSelectedMenuGroupClick = function ($event) {
                        var template = undefined;
                        if ($scope.menuGroupOptions.menus && $scope.menuGroupOptions.menus.length > 0) {
                            $event.preventDefault();
                            $event.stopPropagation();
                            var isSubMenu = false;
                            template = "<div ";
                            if ($scope.menuGroupOptions.position == 'bottom') {
                                var popupWidth = $(window).width();
                                isSubMenu = true;
                                template += " style='width:" + popupWidth + "px" + "; background-color:rgba(248, 176, 97, 0.94); box-shadow: 0 1px 3px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(0,0,0,0.1), 0 4px 0 #FF8500;' class='";
                            }
                            else {
                                template += " class='pl-overflow-y-scroll";
                            }

                            template += " app-white-space-nowrap app-light-gray-backgroud-color app-small-popup'>" +
                                "<div ng-repeat='menu in menuGroupOptions.menus' ng-class='{\"pl-sub-menu\":" + isSubMenu + "}' pl-menu-group-menu class='pl-menu-group-label app-menu-label pl-line-height app-float-left' >" + "</div>" +
                                "</div>";
                        } else if ($scope.menuGroupOptions.template) {
                            template = $scope.menuGroupOptions.template;
                        }
                        if (angular.isUndefined(template)) {
                            return;
                        }

                        var popupScope = $scope.$new();
                        var p = new Popup({
                            autoHide: true,
                            hideOnClick: $scope.menuGroupOptions.hideOnClick !== undefined ? $scope.menuGroupOptions.hideOnClick : true,
                            deffered: true,
                            escEnabled: true,
                            html: $compile(template)(popupScope),
                            scope: popupScope,
                            element: $event.target,
                            position: $scope.menuGroupOptions.position || "bottom",
                            addInElement: false
                        });
                        p.showPopup();
                    };

                }
            }
        }
    }
}]);

pl.directive('plMenuGroupMenu', ["$compile", "$timeout", function ($compile, $timeout) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return {
                post: function ($scope, iElement) {

                    var menu = $scope.menu;
                    var template = '';
                    if (menu + "." + $scope.menuGroupOptions.displayField) {
                        template += '<div ng-class=\'{"selectedmenu":$index == menuGroupOptions.selectedMenuInfo[menuGroupOptions.level]}\'>' +
                            '           <div ng-if="!menu.href" class="app-pop-up-menu-label" ng-bind="menu[menuGroupOptions.displayField]" ng-class="menuGroupOptions.menuClass" ng-click="onMenuGroupOptionClick($index, $event)"></div>' +
                            '           <div ng-if="menu.href"  >' +
                            '               <a class="pl-action-link" href="{{menu.href}}" ng-bind="menu[menuGroupOptions.displayField]" download></a>' + // download property doesn't supported on safari
                            '           </div>' +
                            '        </div>';

                    }
                    iElement.append($compile(template)($scope));

                    $scope.onMenuGroupOptionClick = function ($index, $event) {
                        $scope.menuGroupOptions.selectedMenu = $index;
//                        if ($scope.menuGroupOptions.menus[$index].onClick) {
//                            $scope[$scope.menuGroupOptions.menus[$index].onClick]()
//                            return;
//                        } else if ($scope.menuGroupOptions.onClick) {
//                            $scope[$scope.menuGroupOptions.onClick]($scope.menu)
//                        } else {
                        $scope.menuGroupOptions.menuChanged = !$scope.menuGroupOptions.menuChanged;
//                        }
                    }
                }
            }
        }
    }
}]);

pl.directive('plConfirmationMsg', ["$compile", function ($compile) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement) {
                    var template = "<div class='app-position-absolute' ng-show='workbenchOptions.confirmationOptions' style='top:0px;bottom:0px;right:0px;left:0px;'>" +
                        "               <div class='popupwrapper app-overflow-auto app-pop-up-view'>" +
                        "                   <div class='app-width-full app-float-left app-header-background-color app-text-align-center app-font-weight-bold' style='line-height: 35px;' ng-bind='workbenchOptions.confirmationOptions.title'></div>" +
                        "                       <div class='app-float-left app-width-full app-text-align-center' style='padding: 15px 0px;line-height: 20px;' ng-bind-html='workbenchOptions.confirmationOptions.description'></div>" +
                        "                       <div class='app-float-left app-width-full app-text-align-center app-margin-bottom-five-px'>" +
                        "                               <div ng-repeat='option in workbenchOptions.confirmationOptions.options' class='app-button app-button-border app-button-margin app-button-shadow app-button-padding' ng-click='onConfirmClick(option)' ng-bind='option.label'></div>" +
                        "                       </div>" +
                        "                   </div> " +
                        "               </div>";

                    iElement.append($compile(template)($scope));

                },
                pre: function ($scope, iElement) {

                    $scope.onConfirmClick = function (option) {
                        var confirmationOptions = $scope.workbenchOptions.confirmationOptions;
                        if (option.onClick !== undefined) {
                            option.onClick(option);
                        } else if (confirmationOptions.onClick) {
                            confirmationOptions.onClick(option);
                        }
                        $scope.workbenchOptions.confirmationOptions = undefined;
                    }
                }
            }
        }
    }
}]);

pl.directive('plChangePassword', ['$compile', function () {
    return{
        restrict: 'EAC',
        replace: true,
        template: '   <div class="ng-scope" style="position: fixed;height: 100%;width: 100%;background: rgba(17, 17, 17, 0.39); ">' +
            '      <div class="app-pop-up-view  " style="background: url(\'../images/panel_bg.png\'); ">' +
            '          <div>' +
            '          </div>' +
            '              <div class=" " style="min-width: 500px;min-height: 220px; border: 1px solid #ccc;">' +
            '                 <div class="app-background-grey app-text-align-right">' +
            '                   <span class="">' +
            '                       <span class="btn-blue" ng-click="changePassword()" style="float:none;none;padding: 5px;"><label>Change Password</label></span>' +
            '                   </span>' +
            '                   <span class="">' +
            '                       <span class="btn-blue" ng-click="cancel()" style="float:none;none;padding: 5px;"><label>Cancel</label></span>' +
            '                   </span>' +
            '                 </div>' +
            '               <div class="top app-padding-ten-px">' +
            '                   <div  style="display: flex; margin-bottom: 5px;">' +
            '                      <span class="pl-form-label">' +
            '                          <label >Old Password </label>' +
            '                      </span>' +
            '                      <span class="form-template">' +
            '                          <input class="form-control" type="password" ng-model="oldPassword" />' +
            '                      </span>' +
            '                   </div>' +
            '                   <div  style="display: flex; margin-bottom: 5px;">' +
            '                       <span class="pl-form-label">' +
            '                          <label>New Password </label>' +
            '                       </span>' +
            '                       <span class="form-template">' +
            '                           <input class="form-control" type="password" ng-model="newPassword" >' +
            '                       </span>' +
            '                   </div>' +
            '                  <div  style="display: flex; margin-bottom: 5px;">' +
            '                       <span class="pl-form-label">' +
            '                           <label>Confirm Password </label>' +
            '                       </span>' +
            '                       <span class="form-template">' +
            '                           <input class="form-control" type="password" ng-model="confirmPassword"  >' +
            '                       </span>' +
            '                   </div>' +
            '                   <div>' +
            '                   </div>' +
            '               </div>' +
            '              </div>' +
            '          </div>' +
            '      </div>',
        compile: function () {
            return{
                post: function ($scope, iElement) {
                    $scope.cancel = function () {
                        $('#popup-changePass').remove();
                    }

                    $scope.changePassword = function () {
                        var param = {};
                        param.oldPassword = $scope.oldPassword;
                        param.newPassword = $scope.newPassword;
                        param.confirmPassword = $scope.confirmPassword;
                        if ($scope.workbenchOptions.busyMessageOptions) {
                            $scope.workbenchOptions.busyMessageOptions.msg = 'Loading..';
                        }
                        return ApplaneDB.connection("userdb").invokeFunction("User.resetPassword", [
                            param
                        ]).then(
                            function (response) {
                                console.log('result ' + response);
                                if ($scope.workbenchOptions.busyMessageOptions) {
                                    delete  $scope.workbenchOptions.busyMessageOptions.msg;
                                }
                                $('#popup-changePass').remove();
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }).fail(function (err) {
                                if ($scope.workbenchOptions.busyMessageOptions) {
                                    delete   $scope.workbenchOptions.busyMessageOptions.msg;
                                }
                                $scope.workbenchOptions.warningOptions.error = err;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            })

                    }

                }
            }
        }
    }
}]);

/*pl-view starts from here*/
pl.controller('ViewCtrl', function ($scope, $compile, $parse, $timeout, $http, $q) {
    var unwatcher = {};
    $scope.counter = {};                            // counter for server calls during autocomplete options call
    $scope.view.viewOptions.busyMessageOptions = $scope.view.viewOptions.busyMessageOptions || {};
    $scope.view.viewOptions.backgroundOptions = $scope.view.viewOptions.backgroundOptions || {};
    $scope.view.viewOptions.confirmMessageOptions = $scope.view.viewOptions.confirmMessageOptions || {};
    $scope.view.viewOptions.shortMessageOptions = $scope.view.viewOptions.shortMessageOptions || $scope.workbenchOptions.shortMessageOptions;
    $scope.view.viewOptions.warningOptions = $scope.view.viewOptions.warningOptions || $scope.workbenchOptions.warningOptions;
    if ($scope.view.viewOptions.warningOptions) {
        $scope.view.viewOptions.warningOptions.showWarning = false;
        $scope.view.viewOptions.warningOptions.warnings = [];
    }
    if (!$scope.view.viewOptions.alertMessageOptions) {
        $scope.view.viewOptions.alertMessageOptions = {};
        unwatcher.alertMessageOptions = $scope.$watch("view.viewOptions.alertMessageOptions.message", function () {
            if ($scope.view.viewOptions.alertMessageOptions && $scope.view.viewOptions.alertMessageOptions.message) {
                //open a popup here
                alert($scope.view.viewOptions.alertMessageOptions.title + "\n" + $scope.view.viewOptions.alertMessageOptions.message);
            }
        })
    }

    if (!$scope.view.viewOptions.warningOptions) {
        $scope.view.viewOptions.warningOptions = {};
        unwatcher.warningOptions = $scope.$watch("view.viewOptions.warningOptions.warnings", function (newWarnings) {
            if ($scope.view.viewOptions.warningOptions & $scope.view.viewOptions.warningOptions.warnings && $scope.view.viewOptions.warningOptions.warnings.length > 0) {
                //open a popup here
                alert($scope.view.viewOptions.warningOptions.title + "\n" + JSON.stringify($scope.view.viewOptions.warningOptions.warnings));
            }
        })
    }

    $scope.handleLookupUpsert = function (field) {
        try {
            var viewField = $scope.getViewField($scope.view.viewOptions.fields, field);
            if (angular.isUndefined(viewField)) {
                var title = "$scope.handleLookupUpsert in pl.view";
                var message = field + "field not found while handleLookupUpsert in pl-view !";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }

            var v = {
                ui: "form",
                $limit: 0,
                saveOptions: {editMode: true}
            };
            v.id = viewField.collection;
            v.popup = true;
            $scope[$scope.view.viewOptions.openV](v);
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }
    $scope.closePLView = function () {
        try {
            var parentSharedOptions = $scope.view.viewOptions.parentSharedOptions;
            if (parentSharedOptions) {
//                delete parentSharedOptions.selectedRowAction;
                delete parentSharedOptions.resizable;
                delete parentSharedOptions.referredView;
            }
            $scope[$scope.view.viewOptions.closeV]($scope.view.viewOptions.viewIndex);
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }
    // result is passed to refreshGridModel method to reload the data of grid and form views used in advanced dashboards (by manjeet sangwan)
    $scope.refreshGridModel = function (result, options) {
        var busyMessageOn = true;
        /* as CPU keep busy in rendering grid (specially in large data of 100 rows takes 3-4 sec), we set busyMessageOptions till rendering done and remove background message. Case on pl-form screen having large parent data*/
        $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
        if (options && options.background && $scope.view.viewOptions.backgroundOptions) {
            $scope.view.viewOptions.alignModel = false;
        }
        /*if (options && options.background && $scope.view.viewOptions.backgroundOptions) {
         $scope.view.viewOptions.alignModel = false;
         $scope.view.viewOptions.backgroundOptions.msg = "../images/load2.gif";
         } else if ($scope.view.viewOptions.busyMessageOptions) {
         if ($scope.view.viewOptions.busyMessageOptions.msg === undefined) {
         //During detail row action - nested table model was getting refreshed that was causing loading message to be disappeared before original data comes.
         busyMessageOn = true;
         $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
         }
         }*/

        return dataModel.refresh(result).then(
            function (result) {
                try {
                    if ($scope.view.viewOptions.aggregateAsync && aggregateData && aggregateData.$async) {
                        $scope.populateAggregateDataInAsync();
                    }
                    if (options && options.background && $scope.view.viewOptions.backgroundOptions) {
                        delete $scope.view.viewOptions.backgroundOptions.msg;
                    }
                    if ($scope.view.viewOptions.busyMessageOptions && busyMessageOn) {
                        busyMessageOn = false;
                        delete $scope.view.viewOptions.busyMessageOptions.msg;
                    }
                    if (!$scope.view.viewOptions.nested) {
                        $scope.view.viewOptions.sharedOptions.saveOptions.editMode = false;
                    }
                    // when refresh grid model is called cross Tab  Info is populated after resolving the parameters passed in the crossTabInfo
                    if ($scope.view.viewOptions.crossTabInfo) {
                        $scope.resolveCrossTabParameters($scope.view.viewOptions.crossTabInfo);
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                } catch (e) {
                    if ($scope.handleClientError) {
                        $scope.handleClientError(e);
                    }
                }
            }).fail(function (err) {
                if ($scope.view.viewOptions.busyMessageOptions) {
                    delete $scope.view.viewOptions.busyMessageOptions.msg;
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            });


    }

    $scope.addWatch = function (dModel, watch) {

        function watchData() {
            dModel.on("onPreEvent", function () {
                $timeout(function () {
                    if (dModel.isTriggeringEvents() && $scope.view.viewOptions.busyMessageOptions) {                                           // show loading image on the top when default resolves
                        $scope.view.viewOptions.busyMessageOptions.msg = "Resolving...";
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }, 500)

            });

            dModel.on("onPostEvent", function (err) {
                if ($scope.view.viewOptions.busyMessageOptions && $scope.view.viewOptions.busyMessageOptions.msg == "Resolving...") {                                           // show loading image on the top when default resolves
                    if (dModel.saving) {
                        $scope.view.viewOptions.busyMessageOptions.msg = "Saving...";   //case when click on save button, cause focus lost and default value are resolviong of focus lost, save will wait until it get resloved
                    } else {
                        delete $scope.view.viewOptions.busyMessageOptions.msg;
                    }
                }
                if (err) {
                    if (typeof err === "string") {
                        err = new Error(err);
                    }
                    if (ui == 'form') {
                        $scope.formOptions.save = false;
                    } else if (ui == 'grid') {
                        $scope.gridOptions.save = false;
                    }
                    if ($scope.view.viewOptions.busyMessageOptions) {
                        delete $scope.view.viewOptions.busyMessageOptions.msg;
                    }
                    $scope.view.viewOptions.warningOptions.error = err;
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            });


            unwatcher.data = $scope.$watch("data", function (newValue, oldValue) {
                $timeout(function () {
                    try {
                        $scope.view.viewOptions.sharedOptions.dataChanged = !$scope.view.viewOptions.sharedOptions.dataChanged;//it is used for showing columns in nested table on the basis of when value
                        var p = dModel.handleValueChange(newValue, oldValue, $q);
                    } catch (e) {
                        if ($scope.view.viewOptions) {
                            $scope.view.viewOptions.warningOptions.error = e;
                        }
                    }
                }, 0)
            }, true)
        }


        if (watch) {
            watchData();
        }
        if (dModel.on) {
            dModel.on("onPreSave", function () {
                if ($scope.view.viewOptions.busyMessageOptions) {
                    if ($scope.view.viewOptions.shortMessageOptions && $scope.view.viewOptions.shortMessageOptions.msg) {
                        delete $scope.view.viewOptions.shortMessageOptions.msg;
                    }
                    $scope.view.viewOptions.busyMessageOptions.msg = "Saving...";
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            })

            function populateWarningsMessages(collection, fields, warnings, warningMessages, plabel) {
                for (var i = 0; i < warnings.length; i++) {
                    var warning = warnings[i];
                    for (var key in warning) {
                        var warningValue = warning[key];
                        if (key != "_id") {
                            var fieldDef = Utility.getField(key, fields);
                            if (!fieldDef) {
                                continue;
                            }
                            var label = plabel ? plabel + "." + fieldDef.label : fieldDef.label;
                            if (warningValue === true) {
                                var message = "Mandatory fields can not be left blank [" + label + "] in collection [" + collection + "]";
                                warningMessages.push(message);
                            } else if (fieldDef.type === "fk" && fieldDef.displayField) {
                                var displayField = fieldDef.displayField;
                                if (warningValue[displayField] === true) {
                                    message = "Mandatory fields can not be left blank [" + label + "] in collection [" + collection + "]";
                                    warningMessages.push(message);
                                }
                            }
                            if (fieldDef.fields) {
                                if (!fieldDef.multiple) {
                                    warningValue = [warningValue];
                                }
                                populateWarningsMessages(collection, fieldDef.fields, warningValue, warningMessages, label);
                            }
                        }
                    }
                }
            }

            dModel.on("onSave", function (err, result, additionalResult) {
                if (err) {
                    if (err.validations) {
                        var warningMessages = [];
                        var fields = $scope.view.viewOptions.fields;
                        var collection = fields && fields.length > 0 && fields[0].collectionid ? fields[0].collectionid.collection : $scope.view.viewOptions.collection;
                        populateWarningsMessages(collection, fields, err.validations, warningMessages, undefined);
                        err.message = warningMessages;
                        $scope.view.viewOptions.sharedOptions.validations = err.validations;
                    }
                    $scope.view.viewOptions.warningOptions.error = err;
                    $scope.view.viewOptions.warningOptions.confirmFunction = $scope.view.viewOptions.confirmFunction;
                    if (err.message == Util.NOT_CONNECTED_MESSAGE) {
                        if (ui == 'grid') {
                            $scope.gridOptions.save = false;
                        } else if (ui == 'form') {
                            $scope.formOptions.save = false;
                        }
                    }

                }
                if (additionalResult && additionalResult.postSaveMessage) {
                    $scope.view.viewOptions.alertMessageOptions.html = additionalResult.postSaveMessage.html;
                    $scope.view.viewOptions.alertMessageOptions.doNotShowButton = additionalResult.postSaveMessage.doNotShowButton;
                    $scope.view.viewOptions.alertMessageOptions.title = additionalResult.postSaveMessage.title;
                }

                if (additionalResult && additionalResult.warnings && additionalResult.warnings.length > 0) {
                    viewOptions.warningOptions.showWarning = true;
                    viewOptions.warningOptions.warnings = additionalResult.warnings;
                } else {
                    viewOptions.warningOptions.warnings = [];
                }

                if ($scope.view.viewOptions.busyMessageOptions) {
                    if (dModel.isTriggeringEvents()) {
                        // do nothing, message will be removed by resloving it self
                    } else {
                        delete $scope.view.viewOptions.busyMessageOptions.msg;
                    }

                }


                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            })
            dModel.on("onRefresh", function (err, data) {
                    if (err) {
                        $scope.view.viewOptions.warningOptions.error = err;
                    } else {
                        $scope.view.viewOptions.warningOptions.error = undefined;
                        if (!data) {
                            data = [];
                            dModel.setData(data);
                        }
                        populatePageOptions();
                        $scope.data = data;
                    }


                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            )
        }


    }
    $scope.getViewField = function (viewFields, field) {
        if (!viewFields || viewFields.length == 0) {
            return;
        }
        var indexOfDot = undefined;
        if (typeof field == 'object') {
            return field;
        } else {
            indexOfDot = field.indexOf(".");
        }
        //first match complete as dotted field can be defined in actions of filterType
        for (var i = 0; i < viewFields.length; i++) {
            if (viewFields[i].field == field) {
                return viewFields[i];
            }

        }
        while (indexOfDot >= 0) {
            var firstField = field.substring(0, indexOfDot);
            var field = field.substring(indexOfDot + 1);
            var newViewField = $scope.getViewField(viewFields, firstField);
            if (!newViewField) {
//                throw new Error("No field found in getViewField >>>" + firstField + ">>>>viewFields>>>" + JSON.stringify(viewFields))
                return;
            }
            viewFields = newViewField.fields;
            indexOfDot = field.indexOf(".");
        }

        if (!viewFields || viewFields.length == 0) {
            return;
        }

        for (var i = 0; i < viewFields.length; i++) {
            if (viewFields[i].field == field) {
                return viewFields[i];
            }
        }

    }

    function ensureFieldInFkQuery(fieldToCheck, queryFields) {
        removeParentField(fieldToCheck, queryFields);
        queryFields[fieldToCheck] = 1;

    }


    function addFieldsToFKQuery(fields, queryFields, parentField) {
        if (fields && fields.length > 0) {
            for (var i = 0; i < fields.length; i++) {
                var fieldToCheck = fields[i];
                if (fieldToCheck.field) {


                    var newField = parentField ? parentField + "." + fieldToCheck.field : fieldToCheck.field;
                    ensureFieldInFkQuery(newField, queryFields);

                    if (fieldToCheck.displayField) {
                        ensureFieldInFkQuery(newField + "." + "_id", queryFields);
                        ensureFieldInFkQuery(newField + "." + fieldToCheck.displayField, queryFields)

                        if (fieldToCheck.otherDisplayFields) {
                            for (var j = 0; j < fieldToCheck.otherDisplayFields.length; j++) {
                                ensureFieldInFkQuery(newField + "." + fieldToCheck.otherDisplayFields[j], queryFields)
                            }
                        }

                    }
                    if (fieldToCheck.fields && fieldToCheck.fields.length > 0) {
                        ensureFieldInFkQuery(newField + "." + "_id", queryFields);
                        addFieldsToFKQuery(fieldToCheck.fields, queryFields, newField);
                    }


                }


            }
        }

    }

    $scope.getLookupData = function (viewValue, field, $fetchAllData, asFilter) {
        $scope.counter[field] = $scope.counter[field] || 0;
        $scope.counter[field]++;
        var newCounter = $scope.counter[field];
        if (field && field.fts) {
            var options = getLookUpOptions($fetchAllData, viewValue, field.options, field);

            return options;
        }
        var viewField = undefined;
        try {
            viewField = $scope.getViewField($scope.view.viewOptions.fields, field);
            if (!viewField) {
                viewField = $scope.getViewField($scope.view.viewOptions.actions, field);
            }


            if (!viewField) {
                var title = "$scope.getLookupData in pl.view";
                var message = "Field not found >>>" + field + ">>>Available fields >>>" + JSON.stringify($scope.view.viewOptions.fields);
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }

            var fieldOptions = undefined;
            if (viewField.ui == "duration") {
                fieldOptions = ["Hrs", "Days", "Minutes"];
            }

            if (viewField.type == 'string' && viewField.ui == 'time') {
                fieldOptions = ["00:00 AM", "00:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM",
                    "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM", "6:00 AM",
                    "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM",
                    "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
                    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM",
                    "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM",
                    "10:30 PM", "11:00 PM", "11:30 PM"];
            }

            if (viewField.booleanFilterMapping) {
                fieldOptions = viewField.booleanFilterMapping;
            }
            if (viewField.options && viewField.options.length > 0) {
                fieldOptions = viewField.options;
            }

            if (fieldOptions) {
                var options = getLookUpOptions($fetchAllData, viewValue, fieldOptions, field);
                return options;
            }
            var collection = viewField.collection;
            var viewFieldDisplay = viewField.displayField;
            if (viewField.ui == "currency") {
                collection = "pl.currencies";
                viewFieldDisplay = "currency";
            }
            var fkFilter = {};
            if (viewField.ui == "unit") {
                collection = "pl.units";
                viewFieldDisplay = "unit";
            }
            if (!collection) {
                return [];
            }

            var query = {
                $collection: collection,
                $fields: {},
                $limit: 200
            };
            if (viewField.sort !== undefined) {
                query.$sort = JSON.parse(viewField.sort);
            }

            addFieldsToFKQuery(viewField.fields, query.$fields);


            if (viewField.otherDisplayFields) {
                for (var i = 0; i < viewField.otherDisplayFields.length; i++) {
                    ensureFieldInFkQuery(viewField.otherDisplayFields[i], query.$fields)
                }
            }


            if (viewFieldDisplay) {
                ensureFieldInFkQuery(viewFieldDisplay, query.$fields)
            }

            if (viewField.events) {
                var events = viewField.events;
                if (typeof events === "string") {
                    events = JSON.parse(events);
                }
                if (!(Array.isArray(events))) {
                    events = [events];
                }
                query.$events = events;
            }

            var resolvedParameters = {};
            if (dataModel && viewField.parameters) {
                resolveDataModelParameters(viewField, resolvedParameters, asFilter);
            }
            if (viewField.roleid && viewField.roleid.id) {
                resolvedParameters.__role__ = viewField.roleid.id;
            }
            query.$parameters = resolvedParameters;
            var referredField = typeof field === "object" ? field.field : field;
            if ($scope.view.viewOptions.dataField) {
                referredField = $scope.view.viewOptions.dataField + "." + referredField;
            }
            var referredCollection = viewField.collectionid ? viewField.collectionid.collection : undefined;
            if (referredField && referredCollection) {
                query.$context = {referredField: referredField, referredCollection: referredCollection};
            }
            if (viewField.filter) {
                if (!angular.isObject(viewField.filter)) {
                    viewField.filter = JSON.parse(viewField.filter)
                }
                fkFilter = angular.copy(viewField.filter);
            }
            if (fkFilter) {
                query.$filter = fkFilter;
            }

            if ($fetchAllData) {
                viewValue = "";
            }
            var d = $q.defer();
            $scope.fkTimeOut = $scope.fkTimeOut || {};
            var previousTimeOut = $scope.fkTimeOut[viewField.field];

            if (previousTimeOut) {
                clearTimeout(previousTimeOut.timeOut);
                previousTimeOut.promise.resolve(undefined);
                previousTimeOut.timeOut = undefined;
                previousTimeOut.promise = undefined;
                delete $scope.fkTimeOut[viewField.field];
            }

            var fkTimeOut = setTimeout(function () {
                delete $scope.fkTimeOut[viewField.field];
                var fkOptions = {
                    cacheEnabled: viewField.cache,
                    useLowerCase: viewField.useLowerCase
                };
                if (viewField.otherDisplayFields) {
                    fkOptions.otherDisplayFields = viewField.otherDisplayFields;
                }
                dataModel.fkQuery(query, viewFieldDisplay, viewValue, fkOptions).then(
                    function (res) {
                        if (newCounter >= $scope.counter[field]) {
                            if (viewField && viewField.showNullFilter && asFilter) {
                                var noneFilter = {_id: "__idNone", name: "No value"};
                                res.response.result.splice(0, 0, noneFilter);
                            }
                            if ($fetchAllData && viewField.defaultOptions && asFilter) {
                                for (var i = 0; i < viewField.defaultOptions.length; i++) {
                                    res.response.result.splice(0, 0, viewField.defaultOptions[i]);
                                }
                            }
                            d.resolve(res.response.result);
                        } else {
                            d.resolve(undefined);
                        }
                    }).fail(function (err) {
                        if (err) {
                            $scope.view.viewOptions.warningOptions.error = err;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                        d.reject(err);
                    });
            }, 250)
            $scope.fkTimeOut[viewField.field] = {
                timeOut: fkTimeOut,
                promise: d
            };
            return d.promise;
        } catch (err) {
            $scope.view.viewOptions.warningOptions.error = err;
            return;
        }
    };

    function resolveLookUpOptions(query, options, field) {
        if (query) {
            query = query.toLowerCase();
        }
        if (!query || angular.isUndefined(query) || query.toString().trim().length == 0) {
            return options;
        }
        var resolvedOptions = [];
        var optionsCount = options && options.length > 0 ? options.length : 0;

        for (var i = 0; i < optionsCount; i++) {
            var option = options[i];

            if (option.toLowerCase().indexOf(query) == 0) {
                resolvedOptions.push(option);
            }
        }

//        if (resolvedOptions.length == 0) {
//            if (field.fts) {
//                return undefined;
//            } else {
//                resolvedOptions.push("No Data Found");
//            }
//
//        }

        return resolvedOptions;


    }

    function getLookUpOptions($fetchAllData, viewValue, fieldOptions, field) {
        var deferred = $q.defer();
        viewValue = $fetchAllData ? '' : viewValue;
        var options = resolveLookUpOptions(viewValue, fieldOptions, field);
        deferred.resolve(options);
        return deferred.promise;
    }

    function resolveDataModelParameters(field, resolvedParameter, asFilter) {
        var dataModelParameters = dataModel.getRowParameters();
        var currentRowParameters = $scope.view.viewOptions.sharedOptions.currentRow || {};
        if (currentRowParameters) {
            currentRowParameters = angular.copy(currentRowParameters);
        }
        dataModelParameters = dataModelParameters || {};
        dataModelParameters = angular.copy(dataModelParameters);
        for (var k   in dataModelParameters) {
            if (currentRowParameters[k] === undefined) {
                currentRowParameters[k] = dataModelParameters[k];
            }
        }
        currentRowParameters.__viewId = $scope.view.viewOptions.id;
        currentRowParameters.__collectionId = $scope.view.viewOptions.collection_id;
        currentRowParameters.__mainCollectionId = $scope.view.viewOptions.mainCollection_id;
        var userDB = ApplaneDB.connection("userdb");
        currentRowParameters.__userId = userDB.user;
        if (!angular.isObject(field.parameters)) {
            field.parameters = JSON.parse(field.parameters);
        }
        $scope.resolveParameters(field.parameters, currentRowParameters, resolvedParameter);//first resolved from datamodel parameters, required for running parentfieldid filter in pl.fields (it require collectionid which is available in parameters of datamodel)
        if (asFilter) {
            var userPreferenceOptions = $scope.view.viewOptions.userPreferenceOptions;
            var filterInfo = userPreferenceOptions && userPreferenceOptions.filterInfo ? userPreferenceOptions.filterInfo : [];
            for (var key in field.parameters) {
                var value = field.parameters[key];
                var dollarIndex = value.indexOf("$");
                if (dollarIndex >= 0) {
                    value = value.substring(dollarIndex + 1);
                    for (var i = 0; i < filterInfo.length; i++) {
                        if (Util.resolveDot(filterInfo[i], value) !== undefined) {
                            $scope.resolveParameters(field.parameters, filterInfo[i], resolvedParameter);
                        }
                    }
                }
            }
        }
        var queryGridFilter = $scope.view.viewOptions.queryGrid ? $scope.view.viewOptions.queryGrid.$filter : undefined;
        if (queryGridFilter && Object.keys(queryGridFilter).length > 0) { //filter of organization was coming due to first record but when visibility of organization was set false then on applying filter data was not coming in filter so filter was applied by taking parameters from field --did for singhania praveen goel's case
            for (var key in field.parameters) {
                if (resolvedParameter[key] === undefined) {
                    var paramVal = field.parameters[key];
                    if (paramVal && typeof paramVal === "string" && paramVal.indexOf("$") == 0) {
                        paramVal = paramVal.substring(1);
                        var lastIndexOfId = paramVal.lastIndexOf("._id");
                        if (lastIndexOfId > 0) {
                            paramVal = paramVal.substring(0, lastIndexOfId);
                        }
                        resolvedParameter[key] = Util.resolveDot(queryGridFilter, paramVal);
                    }
                }
            }
        }
    }

    $scope.print = function (html) {
        try {
            $('.pl-print-content').remove();
            var iframe = document.createElement('iframe');
            $('body').append(iframe);
            $(iframe).css({
                'width': '100%',
                'height': '100%'
            });
            $(iframe).addClass('pl-print-content');
            var iFrameDoc = iframe.contentDocument || iframe.contentWindow.document;
            iFrameDoc.write(html);
            $timeout(function () {
                iframe.contentWindow.print();
            }, 100)
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }


    function confirmAllRowSelection(action, dataClone, v, selectedRows) {
        if ($scope.view && $scope.view.viewOptions && $scope.view.viewOptions.sharedOptions && $scope.view.viewOptions.sharedOptions.pageOptions && $scope.view.viewOptions.sharedOptions.pageOptions.allRowSeleceted) {
            var options = {"action": action, "dataClone": dataClone, "v": v, "selectedRows": selectedRows};
            //To confirm for selecting all rows from the UI, require in case of invoke and update. -- Rajit garg
            showConfirmationMessage(options);
        } else {
            invoke(action, dataClone, v, selectedRows);
        }
    }

    function showConfirmationMessage(options) {
        $scope.view.viewOptions.confirmMessageOptions = $scope.view.viewOptions.confirmMessageOptions || {};
        $scope.view.viewOptions.confirmMessageOptions.title = "Confirm bulk action";
        $scope.view.viewOptions.confirmMessageOptions.message = "This action will affect all " + $scope.view.viewOptions.sharedOptions.pageOptions.count + " records in " + $scope.view.viewOptions.label + ". Are you sure you want to continue?"
        $scope.view.viewOptions.confirmMessageOptions.options = [
            {
                label: "Ok",
                class: 'btn-blue'
            },
            {
                label: "Cancel",
                'class': 'pl-cancel-btn '
            }
        ]
        $scope.view.viewOptions.confirmMessageOptions.callback = function (selectedOptions) {
            try {
                var v = options && options["v"] ? options["v"] : undefined;
                if (selectedOptions.option == "Ok") {
                    if (options && options["update"]) {
                        var formUpdates = options["formUpdates"] || {};
                        var params = {};
                        params["v"] = v;
                        params["requestQuery"] = angular.copy($scope.view.viewOptions.queryGrid);
                        params["__allrowselected__"] = true;
                        updateAsync(formUpdates, params);
                    } else {
                        var action = options && options["action"] ? options["action"] : {};
                        action.parameters = action.parameters || {};
                        if (typeof action.parameters == "string" && action.parameters.length > 0) {
                            action.parameters = JSON.parse(action.parameters);
                        }
                        action.parameters.__allrowselected__ = true;
                        action.parameters.requestQuery = angular.copy($scope.view.viewOptions.queryGrid);
                        var dataClone = options && options["dataClone"] ? options["dataClone"] : undefined;
                        var selectedRows = options && options["selectedRows"] ? options["selectedRows"] : undefined;
                        invoke(action, dataClone, v, selectedRows);
                    }
                } else {
                    if (v && v.viewOptions && v.viewOptions.sharedOptions) {
                        v.viewOptions.sharedOptions.closed = true;
                    }
                }
                $scope.view.viewOptions.confirmMessageOptions.title = undefined;
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }

    function updateAsync(formUpdates, params) {
        dataModel.updateAsync(formUpdates, params).then(
            function (result) {
                var v = params && params["v"] ? params["v"] : undefined;
                if (v && v.viewOptions && v.viewOptions.sharedOptions) {
                    v.viewOptions.sharedOptions.closed = true;
                }
                if ($scope.view.viewOptions.processOptions) {
                    $scope.view.viewOptions.processOptions.processInitiated = !$scope.view.viewOptions.processOptions.processInitiated;
                }
                if ($scope.view.viewOptions.ui == "grid") {
                    $scope.refreshGridModel();
                } else if ($scope.view.viewOptions.ui == "form") {
                    $scope.refreshFormDataModel();
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }).fail(function (err) {
                $scope.view.viewOptions.warningOptions.error = err;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            });
    }

    function invoke(action, dataClone, v, selectedRows) {
        dataClone = dataClone || {};
        var _id = undefined;
        if (selectedRows) {
            if (Array.isArray(selectedRows)) {
                _id = [];
                for (var i = 0; i < selectedRows.length; i++) {
                    _id.push(selectedRows[i]._id);
                }
            } else {
                _id = selectedRows._id;
            }
        }

        dataClone._id = _id;
        if (action.requestView) {
            dataClone.requestView = $scope.view.viewOptions.requestView;
        }


        if (dataModel && action.parameters) {
            resolveDataModelParameters(action, dataClone);
        }
        if (action.downloadFile) {
            var userDB = ApplaneDB.connection("userdb");
            var token = userDB.token;
            var form = document.createElement("form");
            form.setAttribute("method", "post");
            form.setAttribute("action", "/rest/invoke");
            var functionInput = document.createElement("input");
            functionInput.setAttribute("name", "function");
            functionInput.setAttribute("value", action.function);
            functionInput.setAttribute("type", "hidden");
            var parametersInput = document.createElement("input");
            parametersInput.setAttribute("name", "parameters");
            parametersInput.setAttribute("value", JSON.stringify([dataClone]));
            parametersInput.setAttribute("type", "hidden");
            var tokenInput = document.createElement("input");
            tokenInput.setAttribute("name", "token");
            tokenInput.setAttribute("value", token);
            tokenInput.setAttribute("type", "hidden");
            form.appendChild(functionInput);
            form.appendChild(parametersInput);
            form.appendChild(tokenInput);
            document.body.appendChild(form);    //required for firefox
            form.submit();
            document.body.removeChild(form);    //required for firefox
            if (v && v.viewOptions && v.viewOptions.sharedOptions) {
                v.viewOptions.sharedOptions.closed = true;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
            return;
        }
        if ($scope.workbenchOptions && $scope.workbenchOptions.busyMessageOptions) {//worked for invoke function called from row action of dashboard
            $scope.workbenchOptions.busyMessageOptions.msg = "Loading...";
        } else if ($scope.view.viewOptions.busyMessageOptions) {
            $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
        }
        // this action is set on the cross tab enabled nested grid to clear old data.
        if (action.function === "populateCrossTab") {
            $scope.populateCrossTabInfo($scope.view.viewOptions.crossTabInfo, dataClone, true);
        }
        else {
            dataModel.invoke(action.function, [dataClone], {
                async: action.async,
                processName: action.label,
                anchor: true
            }).then(
                function (result) {


                    if (v && v.viewOptions && v.viewOptions.sharedOptions) {
                        v.viewOptions.sharedOptions.closed = true;
                    }
                    if ($scope.view.viewOptions.busyMessageOptions) {
                        delete $scope.view.viewOptions.busyMessageOptions.msg;
                    }
                    if ($scope.workbenchOptions && $scope.workbenchOptions.busyMessageOptions) {//worked for invoke function called from row action of dashboard
                        delete $scope.workbenchOptions.busyMessageOptions.msg;
                    }
                    if ($scope.view.viewOptions.processOptions) {
                        if (result && result.processid) {
                            //this work is done for getting process error info, if process fails before 5 sec. -- rajit garg
                            if ($scope.workbenchOptions) {
                                $scope.workbenchOptions.pendingProcess = $scope.workbenchOptions.pendingProcess || {};
                                $scope.workbenchOptions.pendingProcess.result = $scope.workbenchOptions.pendingProcess.result || [];
                                $scope.workbenchOptions.pendingProcess.result.push({"_id": result.processid});
                            }
                        }
                        $scope.view.viewOptions.processOptions.processInitiated = !$scope.view.viewOptions.processOptions.processInitiated;
                    }

                    if (result.response && result.response.redirect_to_url) {
                        var a = document.createElement('a');
                        a.setAttribute('href', result.response.redirect_to_url);
                        var target = result.response.target || "_blank"
                        a.setAttribute('target', target);
                        document.body.appendChild(a);
                        a.click();
                    } else if (result.response && result.response.useAsData && result.response.data) {
                        var resultData = result.response.data;
                        var scopeData = $scope.data;
                        if (scopeData) {
                            for (var i = scopeData.length - 1; i >= 0; i--) {
                                scopeData.splice(i, 1);
                            }
                        }
                        for (var i = 0; i < resultData.length; i++) {
                            dataModel.insert(resultData[i]);
                        }
                    } else if (result.response && result.response.useAsPreview && result.response.data) {
                        var view = {};
                        view.viewOptions = {};
                        view.viewOptions.parentSharedOptions = $scope.view.viewOptions.sharedOptions;
                        view.viewOptions.ui = "html";
                        view.viewOptions.label = "Preview";
                        view.viewOptions.data = "data";
                        view.viewOptions.close = true;
                        view.viewOptions.viewResize = true;
                        view.viewOptions.fullMode = true;
                        view.viewOptions.actions = [
                            {
                                type: "print",
                                id: "print",
                                label: "print",
                                template: "<div class='printer-image' ng-click='printHTML()'></div>"
                            }
                        ]
                        view.viewOptions.resizeV = viewOptions.resizeV;
                        view.data = result.response.data;
                        $scope[$scope.view.viewOptions.openV](view);
                    } else if (result.response && result.response.useAsPrint && result.response.data) {
                        $scope.print(result.response.data);
                    } else if (action.refreshData) {
                        if ($scope.view.viewOptions.ui == "grid") {
                            $scope.refreshGridModel();
                        } else if ($scope.view.viewOptions.ui == "form") {
                            $scope.refreshFormDataModel();
                        }
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }).fail(function (err) {
                    $scope.view.viewOptions.warningOptions.error = err;
                    if ($scope.view.viewOptions.busyMessageOptions) {
                        delete $scope.view.viewOptions.busyMessageOptions.msg;
                    }
                    if ($scope.workbenchOptions && $scope.workbenchOptions.busyMessageOptions) {//worked for invoke function called from row action of dashboard
                        delete $scope.workbenchOptions.busyMessageOptions.msg;
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
        }
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }

    function getFormGroup(field, groups) {
        if (field.group) {
            var group = field.group;
            if (typeof group === "string") {
                group = {title: group};
            }
            var index = Util.isExists(groups, group, "_id");
            if (index === undefined) {
                index = Util.isExists(groups, group, "title");
            }
            if (index !== undefined) {
                var selectedGroup = groups[index];
                selectedGroup.views = selectedGroup.views || [];
                selectedGroup.columns = selectedGroup.columns || [];
                return selectedGroup;
            }
        }
        if (field.ui == 'rte') {
            for (var j = 0; j < groups.length; j++) {
                if (groups[j].singleColumn) {
                    var selectedGroup = groups[j];
                    selectedGroup.views = selectedGroup.views || [];
                    selectedGroup.columns = selectedGroup.columns || [];
                    return selectedGroup;
                }
            }
        }
        if ((field.ui && field.ui == "grid") || (field.uiForm && field.uiForm == "grid")) {
            var selectedGroup = {
                showLabel: true,
                columns: [],
                views: [],
                separator: false,
                type: "flow",
                collapse: false
            };
            groups.push(selectedGroup)
            return selectedGroup;
        } else {
            for (var i = 0; i < groups.length; i++) {
                if (groups[i].default) {
                    return groups[i];
                }
            }
        }
        return groups[groups.length - 1];

    }

    $scope.onQuickViewSelection = function (quickView) {
        try {
            if ($scope.view.viewOptions.openV) {
                var v = angular.copy(quickView);
                v.qviews = angular.copy($scope.view.viewOptions.qviews);
                v.closeViewIndex = $scope.view.viewOptions.viewIndex;
                v.selectedMenu = quickView.selectedMenu;
                v.sourceid = quickView.sourceid;
                if ($scope.view.viewOptions.style && $scope.view.viewOptions.style.left == $scope.leftZero && $scope.view.viewOptions.style.right === $scope.rightZero) {
                    v.viewPosition = 'left';
                }
                v.close = $scope.view.viewOptions.close;
                v.showLabel = $scope.view.viewOptions.showLabel;
                v.parentSharedOptions = $scope.view.viewOptions.parentSharedOptions;
                v.skipUserState = $scope.view.viewOptions.skipUserState;

                //$scope[$scope.view.viewOptions.closeV]($scope.view.viewOptions.viewIndex);
                if ($scope.view.viewOptions.openVComposite) { //this is done for composite view- Earlier it was opening view in right side now the handling is done in pl-composite.js for this case
                    $scope[$scope.view.viewOptions.openVComposite](v);
                } else {
                    $scope[$scope.view.viewOptions.openV](v);
                }

            } else {
                var title = "$scope.onQuickViewSelection in pl.view";
                var message = "OpenV not defined to open Quick view";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    function populateVisibililtyInNestedGrid(fields) {
        try {
            if (!fields || fields.length == 0) {
                return;
            }
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                //todo only for roles nestedGridPosition=form/tab, we want to show inner nested table of role previlges - views, fields etc only at form not as tab, there was issue in using as tab
                if (field.nestedGridPosition != "form") {
                    field.visibilityGrid = field.visibilityForm;
                    field.indexGrid = field.indexForm;
                    field.whenGrid = field.whenForm;
                    field.editableWhenGrid = field.editableWhenForm;
                    populateVisibililtyInNestedGrid(field.fields);
                }

            }
        } catch (e) {
            console.log('Error in populateVisibilityIn Nesdted table>>>>>>>');
        }

    }

    function getFieldActions(field, actions) {
        if (actions && actions.length > 0) {
            var newActions = [];
            for (var i = 0; i < actions.length; i++) {
                var action = actions[i];
                if (field && action.actionField && action.actionField == field.field) {
                    var actionClone = angular.copy(action);
                    delete actionClone.actionField;
                    newActions.push(actionClone)
                }
            }
            return newActions;
        }
    }

    function convertReferredToFieldAction(field, viewOptions) {
        /*code to move referredView to fieldActions: on 23/03/2015 by NSD */
        if (field.referredView) {
            var refView = angular.copy(field.referredView);
            var refViewJSON = undefined;

            if (typeof  refView === "string") {
                try {
                    refViewJSON = JSON.parse(refView);
                } catch (e) {
                    //what to do with error, ignore or not ?
                }
            } else {
                refViewJSON = refView;
            }
            var parameters = refViewJSON.parameters;
            var filter = refViewJSON.$filter || refViewJSON.filter;
            delete refViewJSON.parameters;
            delete refViewJSON.$filter;
            delete refViewJSON.filter;
            viewOptions.fieldActions = viewOptions.fieldActions || {};
            viewOptions.fieldActions[field.field] = viewOptions.fieldActions[field.field] || [];
            field.actionWhen = field.referredWhen;
            var fieldAction = {actionWhen: field.referredWhen, field: field.field, label: field.label, onRow: true, type: "view", qviews: [refViewJSON], parameters: parameters, filter: filter, fullMode: true};
            viewOptions.fieldActions[field.field].push(fieldAction);
        }
    }

    function populateCellTemplate(viewUI, field, selectedGroup, viewOptions) {
        var fieldAlias = field.alias || field.field;
        if (field.alias) {
            field.editableWhen = "false";
        }
        if (field.referredWhen) {
            field.referredWhen = Util.replaceDollarAndThis(field.referredWhen);
        }

        if (field.referredWhen == false || field.referredWhen == "false") {
            field.referredWhen = false;
        } else if (!field.referredWhen) {
            field.referredWhen = true;
        }

        if (field.colStyle) {
            field.colStyle = Util.replaceDollarAndThis(field.colStyle);
        }
        if (field.ui == "grid") {
            populateVisibililtyInNestedGrid(field.fields);
            var view = $scope.getNestedView(field, formSharedOptions);
            if (selectedGroup) {
                selectedGroup.views.push(view);
            }
            field.cellTemplate = "<a ng-click='nestedTablelabelClick(row, col)' ng-bind='col.label'></a>";
            field.editableWhen = 'false';
        } else if (field.ui == "date") {
            if (field.time == true) {
                field.editableCellTemplate = "<div ng-class='{\"error\":row.validations." + fieldAlias + "}' class='app-display-table-cell app-position-relative' style='width:65%;'>" +
                    "                           <input  class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='row.entity." + fieldAlias + "' bs-datepicker />" +
                    "                           <input  class='app-grid-date-picker-calender-image app-float-right pl-right-calender' tabindex='-1' data-container='body' type='text' ng-model='row.entity." + fieldAlias + "' data-trigger='focus' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />" +
                    "                         </div>" +
                    "                        <div ng-class='{\"error\":row.validations." + fieldAlias + "}' class='app-display-table-cell app-vertical-align-top' style='width:35%;'>" +
                    "                           <input style='border-left:1px solid #CCCCCC;' class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='row.entity." + fieldAlias + "' bs-timepicker />" +
                    "                       </div>";
                field.cellTemplate = "<span>{{row.entity." + fieldAlias + " | date : 'dd/MM/yyyy h:mm:ss a'}} </span>";
                if (viewUI == 'form') {
                    field.editableCellTemplate = "<div ng-class='{\"error\":row.validations." + fieldAlias + "}'  class='app-display-table-cell form-template app-position-relative' style='width:65%;'>" +
                        "                           <input  class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='row.entity." + fieldAlias + "' bs-datepicker />" +
                        "                           <input class='app-grid-date-picker-calender-image app-float-right pl-right-calender' tabindex='-1' data-container='body' type='text' ng-model='row.entity." + fieldAlias + "' data-trigger='focus' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />" +
                        "                         </div>" +
                        "                        <div  ng-class='{\"error\":row.validations." + fieldAlias + "}' class='app-display-table-cell app-vertical-align-top form-template' style='width:35%;'>" +
                        "                           <input style='border-left:none;' class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='row.entity." + fieldAlias + "' bs-timepicker />" +
                        "                       </div>";
                    field.cellTemplate = "<span  >{{row.entity." + fieldAlias + " | date : 'dd/MM/yyyy h:mm:ss'}} </span>";
                }

            } else {
                field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + " | date : 'dd/MM/yyyy'}} </span>";
//                    field.editableCellTemplate = "<input class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='row.entity." + field.field + "' bs-datepicker />";
                field.editableCellTemplate = "<pl-date-picker model='row.entity' field='" + fieldAlias + "'></pl-date-picker>";
                if (viewUI == "form") {
                    field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + " | date : 'dd/MM/yyyy'}} </span>";
                    field.editableCellTemplate = "<div pl-date-picker model='row.entity'  class='pl-form-component-parent form-template' >" + field.editableCellTemplate + "</div>";
                }
            }

        } else if (field.ui == "daterange") {
            field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}' ng-show='row.entity." + fieldAlias + ".from && row.entity." + fieldAlias + ".to'>{{row.entity." + fieldAlias + ".from | date : 'dd/MM/yyyy'}} - {{row.entity." + fieldAlias + ".to | date : 'dd/MM/yyyy'}} </span>";
            field.editableCellTemplate = "<div class='pl-date-range'>" +
                "                                <div class='app-display-table-cell app-float-left' style='width:49%; border-right:1px solid #f5f5f5;' >";
            if (viewUI == "form") {
                field.editableCellTemplate = "<div class='pl-form-component-parent form-template pl-split-box'>" +
                    "                               <div class='app-display-table-cell app-float-left' style='width:50%;' >";
            }
            field.editableCellTemplate += "   <pl-date-picker model='row.entity' field='" + fieldAlias + ".from' ></pl-date-picker>" +
                "                               </div>" +
                "                               <div  class='app-display-table-cell app-float-left' style='width:50%' >" +
                "                                   <pl-date-picker model='row.entity' field='" + fieldAlias + ".to' ></pl-date-picker>" +
                "                               </div>" +
                "                         </div>";

        } else if (field.ui == "time") {
            field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + " }} </span>";
            field.editableCellTemplate = "<pl-autocomplete upsert=''  field='col' options='\"data as data for data in getLookupData($viewValue,col.field,$fetchAllData)\"' model='row.entity." + fieldAlias + "'  ></pl-autocomplete>";
            if (viewUI == "form") {
                field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + " }} </span>";
                field.editableCellTemplate = "<div  class='pl-form-component-parent form-template'  >" + field.editableCellTemplate + "</div>";
            }
        } else if (field.ui == "checkbox") {
            field.cellTemplate = "<span class='stylish-txt' ng-class='{\"true-txt\":row.entity." + fieldAlias + ", \"false-txt\":!row.entity." + fieldAlias + "}' ng-bind='row.entity." + fieldAlias + "'></span>";
            if (viewUI == 'form') {
                field.cellTemplate = "<span  >{{row.entity." + fieldAlias + "}} </span>";
                field.editableCellTemplate = "<input class='app-float-left form-template pl-margin-none' type='checkbox' ng-model='row.entity." + fieldAlias + "' />";
            } else if (viewUI == 'grid') {
                field.editableCellTemplate = "<input class='app-float-left' type='checkbox' ng-model='row.entity." + fieldAlias + "' />";
            }
        } else if (field.ui == "autocomplete") {
            var displayRenderer = field.multiple ? "" : fieldAlias;
            var displayEditor = "";
            var otherDisplayFieldTemplate = '';
            if (field.displayField) {
                if (field.type == "fk") {
                    displayRenderer += "." + field.displayField;
                }

                displayEditor = "." + field.displayField;
            }
            var editorModelField = "";
            if (field.type == "string") {
                editorModelField = displayEditor;
                if (field.multiple) {
                    displayRenderer = "";
                }

            }
            field.editableCellTemplate = "<pl-autocomplete field='col' ";
            if (field.type == "fk") {
                if (field.upsert) {
                    field.upsertView = field.upsert;
                    field.editableCellTemplate += " upsert='" + field.displayField + "' ";
                }
                var hyperLink = undefined;

                if (field.hyperlinkEnabled !== undefined) {
                    hyperLink = field.hyperlinkEnabled;
                } else {
                    hyperLink = $scope.view.viewOptions.hyperlinkEnabled || (!angular.isDefined($scope.view.viewOptions.hyperlinkEnabled));
                }
                if (hyperLink) {

                    if (field.referredView) {
                        try {
                            if (typeof  field.referredView === "string") {
                                field.referredView = JSON.parse(field.referredView);
                            }

                        } catch (e) {
                            field.referredView = undefined;
                        }

                    } else {
                        field.referredView = {
                            id: field.collection,
                            ui: "form",
                            $filter: {},
                            parameters: {}
                        };
                        field.referredView.$filter._id = "$" + fieldAlias + "._id";
                        field.referredView.parameters[fieldAlias] = "$" + fieldAlias;
                    }

                }
            } else if (field.type == "string") {
                field.upsertView = false;
                if (field.upsert) {
                    field.editableCellTemplate += " upsert='' ";
                }
            }

            if (field.multiple) {
                if (field.otherDisplayFields) {
                    otherDisplayFieldTemplate = "<span ng-repeat='otherCol in col.otherDisplayFields' ng-show='option[otherCol]'> | <span ng-bind='option[otherCol]'></span> </span> ; "
                } else {
                    otherDisplayFieldTemplate = '; ';
                }
                field.cellTemplate = "<span ng-repeat='option in row.entity." + fieldAlias + "' title='{{option" + displayRenderer + "}}'>" +
                    "                   <span ng-bind='option" + displayRenderer + "'></span> ;" +
                    "                 </span>";
                field.editableCellTemplate += " otherdisplayfields='" + field.otherDisplayFields + "'  data-editormodelfield='" + editorModelField + "' data-displayeditor='" + displayEditor + "' field='col' data-multiple='true' viewui='" + viewUI + "' options='\"data" + editorModelField + " as data" + displayEditor + " for data in getLookupData($viewValue,col.field,$fetchAllData)\"' model='row.entity." + fieldAlias + "' data-displayrenderer='" + displayRenderer + "' ></pl-autocomplete>";
                if (viewUI == "form") {
                    field.editableCellTemplate = "<div class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
                }
            } else {

                if (field.otherDisplayFields) {
                    otherDisplayFieldTemplate = "<span>";
                    for (var i = 0; i < field.otherDisplayFields.length; i++) {
                        var obj = field.otherDisplayFields[i];
                        otherDisplayFieldTemplate += " | <span ng-bind='row.entity." + field.field + "." + field.otherDisplayFields[i] + "'></span>";
                    }
                    otherDisplayFieldTemplate += "</span>";
//                    otherDisplayFieldTemplate = "<span ng-repeat='otherCol in col.otherDisplayFields' ng-show='row.entity[col.field][otherCol]'> | <span ng-bind='row.entity[col.field][otherCol]'></span></span>";
                }
                if (field.referredView) {
                    convertReferredToFieldAction(field, viewOptions);
                }
                if (field.actionWhen === undefined) {
                    field.actionWhen = true;
                }

                if (field.actionWhen && (viewOptions.fieldActions && viewOptions.fieldActions[field.field] && viewOptions.fieldActions[field.field].length > 0 )) {
                    field.cellTemplate = "<span ng-class='{\"link-txt\":" + field.actionWhen + "}' ng-click='openFieldActionPopup($event, row, col)'>" +
                        "                       <span ng-bind='row.entity." + displayRenderer + "'></span>" +
                        "               </span>";
                } else {
                    field.cellTemplate = "<span>" +
                        "                   <span  ng-bind='row.entity." + displayRenderer + "' ></span> " +
                        "                </span>";
                }

                field.editableCellTemplate += " validationdisplay='" + displayRenderer + "'otherdisplayfields='" + field.otherDisplayFields + "' options='\"data" + editorModelField + " as data" + displayEditor + " for data in getLookupData($viewValue,col.field,$fetchAllData)\"' model='row.entity." + fieldAlias + "'  ></pl-autocomplete>";
                if (viewUI == "form") {
                    field.cellTemplate = "<span ng-class='{\"error\":row.validations." + displayRenderer + "}'>{{row.entity." + displayRenderer + "}} <span ng-repeat='otherCol in col.otherDisplayFields' ng-show='row.entity[col.field][otherCol]'> | {{row.entity[col.field][otherCol]}}</span></span>";
                    field.editableCellTemplate = "<div  class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
                }
            }

        } else if (field.ui == "number") {
            var toFixedFilter = '';
            if (field.toFixed === undefined) {
            } else {
                toFixedFilter = " | number:" + field.toFixed;
            }

            var footerField = fieldAlias;
            footerField = footerField.replace(/\./g, "_");
            field.footerCellTemplate = "<span class='app-float-right app-font-weight-bold' style='font-size: 14px;' title='{{row.entity." + footerField + "}}' ng-bind='row.entity." + footerField + toFixedFilter + "'></span>";
            if (field.referredView) {
                convertReferredToFieldAction(field, viewOptions);
            }
            if (field.actionWhen === undefined) {
                field.actionWhen = true;
            }
            if (field.actionWhen && (viewOptions.fieldActions && viewOptions.fieldActions[field.field] && viewOptions.fieldActions[field.field].length > 0 )) {
                field.footerCellTemplate = "<span ng-click='onFkClick(row, col)' ng-class='{\"link-txt\":" + field.actionWhen + ",\"error\":row.validations." + fieldAlias + "}'><span class='app-float-right app-font-weight-bold' style='font-size: 14px;' title='{{row.entity." + footerField + "}}' ng-bind='row.entity." + footerField + toFixedFilter + "'></span></span>";
                field.cellTemplate = "<div ng-class='{\"error\":row.validations." + fieldAlias + "}' class='app-float-left app-width-full pl-rsp-cond app-text-align-right app-float-right'><span ng-click='openFieldActionPopup($event, row, col)'><a>{{row.entity." + fieldAlias + toFixedFilter + "}}</a><a ng-if='gridOptions.showZeroIfNull && !row.entity." + fieldAlias + "'>0</a></span></div>";
            } else {
                field.cellTemplate = "<span ng-class='{\"medium\":gridOptions.largeFont,\"error\":row.validations." + fieldAlias + "}' class='pl-rsp-cond '><span class='app-width-full app-text-align-right app-float-right'><span>{{row.entity." + fieldAlias + toFixedFilter + "}}</span><span ng-if='gridOptions.showZeroIfNull && !row.entity." + fieldAlias + "'>0</span> </span></span>";
            }
            field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control' type='number' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'/>";
            if (viewUI == "form") {
                field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + toFixedFilter + "}}</span>";
                field.editableCellTemplate = "<div  class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
            }

        } else if (field.ui == "schedule") {
            field.cellTemplate = "<span>{{row.entity." + fieldAlias + ".nextDueOn | date : 'dd/MM/yyyy hh:mm a'}} </span>";
//                field.editableCellTemplate = "<pl-schedule data-model='row.entity' data-field='" + fieldAlias + "'></pl-schedule>";
            field.editableCellTemplate = "<div ng-class='{\"error\":row.validations." + fieldAlias + "}'><pl-date-picker model='row.entity' data-title='Next Due On' placeholder='Next Due On' field='" + fieldAlias + "' schedule=true></pl-date-picker></div>";
            if (viewUI == "form") {
                field.cellTemplate = "<span >{{row.entity." + fieldAlias + ".nextDueOn | date : 'dd/MM/yyyy hh:mm a'}} </span>";
                field.editableCellTemplate = "<div  class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
            }
        } else if (field.ui == "password") {
            if (viewUI == 'grid') {
                field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control' type='password' ng-model='row.entity." + fieldAlias + "' />";
            } else if (viewUI == 'form') {
                field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control form-template' type='password' ng-model='row.entity." + fieldAlias + "' />";
            }
        } else if (field.ui == "duration") {
            if (field.toFixed === undefined) {
                field.toFixed = 2;
            }
            if (field.toFixedAggregate === undefined) {
                field.toFixedAggregate = 0;
            }
            var footerField = fieldAlias;
            footerField = footerField.replace(/\./g, "_");
            field.footerCellTemplate = "<span class='app-float-right app-font-weight-bold' style='font-size: 14px;'><span ng-bind='row.entity." + footerField + ".time | number:" + field.toFixedAggregate + "'></span><span ng-bind='row.entity." + footerField + ".unit'></span></span>";

            if (field.referredView) {
                convertReferredToFieldAction(field, viewOptions);
            }
            if (field.actionWhen === undefined) {
                field.actionWhen = true;
            }
            if (field.actionWhen && (viewOptions.fieldActions && viewOptions.fieldActions[field.field] && viewOptions.fieldActions[field.field].length > 0 )) {
                field.footerCellTemplate = "<span class='app-float-right app-font-weight-bold' style='font-size: 14px;'><span ng-class='{\"link-txt\":" + field.actionWhen + "}' ng-click='onFkClick(row, col)'><span ng-bind='row.entity." + footerField + ".time | number:" + field.toFixedAggregate + "'></span><span ng-bind='row.entity." + footerField + ".unit'></span></span></span>";
                field.cellTemplate = "<span ng-class='{\"medium\":gridOptions.largeFont}' class='app-float-right' ng-click='openFieldActionPopup($event, row, col)'><span ng-class='{\"link-txt\":" + field.actionWhen + "}'>{{row.entity." + fieldAlias + ".time | number:" + field.toFixed + "}} {{row.entity." + fieldAlias + ".unit}}</span><span ng-class='{\"link-txt\":" + field.actionWhen + "}' ng-if='!row.entity." + fieldAlias + ".time && gridOptions.showZeroIfNull'>0</span></span>";
            } else {
                field.cellTemplate = "<span ng-class='{\"medium\":gridOptions.largeFont}' class='app-float-right'>{{row.entity." + fieldAlias + ".time | number:" + field.toFixed + "}} {{row.entity." + fieldAlias + ".unit}}<span ng-if='gridOptions.showZeroIfNull && !row.entity." + fieldAlias + ".time'>0</span></span>";
            }
            field.editableCellTemplate = "<div class='app-display-table-cell app-float-left app-width-74-per' >" +
                "                               <input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control' type='number' ng-model='row.entity." + fieldAlias + ".time' ng-model-options='{ updateOn: \"blur\" }'/>" +
                "                          </div>" +
                "                          <div class='app-display-table-cell pl-split-box' style='width:25%;border-right: 1px solid #ccc;'>";
            if (field.unitEditableWhen === "false") {
                field.editableCellTemplate += "<span style='position:absolute;margin-top:2px;margin-left:10px' ng-class='{\"medium\":gridOptions.largeFont}' class='app-float-right'>{{row.entity." + fieldAlias + ".unit}}<span ng-if='gridOptions.showZeroIfNull && !row.entity." + fieldAlias + ".time'>0</span></span>";
            } else {
                field.editableCellTemplate += "<pl-autocomplete field='col' options='\"data as data for data in getLookupData($viewValue,col.field,$fetchAllData)\"' model='row.entity." + fieldAlias + ".unit'  ></pl-autocomplete>";
            }
            field.editableCellTemplate += "</div>";
            if (viewUI == "form") {
                field.cellTemplate = "<span >{{row.entity." + fieldAlias + ".time | number:" + field.toFixed + "}} {{row.entity." + fieldAlias + ".unit}} </span>";
                field.editableCellTemplate = "<div  class='pl-form-component-parent  form-template pl-split-box'>" + field.editableCellTemplate + "</div>";
            }


        } else if (field.ui == "currency") {

            var footerField = fieldAlias;
            if (field.toFixed === undefined) {
                field.toFixed = 2;
            }
            if (field.toFixedAggregate === undefined) {
                field.toFixedAggregate = 2;
            }
            if (field.hideUnit == undefined) {
                field.hideUnit = viewOptions.hideUnit;
            }
            footerField = footerField.replace(/\./g, "_");
            field.footerCellTemplate = "<span class='app-float-right medium app-font-weight-bold' title='{{row.entity." + footerField + ".amount | currency:\"\":" + field.toFixedAggregate + "}} {{row.entity." + footerField + ".type.currency}}'>" +
                "                          <span ng-bind='row.entity." + footerField + ".amount | currency:\"\":" + field.toFixedAggregate + " '></span>" +
                "                           <span ng-class='{\"ng-hide\":" + field.hideUnit + "}' ng-bind='row.entity." + footerField + ".type.currency'></span>" +
                "                       </span>";

            if (field.referredView) {
                convertReferredToFieldAction(field, viewOptions);
            }
            if (field.actionWhen === undefined) {
                field.actionWhen = true;
            }
            if (field.actionWhen && (viewOptions.fieldActions && viewOptions.fieldActions[field.field] && viewOptions.fieldActions[field.field].length > 0 )) {
                field.footerCellTemplate = "<span class='app-float-right medium app-font-weight-bold' title='{{row.entity." + footerField + ".amount | currency:\"\":" + field.toFixedAggregate + "}} {{row.entity." + footerField + ".type.currency}}'>" +
                    "                          <span ng-click='openFieldActionPopup($event, row, col)' ng-class='{\"link-txt\":" + field.actionWhen + "}'><span ng-bind='row.entity." + footerField + ".amount | currency:\"\":" + field.toFixedAggregate + "'></span>" +
                    "                           <span ng-class='{\"ng-hide\":" + field.hideUnit + ",\"error\":row.validations." + fieldAlias + "}' ng-bind='row.entity." + footerField + ".type.currency'></span></span>" +
                    "                       </span>";
                field.cellTemplate = "<span ng-class='{\"medium\":gridOptions.largeFont,\"error\":row.validations." + fieldAlias + "}' class='app-float-right medium' ng-click='openFieldActionPopup($event, row, col)'>" +
                    "   <span ng-class='{\"link-txt\":" + field.actionWhen + "}'>" +
                    "       <span ng-if='row.entity." + fieldAlias + ".amount'>{{row.entity." + fieldAlias + ".amount | currency:'':" + field.toFixed + " }}</span>" +
                    "       <span ng-if='row.entity." + fieldAlias + ".amount' ng-class='{\"ng-hide\":" + field.hideUnit + "}'> {{row.entity." + fieldAlias + ".type.currency}}</span>" +
                    "   </span>" +
                    "   <span ng-class='{\"link-txt\":" + field.actionWhen + "}' ng-if='!row.entity." + fieldAlias + ".amount && gridOptions.showZeroIfNull'>0</span>" +
                    "</span>";
            } else {
                field.cellTemplate = "<span ng-class='{\"medium\":gridOptions.largeFont,\"error\":row.validations." + fieldAlias + "}' class='app-float-right pl-cnd'><span ng-if='row.entity." + fieldAlias + ".amount'>{{row.entity." + fieldAlias + ".amount  | currency:'':" + field.toFixed + "  }}</span><span ng-if='row.entity." + fieldAlias + ".amount' ng-class='{\"ng-hide\":" + field.hideUnit + "}'> {{row.entity." + fieldAlias + ".type.currency}}</span><span ng-if='!row.entity." + fieldAlias + ".amount && gridOptions.showZeroIfNull'>0</span></span>";
            }
            field.editableCellTemplate = "<div class='app-display-table-cell app-float-left app-width-74-per' >" +
                "                           <input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control' type='number' ng-model='row.entity." + fieldAlias + ".amount' ng-model-options='{ updateOn: \"blur\" }'/>" +
                "                         </div>" +
                "                         <div ng-class='' class='app-display-table-cell app-vertical-align-top pl-split-box' style='width:25%;border-right: 1px solid #ccc;position:relative'>";
            if (field.unitEditableWhen === "false") {
                field.editableCellTemplate += "<span style='position:absolute;margin-top:2px;margin-left:10px' ng-if='row.entity." + fieldAlias + ".amount' ng-class='{\"ng-hide\":" + field.hideUnit + "}'> {{row.entity." + fieldAlias + ".type.currency}}</span>";
            } else {
                field.editableCellTemplate += "     <pl-autocomplete field='col' options='\"data as data.currency for data in getLookupData($viewValue,col.field,$fetchAllData)\"' model='row.entity." + fieldAlias + ".type'  ></pl-autocomplete>";
            }
            field.editableCellTemplate += "</div>";

            if (viewUI == "form") {
                field.cellTemplate = "<span >{{row.entity." + fieldAlias + ".amount | currency:'':" + field.toFixed + " }} {{row.entity." + fieldAlias + ".type.currency}} </span>";
                field.editableCellTemplate = "<div class='pl-form-component-parent form-template pl-split-box'>" + field.editableCellTemplate + "</div>";
            }


        } else if (field.ui == "unit") {

            field.cellTemplate = "<span >{{row.entity." + fieldAlias + ".quantity}} {{row.entity." + fieldAlias + ".unit.unit}} </span>";
            field.editableCellTemplate = "<div class='app-display-table-cell app-float-left app-width-74-per' style='border-right:1px solid #ccc;'>" +
                "                           <input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control' type='number' ng-model='row.entity." + fieldAlias + ".quantity' ng-model-options='{ updateOn: \"blur\" }'/>" +
                "                         </div>" +
                "                        <div class='app-display-table-cell app-vertical-align-top pl-split-box' style='width:25%;1px solid #ccc;'>" +
                "                           <pl-autocomplete field='col' options='\"data as data.unit for data in getLookupData($viewValue,col.field,$fetchAllData)\"' model='row.entity." + fieldAlias + ".unit'  ></pl-autocomplete>" +
                "                       </div>";

            if (viewUI == "form") {
                field.cellTemplate = "<span  >{{row.entity." + fieldAlias + ".quantity}} {{row.entity." + fieldAlias + ".unit.unit}} </span>";
                field.editableCellTemplate = "<div  class='pl-form-component-parent form-template pl-split-box'>" + field.editableCellTemplate + "</div>";
            }


        } else if (field.ui == "image") {
            var userDB = ApplaneDB.connection("userdb");
            var token = userDB.token;
            var url = "/rest/file/download?";
            url += "token=" + token;
            if (viewUI == "grid") {
                field.cellTemplate = "<div ng-class='{\"error\":row.validations." + fieldAlias + "}' class='app-text-align-center app-border' ng-if='row.entity." + fieldAlias + ".key'>" +
                    "                   <img alt='row.entity." + field.label + "' width='80%' height='80%' ng-src='" + url + "&filekey={{row.entity." + fieldAlias + ".key}}' />" +
                    "               </div>";
                field.editableCellTemplate = " <input ng-class='{\"error\":row.validations." + fieldAlias + "}' ng-if='!row.entity." + fieldAlias + "' pl-file-upload  ng-model='row.entity." + fieldAlias + "'  class='app-text-align-center app-float-left ' type='file' />" +
                    "                          <div class='app-text-align-center app-border pl-image-remove' ng-if='row.entity." + fieldAlias + ".key'>" +
                    "                               <img alt='row.entity." + field.label + "' width='80%' height='80%' ng-src='" + url + "&filekey={{row.entity." + fieldAlias + ".key}}' />" +
                    "                              <a pl-remove-value ng-model='row.entity." + fieldAlias + "' ng-show='row.entity." + fieldAlias + "' ng-click='remove(undefined,$event)' class='app-color-black app-remove-file icon-remove '></a>" +
                    "                           </div>";


            }
            if (viewUI == "form") {
                field.cellTemplate = "<div  ng-if='row.entity." + fieldAlias + ".key'>" +
                    "<img  style='max-width: 40%;' alt='row.entity." + field.label + "' ng-src='" + url + "&filekey={{row.entity." + fieldAlias + ".key}}' >" +
                    "</div>";
                field.editableCellTemplate = " <input ng-class='{\"error\":row.validations." + fieldAlias + "}' ng-if='!row.entity." + fieldAlias + "'  pl-file-upload  ng-model='row.entity." + fieldAlias + "'  class=' app-float-left app-height-twenty-px' type='file' />" +
                    "                               <div ng-if='row.entity." + fieldAlias + ".key' tabindex='-1' class='pl-image-remove'>" +
                    "                                   <img style='max-width: 40%;' alt='row.entity." + field.label + "' ng-src='" + url + "&filekey={{row.entity." + fieldAlias + ".key}}' ><br>" +
                    "                                   <a pl-remove-value ng-model='row.entity." + fieldAlias + "' ng-show='row.entity." + fieldAlias + "' ng-click='remove(undefined,$event)' class='app-color-black app-remove-file icon-remove '></a>" +
                    "                               </div>";
            }


        } else if (field.ui == "file") {
            var userDB = ApplaneDB.connection("userdb");
            var token = userDB.token;
            var url = "/rest/file/download?";
            url += "token=" + token;
            if (field.multiple) {
                field.cellTemplate = " <a download tabindex='-1' ng-repeat='file in row.entity." + fieldAlias + "' ng-href='" + url + "&filekey={{file.key}}'>{{file.name}}; </a>";
                field.editableCellTemplate = " <input pl-file-upload ng-model='row.entity." + fieldAlias + "'  class='app-file-upload app-height-twenty-px' type='file' multiple=true />" +
                    "                               <div  ng-repeat='file in row.entity." + fieldAlias + "' ng-show='row.entity." + fieldAlias + " && row.entity." + fieldAlias + ".length > 0' tabindex='-1' class='app-file-upload-files'>" +
                    "                                   <a download ng-href='" + url + "&filekey={{file.key}}' class='app-color-black'>{{file.name}}</a>" +
                    "                                   <span pl-remove-value ng-model='row.entity." + fieldAlias + "' ng-show='row.entity." + fieldAlias + " && row.entity." + fieldAlias + ".length>0' ng-click='remove($index, $event)' class='app-remove-file'>X</span>" +
                    "                               </div>";
            } else {
                field.cellTemplate = "<a download tabindex='-1'  ng-href='" + url + "&filekey={{row.entity." + fieldAlias + ".key}}' class='app-color-black'>{{row.entity." + fieldAlias + ".name}}</a>";
                field.editableCellTemplate = " <input ng-class='{\"error\":row.validations." + fieldAlias + "}' pl-file-upload ng-show='!row.entity." + fieldAlias + "'  ng-model='row.entity." + fieldAlias + "'  class='app-file-upload app-height-twenty-px' style='height:20px;' type='file' />" +
                    "                               <div ng-show='row.entity." + fieldAlias + "' tabindex='-1' class='app-file-upload-files'>" +
                    "                                   <a download ng-href='" + url + "&filekey={{row.entity." + fieldAlias + ".key}}' class='app-color-black'>{{row.entity." + fieldAlias + ".name}}</a>" +
                    "                                   <span pl-remove-value ng-model='row.entity." + fieldAlias + "' ng-show='row.entity." + fieldAlias + "' ng-click='remove(undefined,$event)' class='app-remove-file'><i class='icon-remove'></i></span>" +
                    "                               </div>";
            }

            if (viewUI == "form") {
                if (field.multiple) {
                    field.cellTemplate = " <a download tabindex='-1' ng-repeat='file in row.entity." + fieldAlias + "' target='_blank' ng-href='" + url + "&filekey={{file.key}}'>{{file.name}}; </a>";
                    field.editableCellTemplate = " <input  pl-file-upload ng-model='row.entity." + fieldAlias + "'  class='app-file-upload app-height-twenty-px' type='file' multiple=true />" +
                        "                               <div  ng-repeat='file in row.entity." + fieldAlias + "' ng-show='row.entity." + fieldAlias + " && row.entity." + fieldAlias + ".length > 0' tabindex='-1' class='app-file-upload-files'>" +
                        "                                   <a download ng-href='" + url + "&filekey={{file.key}}' class='app-color-black'>{{file.name}}</a>" +
                        "                                   <span pl-remove-value ng-model='row.entity." + fieldAlias + "' ng-show='row.entity." + fieldAlias + " && row.entity." + fieldAlias + ".length>0' ng-click='remove($index, $event)' class='app-remove-file'>X</span>" +
                        "                               </div>";
                } else {
                    field.cellTemplate = "<a download tabindex='-1' ng-href='" + url + "&filekey={{row.entity." + fieldAlias + ".key}}' class='app-color-black'>{{row.entity." + fieldAlias + ".name}}</a>";
                    field.editableCellTemplate = " <input ng-class='{\"error\":row.validations." + fieldAlias + "}' pl-file-upload ng-show='!row.entity." + fieldAlias + "'  ng-model='row.entity." + fieldAlias + "'  class='app-file-upload app-height-twenty-px' style='height:20px;' type='file' />" +
                        "                               <div ng-show='row.entity." + fieldAlias + "' tabindex='-1' class='app-file-upload-files'>" +
                        "                                   <a download ng-href='" + url + "&filekey={{row.entity." + fieldAlias + ".key}}' class='app-color-black'>{{row.entity." + fieldAlias + ".name}}</a>" +
                        "                                   <span pl-remove-value ng-model='row.entity." + fieldAlias + "' ng-show='row.entity." + fieldAlias + "' ng-click='remove(undefined,$event)' class='app-remove-file'>X</span>" +
                        "                               </div>";
                }
            }
        } else if (field.ui == "json") {
            field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + " | json}} </span>";
            field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}' pl-json='' class='form-control pl-json' type='text' ng-blur='onblur()' ng-model='row.entity." + fieldAlias + "'  />";
            if (viewUI == "form") {
                field.cellTemplate = "<span >{{row.entity." + fieldAlias + " | json}} </span>";
                field.editableCellTemplate = "<div  class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
            }
        } else if (field.ui == "rte") {
            if (viewUI == "grid") {
                field.cellTemplate = "<span ng-bind-html='row.entity." + fieldAlias + "'></span>";
                field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control' type='text' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'/>";
            } else if (viewUI == "form") {
                field.cellTemplate = "<span ng-bind-html='row.entity." + fieldAlias + "'></span>";
                field.editableCellTemplate = "<span text-angular='text-angular' class='pl-rte' ng-model='row.entity." + fieldAlias + "'></span>";
            }
        } else if (field.ui == "html") {
            if (field.type == 'object') {
                field.html = Util.replaceDollarAndThis(field.html);
                field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>" + field.html + "</span>";
                field.editableCellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>" + field.html + "</span>";
            } else {
                field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}' ng-bind-html='row.entity." + fieldAlias + "'></span>";
                field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control' type='text' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'/>";
                if (viewUI == "form") {
                    field.editableCellTemplate = "<div ng-class='{\"error\":row.validations." + fieldAlias + "}' class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
                }
            }
        } else if (field.ui == "text") {
            if (field.referredView) {
                convertReferredToFieldAction(field, viewOptions);
            }
            if (field.actionWhen == undefined) {
                field.actionWhen = true;
            }
            if (field.actionWhen && (viewOptions.fieldActions && viewOptions.fieldActions[field.field] && viewOptions.fieldActions[field.field].length > 0 )) {
                field.cellTemplate = "<span ng-click='openFieldActionPopup($event, row, col)' ng-class='{\"link-txt\":" + field.actionWhen + ",\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + "}}</span>";
            } else {
                field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}' ng-bind='row.entity." + fieldAlias + "' title='{{row.entity." + fieldAlias + "}}'></span>";
            }
            field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}'  class='form-control' type='text' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'/>";
            if (viewUI == "form") {
                field.cellTemplate = "<span ng-bind='row.entity." + fieldAlias + "'></span>";
                field.editableCellTemplate = "<div  class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
            }
        } else if (field.ui == "textarea") {
            field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}' ng-bind='row.entity." + fieldAlias + "' ></span>";
            field.editableCellTemplate = "<textarea ng-class='{\"error\":row.validations." + fieldAlias + "}' rows='2' cols='5' class='form-control' type='text' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'></textarea>";
            if (viewUI == "form") {
                field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + "}} </span>";
                field.editableCellTemplate = "<div class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
            }
        } else if (field.ui == "dragAndDrop") {
            if (viewUI == "grid") {
                field.index = -999999;
                field.label = "";
                field.dragRow = true;
                field.style = {
                    "width": "20px",
                    height: "20px"
                };
                field.cellTemplate = "<div class='pl-row-drag app-serial-number' ng-hide='row.aggregateRow' ng-bind='$parent.$index+1'></div>";
                field.editableCellTemplate = "<input class='form-control' type='number' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'/>";
            } else if (viewUI == "form") {
                field.cellTemplate = "<span>{{row.entity." + fieldAlias + "}}</span>";
                field.editableCellTemplate = "<div class='pl-form-component-parent form-template'><input class='form-control' type='number' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'/></div>";
            }

        } else if (field.ui === "radio") {
            field.cellTemplate = "<span >{{row.entity." + fieldAlias + "}} </span>";
            field.editableCellTemplate = "<div ng-class='{\"error\":row.validations." + fieldAlias + "}' ><div ng-repeat='option in col.radioOptions'><input type='radio'  value='{{option}}' ng-model='row.entity." + fieldAlias + "'> <label style='font-weight:100 ;'>{{option}}</label></div><div>";
        } else if (field.ui === "anchor") {
            var anchorTarget = field.anchorTarget ? field.anchorTarget : "_blank";
            field.cellTemplate = "<div><a style='color:#4398ec;text-decoration: underline;' target='" + anchorTarget + "' ng-href='{{row.entity." + fieldAlias + "}}'><span>{{row.entity." + fieldAlias + "}}</span></a></div>";
            field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}'  class='form-control' type='text' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'/>";
        } else {
            field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}' ng-bind='row.entity." + fieldAlias + "'></span>";
            field.editableCellTemplate = "<input ng-class='{\"error\":row.validations." + fieldAlias + "}' class='form-control' type='text' ng-model='row.entity." + fieldAlias + "' ng-model-options='{ updateOn: \"blur\" }'/>";
            if (viewUI == "form") {
                field.cellTemplate = "<span ng-class='{\"error\":row.validations." + fieldAlias + "}'>{{row.entity." + fieldAlias + "}} </span>";
                field.editableCellTemplate = "<div ng-class='{\"error\":row.validations." + fieldAlias + "}' class='pl-form-component-parent form-template'>" + field.editableCellTemplate + "</div>";
            }
        }
    }

    function populateColumns(viewUI, fields, columns, aggregateColumns, groupColumns, filterColumns, sortColumns, updateColumns, ftsColumns, groups, tabs, parentField, viewOptions, recursiveColumns) {
        var fieldLength = fields ? fields.length : 0;
        for (var i = 0; i < fieldLength; i++) {
            var field = fields[i];
            var visibility = field.visibility;
            var index = field.index;
            var editable = field.editableWhen;                                                                          // editable will be used to make field editable on conditional bases.
            if (field.referredView && (typeof field.referredView == "string")) {
                try {
                    field.referredView = JSON.parse(field.referredView);
                } catch (e) {
                    $scope.view.viewOptions.viewRenderError = $scope.view.viewOptions.viewRenderError || "";
                    $scope.view.viewOptions.viewRenderError += "\nUnable to parse reffered view in field " + JSON.stringify(field);
                }

            }
            if (viewUI == "grid") {
                if (angular.isDefined(field.visibilityGrid)) {
                    visibility = field.visibilityGrid || visibility;
                }
                if (angular.isDefined(field.editableWhenGrid)) {
                    editable = field.editableWhenGrid;
                }
            } else if (viewUI == "form") {
                if (angular.isDefined(field.visibilityForm)) {
                    visibility = field.visibilityForm || visibility;
                }
                if (angular.isDefined(field.editableWhenForm)) {
                    editable = field.editableWhenForm;
                }
            }
            if (viewUI == "grid" && angular.isDefined(field.indexGrid)) {
                index = field.indexGrid || index;
            } else if (viewUI == "form" && angular.isDefined(field.indexForm)) {
                index = field.indexForm || index;
            }
            if (ftsColumns && field.ftsEnable) {
                var ftsEnableColumns = {};
                ftsEnableColumns.label = field.label;
                ftsEnableColumns.field = field.field;
                ftsEnableColumns.displayField = field.displayField;
                ftsColumns.push(ftsEnableColumns);
            }
            field = angular.copy(field);
            if (parentField) {
                field.field = parentField + "." + field.field;
            }
            if (!visibility) {
                populateColumns(viewUI, field.fields, columns, aggregateColumns, groupColumns, filterColumns, sortColumns, updateColumns, ftsColumns, groups, tabs, field.field, viewOptions);
            }


            field.visibility = visibility;
            if (angular.isDefined(editable) && editable.toString().trim().length > 0) {
                field.editableWhen = editable;
                field.editableWhen = Util.replaceDollarAndThis(field.editableWhen);
            } else {
                delete field.editableWhen;
            }

            field.index = index;


            var fieldUI = undefined;
            var when = undefined;
            if (viewUI == "grid") {
                fieldUI = (angular.isDefined(field.uiGrid) && field.uiGrid.toString().trim().length > 0 ) ? field.uiGrid : field.ui;
                when = (angular.isDefined(field.whenGrid) && field.whenGrid.toString().trim().length > 0) ? field.whenGrid : field.when;
            } else if (viewUI == "form") {
                fieldUI = (angular.isDefined(field.uiForm) && field.uiForm.toString().trim().length > 0 ) ? field.uiForm : field.ui;
                when = (angular.isDefined(field.whenForm) && field.whenForm.toString().trim().length > 0 ) ? field.whenForm : field.when;
            }
            field.ui = fieldUI;
            field.when = when;
            if (angular.isDefined(field.when) && (field.when).toString().trim().length > 0) {
                field.when = Util.replaceDollarAndThis(field.when);
            }
            if (filterColumns && field.filterable) {
                populateFilterColumns(field, filterColumns);
            }

            if (aggregateColumns && field.aggregatable && visibility) {
                var aggregateColumn = {};
                aggregateColumn.label = field.label;
                aggregateColumn.field = field.field;
                aggregateColumn.alias = field.alias || Util.replaceDotToUnderscore(field.field);
                aggregateColumn.type = field.type;
                aggregateColumn.sortable = field.sortable;
                aggregateColumn.ui = field.ui;
                aggregateColumn.aggregate = field.aggregate || "sum";
                if (field.ui == "currency") {
                    aggregateColumn.ui = field.ui;
                    populateCellTemplate(viewUI, aggregateColumn, selectedGroup, viewOptions);
                } else if (field.ui == "duration") {
                    aggregateColumn.ui = field.ui;
                    populateCellTemplate(viewUI, aggregateColumn, selectedGroup, viewOptions);
                } else if (field.ui == "number") {
                    aggregateColumn.ui = field.ui;
                    populateCellTemplate(viewUI, aggregateColumn, selectedGroup, viewOptions);
                }
                aggregateColumns.push(aggregateColumn);
            }


            if (groupColumns && field.groupable) {
                var groupableColumn = {};
                groupableColumn.label = field.label;
                groupableColumn.field = field.field;
                groupableColumn.displayField = field.displayField;
                if (field.recursion) {
                    var groupRecursion = field.recursion;
                    if (typeof groupRecursion === "string") {
                        groupRecursion = JSON.parse(groupRecursion);
                    }
                    groupableColumn.recursion = angular.copy(groupRecursion);
                }
                groupableColumn.master = true;
                groupColumns.push(groupableColumn);
            }

            if (field.update && updateColumns && viewOptions.edit) {
                var cloneField = angular.copy(field);
                cloneField.formType = undefined;
                updateColumns.push(cloneField);
            }

            if (sortColumns && field.sortable) {
                var sortableColumn = {};
                sortableColumn.label = field.label;
                sortableColumn.field = field.field;
                sortableColumn.displayField = field.displayField;
                sortColumns.push(sortableColumn);
            }

            if (!visibility) {
                continue;
            }

            var selectedGroup = undefined;
            if (viewUI == "form") {
                selectedGroup = getFormGroup(field, groups);
            }


            // check to move nested grid into tabs
            if (viewUI == "grid" && field.ui === "grid") {
//                if ((!angular.isDefined(field.when) || (field.when != 'false'))) {
//                    tabs.push(angular.copy(field));
//                }
                populateCellTemplate(viewUI, field, selectedGroup, viewOptions);
                columns.push(field);
            } else {
                populateCellTemplate(viewUI, field, selectedGroup, viewOptions);
                if (viewUI == "grid") {
                    columns.push(field);
                } else if (viewUI == "form" && field.ui != "grid") {
                    if (selectedGroup) {
                        selectedGroup.columns.push(field);
                    }
                }

                if (!(viewUI == "form" && field.ui == "grid")) {
                    populateColumns(viewUI, field.fields, columns, aggregateColumns, groupColumns, filterColumns, sortColumns, updateColumns, ftsColumns, groups, tabs, field.field, viewOptions);
                }
            }
            if (viewOptions.recursionEnabled && viewOptions.recursion && recursiveColumns) {//this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
                populateRecursiveColumns(recursiveColumns, field, viewOptions.recursion);
            }
        }


    }

    function populateRecursiveColumns(recursiveColumns, field, recursion) { //this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
        if (recursion.$primaryColumn) {
            var primaryColumn = recursion.$primaryColumn;
            if (primaryColumn === field.field) {
                var recursiveColumn = {};
                recursiveColumn.field = field.field;
                recursiveColumn.label = field.label;
                recursiveColumn.recursion = recursion;
                recursiveColumns.push(recursiveColumn);
            }
        }
    }

    function populateFilterColumns(field, filterColumns) {                                                               // method to populate filter columns
        if (field.filterspace) { //Did for not showing checkbox for selecting filter for field in which filterspace is defined
            return;
        }
        var filterableColumn = {};
        filterableColumn.label = field.label;
        filterableColumn.field = field.field;
        filterableColumn.ui = field.ui;
        filterableColumn.type = field.type;
        filterableColumn.displayField = field.displayField;
        filterableColumn.time = field.time;
        filterableColumn.filterspace = field.filterspace;
        filterableColumn.asParameter = field.asParameter;
        filterableColumn.valueAsObject = field.valueAsObject;
        filterableColumn.customFilter = field.customFilter;
        filterableColumn.filterOptions = field.filterOptions;
        filterableColumn.multiple = field.multiple || field.multipleFilterable;
        filterableColumn.pastComparison = field.pastComparison;
        filterableColumn.recursion = field.recursion;
        filterableColumn.showFilterInLeft = field.showFilterInLeft;
        filterableColumn.views = field.views;
        filterableColumn.collection = field.collection;
        filterableColumn.recursiveFilter = field.recursiveFilter;
        filterableColumn.recursiveFilterField = field.recursiveFilterField;
        filterableColumn.filter = field.filter;
        filterableColumn.view = field.view;

        if (field.roleid) {
            filterableColumn.roleid = field.roleid;
        }
//        filterableColumn.reloadViewOnFilterChange = field.reloadViewOnFilterChange;
        if (field.ui == "date") {
            filterableColumn.editableCellTemplate = "<pl-date-filter></pl-date-filter>";
            filterableColumn.cellTemplate = "<div class='pl-filter-template' title='" + field.label + " : {{filter.value}}'>" + field.label + " : {{filter.value}} </div>"
            filterColumns.push(filterableColumn);
        } else if (field.ui == "autocomplete") {

            var displayRenderer = field.field;
            var displayEditor = "";
            if (field.displayField) {
                displayRenderer += "." + field.displayField;
                displayEditor = "." + field.displayField;
            }
            var filterOptr = [
                {label: "=="},
                {label: "!="}
            ];
            if (field.recursiveFilter) {
                filterOptr.push({label: ".."});
            }
            var defaultLabel = "==";
            $scope.otherDisplayFieldsFilter = field.otherDisplayFields;
            if (field.multiple || field.multipleFilterable) {
                filterOptr.push({label: "&&"});    //for $all filter required for tags in tasks  -rohit and manjeet 31-12-2014
                filterableColumn.editableCellTemplate = "<div class='app-multiple-values' ng-repeat='value in filter." + field.field + "' style='margin:0px 3px;'>" +
                    "                                       <span class='value' ng-bind='value" + displayEditor + "'></span>" +
                    "                                       <span ng-repeat='otherCol in otherDisplayFieldsFilter' ng-show='value[otherCol]'> | {{value[otherCol]}}</span> " +
                    "                                       <span pl-remove-value ng-model='filter." + field.field + "' ng-click='remove($index, $event)' class='cross'><i class='icon-remove'></i></span>" +
                    "                                   </div>" +
                    "                                   <div class='app-position-relative app-float-left'>" +
                    "                                       <input data-other-display-fields='" + field.otherDisplayFields + "' style='width:auto;' data-container='body' class='app-border-none-important form-control app-float-left'  ng-model='filter." + field.field + "'  data-animation='am-flip-x' ng-options='data as data" + displayEditor + " for data in getLookupData($viewValue,filter.field, $fetchAllData, true)' placeholder='{{filter.label}}' bs-typeahead type='text' data-multiple=true/>" +
                    "                                       <input class='pl-filter-dropdown-parent' type='text' tabindex='-1' style='width:20px;' >" +
                    "                                       <img src='../images/loading.gif' class='pl-loading-image' ng-show='loadingImage' />" +
                    "                                   <div style='width:20px;' class='pl-autocomplete-filter-operator' pl-menu-group = 'filter.filterOperators' ></div>" +
                    "                                   </div>";
                filterableColumn.cellTemplate = "<span title='" + field.label + ": {{filterValue" + displayEditor + "}}'>" + field.label + " : </span>" +
                    "                            <span ng-show='filter.filterOperators.label != \"==\"' title='{{filter.filterOperators.label}}' ng-bind='filter.filterOperators.label'></span>" +
                    "                            <span ng-repeat='filterValue in filter." + field.field + "' title='{{filterValue" + displayEditor + "}}'>" +
                    "                                {{filterValue" + displayEditor + "}}" +
                    "                                <span ng-repeat='otherCol in otherDisplayFieldsFilter'   ng-show='filterValue[otherCol]'> | {{filterValue[otherCol]}}</span>; " +
                    "                           </span>";

            } else {
                filterableColumn.editableCellTemplate = "<div class='app-position-relative app-float-left'>" +
                    "                                       <input data-other-display-fields='" + field.otherDisplayFields + "' data-container='body' class='app-border-none-important form-control app-float-left pl-border-radius-3px'  ng-model='filter." + field.field + "'  data-animation='am-flip-x' ng-options='data as data" + displayEditor + " for data in getLookupData($viewValue,filter.field,$fetchAllData, true)' placeholder='{{filter.label}}' bs-typeahead type='text'/>" +
                    "                                       <input class='pl-filter-dropdown-parent' type='text' tabindex='-1' style='width:20px;' >" +
                    "                                       <img src='../images/loading.gif' class='pl-loading-image' ng-show='loadingImage' />" +
                    "                                       <div class='pl-autocomplete-filter-operator' pl-menu-group = 'filter.filterOperators' ></div>" +
                    "                                   </div>";
                filterableColumn.cellTemplate = "<div class='pl-filter-template' title='" + field.label + ": {{filter." + displayRenderer + "}}'>" + field.label + " : " +
                    "                               <span ng-bind='filter.filterOperators.label' title='{{filter.filterOperators.label}}' ng-show='filter.filterOperators.label != \"==\"'></span> " +
                    "                               {{filter." + displayRenderer + "}} " +
                    "                               <span ng-repeat='otherCol in otherDisplayFieldsFilter' ng-show='otherCol'> | {{filter." + field.field + "[otherCol]}}</span> " +
                    "                            </div>"
            }
            filterableColumn.filterOperators = {
                menus: filterOptr,
                menuClass: 'app-text-align-left',
                displayField: "label",
                label: defaultLabel,
                hideOnClick: true,
                showOptions: true
            };
            filterColumns.push(filterableColumn);
        } else if (field.ui == "number") {
            filterableColumn.filterOperators = {
                menus: [
                    {label: ">="},
                    {label: "<"},
                    {label: "<="},
                    {label: "!="},
                    {label: "="}
                ],
                displayField: "label",
                label: "=",
                hideOnClick: true
            };
            filterableColumn.editableCellTemplate = "<input style='width:80%' class='app-border-none-important form-control app-float-left' type='text' placeholder='{{filter.label}}' ng-model='filter." + field.field + "' ></input>" +
                "<div class='pl-filter-operator' pl-menu-group = 'filter.filterOperators' ></div>";
            filterableColumn.cellTemplate = "<div class='pl-filter-template' title='" + field.label + " : {{filter.filterOperators.label}} {{filter." + field.field + "}}' >" + field.label + " : {{filter.filterOperators.label}} {{filter." + field.field + "}} </div>"
            filterColumns.push(filterableColumn);
        } else if (field.ui == 'checkbox') {
            filterableColumn.options = field.booleanFilterMapping;
            filterableColumn.editableCellTemplate = "<div class='app-position-relative app-float-left'>" +
                "                                       <input data-other-display-fields='" + field.otherDisplayFields + "' data-container='body' class='app-border-none-important form-control app-float-left pl-border-radius-3px'  ng-model='filter." + field.field + "'  data-animation='am-flip-x' ng-options='data as data for data in getLookupData($viewValue,filter.field,$fetchAllData, true)' placeholder='{{filter.label}}' bs-typeahead type='text'/>" +
                "                                       <input class='pl-filter-dropdown-parent' type='text' tabindex='-1' style='width:20px;' >" +
                "                                       <img src='../images/loading.gif' class='pl-loading-image' ng-show='loadingImage' />" +
                "                                   </div>";
            filterableColumn.cellTemplate = "<div class='pl-filter-template' title='" + field.label + " : {{filter." + field.field + "}}'>" + field.label + " : {{filter." + field.field + "}} </div>"
            filterColumns.push(filterableColumn);
        } else if (field.ui == 'text') {
            filterableColumn.filterOperators = {
                menus: [
                    {label: "=="},
                    {label: "!="}
                ],
                displayField: "label",
                label: "==",
                hideOnClick: true
            };
            filterableColumn.editableCellTemplate = "<input class='app-border-none-important form-control app-float-left' type='text' placeholder='{{filter.label}}' ng-model='filter." + field.field + "' />";
            filterableColumn.cellTemplate = "<div class='pl-filter-template' title='" + field.label + " : {{filter." + field.field + "}}'>" + field.label + " : {{filter." + field.field + "}} </div>"
            filterColumns.push(filterableColumn);
        }
    }                                                          // method to populate filterColumns

    function getHeaderActionFilter(filterColumns, actions, viewOptions) {                                                      // method add actions of filter type into filterColumns
        if (actions && actions.length > 0) {
            for (var i = 0; i < actions.length; i++) {
                var action = actions[i];
                if (action.type == "filter") {
                    if (viewOptions && action.showFilterInLeft && !viewOptions.showFilterInLeft) {//this work is done for compositeViewOptions and showing calling pl-view in right 80%
                        viewOptions.showFilterInLeft = true;
                    }
                    populateFilterColumns(action, filterColumns);
                }

            }
        }
    }

    function populateAggregateFields(fields) {
        var aggregateFields = [];
        var length = fields ? fields.length : 0;
        for (var i = 0; i < length; i++) {
            if (fields[i].aggregate === "sum") {
                aggregateFields.push(fields[i]);
            }
        }
        return aggregateFields;
    }

    function populateNestedAggregateData(newData, aggregateFields, aggregateData) {
        for (var i = 0; i < aggregateFields.length; i++) {
            var field = aggregateFields[i];
            var value = undefined;
            if (field.type === "currency") {
                var total = calculateTotal(newData, field.field, field.type);
                value = {
                    "amount": total.total,
                    "type": total.type
                }
            } else if (field.type === "duration") {
                var total = calculateTotal(newData, field.field, field.type);
                var time = total.total;
                if (total.type) {
                    time = total.total / 60;
                }
                value = {
                    "time": time,
                    unit: total.type
                }
            } else if (field.type === "number") {
                var exp = field.field;
                value = calculateTotal(newData, field.field, field.type).total;
            } else {
                var title = "populateNestedAggregateData in pl-view";
                var message = "aggregate not supported for type >>> " + JSON.strinigfy(field);
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
            }
            aggregateData[field.field] = value;
        }
    }

    function calculateTotal(newData, expression, type) {
        var total = 0;
        var TYPE = undefined;

        for (var i = 0; i < newData.length; i++) {
            var row = newData[i];
            var convertedValue = undefined;
            var value = Util.resolveDot(row, expression);
            if (type === "duration") {
                convertedValue = value ? value.time : 0;
                if (value && value.unit === "Days") {
                    convertedValue = convertedValue * 8 * 60;
                } else if (value && value.unit === "Hrs") {
                    convertedValue = convertedValue * 60;
                }
                total += convertedValue;
                if (!TYPE) {
                    TYPE = value ? value.unit : undefined;
                }
            } else if (type === "currency") {
                convertedValue = value ? value.amount : 0;
                total += convertedValue;
                if (!TYPE) {
                    TYPE = value ? value.type : undefined;
                }
            } else {
                total += value ? value : 0;
            }
        }
        return {
            total: total,
            type: TYPE
        };
    }

    $scope.populateFilterInfo = function (filterInfos, filterColumns) {
        try {
            if (!filterInfos || !viewOptions.fields) {
                return;
            }
            for (var i = filterInfos.length - 1; i >= 0; i--) {
                var filterInfo = filterInfos[i];
                if (filterInfo.filterspace) { //Did for not showing filterInfos for filterspace filters
                    filterInfos.splice(i, 1);
                    continue;
                }
                for (var j = 0; j < filterColumns.length; j++) {
                    var field = filterColumns[j];
                    if (field.field == filterInfo.field) {
                        field.__selected__ = filterInfo.__selected__;
                        filterInfo.pastComparison = field.pastComparison;
                        filterInfo.filterOptions = field.filterOptions;
                        filterInfo.customFilter = field.customFilter;
                        filterInfo.valueAsObject = field.valueAsObject;
                        filterInfo.displayField = field.displayField;
                        filterInfo.type = field.type;
                        filterInfo.multiple = field.multiple || field.multipleFilterable;
                        filterInfo.options = field.options;
                        filterInfo.time = field.time;
                        filterInfo.recursiveFilter = field.recursiveFilter;
                        filterInfo.recursiveFilterField = field.recursiveFilterField;
                        filterInfo.collection = field.collection;
//                        filterInfo.filter = field.filter; // It is causing null to be set in filter of date type filter
                        filterInfo.view = field.view;
//                    filterCol.reloadViewOnFilterChange = field.reloadViewOnFilterChange;
                        break;
                    }
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.populateSortInfo = function (sortInfo, sortColumns) {
        try {
            if (sortInfo) {
                for (var i = 0; i < sortInfo.length; i++) {
                    var sortInfoCol = sortInfo[i];
                    if (angular.isDefined(sortInfoCol.__selected__)) {
                        for (var j = 0; j < sortColumns.length; j++) {
                            if (sortInfoCol.field == sortColumns[j].field) {
                                sortColumns[j].__selected__ = sortInfoCol.__selected__;
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.populateRecursiveInfo = function (recursionInfo, recursiveColumns) {//this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
        try {                                                                  //to show the recursiveColumn selected on reloading view
            if (recursionInfo) {
                for (var i = 0; i < recursionInfo.length; i++) {
                    var recursionInfoCol = recursionInfo[i];
                    if (angular.isDefined(recursionInfoCol.__selected__)) {
                        for (var j = 0; j < groupColumns.length; j++) {
                            if (recursionInfoCol.field == recursiveColumns[j].field) {
                                recursiveColumns[j].__selected__ = recursionInfoCol.__selected__;
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };


    $scope.populateGroupInfo = function (groupInfo, groupColumns) {
        try {
            if (groupInfo) {
                for (var i = 0; i < groupInfo.length; i++) {
                    var groupInfoCol = groupInfo[i];
                    if (angular.isDefined(groupInfoCol.__selected__)) {
                        for (var j = 0; j < groupColumns.length; j++) {
                            if (groupInfoCol.field == groupColumns[j].field) {
                                groupColumns[j].__selected__ = groupInfoCol.__selected__;
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.setFetchCountInPageOptions = function (count) {
        $scope.view.viewOptions.sharedOptions.pageOptions.count = count;
        $scope.view.viewOptions.sharedOptions.pageOptions.fetchCount = $scope.view.viewOptions.fetchCount;
    }

    $scope.populateAggregateDataInAsync = function () {
        var userDB = ApplaneDB.connection("userdb");
        if (viewOptions.aggregateQueryGrid) {
            userDB.query(viewOptions.aggregateQueryGrid).then(function (result) {
                if (result && result.response && result.response.result && result.response.result.length > 0) {
                    for (var key in result.response.result[0]) {
                        aggregateData[key] = result.response.result[0][key];
                    }
                    if ($scope.view.viewOptions.fetchCount && $scope.view.viewOptions.aggregateQueryGrid && aggregateData.__count !== undefined) {
                        $scope.setFetchCountInPageOptions(aggregateData.__count);
                    }
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            });
        }
    }

    function populatePageOptions() {
        if ($scope.view.viewOptions.sharedOptions.pageOptions && dataModel && dataModel.query) {
            $scope.view.viewOptions.sharedOptions.pageOptions.pageSize = dataModel.query.$limit;
            if ($scope.view.viewOptions.fetchCount && dataModel.aggregateQuery && dataModel.aggregateData && dataModel.aggregateData.__count !== undefined) {
                $scope.setFetchCountInPageOptions(dataModel.aggregateData.__count);
            }
            var startCursor = dataModel.query.$skip || 0;
            $scope.dataInfo = dataModel.dataInfo;
            var endCursor = startCursor;
            if (dataModel.dataCount > 0) {
                $scope.view.viewOptions.sharedOptions.pageOptions.currentRowPointer = $scope.view.viewOptions.sharedOptions.pageOptions.currentRowPointer || "First";
                if ($scope.view.viewOptions.alignModel === false) {
                    //NOTE: check alignModel to keep at same record which was updated or refresh by setting currentRowPointer= undefined when refresh data
                    $scope.view.viewOptions.sharedOptions.pageOptions.currentRowPointer = undefined;
                    $scope.view.viewOptions.alignModel = undefined;
                }
                if ($scope.view.viewOptions.sharedOptions.pageOptions.currentRowPointer) {
                    if (($scope.view.viewOptions.sharedOptions.pageOptions.currentRowPointer == "First")) {
                        $scope.view.viewOptions.sharedOptions.currentRowIndex = 0;
                    } else if (($scope.view.viewOptions.sharedOptions.pageOptions.currentRowPointer == "Last")) {
                        $scope.view.viewOptions.sharedOptions.currentRowIndex = dataModel.dataCount - 1;
                    }
                    $scope.view.viewOptions.sharedOptions.currentRow = dataModel.data[$scope.view.viewOptions.sharedOptions.currentRowIndex];
                    $scope.view.viewOptions.sharedOptions.currentRowChanged = !$scope.view.viewOptions.sharedOptions.currentRowChanged;
                }
                if (dataModel.dataCount > $scope.view.viewOptions.sharedOptions.pageOptions.pageSize) {
                    endCursor = startCursor + $scope.view.viewOptions.sharedOptions.pageOptions.pageSize;
                } else {
                    endCursor = startCursor + dataModel.dataCount;
                }
                $scope.view.viewOptions.sharedOptions.pageOptions.label = (startCursor + 1) + "-" + (endCursor);
            } else {
                $scope.view.viewOptions.sharedOptions.pageOptions.label = startCursor + "-" + endCursor;
            }

            if (startCursor >= 1) {
                $scope.view.viewOptions.sharedOptions.pageOptions.hasPrevious = true;
            } else {
                $scope.view.viewOptions.sharedOptions.pageOptions.hasPrevious = false;
            }

            if ($scope.dataInfo && $scope.dataInfo.hasNext) {
                $scope.view.viewOptions.sharedOptions.pageOptions.hasNext = true;
            } else {
                $scope.view.viewOptions.sharedOptions.pageOptions.hasNext = false;
            }
            $scope.view.viewOptions.sharedOptions.pageOptions.cursor = startCursor;
            $scope.view.viewOptions.sharedOptions.pageOptions.endCursor = endCursor;
        }
    }

    function populateFormPageOptions() {
        if ($scope.formOptions.sharedOptions.pageOptions && $scope.formOptions.parentSharedOptions && $scope.formOptions.parentSharedOptions.pageOptions) {

            $scope.formOptions.sharedOptions.pageOptions.cursor = $scope.formOptions.parentSharedOptions.currentRowIndex;

            var now = $scope.formOptions.parentSharedOptions.pageOptions.cursor + $scope.formOptions.sharedOptions.pageOptions.cursor;
            $scope.formOptions.sharedOptions.pageOptions.pageSize = 1;

            $scope.formOptions.sharedOptions.pageOptions.label = now + 1;
            if (now == 0) {
                $scope.formOptions.sharedOptions.pageOptions.hasPrevious = false;
            } else {
                $scope.formOptions.sharedOptions.pageOptions.hasPrevious = true;
            }
            if ((!$scope.formOptions.parentSharedOptions.pageOptions.hasNext) && (now + 1) >= $scope.formOptions.parentSharedOptions.pageOptions.endCursor) {
                $scope.formOptions.sharedOptions.pageOptions.hasNext = false;
            } else {
                $scope.formOptions.sharedOptions.pageOptions.hasNext = true;
            }
        }
    }

    function resolveViewId(formView, parameters) {
        for (var k in formView) {
            var paramVal = formView[k];
            if (typeof paramVal === "string" && paramVal.indexOf("$") === 0) {
                paramVal = paramVal.substring(1);
                var filterValue = Util.resolveDot(parameters, paramVal);
                formView[k] = filterValue;
            }
        }
    }

    $scope.loadFile = function (name, type, contents) {
        if (dataModel) {
            if ($scope.workbenchOptions && $scope.workbenchOptions.busyMessageOptions) {
                $scope.workbenchOptions.busyMessageOptions.msg = "Uploading..";
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            return dataModel.uploadFile(name, type, contents).then(
                function (result) {
                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                    return result;
                }).fail(function (err) {
                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                    throw err;
//                    $scope.view.viewOptions.warningOptions.error = err;
//                    if (!$scope.$$phase) {
//                        $scope.$apply();
//                    }

                });
        } else {

            var title = "loadFile in pl.view";
            var message = "Datamodel not found for loadfile";
            $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
        }
    };

    $scope.resolveActions = function (row, actions) {
        var d = require("q").defer();
        if (!row || !actions || actions.length === 0) {
            d.resolve();
            return d.promise;
        }
        return Util.asyncIterator(actions,
            function (index, action) {
                var when = action.when;
                if (!when) {
                    return;
                }
                try {
                    when = JSON.parse(when);
                } catch (e) {
                }
                var functionName = undefined;
                var parameters = {_id: row._id};
                if (Util.isJSONObject(when) && Object.keys(when).length > 0) {
                    functionName = Object.keys(when)[0];
                    var newParameters = when[functionName];
                    if (functionName.indexOf("$$") === 0) {
                        functionName = functionName.substring(2);
                    } else {
                        return;
                    }
                    $scope.resolveParameters(newParameters, row, parameters);
                } else if (when.indexOf("$$") === 0) {
                    functionName = when.substring(2);
                } else {
                    return;
                }
                return ApplaneDB.connection("userdb").invokeFunction(functionName, [
                    parameters
                ]).then(function (result) {
                    action.hide = !result.response
                })
            }).fail(function (e) {
                d.reject(e);
            })
    };

    $scope.resolveParameters = function (parameters, row, resolvedParameters) {
        try {
            if (!parameters) {
                return;
            }
            for (var k in parameters) {
                var paramVal = parameters[k];
                if (typeof paramVal === "string" && paramVal.indexOf("$") == 0) {
                    paramVal = paramVal.substring(1);
                    var filterValue = Util.resolveDot(row, paramVal);
                    resolvedParameters[k] = filterValue;
                } else {
                    resolvedParameters[k] = paramVal;
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.splitQviewHeader = function () {
        try {
            if ($scope.view.viewOptions && $scope.view.viewOptions.quickViewMenuGroup && $scope.view.viewOptions.quickViewMenuGroup.menus) {
                var toolbarWidth = angular.element('.pl-header-toolbar').width();
                var toolbarHeader = angular.element('#toolBarHeader');
                var viewWidth = toolbarWidth;
                if (!toolbarWidth || !toolbarHeader) {
                    return;
                }
                for (var i = 0; i < $scope.view.viewOptions.quickViewMenuGroup.menus.length; i++) {
                    $scope.view.viewOptions.quickViewMenuGroup.menus[i].hide = false;
                    if ($scope.view.viewOptions.quickViewMenuGroup.menus[i].mores) {
                        $scope.view.viewOptions.quickViewMenuGroup.menus.splice(i, 1);
                    }
                }
                var splitIndex = undefined;
                $(toolbarHeader).find("li").each(function (index) {
                    var qMenuPos = $(this).offset().left + $(this).width();
                    if (qMenuPos > (viewWidth - 250) && splitIndex == undefined) {
                        splitIndex = index;
                    }
                });
                if (splitIndex > 0) {
                    if (!$scope.view.viewOptions.quickViewMenuGroup.breakingIndex) {
                        $scope.view.viewOptions.quickViewMenuGroup.breakingIndex = splitIndex;
                    }
                    var maxIndex = 500000;
                    var isMores = undefined;
                    for (var i = 0; i < $scope.view.viewOptions.quickViewMenuGroup.menus.length; i++) {
                        if ($scope.view.viewOptions.quickViewMenuGroup.menus[i].index > maxIndex) {
                            maxIndex = $scope.view.viewOptions.quickViewMenuGroup.menus[i].index;
                        }
                        if (i >= splitIndex - 1) {
                            $scope.view.viewOptions.quickViewMenuGroup.menus[i].hide = true;
                        } else {
                            $scope.view.viewOptions.quickViewMenuGroup.menus[i].hide = false;
                        }
                        if ($scope.view.viewOptions.quickViewMenuGroup.menus[i].mores) {
                            $scope.view.viewOptions.quickViewMenuGroup.menus.splice(i, 1);
                        }
                    }
                    if (isMores == undefined) {
                        var otherMenu = {
                            label: "More..",
                            mores: true,
                            _id: '__more',
                            onClick: 'qViewHeaderPopup',
                            index: maxIndex
                        };
                        $scope.view.viewOptions.quickViewMenuGroup.menus.push(otherMenu);
                    }

                } else {
//                var menuBar = document.getElementsByClassName('header-l-bar');
//                menuBar[0].style.maxWidth = (viewWidth - 200) + 'px';
//                menuBar[0].style.overflow = 'hidden';
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    unwatcher.viewResized = $scope.$watch('view.viewOptions.viewResized', function (newValue, oldValue) {
        if (angular.isDefined(newValue)) {
            if ($scope.view.viewOptions.style) {
                if ($scope.view.viewOptions.style.left == $scope.leftZero) {
                    if ($scope.view.viewOptions.fullMode) {
                        $scope.view.viewOptions.sharedOptions.viewPosition = 'full';
                    } else {
                        $scope.view.viewOptions.sharedOptions.viewPosition = 'left';
                    }
                } else if ($scope.view.viewOptions.style.left == $scope.leftChild) {
                    $scope.view.viewOptions.sharedOptions.viewPosition = 'right';
                }
            }
            $timeout(function () {
                if ($scope.view.viewOptions && $scope.view.viewOptions.quickViewMenuGroup && $scope.view.viewOptions.quickViewMenuGroup.menus) {
                    $scope.view.viewOptions.quickViewMenuGroup.menus = angular.copy($scope.view.viewOptions.qViewClone);
                    $timeout(function () {
                        $scope.splitQviewHeader();
                    }, 0);
                }
            }, 0)
        }
    });

    $scope.viewRowAction = function (rowAction) {
        try {
            var closeViewIndex = undefined;
            var nextViewInfo = $scope[$scope.view.viewOptions.getV]($scope.view.viewOptions.viewIndex + 1);
            if (nextViewInfo && nextViewInfo.viewOptions && nextViewInfo.viewOptions.parentViewIndex === $scope.view.viewOptions.viewIndex) {
                closeViewIndex = $scope.view.viewOptions.viewIndex + 1;
            }

            if ($scope.view.viewOptions.sharedOptions && $scope.view.viewOptions.sharedOptions.currentRowChanged !== undefined) {
                $scope.view.viewOptions.sharedOptions.currentRowChanged = undefined; //for the first time when child view or detail open, currentRowChanged watch should not fire
            }

            if (rowAction.type == "detail") {
                var formViewOptions = {};
                var formView = {viewOptions: formViewOptions};
                formViewOptions.closeViewIndex = closeViewIndex;
                var viewOptions = $scope.view.viewOptions;
                if (rowAction.nestedForm) {
                    formViewOptions.headerTemplate = "<div pl-accordion class='app-background-grey'  style='display: table-caption;'>" +
                        "                               <span class='app-float-left app-cursor-pointer pl-group-title'  ng-click='close()'>{{formOptions.label}}</span>" +
                        "                               <span class='app-float-right'>" +
//                        "                               <i ng-click='close()' title='Back' class=' app-float-left  pl-button-box pl-back' ></i>" +
                        "                               <i ng-click='closeAndNew()' title='New' class='app-float-left icon-plus pl-button-box ' ></i>" +
                        "                                   <span class='app-float-right pl-button-box' title='Up/Down' ng-click='toggleChild()'>" +
                        "                                       <i class=\"pl-accordion icon-chevron-up\" ></i>" +
                        "                                   </span> " +
                        '                                   <div ng-click="close()" title="Close" class="app-float-left pl-button-box pl-close-btn pl-top-label-text pl-line-height" style="margin: 0 2px;"><i class="icon-remove"></i></div>' +
                        "                               </span> " +
                        "                           </div>";

                    formViewOptions.saveOptions = viewOptions.sharedOptions.saveOptions;
                }
                if (rowAction.refreshDataOnLoad !== undefined) {
                    formViewOptions.refreshDataOnLoad = rowAction.refreshDataOnLoad;
                }
                formViewOptions.popupResize = viewOptions.popupResize;
                formViewOptions._id = viewOptions._id;
                formViewOptions.id = viewOptions.id;
                formViewOptions.mainCollection = viewOptions.mainCollection;
                formViewOptions.collection_id = viewOptions.collection_id;
                formViewOptions.mainCollection_id = viewOptions.mainCollection_id;
                formViewOptions.mainCollection = viewOptions.mainCollection;
                formViewOptions.sourceid = viewOptions.sourceid;
                formViewOptions.requestView = viewOptions.requestView;
                formViewOptions.admin = viewOptions.admin;
                if (viewOptions.queryForm && viewOptions.queryForm.$parameters) {         // to resolve the header action visibility
                    formViewOptions.parameters = viewOptions.queryForm.$parameters;
                }
                formViewOptions.collectionLevelCustomization = viewOptions.collectionLevelCustomization;
                formViewOptions.qviewLevelCustomization = viewOptions.qviewLevelCustomization;
                formViewOptions.viewLevelCustomization = viewOptions.viewLevelCustomization;
                formViewOptions.userLevelCustomization = viewOptions.userLevelCustomization;
                formViewOptions.popupStyle = viewOptions.popupStyle;
                formViewOptions.fullMode = viewOptions.fullMode;
                formViewOptions.autoWidthColumn = viewOptions.autoWidthColumn;
                formViewOptions.fieldCustomization = viewOptions.fieldCustomization;
                formViewOptions.crossTabInfo = viewOptions.crossTabInfo;
                formViewOptions.updateMode = viewOptions.updateMode;
                formViewOptions.saveCustomization = viewOptions.saveCustomization;
                formViewOptions.responsiveColumns = viewOptions.responsiveColumns;
                formViewOptions.parentViewIndex = viewOptions.viewIndex;
                formViewOptions.width = viewOptions.width;
                formViewOptions.collection = viewOptions.collection;
                formViewOptions.height = viewOptions.height;
                formViewOptions.queryGrid = viewOptions.queryGrid;
                formViewOptions.events = viewOptions.events;
                formViewOptions.queryForm = viewOptions.queryForm;
                formViewOptions.label = 'Detail';
                formViewOptions.tabLabel = viewOptions.tabLabel || viewOptions.label;
                if (rowAction.nestedForm) {
                    formViewOptions.label = $scope.view.viewOptions.label;
                }
                // when the insert button is clicked addNewRow is set to true and we are going to cache the lookup fields.
                if (rowAction.addNewRow) {
                    formViewOptions.showLabel = false;
                    formViewOptions.queryLookupData = true;
                } else {
                    formViewOptions.showLabel = true;
                }
                formViewOptions.fields = viewOptions.fields;
                formViewOptions.ui = "form";
                formViewOptions.close = true;
                formViewOptions.save = viewOptions.save;
                formViewOptions.viewControl = false;
                formViewOptions.viewResize = viewOptions.viewResize;
                formViewOptions.viewPosition = viewOptions.viewPosition || 'right';
                formViewOptions.nested = viewOptions.nested || false;
                formViewOptions.groups = viewOptions.groups;
                formViewOptions.parameters = rowAction.parameters;
                formViewOptions.parentSharedOptions = $scope.gridOptions.sharedOptions;
                formViewOptions.edit = angular.isDefined(viewOptions.edit) ? viewOptions.edit : true;
                formViewOptions.insert = angular.isDefined(viewOptions.insert) ? viewOptions.insert : true;
                formViewOptions.actions = viewOptions.actions;
                formViewOptions.deAttached = rowAction.deAttached;
                formViewOptions.quickInsert = viewOptions.quickInsert;
                formViewOptions.shortMessageOptions = viewOptions.shortMessageOptions;
                formViewOptions.showZeroIfNull = viewOptions.showZeroIfNull;
                // set deAttached = true in case of viewOptions.$unwind, and set currentRow._id as data _id to load current row data and deAttached form current row
                if (!formViewOptions.deAttached) {
                    if (viewOptions.queryGrid && viewOptions.queryGrid.$unwind) {
                        formViewOptions.deAttached = true;
                        if ($scope.gridOptions.sharedOptions && $scope.gridOptions.sharedOptions.currentRow) {
                            rowAction.data = [
                                {_id: $scope.gridOptions.sharedOptions.currentRow._id}
                            ]
                        }
                    }
                    rowAction.watchParent = true;
                }

                if (formViewOptions.deAttached) {
                    if (rowAction.data) {
                        formViewOptions.data = "data";
                        formView.data = rowAction.data;
                    }
                    formViewOptions.saveOptions = formViewOptions.saveOptions || rowAction.saveOptions;
                    formViewOptions.addNewRow = rowAction.addNewRow;
                    formViewOptions.navigation = false;
                    formViewOptions.watchParent = rowAction.watchParent;
                } else {
                    formViewOptions.dataModel = dataModel;
                    formViewOptions.watchParent = true;
                    formViewOptions.editMode = $scope.gridOptions.editMode;
                    formViewOptions.navigation = viewOptions.navigation;
                }

                $scope[$scope.view.viewOptions.openV](formView);

            } else if (rowAction.type == "view") {
                var formView = {};
                if (rowAction.qviews && rowAction.qviews.length > 0) {
                    var qview = rowAction.qviews[0];
                    formView.id = qview.id;
                    formView.label = qview.label;
                    formView.ui = qview.ui;
                    if (qview && qview.limit !== undefined) {
                        formView.$limit = qview.limit;
                    }
                } else {
                    formView.id = rowAction.collection;
                }
                formView.parentViewIndex = $scope.view.viewOptions.viewIndex;
                var filter = rowAction.filter || {};
                if (typeof filter == "string" && filter.indexOf("$") != 0) {
                    try {
                        filter = JSON.parse(filter);
                    } catch (e) {
                        //ignore error of parsing, ignore or not ?
                    }
                }

                var parameters = rowAction.parameters || {};
                parameters = typeof parameters == "string" ? JSON.parse(parameters) : parameters;
                var rowActionSharedOptions = $scope.view.viewOptions.sharedOptions;
                if (filter) {
                    formView.$filter = filter;
                }
                var p = {};
                var currentRow = rowActionSharedOptions && rowActionSharedOptions.currentRow ? rowActionSharedOptions && rowActionSharedOptions.currentRow : {}
                var queryToPopulateParameters = undefined;
                if (dataModel) {
                    queryToPopulateParameters = dataModel.query;
                }
                p = populateParametersFromQuery(p, currentRow, queryToPopulateParameters);
                if (parameters) {
                    var newParameters = {};
                    $scope.resolveParameters(parameters, p, newParameters);
                    // to resolve the __viewid parameter passed in case of comments
                    resolveViewId(formView, newParameters);

                    formView.$parameters = newParameters;
                    formView.$parametermappings = parameters;
                    formView.parentSharedOptions = $scope.view.viewOptions.sharedOptions;
                }
                formView.close = true;
                formView.viewPosition = $scope.view.viewOptions.fullMode ? 'full' : 'right';
                formView.watchParent = rowAction.watchParent !== undefined ? rowAction.watchParent : true;
                formView.closeViewIndex = closeViewIndex;
                formView.sourceid = rowAction._id;
                formView.events = rowAction.events;
                formView.insert = rowAction.insert;
                formView.edit = rowAction.edit;
                formView.delete = rowAction.delete;
                formView.detail = rowAction.detail;
                formView.selfInsertView = true;
                formView.showLabel = true;
                formView.skipUserState = true;
                formView.primaryField = $scope.view.viewOptions.primaryField;
                $scope[$scope.view.viewOptions.openV](formView);
            } else if (rowAction.type == "invoke") {
                var invokeAction = angular.copy(rowAction);
                var sharedOptions = $scope.view.viewOptions.sharedOptions;
                if (!sharedOptions || !sharedOptions.currentRow) {
                    var title = "$scope.viewRowAction in pl.view";
                    var message = "Shared options or current row not found in row action";
                    $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                    return;
                }
                $scope.handleInvokeMethod(invokeAction, sharedOptions.currentRow);
            } else if (rowAction.type == "referredView") {
                //it is not a row action, it will be comes form refferedView column click
                formView = rowAction.referredView;
                //Naveen Singh 08/07/2014
                //To open children of row in another view we use $self based condition
                var target = undefined;

                formView.$filter = formView.$filter || formView.filter;
                var parameters = formView.parameters;
                if (parameters && rowAction.currentRow) {
                    var newParameters = {};
                    var p = {};
                    var queryToPopulateParameters = undefined;
                    if (dataModel) {
                        queryToPopulateParameters = dataModel.query;
                    }
                    p = populateParametersFromQuery(p, rowAction.currentRow, queryToPopulateParameters);
                    var rowSelectedAsChildren = p.__children;   //row selected was xyz & team --> so we will apply childrenFilter
                    if (rowSelectedAsChildren && p.__self_id) {
                        if (formView.$childrenFilter) {
                            formView.$filter = formView.$childrenFilter;
                        }
                    } else {
                        if (formView.$selfFilter) {
                            formView.$filter = formView.$selfFilter;
                        }
                    }
                    $scope.resolveParameters(parameters, p, newParameters);
                    // to resolve the __viewid parameter passed in case of comments
                    resolveViewId(formView, newParameters);
                    formView.$parameters = newParameters;
                    formView.$parametermappings = parameters;
                }
                target = formView;
                formView.closeViewIndex = closeViewIndex;
                formView.refreshParentInBackground = false;
                if (rowAction.sourceid) {
                    formView.sourceid = rowAction.sourceid;
                }
                target.primaryField = $scope.view.viewOptions.primaryField;
                target.parentViewIndex = $scope.view.viewOptions.viewIndex;
                target.parentSharedOptions = $scope.view.viewOptions.sharedOptions;
                target.getV = $scope.view.viewOptions.getV;
                target.close = true;
                target.viewPosition = $scope.view.viewOptions.fullMode ? 'full' : 'right';
                target.showLabel = true;
                target.skipUserState = true;
                $scope[$scope.view.viewOptions.openV](formView);

            } else {
                var title = "$scope.viewRowAction in pl.view";
                var message = "Not supported row action[" + rowAction.type + "]";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }


    }

    function populateParametersFromQuery(p, currentRow, query) {
        if (query && query.$parameters) {
            p = angular.copy(query.$parameters);
        }
        if (query && query.$filter) {
            for (var key in query.$filter) {
                if (p[key] === undefined) {
                    var value = query.$filter[key];
                    if (value && Utility.isJSONObject(value) && value.$$whenDefined) {
                        //in case of $$whenDefined available in value -- it should not be used to resolve the parameters ---- Rajit 25/apr/2015
                    } else {
                        p[key] = value;
                    }
                }
            }
        }
        for (var k in currentRow) {
            p[k] = angular.copy(currentRow[k]);
        }
        var rowSelectedAsChildren = p.__children;   //row selected was xyz & team --> so we will apply childrenFilter
        if (rowSelectedAsChildren && p.__self_id) {
            p._id = p.__self_id;
            p.__childrenSelected = true;
        }
        return p;
    }

    $scope.removeUserFieldCustomization = function () {
        return ApplaneDB.connection("userdb").invokeFunction("SaveUserState.deleteUserFieldCustomization", [
            {collection_id: $scope.view.viewOptions.collection_id}
        ])

    }

    $scope.removeFieldCustomization = function () {
        return ApplaneDB.connection("userdb").invokeFunction("SaveUserState.deleteFieldCustomization", [
            {collection_id: $scope.view.viewOptions.collection_id}
        ])
    }

    $scope.handleFieldDragChanges = function (field, colType) {
        if (!field._id) {
            var title = "$scope.handleFieldDragChanges in pl.view";
            var message = "No _id found in field for recording dragging>>>" + JSON.stringify(field);
            $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
            return;
        }
        $scope.view.viewOptions.fieldUpdates = $scope.view.viewOptions.fieldUpdates || [];
        var updatedField = undefined;
        for (var i = 0; i < $scope.view.viewOptions.fieldUpdates.length; i++) {
            var tField = $scope.view.viewOptions.fieldUpdates[i];
            if (tField._id == field._id) {
                updatedField = tField;
                break;
            }
        }
        if (!updatedField) {
            updatedField = {
                _id: field._id,
                collection: $scope.view.viewOptions.collection
            };
            $scope.view.viewOptions.fieldUpdates.push(updatedField);
        }

        if (colType == "drag") {
            updatedField.indexGrid = field.index;
        } else if (colType == "resize") {
            updatedField.width = field.style.width;
        } else if (colType == "visibility") {
            updatedField.visibilityGrid = field.visibilityGrid;
            updatedField.visibility = false;    //if customization done, then visibility need to be false
            updatedField.visibilityForm = field.visibilityForm;

        }
        $scope.view.viewOptions.sharedOptions.saveCustomizationEnable = true;
    }

    $scope.saveAdminCustomization = function (type) {
        $scope.saveCustomization("admin", type);
    }
    $scope.saveCustomization = function (customizationScope, type) {
        if (dataModel) {
            $scope.view.viewOptions.busyMessageOptions.msg = "Saving...";
            var fieldUpdates = $scope.view.viewOptions.fieldUpdates;
            if (!type || type === "view" || type === "qview") {
                for (var i = 0; i < fieldUpdates.length; i++) {
                    var fieldUpdate = fieldUpdates[i];
                    if (!type || type === "view") {
                        fieldUpdate.qview = $scope.view.viewOptions.id;
                        fieldUpdate.sourceid = $scope.view.viewOptions.sourceid;
                    } else if (type === "qview") {
                        fieldUpdate.qview = $scope.view.viewOptions.id;
                    }
                }
            }
            return ApplaneDB.connection("userdb").invokeFunction("SaveUserState.saveFieldCustomization", [
                {
                    fieldCustomizations: fieldUpdates,
                    scope: customizationScope
                }
            ])
                .then(
                function (response) {
                    $scope.view.viewOptions.sharedOptions.saveCustomizationEnable = false;
                    if ($scope.view.viewOptions.dataModel && $scope.view.viewOptions.parentSharedOptions) {
                        delete   $scope.view.viewOptions.busyMessageOptions.msg;
                        $scope.view.viewOptions.parentSharedOptions.reloadView = !$scope.view.viewOptions.parentSharedOptions.reloadView;
                        $scope.view.viewOptions.sharedOptions.closed = true;

                    } else {
                        $scope.onQuickViewSelection($scope.view.viewOptions.requestView);
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }).fail(function (err) {
                    delete   $scope.view.viewOptions.busyMessageOptions.msg;
                    $scope.view.viewOptions.warningOptions.error = err;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
        }

    }
    $scope.deleteCustomization = function (customizationScope, type) {
        if (dataModel) {
            $scope.view.viewOptions.busyMessageOptions.msg = "Saving...";
            var params = {scope: customizationScope, collection: $scope.view.viewOptions.collection};
            if (type == 'self' || type == 'view') {
                params.qview = $scope.view.viewOptions.id;
                params.sourceid = $scope.view.viewOptions.sourceid;
            } else if (type == 'qview') {
                params.qview = $scope.view.viewOptions.id;
            }
            return ApplaneDB.connection("userdb").invokeFunction("SaveUserState.deleteFieldCustomization", [
                params
            ])
                .then(
                function (response) {
                    $scope.view.viewOptions.sharedOptions.saveCustomizationEnable = false;
                    if ($scope.view.viewOptions.dataModel && $scope.view.viewOptions.parentSharedOptions) {
                        delete   $scope.view.viewOptions.busyMessageOptions.msg;
                        $scope.view.viewOptions.parentSharedOptions.reloadView = !$scope.view.viewOptions.parentSharedOptions.reloadView;
                        $scope.view.viewOptions.sharedOptions.closed = true;

                    } else {
                        $scope.onQuickViewSelection($scope.view.viewOptions.requestView);
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }).fail(function (err) {
                    delete   $scope.view.viewOptions.busyMessageOptions.msg;
                    $scope.view.viewOptions.warningOptions.error = err;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
        }

    }

    $scope.viewHeaderAction = function (action, selectedRows) {
        try {
            if (!action) {
                var title = "$scope.viewHeaderAction in pl.view";
                var message = "Action is not defined in viewHeaderAction !";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
            var type = action.type;
            if (type == "invoke") {
                $scope.handleInvokeMethod(action);
            } else if (type == "view") {
                $scope.viewRowAction(action);
            } else {
                var title = "$scope.viewHeaderAction in pl.view";
                var message = "Header action not supported for type [" + type + "]";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.handleInvokeMethod = function (action, selectedRows) {
        try {
            action = angular.copy(action);
            var functionName = action["function"];

            if (!dataModel) {
                var title = "$scope.handleInvokeMethod in pl.view";
                var message = "Data model not found while calling invoke method";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
            if ((!selectedRows) && dataModel && dataModel["getSelectedRow"]) {
                selectedRows = dataModel.getSelectedRow();
            }
            if (action.requireSelectedRows) {

                if (!selectedRows || angular.isUndefined(selectedRows) || (!angular.isObject(selectedRows) && !angular.isArray(selectedRows)) || (angular.isArray(selectedRows) && selectedRows.length == 0)) {
                    $scope.view.viewOptions.shortMessageOptions.msg = "Please select row.";
                    return;
                }
            }
            action.parameters = action.parameters || {};
            action.parameters = typeof action.parameters == "string" ? JSON.parse(action.parameters) : action.parameters;

            action.parameters.viewid = "$__viewId";
            var actionFields = action.fields;

            // assigning templateid and preview(define at action) to action.parameters require in case of resolve template -- Rajit garg
            if (action["templateId"]) {
                action.parameters.template = action["templateId"];
                if (action["preview"]) {
                    action.parameters.preview = action["preview"];
                }
            } else if ((!actionFields || (actionFields && actionFields.length == 0)) && action.function === "ResolveTemplate.resolveTemplate") {
                actionFields = [
                    {
                        "collection": "pl.templates",
                        "displayField": "id",
                        "field": "template",
                        "label": "Template",
                        "ui": "autocomplete",
                        "filter": {"collectionid": "$__collectionId"},
                        parameters: {"__collectionId": "$__collectionId"}
                    },
                    {
                        "label": "preview",
                        "field": "preview",
                        "ui": "checkbox"
                    }
                ];
            }
            if (actionFields && actionFields.length > 0) {
                for (var i = 0; i < actionFields.length; i++) {
                    actionFields[i].visibility = true;
                }

                var v = {};
                v.data = [
                ];
                var invokeFunction = function (formUpdates) {
                    if (formUpdates && formUpdates.$insert && formUpdates.$insert.length > 0) {
                        formUpdates = formUpdates.$insert[0];
                    } else {
                        formUpdates = {};
                    }
                    confirmAllRowSelection(action, formUpdates, v, selectedRows);
                }

                // saveLabel: used to display custom name on save button and hide other save options
                v.viewOptions = {
                    close: true,
                    label: 'Invoke Action',
                    ui: "form",
                    viewResize: false,
                    showLabel: false,
                    data: "data",
                    saveOptions: {editMode: true},
                    saveFn: invokeFunction,
                    saveLabel: action.label,
                    id: viewOptions.id,
                    collection_id: viewOptions.collection_id,
                    mainCollection_id: viewOptions.mainCollection_id,
                    viewControl: false
                };
                v.viewOptions.fields = actionFields;
                v.popup = true;
                v.viewOptions.popup = true;
                if (viewOptions.openV) {
                    $scope[viewOptions.openV](v);
                }
            } else {
                confirmAllRowSelection(action, {}, v, selectedRows);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.applyInvokeMethod = function () {
        if (dataModel) {
            dataModel.save();
        }
    }

    $scope.closeInvokeMethodPopUp = function () {
        if (viewOptions.closeV) {
            $scope[viewOptions.closeV]();
        }
    }

    $scope.onViewControl = function (option) {
        try {
            if (option.viewid) {
                var view = angular.copy(AppViews[option.viewid]);
                view.popup = true;
                view.viewOptions.popupResize = true;
                if (view.viewOptions && view.viewOptions.queryGrid) {
                    view.viewOptions.queryGrid.$parameters = view.viewOptions.queryGrid.$parameters || {};
                    view.viewOptions.queryGrid.$parameters.collection_id = $scope.view.viewOptions.collection_id;
                    view.viewOptions.queryGrid.$parameters.mainCollection_id = $scope.view.viewOptions.mainCollection_id;
                    view.viewOptions.queryGrid.$parameters.view_id = $scope.view.viewOptions._id;
                    view.viewOptions.queryGrid.$parameters.viewid = $scope.view.viewOptions.id;
                    view.viewOptions.queryGrid.$parameters.sourceid = $scope.view.viewOptions.sourceid;
                }
                if (view.viewOptions && view.viewOptions.queryForm) {
                    view.viewOptions.queryForm.$parameters = view.viewOptions.queryForm.$parameters || {};
                    view.viewOptions.queryForm.$parameters.collection_id = $scope.view.viewOptions.collection_id;
                    view.viewOptions.queryForm.$parameters.mainCollection_id = $scope.view.viewOptions.mainCollection_id;
                    view.viewOptions.queryForm.$parameters.view_id = $scope.view.viewOptions._id;
                    view.viewOptions.queryForm.$parameters.viewid = $scope.view.viewOptions.id;
                    view.viewOptions.queryForm.$parameters.sourceid = $scope.view.viewOptions.sourceid;
                }
                $scope[$scope.view.viewOptions.openV](view);
            } else if (option.type === "invoke") {
                $scope.handleInvokeMethod(option, {});
            }

        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.populateUserPreferene = function (userPreferenceOptions, saveState) {
        try {
            var reloadViewOnFilterChange = (userPreferenceOptions.recursionSelected && !$scope.view.viewOptions.recursionInfo) || (!userPreferenceOptions.recursionSelected && $scope.view.viewOptions.recursionInfo)  //this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
            if (!reloadViewOnFilterChange) {                                                                                //we are reloading the view on recursion apply
                reloadViewOnFilterChange = $scope.view.viewOptions.reloadViewOnFilterChange;
            }
            if (!reloadViewOnFilterChange) {
                // change the parameters of the advance dashboard queries when filter changes.(manjeet-sangwan)
                if (dataModel instanceof DashboardDataModel && viewOptions.executeOnClient) {//check of viewOptions.executeOnClient is added here as reloadViewOnFilterChange was set true hardcoded for advance dashboard, whole view was reloading on filter applied and that was removing filter applied from left dashboard view on right view.--case on row click of project dashboard,filter of that project should be applied on the tasks dashboard
                    dataModel.setUserPreference(userPreferenceOptions);
                    dataModel.refresh(function () {
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                } else if (dataModel instanceof DataModel && $scope.view.viewOptions.ui !== "dashboard" && $scope.view.viewOptions.ui !== "composite") {
                    if (userPreferenceOptions.queryGroups !== undefined) {
                        dataModel.setGroup(userPreferenceOptions.queryGroups);
                    }
                    if (userPreferenceOptions.querySorts !== undefined) {
                        dataModel.setSort(userPreferenceOptions.querySorts);
                    }
                    if (userPreferenceOptions.queryFilters) {
                        for (var k in userPreferenceOptions.queryFilters) {
                            dataModel.setFilter(k, userPreferenceOptions.queryFilters[k]);
                        }
                    }
                    if (userPreferenceOptions.queryParameters) {
                        for (var k in userPreferenceOptions.queryParameters) {
                            dataModel.setParameter(k, userPreferenceOptions.queryParameters[k]);
                        }
                    }
                    if (dataModel.metadata && userPreferenceOptions.groupInfo && userPreferenceOptions.groupInfo.length > 0) {
                        /*to populate data in linear form in case of groupInfo set transformRecursionToLinear equal to true*/
                        dataModel.metadata.transformRecursionToLinear = isTransformResucrionToLinear(userPreferenceOptions.groupInfo, undefined, undefined);
                    }
                    if ($scope.gridOptions) {
                        $scope.gridOptions.repopulateColumn = true;
                        dataModel.setCursor(0);
                        $scope.refreshGridModel();
                    } else {
                        dataModel.refresh();
                    }

                } else {
                    $scope.view.viewOptions.sharedOptions.userPreferenceOptions = userPreferenceOptions;
                }
            }
            if ($scope.view.viewOptions.saveUserSate === false) {
                saveState = false;
            }
            if (saveState) {
                if (reloadViewOnFilterChange) {
                    if ($scope.view.viewOptions.busyMessageOptions) {
                        $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";         // this loading msg will be removed from getView in workbenchcntrl
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
                var userState = $scope.onUserStateSave(userPreferenceOptions);
                if (userState) {
                    userState.then(function (response) {
                        if (reloadViewOnFilterChange) {
                            $scope.onQuickViewSelection($scope.view.viewOptions.requestView);
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }

                    });
                }
            }

        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }


    $scope.onUserStateSave = function (userPreferenceOptions) {
        try {
            if (!userPreferenceOptions) {
                return;
            }
            var fInfo = [];
            var gInfo = [];
            var sInfo = [];
            var rInfo = [];
            var updates = {};
            var filterSpaceInfo = [];
            var removedFilterSpaceInfo = [];
            if (userPreferenceOptions.lastSelectedInfo) {
                updates.lastSelectedInfo = userPreferenceOptions.lastSelectedInfo;
            }
            if (userPreferenceOptions.groupInfo && userPreferenceOptions.groupInfo.length > 0) {
                var queryGroup = userPreferenceOptions.queryGroups;
                for (var i = 0; i < userPreferenceOptions.groupInfo.length; i++) {
                    var groupInfo = (userPreferenceOptions.groupInfo[i]);
                    var obj = {};
                    obj.field = groupInfo.field;
                    obj.displayField = groupInfo.displayField;
                    obj.label = groupInfo.label;
                    obj.recursion = groupInfo.recursion;
                    obj.__selected__ = groupInfo.__selected__;

                    gInfo.push(obj);
                }
//                if (gInfo.length > 0 && dataModel && dataModel.query && dataModel.query.$group) {
                updates.groupInfo = {
                    appliedGroups: gInfo,
                    queryGroup: JSON.stringify(queryGroup)
                };
//                }
            }
            if (userPreferenceOptions.recursionInfo && userPreferenceOptions.recursionInfo.length > 0) { //this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
                for (var i = 0; i < userPreferenceOptions.recursionInfo.length; i++) {                  //for saving the recursioninfo in state
                    var recursionInfo = angular.copy(userPreferenceOptions.recursionInfo[i]);
                    if (recursionInfo.$$hashKey) {
                        delete recursionInfo.$$hashKey;
                    }
                    var obj = {};
                    obj.label = recursionInfo.label;
                    obj.field = recursionInfo.field;
                    obj.recursion = recursionInfo.recursion;
                    obj.__selected__ = recursionInfo.__selected__;
                    rInfo.push(obj);
                }
                if (rInfo.length > 0) {
                    updates.recursionInfo = rInfo;
                }
            }

            if (userPreferenceOptions.sortInfo && userPreferenceOptions.sortInfo.length > 0) {
                for (var i = 0; i < userPreferenceOptions.sortInfo.length; i++) {
                    var sortInfo = angular.copy(userPreferenceOptions.sortInfo[i]);
                    if (sortInfo.$$hashKey) {
                        delete sortInfo.$$hashKey;
                    }
                    var obj = {};
                    obj.label = sortInfo.label;
                    obj.field = sortInfo.field;
                    obj.displayField = sortInfo.displayField;
                    obj.__selected__ = sortInfo.__selected__;
                    obj.value = sortInfo.value;

                    sInfo.push(obj);
                }
                if (sInfo.length > 0) {
                    updates.sortInfo = sInfo;
                    updates.sort = userPreferenceOptions.querySorts;
                }
            }
            if (userPreferenceOptions.filterInfo && userPreferenceOptions.filterInfo.length > 0) {
                for (var i = 0; i < userPreferenceOptions.filterInfo.length; i++) {
                    var filterInfo = angular.copy(userPreferenceOptions.filterInfo[i]);
                    if (filterInfo.$$hashKey) {
                        delete filterInfo.$$hashKey;
                    }

                    var obj = {};
                    var filterValue = Util.resolveDot(filterInfo, filterInfo.field);
                    Util.putDottedValue(obj, filterInfo.field, filterValue);
                    obj.field = filterInfo.field;
                    obj.ui = filterInfo.ui;
                    obj.filterspace = filterInfo.filterspace;
                    obj.__selected__ = filterInfo.__selected__;
                    obj.__pastComparisonEnabled = filterInfo.__pastComparisonEnabled;
                    obj.__span__ = filterInfo.__span__;
                    obj.mandatory = filterInfo.mandatory;

                    var filter = {};
                    obj.asParameter = filterInfo.asParameter;
                    if (filterInfo.asParameter || (filterValue && filterValue.asParameter)) {
                        filter[filterInfo.field] = userPreferenceOptions.queryParameters[filterInfo.field];
                    } else {
                        filter[filterInfo.field] = userPreferenceOptions.queryFilters[filterInfo.field];
                    }

                    if (filter && filter[filterInfo.field] !== undefined) {
                        obj.filter = filter;
                    }
                    if (filterInfo.filterOperators && filterInfo.filterOperators.label) {
                        obj.filterOperators = {label: filterInfo.filterOperators.label};
                    } else if (filterInfo.filter) {
                        obj.value = filterInfo.value;
                    }
                    var filterColumns = userPreferenceOptions.filterColumns;
                    var isFilterSpace = false;
                    var noOfColumns = filterColumns ? filterColumns.length : 0;
                    for (var j = 0; j < noOfColumns; j++) {
                        if (filterColumns[j].filterspace && filterColumns[j].field === filterInfo.field) {
                            isFilterSpace = true;
                        }
                    }
                    if (isFilterSpace) {
                        filterSpaceInfo.push(obj);
                    } else {
                        fInfo.push(obj);
                    }
                }
            }
            var noOfColumns = userPreferenceOptions.filterColumns ? userPreferenceOptions.filterColumns.length : 0;
            for (var j = 0; j < noOfColumns; j++) {
                if (userPreferenceOptions.filterColumns[j].filterspace) {
                    var found = false;
                    for (var i = 0; i < filterSpaceInfo.length; i++) {
                        if (userPreferenceOptions.filterColumns[j].field === filterSpaceInfo[i].field) {
                            found = true;
                        }
                    }
                    if (!found) {
                        removedFilterSpaceInfo.push({
                            field: userPreferenceOptions.filterColumns[j].field,
                            filterspace: userPreferenceOptions.filterColumns[j].filterspace
                        });
                    }
                }
            }
            if (fInfo.length > 0) {
                updates.filterInfo = fInfo;
            }
            if (filterSpaceInfo.length > 0) {
                updates.filterSpaceInfo = filterSpaceInfo;
            }
            if (removedFilterSpaceInfo.length > 0) {
                updates.removedFilterSpaceInfo = removedFilterSpaceInfo;
            }

            var userState = {
                viewid: $scope.view.viewOptions.id,
                state: updates,
                sourceid: $scope.view.viewOptions.sourceid
            };
            return ApplaneDB.connection("userdb").invokeFunction("SaveUserState.saveUserState", [userState]).then(
                function (response) {
                    return response;
                }).fail(function (err) {
                });

            $scope.view.viewOptions.userPreferenceOptions.saveUserSate = false;
        } catch (e) {
            $scope.view.viewOptions.warningOptions.error = e;
        }
    }

    $scope.getNestedView = function (field, sharedOptions) {
        var view = {viewOptions: {}};
        if (viewOptions.responsiveColumns && viewOptions.responsiveColumns[field.field]) {
            try {
                view.viewOptions.responsiveColumns = JSON.stringify(viewOptions.responsiveColumns[field.field]);
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }
        view.viewOptions.saveOptions = $scope.view.viewOptions.sharedOptions.saveOptions;
        view.viewOptions.autoWidthColumn = $scope.view.viewOptions.autoWidthColumn;
        //cross tab info is passed to the nested grid
        if ($scope.view.viewOptions && $scope.view.viewOptions.crossTabInfo) {
            var crossTabInfo = $scope.view.viewOptions.crossTabInfo;
            if (typeof crossTabInfo == "string") {
                crossTabInfo = JSON.parse(crossTabInfo);
            }
            if (crossTabInfo[field.field]) {
                view.viewOptions.crossTabInfo = crossTabInfo[field.field];
            }
        }
        view.viewOptions.doNotResolveVisibilityWithParent = field.doNotResolveVisibilityWithParent;
        view.viewOptions.formType = field.formType;
        view.viewOptions.fields = field.fields;
        view.viewOptions.ui = "grid";
        view.viewOptions.toolbar = false;
        view.viewOptions.headerFreeze = field.headerFreeze || false;
        view.viewOptions.label = field.label;
        if ($scope.view.viewOptions.nested) {
            view.viewOptions.label = field.label + '(' + $scope.view.viewOptions.label + ")";
        }
        view.viewOptions.dataModel = dataModel;
        view.viewOptions.dataField = field.field;
        view.viewOptions.parentSharedOptions = sharedOptions;
        view.viewOptions.refresh = false;
        view.viewOptions.save = false;
        view.viewOptions.viewControl = false;
        view.viewOptions.viewResize = false;
        view.viewOptions.when = field.when;
        view.viewOptions.showLabel = true;
        view.viewOptions.nested = true;
        view.viewOptions.tabs = tabs;
        view.viewOptions.insertMode = "grid";
        view.viewOptions.style = {};
        view.viewOptions.hyperlinkEnabled = false;
        view.viewOptions.headerTemplate = "<div pl-accordion class='app-background-grey' >" +
            "                               <div ng-click=\"resize('left')\" ng-show='gridOptions.viewResize' pl-resize class=\"pl-resize-view app-cursor-pointer inline app-zero-padding\" style='font-size:12px;'><i class=\"icon-double-angle-left\"></i></div>" +
            "                               <span class=' app-cursor-pointer pl-group-title'  ng-click='close()'>{{gridOptions.label}}</span>" +
            "                               <span ng-show='gridOptions.toolbarActions'>" +
            "                                   <span ng-repeat='action in gridOptions.toolbarActions' ng-click='viewHeaderAction(action)' ng-class='action.class' >" +
            "                                       <span ng-if='!action.class' ng-bind='action.label' class='header-action-label'></span>" +
            "                                   </span>" +
            "                               </span>" +
            "                               <span class='app-float-right'>" +
            "                               <i ng-click='insert($event, \"nestedForm\")' class='icon-plus app-float-left pl-form-insert pl-button-box ' ></i>" +
            "                                   <span ng-click='close()' ng-show='gridOptions.close' title='Close' class='app-float-right pl-nested-close-btn pl-top-label-text'><i class='icon-remove'></i></span>" +
            "                                   <span class='app-float-right pl-button-box' ng-hide='gridOptions.hideAccordion' ng-click='toggleChild()'>" +
            "                                       <i class=\"pl-accordion icon-chevron-up\" ></i>" +
            "                                   </span> " +
            "                               </span> " +
            "                           </div>";
        view.viewOptions.actions = getFieldActions(field, viewOptions.actions);
        /*Required for nested grid, sliding of grid body will be handle by this, it will be added in top of grid*/
        view.viewOptions.addUserPreference = false;
        view.viewOptions.saveCustomization = false;
        view.viewOptions.navigation = false;
        view.viewOptions.watchParent = true;
        view.viewOptions.edit = viewOptions.edit;
        view.viewOptions.shortMessageOptions = viewOptions.shortMessageOptions;
        view.viewOptions.busyMessageOptions = viewOptions.busyMessageOptions;
        view.viewOptions.showZeroIfNull = viewOptions.showZeroIfNull;
        view.viewOptions.alertMessageOptions = viewOptions.alertMessageOptions;
        var aggregateFields = populateAggregateFields(field.fields);
        if (aggregateFields && aggregateFields.length > 0) {
            view.viewOptions.aggregateFields = angular.copy(aggregateFields);
            view.viewOptions.watchAggregates = true;
            view.viewOptions.aggregateData = "aggregateData";
            view.aggregateData = {};
        }
        if (viewOptions.insert || viewOptions.edit) {
            view.viewOptions.insert = true;
        } else {
            view.viewOptions.insert = false;
        }
        return view;
    }

    function removeParentField(field, fields) {
        if (!fields) {
            return;
        }
        for (var qField in fields) {
            if (field.indexOf(qField + ".") == 0) {
                delete fields[qField];
            }
        }

    }

    function isSubFieldExists(field, fields) {
        var exists = false;
        if (!fields) {
            return exists;
        }

        for (var qField in fields) {
            if (qField.indexOf(field + ".") == 0) {
                exists = true;
                break;
            }
        }
        return exists;
    }

    function getAllFields(fields, customizedFields, ui, parent) {
        if (!fields || fields.length == 0) {
            return;
        }
        for (var i = 0; i < fields.length; i++) {
            var _id = fields[i]._id;
            var label = fields[i].label;
            var visibilityGrid = fields[i].visibilityGrid || fields[i].visibility;
            var visibilityForm = fields[i].visibilityForm || fields[i].visibility;
            var visibility = fields[i].visibility;
            if (ui == "form") {
                var index = fields[i].indexForm || fields[i].index;
            } else if (ui == "grid") {
                var index = fields[i].indexGrid || fields[i].index;
            }
            if (parent) {
                label = label + "(" + parent + ")"
            }
            customizedFields.push({
                _id: _id,
                label: label,
                visibilityGrid: visibilityGrid,
                visibility: visibility,
                visibilityForm: visibilityForm,
                index: index,
                field: fields[i].field
            });
            if (ui == "form") {/*we will not show nested fields in grid as required by amit singh fot hitkarini on 21-10-2014*/
                getAllFields(fields[i].fields, customizedFields, ui, label);
            }

        }
    }

    $scope.resolveCrossTabParameters = function (crossTabInfo) {
        try {
            var dataClone = {};
            if (dataModel && crossTabInfo.parameters) {
                resolveDataModelParameters(crossTabInfo, dataClone);
            }
            $scope.populateCrossTabInfo(crossTabInfo, dataClone);
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }


    function clearCrossTabData(clearData, data) {
        if (!clearData) {
            var d = $q.defer();
            d.resolve();
            return d.promise;
        } else {
            var indexes = [];
            for (var i = 0; i < data.length; i++) {
                indexes.push(i);
            }
            return dataModel.delete(indexes);
        }
    }

    function populateCrossTabData(params) {
        var data = params.data;
        var crossTabData = params.crossTabData;
        var xaxisData = params.xaxisData;
        var yaxisData = params.yaxisData;
        var xAxisDisplayField = params.xAxisDisplayField;
        var xAxisDataField = params.xAxisDataField;
        var yAxisDataField = params.yAxisDataField;
        var dataFields = params.dataFields;
        var xAxisFields = params.xAxisFields || [];
        var yAxisFields = params.yAxisFields || [];

        for (var i = 0; i < xaxisData.result.length; i++) {
            var row = {};
            row._id = xaxisData.result[i]._id;
            row.xaxis = {
                _id: xaxisData.result[i]._id,
                value: xaxisData.result[i][xAxisDisplayField]
            };
            for (var m = 0; m < xAxisFields.length; m++) {
                var field = xAxisFields[m].field;
                row.xaxis[field] = xaxisData.result[i][field];
            }
            for (var j = 0; j < yaxisData.result.length; j++) {
                row.yaxis = row.yaxis || {};
                row.yaxis["a" + j] = {};
                row.yaxis["a" + j]["_id"] = yaxisData.result[j]._id;
                var found = false;
                for (var l = 0; l < data.length; l++) {
                    if ((Utility.deepEqual(xaxisData.result[i]._id, $scope.data[l][xAxisDataField]["_id"])) && ( Utility.deepEqual(yaxisData.result[j]._id, $scope.data[l][yAxisDataField]["_id"]))) {
                        for (var k = 0; k < dataFields.length; k++) {
                            var dataField = dataFields[k].field;
                            row.yaxis["a" + j][dataField] = $scope.data[l][dataField];
                            row.yaxis["a" + j]["data_id"] = $scope.data[l]._id;
                            found = true;
                        }
                        break;
                    }
                }
                for (var n = 0; n < yAxisFields.length; n++) {
                    var field = yAxisFields[n].field;
                    row.yaxis["a" + j][field] = yaxisData.result[j][field];
                }
                if (!found) {
                    row.yaxis["a" + j]["data_id"] = Utility.getUniqueTempId();
                }
            }
            crossTabData.push(row);
        }
    }


    function mergeDottedFieldsWithFieldsInQuery(query, fields, dispalyField) {
        var queryFields = query.$fields || {};
        if (fields) {
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                queryFields[field.field] = 1;
            }
            queryFields[dispalyField] = 1;
            if (Object.keys(queryFields).length > 0) {
                query.$fields = queryFields;
            }
        }
    }

    function populateCrossTabColumns(params) {
        var columns = params.columns;
        var xAxis = params.xAxis;
        var yaxisData = params.yaxisData;
        var dataFields = params.dataFields;
        var xAxisDisplayField = params.xAxisDisplayField;
        var yAxisDisplayField = params.yAxisDisplayField;
        var xAxisFields = params.xAxisFields || [];
        var yAxisFields = params.yAxisFields || [];
        xAxisFields.push({field: "value", label: xAxis.label, visibility: true});
        columns.push({field: "xaxis", visibilityGrid: false, type: "object", fields: xAxisFields});
        var rowColumn = {field: "yaxis", visibilityGrid: false, type: "object"};
        var yaxisColumns = [];
        for (var i = 0; i < yaxisData.result.length; i++) {
            var col = {field: "a" + i, type: "object", visibilityGrid: false};
            var colNestedFields = Util.deepClone(yAxisFields);
            for (var j = 0; j < dataFields.length; j++) {
                var label = yaxisData.result.length === 1 ? dataFields[j].label : dataFields[j].label + " (" + yaxisData.result[i][yAxisDisplayField] + ")"
                colNestedFields.push({
                    field: dataFields[j].field,
                    visibility: true,
                    label: label,
                    index: dataFields[j].index
                });
            }
            col.fields = colNestedFields;
            yaxisColumns.push(col);
        }
        rowColumn.fields = yaxisColumns;
        columns.push(rowColumn);
    }

    function isTransformResucrionToLinear(groupInfo, resursionInfo, viewOptions) {
        if (groupInfo) {
            return true;
        } else if (resursionInfo && (viewOptions.edit || viewOptions.detail)) {
            return true;
        }
    }

    $scope.watchCrossTabData = function (newValue, xAxisDataField, yAxisDataField, yAxisDisplayField, dataFields) {
        var newValueClone = angular.copy(newValue);
        return Util.iterateArrayWithPromise(newValueClone, function (index, value) {
            var yaxis = value["yaxis"];
            var xaxis = value["xaxis"];
            var keys = Object.keys(yaxis);
            return Util.iterateArrayWithPromise(keys, function (index, key) {
                var dataid = yaxis[key]["data_id"];
                var index = Utility.isExists($scope.data, {_id: dataid}, "_id");
                if (index >= 0) {
                    if ((Utility.deepEqual(xaxis._id, $scope.data[index][xAxisDataField]["_id"])) && ( Utility.deepEqual(yaxis[key]._id, $scope.data[index][yAxisDataField]["_id"]))) {
                        for (var j = 0; j < dataFields.length; j++) {
                            var dataField = dataFields[j].field;
                            $scope.data[index][dataField] = yaxis[key][dataField];
                        }
                    }
                } else {
                    var newRow = {};
                    newRow._id = yaxis[key]["data_id"];
                    newRow[xAxisDataField] = xaxis;
                    newRow[yAxisDataField] = {};
                    newRow[yAxisDataField]["_id"] = yaxis[key]._id;
                    newRow[yAxisDataField][yAxisDisplayField] = yaxis[key][yAxisDisplayField];
                    var changed = false;
                    for (var j = 0; j < dataFields.length; j++) {
                        var dataField = dataFields[j].field;
                        if (yaxis[key][dataField] !== undefined) {
                            newRow[dataField] = yaxis[key][dataField];
                            changed = true;
                        }
                    }
                    if (changed) {
                        $scope.data.push(newRow);
                    }
                }
            })
        })
    }

    $scope.populateCrossTabInfo = function (crossTabInfo, dataClone, clearData) {
        // in case of cce module only one yaxis data is there so we handle this case by do not passing the dataFields.If $scope.data exists return the data otherwise we execute the xaxis and yaxis query and populate the data in $scope
        if (crossTabInfo["dataFields"] == undefined || crossTabInfo["dataFields"].length === 0) {
            if ($scope.data && $scope.data.length > 0) {
                var d = $q.defer();
                d.resolve();
                return d.promise;
            } else {
                var xAxis = crossTabInfo["x-axis"];
                var yAxis = crossTabInfo["y-axis"];
                var xAxisDataField = xAxis["dataField"];
                var yAxisDataField = yAxis["dataField"];
                var batchQuery = {};
                batchQuery.xaxis = xAxis.query;
                batchQuery.xaxis["$parameters"] = dataClone;
                batchQuery.yaxis = yAxis.query;
                batchQuery.yaxis["$parameters"] = dataClone;
                var userDB = ApplaneDB.connection("userdb");
                $scope.view.viewOptions.busyMessageOptions = $scope.view.viewOptions.busyMessageOptions || {};
                $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
                return  userDB.batchQuery(batchQuery).then(function (data) {
                    if (data && data.response) {
                        var xaxisData = data.response.xaxis;
                        var yaxisData = data.response.yaxis;
                        if (yaxisData && yaxisData.result && yaxisData.result.length !== 1) {
                            throw new BusinessLogicError("yaxis data length should be equal to 1 if dataFields are not provided");
                        }
                        return Util.iterateArrayWithPromise(xaxisData.result,
                            function (index, xAxisDataRow) {
                                var newRow = {};
                                newRow[xAxisDataField] = xAxisDataRow;
                                newRow[yAxisDataField] = yaxisData.result[0];
                                var insertId = Utility.getUniqueTempId();
                                newRow._id = insertId
                                newRow.__insert__ = true;
                                $scope.data.push(newRow);
                            }).then(function () {
                                $scope.view.viewOptions.sharedOptions.saveOptions.editMode = true;
                                if ($scope.view.viewOptions.busyMessageOptions) {
                                    delete $scope.view.viewOptions.busyMessageOptions.msg;
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });

                    }
                })
            }
        } else if (crossTabInfo["x-axis"]) {
            //when the use click the populate data button all  data is cleared
            // cleardata argument is passed true when the populate data button is called.
            return clearCrossTabData(clearData, $scope.data || []).then(function () {
                var crossTabInfo = viewOptions.crossTabInfo;
                var xAxis = crossTabInfo["x-axis"];
                var yAxis = crossTabInfo["y-axis"];
                var xAxisDataField = xAxis["dataField"];
                var yAxisDataField = yAxis["dataField"];
                var dataFields = crossTabInfo["dataFields"];

                var fields = viewOptions.fields;
                var xAxisFieldInfo = Util.getField(xAxisDataField, fields);
                var xAxisDisplayField = xAxisFieldInfo ? xAxisFieldInfo.displayField : undefined;
                var xAxisFields = xAxisFieldInfo ? xAxisFieldInfo.fields : undefined;
                var yAxisFieldInfo = Util.getField(yAxisDataField, fields);
                var yAxisDisplayField = yAxisFieldInfo ? yAxisFieldInfo.displayField : undefined;
                var yAxisFields = yAxisFieldInfo ? yAxisFieldInfo.fields : undefined;

                // validations
                var message = "";
                if (!xAxis) {
                    message = "Provide Value of x-axis";
                }
                if (!xAxis.query) {
                    message = "Provide query to get data of x-axis";
                }
                if (!yAxis) {
                    message = "Provide Value of y-axis";
                }
                if (!yAxis.query) {
                    message = "Provide query to get data of y-axis";
                }
                if (!xAxisDataField) {
                    message = "Provide value of x-axis  dataField";
                }
                if (!yAxisDataField) {
                    message = "Provide value of y-axis  dataField";
                }
                if (!dataFields) {
                    message = "Provide Value of Data Fields";
                }
                if (Utility.isJSONObject(dataFields)) {
                    dataFields = [dataFields];
                }
                if (message.trim().length > 0) {
                    if ($scope.view.viewOptions.busyMessageOptions) {
                        delete $scope.view.viewOptions.busyMessageOptions.msg;
                    }
                    var title = "Provide Necessary Parameters to populate Cross Tab Info";
                    var message1 = message;
                    $scope.view.viewOptions.warningOptions.error = new Error(message1 + "-" + title);
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                    return;
                }
                var batchQuery = {};
                mergeDottedFieldsWithFieldsInQuery(xAxis.query, xAxisFields, xAxisDisplayField);
                batchQuery.xaxis = xAxis.query;
                batchQuery.xaxis["$parameters"] = dataClone;
                mergeDottedFieldsWithFieldsInQuery(yAxis.query, yAxisFields, yAxisDisplayField);
                batchQuery.yaxis = yAxis.query;
                batchQuery.yaxis["$parameters"] = dataClone;
                if (Object.keys(batchQuery).length > 0) {
                    var userDB = ApplaneDB.connection("userdb");
                    if ($scope.view.viewOptions.busyMessageOptions) {
                        $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
                    }
                    return  userDB.batchQuery(batchQuery, {cache: true}).then(
                        function (data) {
                            if (data && data.response) {
                                var xaxisData = data.response.xaxis;
                                var yaxisData = data.response.yaxis;
                                var columns = [];
                                populateCrossTabColumns({
                                    columns: columns,
                                    xAxis: xAxis,
                                    yaxisData: yaxisData,
                                    dataFields: dataFields,
                                    xAxisDisplayField: xAxisDisplayField,
                                    yAxisDisplayField: yAxisDisplayField,
                                    xAxisFields: Util.deepClone(xAxisFields),
                                    yAxisFields: Util.deepClone(yAxisFields)
                                });
                                var newColumns = [];
                                populateColumns("grid", columns, newColumns, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
                                Util.sort(newColumns, "asc", "index");
                                $scope.gridOptions.columns = newColumns;
                                $scope.gridOptions.repopulateColumn = true;
                                var crossTabData = [];
                                populateCrossTabData({
                                    data: $scope.data,
                                    crossTabData: crossTabData,
                                    xaxisData: xaxisData,
                                    yaxisData: yaxisData,
                                    xAxisDisplayField: xAxisDisplayField,
                                    xAxisDataField: xAxisDataField,
                                    yAxisDataField: yAxisDataField,
                                    dataFields: dataFields,
                                    xAxisFields: xAxisFields,
                                    yAxisFields: yAxisFields
                                });
                                $scope.viewData = crossTabData;
                                unwatcher.viewData = $scope.$watch("viewData", function (newValue, oldValue) {
                                    if (!angular.equals(newValue, oldValue) && newValue !== undefined) {
                                        $scope.watchCrossTabData(newValue, xAxisDataField, yAxisDataField, yAxisDisplayField, dataFields);
                                    }
                                }, true);
                                $scope.viewDataChanged = !$scope.viewDataChanged;
                                if ($scope.view.viewOptions.busyMessageOptions) {
                                    delete $scope.view.viewOptions.busyMessageOptions.msg;
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        }).fail(function (err) {
                            if ($scope.view.viewOptions.busyMessageOptions) {
                                delete $scope.view.viewOptions.busyMessageOptions.msg;
                            }
                            $scope.view.viewOptions.warningOptions.error = err;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        });
                }
            })
        }
    }

    $scope.popupResize = function () {
        try {
            var uiOptions = 'gridOptions';
            if (view.viewOptions.ui == 'form') {
                uiOptions = 'formOptions';
            }
            if ($scope[uiOptions].popupStyle) {
                $scope[uiOptions].popupStyle.width = '90%';
                $scope[uiOptions].popupStyle.height = '90%';
                $scope[uiOptions].popupStyle.top = '50%';
                $scope[uiOptions].popupStyle["max-height"] = 'none';
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

    $scope.sortByLabel = function () {
        Utility.sort($scope.view.viewOptions.customizedFields, "asc", "label");
    }

    $scope.sortByIndex = function () {
        Utility.sort($scope.view.viewOptions.customizedFields, "asc", "index");
    }

    $scope.showColumns = function ($event) {
        try {
            var visibilityOption = undefined;
            if ($scope.view.viewOptions.ui == "grid") {
                visibilityOption = 'visibilityGrid';
            } else if ($scope.view.viewOptions.ui == "form") {
                visibilityOption = 'visibilityForm';
            }
            var template = "<div " +
                " style='overflow-y: auto;overflow-x: hidden;padding:5px 17px 5px 5px;' class='" +
                " app-white-space-nowrap app-light-gray-backgroud-color app-small-popup'>" +
                "<a class='block' ng-click='sortByLabel()' >Sort by name</a>" +
                "          <div ng-repeat='col in view.viewOptions.customizedFields'>" +
                "              <span><input type='checkbox' ng-change='onColumnPopupClick(col)' ng-model='col." + visibilityOption + "'></span>" +
                "              <span ng-bind='col.label'></span>" +
                "          </div>" +
                "<a class='block' id='{{view.viewOptions.uniqueViewId}}collection-customization' ng-click='deleteCustomization(\"admin\", \"collection\")' ng-show='view.viewOptions.collectionLevelCustomization && view.viewOptions.admin' title='{{view.viewOptions.fieldCustomizationDatabases }}'>Remove Collection Customization</a>" +
                "<a class='block' id='{{view.viewOptions.uniqueViewId}}qview-customization' ng-click='deleteCustomization(\"admin\", \"qview\")' ng-show='view.viewOptions.qviewLevelCustomization && view.viewOptions.admin' title='{{ view.viewOptions.fieldCustomizationDatabases }}'>Remove Qview Customization</a>" +
                "<a class='block' id='{{view.viewOptions.uniqueViewId}}view-customization' ng-click='deleteCustomization(\"admin\", \"view\")' ng-show='view.viewOptions.viewLevelCustomization && view.viewOptions.admin' title='{{ view.viewOptions.fieldCustomizationDatabases }}'>Remove View Customization</a>" +
                "<a class='block' id='{{view.viewOptions.uniqueViewId}}self-customization' ng-click='deleteCustomization(\"self\", \"self\")' ng-show='view.viewOptions.userLevelCustomization'>Remove Self Customization</a>" +
                "</div>";
            var popupScope = $scope.$new();
            var p = new Popup({
                autoHide: true,
                hideOnClick: false,
                deffered: true,
                escEnabled: true,
                html: $compile(template)(popupScope),
                scope: popupScope,
                element: $event.target,
                event: $event,
                closeableIds: [$scope.view.viewOptions.uniqueViewId + 'collection-customization', $scope.view.viewOptions.uniqueViewId + 'view-customization', $scope.view.viewOptions.uniqueViewId + 'qview-customization', $scope.view.viewOptions.uniqueViewId + 'self-customization'],
                position: "bottom"
            });
            p.showPopup();

        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.onColumnPopupClick = function (col) {
        try {
            $scope.handleFieldDragChanges(col, "visibility")
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }
    function getViewFields(fields, viewFields) {
        if (viewFields && viewFields.length > 0) {
            var viewField = viewFields[0];
            var viewFieldInfo = Util.getField(viewField, fields);
            if (viewFieldInfo) {
                if (viewFieldInfo.type === "object" && viewFieldInfo.multiple) {
                    return viewFieldInfo.fields;
                } else {
                    throw new Error("Viewfields field must be of type object and multiple must be true");
                }
            } else {
                throw new Error("view field defination not found in fields");
            }
        }
    }

    try {
        var view = $scope.view;
        view.viewOptions.ui = view.viewOptions.ui || "grid";
        view.viewOptions.label = view.viewOptions.label || view.viewOptions.id;

        var viewOptions = view.viewOptions;
        // viewFields are there to show the nested table as the main view.Used to show the nested qFields array as the main view
        // the child fields of the viewFields are treated as top level fields(manjeet 13-01-2015)
        if (viewOptions.viewFields && viewOptions.viewFields.length > 0) {
            viewOptions.fields = getViewFields(viewOptions.fields, viewOptions.viewFields);
        }
        var fields = viewOptions.fields;

        if (!view.viewOptions) {
            var title = "ViewCtrl in pl.view";
            var message = "Please provide ViewOption in pl-view";
            $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
            return;
        }

        var ui = viewOptions.ui;
        if (ui != "grid" && ui != "form" && ui != "dashboard" && ui != "html" && ui != "graph" && ui != "advance dashboard" && ui != 'aggregate' && ui != 'composite') {
            var title = "ViewCtrl in pl.view";
            var message = "UI not supported in pl-view[" + ui + "]";
            $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
            return;
        }

        if (viewOptions.queryGrid) {
            if (viewOptions.queryGrid.$recursion) {
                viewOptions.$recursion = viewOptions.queryGrid.$recursion;
            } else if (viewOptions.queryGrid.$group && viewOptions.queryGrid.$group.$recursion) {
                viewOptions.$recursion = viewOptions.queryGrid.$group.$recursion;
            }
        }
        /*set transformRecursionToLinear equal to true if viewOptions have groupinfo or recursion*/
        viewOptions.transformRecursionToLinear = isTransformResucrionToLinear(viewOptions.groupInfo, viewOptions.$recursion, viewOptions);
        if (viewOptions.$recursion) {
            if (viewOptions.edit || viewOptions.detail) {
                viewOptions.showSelectionCheckbox = true;
            } else {
                viewOptions.showSelectionCheckbox = false;
            }
        }

        var qViews = viewOptions.qviews || [];
        Util.sort(qViews, "asc", "index");
        var qViewSelectedIndex = undefined;
        for (var i = 0; i < qViews.length; i++) {
            if (!qViews[i].label) {
                qViews[i].label = qViews[i].id;
            }
            if (qViews[i].sourceid == viewOptions.sourceid) {
                qViewSelectedIndex = i;

            }
        }
        if (qViews.length > 0) {
            if (angular.isUndefined(qViewSelectedIndex)) {
                var title = "ViewCtrl in pl.view";
                var message = "Selected Quick View Index not found !";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
            var quickViewMenuGroup = {
                menus: qViews,
                selectedMenu: qViewSelectedIndex,
                onClick: "onQuickViewSelection",
                displayField: "label",
                hideOnClick: true,
                img: 'images/down_arrow_new.png',
                menuClass: 'pl-quick-menu'
            };
            quickViewMenuGroup.label = qViews[qViewSelectedIndex].label || qViews[qViewSelectedIndex].id || "Quick Views";
            viewOptions.quickViewMenuGroup = quickViewMenuGroup;
            viewOptions.qViewClone = angular.copy(qViews);
        }


        viewOptions.edit = viewOptions.edit === undefined ? true : viewOptions.edit;

        var dataModel = viewOptions.dataModel;
        var parentSharedOptions = viewOptions.parentSharedOptions;
        var currentRowIndex = undefined;
        if (parentSharedOptions) {
            currentRowIndex = parentSharedOptions.currentRowIndex;
        }
        var aggregateData = undefined;
        if (viewOptions.aggregateData) {
            aggregateData = $scope.$eval("view." + viewOptions.aggregateData);
        }
        var dataField = viewOptions.dataField; //For nested grid
        if (dataModel) {
            if (dataField) {
                // Nested table as tab, it should be a field data model but parent will be RowDataModel not DataModel itself
                if (!(dataModel instanceof RowDataModel)) {
                    dataModel = new RowDataModel(currentRowIndex, queryForm, dataModel);
                }
                dataModel = new FieldDataModel(dataField, dataModel);
                $scope.addWatch(dataModel, false);
            } else if (currentRowIndex !== undefined) {
                var queryForm = viewOptions.queryForm;
                dataModel = new RowDataModel(currentRowIndex, queryForm, dataModel);
            } else {
                var title = "ViewCtrl in pl.view";
                var message = "Either dataField or currentRowIndex must be passed if dataModel need to be shared ";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
        } else if (viewOptions.ui === "dashboard" && viewOptions.dashboardType == "AdvanceDashboard") {
            var metadata = {viewOptions: viewOptions};
            dataModel = new DashboardDataModel(metadata, ApplaneDB.connection("userdb"));
        } else {
            var data = undefined;
            if (viewOptions.data) {
                data = $scope.$eval("view." + viewOptions.data);
            } else {
                data = [];
            }

            var dataInfo = undefined;
            if (viewOptions.dataInfo) {
                dataInfo = $scope.$eval("view." + viewOptions.dataInfo);
            }

            if (data === undefined) {
                var title = "ViewCtrl in pl.view";
                var message = "No data found in ViewOptions";
                $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
            var query = undefined;
            var onSaveQueryFields = {};
            if (viewOptions.queryGrid) {
                query = viewOptions.queryGrid;
                onSaveQueryFields = query.$fields || {};
                onSaveQueryFields = angular.copy(onSaveQueryFields);
            }
            if (onSaveQueryFields && viewOptions.queryForm && viewOptions.queryForm.$fields) {
                for (var k in viewOptions.queryForm.$fields) {
                    removeParentField(k, onSaveQueryFields);
                    if (!isSubFieldExists(k, onSaveQueryFields)) {
                        onSaveQueryFields[k] = viewOptions.queryForm.$fields[k];
                    }
                }
            }
            if (viewOptions.deAttached && viewOptions.queryForm) {
                viewOptions.queryForm = angular.copy(viewOptions.queryForm);
                viewOptions.queryForm.$fields = onSaveQueryFields;

            }
            if (!query) {
                query = {}
                query.$collection = viewOptions.collection;
            }
            query.$parameters = query.$parameters || {};

            var metadata = {
                fields: fields,
                events: viewOptions.events,
                onSaveQueryFields: onSaveQueryFields,
                transform: viewOptions.transform,
                updateMode: viewOptions.updateMode,
                dataProcessedOnServer: viewOptions.dataProcessedOnServer,
                upsert: viewOptions.upsert,
                upsertFields: viewOptions.upsertFields,
                viewFields: viewOptions.viewFields,
                autoUpdates: viewOptions.autoUpdates, /*autoUpdates: if __insert__ is coming in view data than it should be removed form dataClone, required for nested table of results in activity in cc module for dipender - by naveen and rohit*/
                token: viewOptions.token, /*view token is used to handle view with different token as in case of report An Issue, current db can be of girnarsoft or business_sb token, but we have required daffodilsw token -- Rajit garg*/
                transformRecursionToLinear: viewOptions.transformRecursionToLinear, /*used to convert the data in linear array and move all children at the top level in data array */
                viewId: viewOptions.id,
                setAsNull: viewOptions.setAsNull,
                aggregateAsync: viewOptions.aggregateAsync
            };

            dataModel = new DataModel(query, data, metadata, ApplaneDB.connection("userdb"));
            dataModel.setAggregateData(aggregateData);
            dataModel.setDataInfo(dataInfo);
            if (viewOptions.aggregateQueryGrid) {
                dataModel.setAggregateQuery(viewOptions.aggregateQueryGrid);
            }
            $scope.addWatch(dataModel, true);
            if (ui == "form") {
                if (data.length == 0) {
                    /* we dont require to run refereshFormDataModel in case of insert as it delete loading message before resolving that's why we set "viewOptions.watchParent = false", case when open "add Result" for tasks on*/
                    viewOptions.watchParent = false;
                    if ($scope.view.viewOptions.busyMessageOptions) {
                        $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
                    }
                    var row = {__insert__: true};
                    dataModel.insert(row).then(
                        function () {
                            if ($scope.view.viewOptions.busyMessageOptions) {
                                delete $scope.view.viewOptions.busyMessageOptions.msg;
                            }
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }).fail(function (err) {
                            if ($scope.view.viewOptions.busyMessageOptions) {
                                delete $scope.view.viewOptions.busyMessageOptions.msg;
                            }
                            $scope.formOptions.save = false;
                            $scope.view.viewOptions.warningOptions.error = err;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        });
                }
                data = dataModel.getData();
                currentRowIndex = data.length - 1;
                dataModel.setCurrentRowIndex(currentRowIndex);
                var queryForm = undefined;
                if (viewOptions.queryForm) {
                    queryForm = viewOptions.queryForm;
                }
                dataModel = new RowDataModel(currentRowIndex, queryForm, dataModel);
            }

        }
        var tabs = [];
        viewOptions.sharedOptions = viewOptions.sharedOptions || {};//required for linking two dashboard--we can see the task of any employee in the tasks menu by clicking on the row of employee menu
        viewOptions.sharedOptions.resizable = viewOptions.resizable;
        viewOptions.sharedOptions.close = viewOptions.close;
        viewOptions.sharedOptions.queryGrid = query;
        var viewControl = viewOptions.viewControl !== undefined ? viewOptions.viewControl : true;
        if (!$scope.workbenchOptions.developmentRight) {
            viewControl = false;
        }

        var primaryFieldInfo = {};
        if (viewOptions.parentSharedOptions && viewOptions.parentSharedOptions.primaryFieldValue) {
            primaryFieldInfo = viewOptions.parentSharedOptions.primaryFieldValue;
            viewOptions.primaryFieldInfo = primaryFieldInfo;
        }

        viewOptions.fieldCustomization = viewOptions.fieldCustomization !== undefined ? viewOptions.fieldCustomization : true;
        if (viewOptions.dashboardCellToolbar) {
            viewOptions.headerTemplate = "<div class='adv-header' ng-mousemove='mouseMoveOnHeader($event)' ng-mousedown='mouseDownOnHeader($event)' ng-mouseup='mouseUpOnHeader($event)'>" +
                "                   <div class='adv-toolbar app-text-align-center'><span ng-bind='cell.name'></span>" +
                "                       <div ng-if='cell.viewControl' pl-menu-group='cell.viewControlOptions' style='float:right;'></div>";
            if (viewOptions.navigation) {
                viewOptions.headerTemplate += '<div ng-class="{\'app-right-thirty-px\':cell.viewControl}" ng-if="!view.viewOptions.$recursion && view.viewOptions.navigation" class="app-font-weight-bold app-text-align-center app-position-absolute app-right-zero pl-horizontal-gap" style="top:10px;">' +
                    '                           <div class="app-float-left app-width-twenty-px app-cursor-pointer" ng-click="previous()" ng-show="view.viewOptions.sharedOptions.pageOptions.hasPrevious"><i class="icon-chevron-left"></i></div>' +
                    '                           <div ng-bind="view.viewOptions.sharedOptions.pageOptions.label" class="app-float-left"></div>' +
                    '                           <div ng-show="view.viewOptions.sharedOptions.pageOptions.fetchCount" class="app-float-left">{{"&nbsp;of&nbsp;"+view.viewOptions.sharedOptions.pageOptions.count}}</div>' +
                    '                           <div class="app-float-left app-width-twenty-px app-cursor-pointer" ng-click="next()" ng-show="view.viewOptions.sharedOptions.pageOptions.hasNext" ><i class="icon-chevron-right"></i></div>' +
                    '                       </div>';

            }

            viewOptions.headerTemplate += "</div><div class='adv-toolbar-button adv-header-action'>";
            if (viewOptions.insertView) {
                viewOptions.headerTemplate += "<span title='InsertView' class='icon-plus adv-action' ng-click='onHeaderActionClick(view.viewOptions.insertView, \"insertView\", $index)'></span>";
            }
            if (viewOptions.drildownView) {
                viewOptions.headerTemplate += "<span title='DrildownView' class='drill-down adv-action app-cursor-pointer' ng-click='onHeaderActionClick(view.viewOptions.drildownView, \"drildownView\", $index)'></span>";
            }
            if (viewOptions.listView) {
                viewOptions.headerTemplate += "<span title='ListView' class='list-view app-cursor-pointer app-float-left' ng-click='onHeaderActionClick(view.viewOptions.listView, \"listView\", $index)'></span>";
            }
            viewOptions.headerTemplate += "<span ng-if='view.viewOptions.close' ng-click='closeCell($index)' title='Close' class='icon-remove adv-action'></span></div>" +
                "               </div>";
        }

        viewOptions.sharedOptions.saveOptions = viewOptions.saveOptions || {};
        viewOptions.sharedOptions.pageOptions = {};
        if (viewOptions.viewPosition == 'full') {
            viewOptions.fullMode = true
        }
        if (viewOptions.fullMode) {
            viewOptions.viewPosition = "full";
            viewOptions.viewResize = false;
        }
        viewOptions.sharedOptions.viewPosition = viewOptions.viewPosition || 'right';
        if (viewOptions.doNotMergeUserFieldCustomizations) {
            viewOptions.saveCustomization = false;
            viewOptions.fieldResize = false;
            viewOptions.fieldDragable = false;
        }
        viewOptions.uniqueViewId = Utility.getUniqueTempId();

        unwatcher.validations = $scope.$watch("view.viewOptions.parentSharedOptions.validations", function (validations) {
            if (angular.isDefined(validations)) {
                var rows = $scope.data;
                if (Utility.isJSONObject(rows)) {//for record of form
                    rows = [rows];
                }
                var dataField = $scope.view.viewOptions.dataField;
                var newValidations = [];

                populateNewValidations(validations, rows, newValidations, dataField);

                $scope.view.viewOptions.sharedOptions.validations = newValidations;
            }
        })


        function populateNewValidations(validations, rows, newValidations, dataField) {
            for (var i = 0; i < validations.length; i++) {
                var validation = validations[i];
                for (var j = 0; j < rows.length; j++) {
                    var row = rows[j];
                    if (dataField === undefined) {
                        if (Utility.deepEqual(row._id, validation._id)) {
                            newValidations.push(validation);
                            break;
                        }
                    }
                }
                if (dataField) {
                    if (validation[dataField]) {
                        populateNewValidations(validation[dataField], rows, newValidations);
                    }
                }

            }
        }

        if (view.viewOptions.ui == 'grid') {


            if (!data) {
                data = dataModel.getData();
                if (!data) {
                    data = [];
                    dataModel.setData(data);

                }
            }
            var columns = [];
            var filterColumns = [];
            var sortColumns = [];
            var groupColumns = [];
            var aggregateColumns = [];
            var updateColumns = [];
            var headerActions = [];
            var toolbarActions = [];
            var ftsColumns = [];

            var recursiveColumns = [];

            var rowActions = [];

            if (viewOptions.detail || angular.isUndefined(viewOptions.detail)) {
                var detailRowAction = {
                    label: "Detail",
                    type: "detail",
                    onClick: "viewRowAction",
                    rowActionIndex: 0
                };
                rowActions.push(detailRowAction);
            }
            Util.sort(viewOptions.actions, "asc", "index");
            var fieldActions = undefined;
            if (viewOptions.actions) {
                for (var i = 0; i < viewOptions.actions.length; i++) {
                    var action = viewOptions.actions[i];
                    if (action.when && !viewOptions.resolveActionWithRow) { // for showing actions on the basis of current row--if it action.when contains $$ then add resolveActionWithRow in viewOptions which is used by grid--Ritesh Bansal
                        var when = action.when;
                        try {
                            when = JSON.parse(when);
                        } catch (e) {
                        }
                        if (Util.isJSONObject(when)) {
                            var whenKeys = Object.keys(when);
                            if (whenKeys.length > 0) {
                                var firstKey = whenKeys[0];
                                if (firstKey.indexOf("$$") === 0) {
                                    viewOptions.resolveActionWithRow = true;
                                }
                            }
                        } else if (typeof when === "string" && when.indexOf("$$") === 0) {
                            viewOptions.resolveActionWithRow = true;
                        }
                    }
                    if (action.actionField) {
                        if (action.onRow) {
                            if (action.when) {
                                action.actionWhen = Util.replaceDollarAndThis(action.when);
                            }
                            if (action.when == undefined) {
                                action.actionWhen = true;
                            }
                            fieldActions = fieldActions || {};
                            fieldActions[action.actionField] = fieldActions[action.actionField] || [];
                            fieldActions[action.actionField].push(action)
                        }
                        continue;
                    }
                    if (action.onRow || action.onHeader) {
                        if (action.onRow) {
                            var rowAction = angular.copy(action);
                            if (rowAction.when) {
                                rowAction.when = Util.replaceDollarAndThis(rowAction.when);
                            }
                            rowAction.onClick = "viewRowAction";
                            rowAction.rowActionIndex = (i + 1);
                            rowActions.push(rowAction);
                        }
                        if (action.onHeader && (action.visibility || action.visibilityGrid)) {
                            var headerAction = angular.copy(action);
                            if (headerAction.when) {
                                headerAction.when = Util.replaceDollarAndThis(headerAction.when, 'gridOptions.parameters.');
                            }
                            if (headerAction.when == undefined) {
                                headerAction.when = true;
                            }
                            headerAction.onClick = "viewHeaderAction";
                            headerAction.showLabel = true;
                            headerAction.actionClass = 'pl-header-actions app-populate-default-filter';
                            headerActions.push(headerAction);
                        }
                    } else if (action.type == "invoke" || action.type == "view") {
                        if (action.when) {
                            action.when = Util.replaceDollarAndThis(action.when, 'gridOptions.parameters.');
                        }
                        if (action.when == undefined) {
                            action.when = true;
                        }
                        action.onClick = "viewHeaderAction";
                        if (action.function == 'ExportViewService.exportExcelView') {
                            action.class = "exl";
                        } else if (!action.class) {
                            action.showLabel = true;
                        }
                        toolbarActions.push(action);
                    }
                }
            }
            viewOptions.fieldActions = fieldActions;

            populateColumns(ui, fields, columns, aggregateColumns, groupColumns, filterColumns, sortColumns, updateColumns, ftsColumns, undefined, tabs, undefined, viewOptions, recursiveColumns);
            Util.sort(columns, "asc", "index");
//            if (toolbarActions.length > 0) {
//                var toolbarAction = {};
//                toolbarAction.displayField = 'label';
//                toolbarAction.action = true;
//                toolbarAction.actionInnerClass = 'pl-margin-box-negative-ten-px';
//                toolbarAction.menus = toolbarActions;
//                toolbarAction.actionClass = 'pl-action-box';
//                toolbarActions = toolbarAction;
//            } else {
//                toolbarActions = undefined;
//            }
            getHeaderActionFilter(filterColumns, viewOptions.actions);
            if (groupColumns.length > 0 && !viewOptions.groupCountDisabled) {
                aggregateColumns.push({
                    label: "Count",
                    field: "count",
                    "aggregate": "count",
                    "type": "number",
                    ui: "number",
                    "sortable": true,
                    "cellTemplate": "{{row.entity.count}}"
                });
            }

            // add watchParent property due open view form rowActions
            if (viewOptions.watchParent && viewOptions.parentSharedOptions) {
                //this watch is used for showing columns in nested table on the basis of when value
                unwatcher.dataChanged = $scope.$watch("view.viewOptions.parentSharedOptions.dataChanged", function () {
                    //TODO only for role need to be removed
                    if ($scope.view.viewOptions.doNotResolveVisibilityWithParent) {
                        return;
                    }
                    var rowParameter = angular.copy(dataModel.getRowParameters());
                    var columnsForWhen = $scope.gridOptions.columns;
                    var reConfigure = false;
                    for (var i = 0; i < columnsForWhen.length; i++) {
                        var whenValue = columnsForWhen[i].when;
                        if (whenValue != undefined && typeof whenValue === 'string' && whenValue.indexOf("row.entity") == 0) {
                            var getter = $parse(whenValue);
                            var context = {row: {entity: rowParameter}}
                            var resolved = getter(context);
                            var oldVisibleValue = columnsForWhen[i].visibilityGrid;
                            columnsForWhen[i].visibilityGrid = resolved;
                            columnsForWhen[i].visibility = resolved;
                            //also change in fields so that it will reflect in detail form also, we will change whenForm to resolved value
                            for (var j = 0; j < $scope.view.viewOptions.fields.length; j++) {
                                var viewField = $scope.view.viewOptions.fields[j];
                                if (viewField.field === columnsForWhen[i].field) {
                                    viewField.whenForm = resolved + "";
                                    break;
                                }
                            }
                            if (oldVisibleValue != columnsForWhen[i].visibilityGrid) {

                                reConfigure = true;
                            }
                        }
                    }
                    if (reConfigure) {
                        $scope.gridOptions.reConfigureColumns = !$scope.gridOptions.reConfigureColumns;
                    }
                })

                unwatcher.currentRowChanged = $scope.$watch("view.viewOptions.parentSharedOptions.currentRowChanged", function (newValue, oldValue) {
                    if (angular.isDefined(newValue)) {
                        // to change nested grid data moving through selecting parent grid row , set currentIndex in rowDataModel in case of nested grid showing as tab
                        if (dataModel instanceof FieldDataModel) {
                            dataModel.rowDataModel.setIndex(view.viewOptions.parentSharedOptions.currentRowIndex)
                        }
                        var currentRow = $scope.view.viewOptions.parentSharedOptions.currentRow;
                        var $parametermappings = $scope.view.viewOptions.$parametermappings;
                        var queryGrid = $scope.view.viewOptions.parentSharedOptions.queryGrid;
                        if (currentRow) {
                            if ($parametermappings) {
                                var newCurrentRow = {};
                                newCurrentRow = populateParametersFromQuery(newCurrentRow, currentRow, queryGrid);
                                var newParameters = {};
                                $scope.resolveParameters($parametermappings, newCurrentRow, newParameters);
                                dataModel.setParameters(newParameters);
                            }
                            $scope.refreshGridModel();

                        }

                    }
                })
            }
            if ($scope.view.viewOptions.provideParentParameter) { // this watch is added for passing parameters to other dashboard view.---case on click of row of project dashboard,we have to notify apply filter to task dashboard-Ritesh Bansal
                $scope.$watch("view.viewOptions.sharedOptions.currentRowChanged", function (newValue, oldValue) {
                    if ((!angular.isDefined(newValue)) || angular.equals(newValue, oldValue)) {
                        return;
                    }
                    var currentRow = $scope.view.viewOptions.sharedOptions.currentRow;
                    if (currentRow) {
                        var parentParameter = $scope.view.viewOptions.provideParentParameter;
                        var onRecursiveIconClick = $scope.view.viewOptions.sharedOptions.onRecursiveIconClick;
                        if (onRecursiveIconClick) {
                            $scope.view.viewOptions.parentParameters[parentParameter] = {};
                            $scope.view.viewOptions.parentParameters[parentParameter].$in = $scope.view.viewOptions.parentParameters[parentParameter].$in || {};
                            $scope.view.viewOptions.parentParameters[parentParameter].$in["$$getRecursive"] = $scope.view.viewOptions.parentParameters[parentParameter].$in["$$getRecursive"] || {};
                            var params = $scope.view.viewOptions.parentParameters[parentParameter].$in["$$getRecursive"];
                            params.key = currentRow._id;
                            var recursion = $scope.view.viewOptions.$recursion;
                            for (var key in recursion) {
                                if (key.indexOf("$") < 0) {
                                    params.recursiveField = key;
                                    break;
                                }
                            }
                            params.recursiveCollection = $scope.view.viewOptions.collection;
                        } else {
                            $scope.view.viewOptions.parentParameters[parentParameter] = currentRow._id;
                        }
                    }
                    $scope.view.viewOptions.parentParameters.__changed = !$scope.view.viewOptions.parentParameters.__changed; //angular do not recognize change in reference in property staring with "$"...that's why we have reversed the value of __watch.
                })
            }


            populatePageOptions();


            viewOptions.userPreferenceOptions = {};
            viewOptions.sharedOptions.insertInfo = {insertMode: viewOptions.insertMode};
            $scope.populateFilterInfo(viewOptions.filterInfo, filterColumns);
            $scope.populateSortInfo(viewOptions.sortInfo, sortColumns);
            $scope.populateGroupInfo(viewOptions.groupInfo, groupColumns);
            if (viewOptions.recursionEnabled) { //this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
                $scope.populateRecursiveInfo(viewOptions.recursionInfo, recursiveColumns);
            }
            viewOptions.qViewStyle = Util.replaceDollarAndThis(viewOptions.qViewStyle);
            if (viewOptions.responsiveColumns) {
                viewOptions.responsiveColumns = JSON.parse(viewOptions.responsiveColumns);
            }
            var customizedFields = [];
            getAllFields(angular.copy($scope.view.viewOptions.fields), customizedFields, ui);
            Util.sort(customizedFields, "asc", "index");
            viewOptions.customizedFields = customizedFields;
            if (viewOptions.insert || viewOptions.insert == undefined) {
                if (viewOptions.insertMode == undefined || viewOptions.insertMode == 'both') {
                    viewOptions.quickInsert = true;
                } else if (viewOptions.insertMode == 'form') {
                    viewOptions.quickInsert = false;
                } else if (viewOptions.insertMode == 'grid') {
                    viewOptions.quickInsert = true;
                    viewOptions.insert = false;
                }
            }
            viewOptions.navigation = viewOptions.navigation !== undefined ? viewOptions.navigation : true;
            if (viewOptions.primaryField === undefined) {
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].primary) {
                        viewOptions.primaryField = columns[i].field;
                        break;
                    }
                }
            }
            if (viewOptions.primaryField) {
                viewOptions.sharedOptions = viewOptions.sharedOptions || {};
                viewOptions.sharedOptions.primaryField = viewOptions.primaryField;
            }
            viewOptions.userPreferenceOptions = viewOptions.userPreferenceOptions || {};
            viewOptions.userPreferenceOptions.recursionEnabled = viewOptions.recursionEnabled; //this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh

            var gridOptions = {
                resolveActionWithRow: viewOptions.resolveActionWithRow,
                recursiveColumns: recursiveColumns,
                $parameters: viewOptions.$parameters,
                provideParentParameter: viewOptions.provideParentParameter,
                $recursion: viewOptions.$recursion,
                hideAccordion: viewOptions.hideAccordion,
                addUserPreference: viewOptions.addUserPreference !== undefined ? viewOptions.addUserPreference : true,
                admin: viewOptions.admin,
                aggregateColumns: aggregateColumns,
                aggregatePosition: viewOptions.aggregatePosition,
                alertMessageOptions: viewOptions.alertMessageOptions,
                autoWidthColumn: viewOptions.autoWidthColumn,
                busyMessageOptions: viewOptions.busyMessageOptions,
                confirmMessageOptions: viewOptions.confirmMessageOptions,
                checkboxSelection: viewOptions.checkboxSelection,
                clientSearch: viewOptions.clientSearch,
                close: viewOptions.close !== undefined ? viewOptions.close : false,
                closeV: viewOptions.closeV,
                colSequenceField: viewOptions.colSequenceField || 'index',
                columns: columns,
                confirmationV: viewOptions.confirmationV,
                data: "data",
                edit: viewOptions.edit !== undefined ? viewOptions.edit : true,
                dataModel: dataModel,
                dataReloaded: false,
                delete: viewOptions.delete !== undefined ? viewOptions.delete : true,
                fieldCustomization: viewOptions.fieldCustomization,
                fieldActions: viewOptions.fieldActions,
                fieldDragable: viewOptions.fieldDragable !== undefined ? viewOptions.fieldDragable : true,
                fieldResize: viewOptions.fieldResize !== undefined ? viewOptions.fieldResize : true,
                filterColumns: filterColumns,
                filterInfo: viewOptions.filterInfo || [],
                formType: viewOptions.formType,
                groupColumns: groupColumns,
                groupInfo: viewOptions.groupInfo || [],
                recursionInfo: viewOptions.recursionInfo || [],
                ftsColumns: ftsColumns,
                fullMode: viewOptions.fullMode,
                headerActions: headerActions,
                headerSize: viewOptions.headerSize || 'large',
                handleFieldDragChanges: "handleFieldDragChanges",
                headerFreeze: viewOptions.headerFreeze !== undefined ? viewOptions.headerFreeze : true,
                headerTemplate: viewOptions.headerTemplate,
                hideUnit: viewOptions.hideUnit,
                insert: viewOptions.insert !== undefined ? viewOptions.insert : true,
                label: viewOptions.label,
                lastSelectedInfo: viewOptions.lastSelectedInfo,
                largeFont: viewOptions.largeFont,
                navigation: viewOptions.navigation,
                nested: viewOptions.nested,
                onSelectionChange: "onSelectionChange",
                openV: viewOptions.openV,
                onRefresh: "refreshGridModel",
                pageOptions: viewOptions.pageOptions,
                parentSharedOptions: viewOptions.parentSharedOptions,
                popup: viewOptions.popup,
                quickInsert: viewOptions.quickInsert,
                quickViewMenuGroup: viewOptions.quickViewMenuGroup,
                qViewStyle: viewOptions.qViewStyle,
                refresh: viewOptions.refresh,
                refreshDataOnLoad: viewOptions.refreshDataOnLoad,
                responsiveColumns: viewOptions.responsiveColumns,
                viewResize: viewOptions.viewResize,
                resizeV: viewOptions.resizeV,
                rowActions: rowActions,
                rowDragable: false,
                save: viewOptions.save !== undefined ? viewOptions.save : true,
                saveCustomization: viewOptions.saveCustomization,
                sequenceField: viewOptions.sequenceField || undefined,
                style: viewOptions.style || {},
                showLabel: viewOptions.showLabel,
                sharedOptions: viewOptions.sharedOptions,
                shortMessageOptions: viewOptions.shortMessageOptions,
                showSelectionCheckbox: viewOptions.showSelectionCheckbox !== undefined ? viewOptions.showSelectionCheckbox : true,
                showZeroIfNull: viewOptions.showZeroIfNull,
                sortColumns: sortColumns,
                sortInfo: viewOptions.sortInfo || [],
                tabs: tabs,
                toolbar: viewOptions.toolbar !== undefined ? viewOptions.toolbar : true,
                toolbarActions: toolbarActions,
                updateColumns: updateColumns,
                userPreferenceOptions: viewOptions.userPreferenceOptions,
                viewControl: viewControl,
                viewIndex: viewOptions.viewIndex,
                warningOptions: viewOptions.warningOptions,
                popupResize: viewOptions.popupResize,
                popupStyle: viewOptions.popupStyle,
                primaryFieldInfo: primaryFieldInfo,
                processOptions: viewOptions.processOptions,
                uniqueViewId: viewOptions.uniqueViewId,
                userSorting: viewOptions.userSorting
            }
            // crosstab nested view is dealing with the viewdata instead of data.
            if (viewOptions.crossTabInfo && viewOptions.crossTabInfo["x-axis"]) {
                if (viewOptions.crossTabInfo["dataFields"] !== undefined && viewOptions.crossTabInfo["dataFields"].length !== 0) {
                    gridOptions.watchViewData = true;
                }
                gridOptions.quickInsert = false;
                gridOptions.delete = false;
            }
            if (viewOptions.queryGrid && viewOptions.queryGrid.$parameters) {         // to resolve the header action visibility
                gridOptions.parameters = viewOptions.queryGrid.$parameters;
            }
            if (gridOptions.viewControl) {
                gridOptions.viewControlOptions = {
                    menus: [
                        {
                            label: AppViews.__addfield__.viewOptions.label,
                            viewid: AppViews.__addfield__.viewOptions.id
                        },
                        {
                            label: AppViews.__selfquickview__.viewOptions.label,
                            viewid: AppViews.__selfquickview__.viewOptions.id
                        },
                        {
                            label: AppViews.__editfield__.viewOptions.label,
                            viewid: AppViews.__editfield__.viewOptions.id
                        },
                        {
                            label: AppViews.__editquickview__.viewOptions.label,
                            viewid: AppViews.__editquickview__.viewOptions.id
                        },
                        {
                            label: AppViews.__editaction__.viewOptions.label,
                            viewid: AppViews.__editaction__.viewOptions.id
                        },
                        {
                            label: AppViews.__managetrigger__.viewOptions.label,
                            viewid: AppViews.__managetrigger__.viewOptions.id
                        },
                        {
                            label: AppViews.__manageevents__.viewOptions.label,
                            viewid: AppViews.__manageevents__.viewOptions.id
                        },
                        {
                            label: AppViews.__manageworkflowevents__.viewOptions.label,
                            viewid: AppViews.__manageworkflowevents__.viewOptions.id
                        },

                        {
                            label: AppViews.__manageFormGroup__.viewOptions.label,
                            viewid: AppViews.__manageFormGroup__.viewOptions.id
                        },

                        {
                            label: AppViews.__manageIndexes__.viewOptions.label,
                            viewid: AppViews.__manageIndexes__.viewOptions.id
                        },
                        {
                            label: AppViews.__filterspace__.viewOptions.label,
                            viewid: AppViews.__filterspace__.viewOptions.id
                        },
                        {
                            label: AppViews.__edittemplates__.viewOptions.label,
                            viewid: AppViews.__edittemplates__.viewOptions.id
                        },
                        {
                            label: AppViews.__commit__.viewOptions.label,
                            function: "Commit.commit",
                            type: "invoke",
                            fields: AppViews.__commit__.viewOptions.fields,
                            async: true
                        },
                        {
                            label: AppViews.__otherFunctions__.viewOptions.label,
                            function: "Porting.otherFunctions",
                            type: "invoke",
                            fields: AppViews.__otherFunctions__.viewOptions.fields
                        }
                    ],
                    class: "app-bar-button app-menu-setting",
                    displayField: "label",
                    hideOnClick: true,
                    onClick: 'onViewControlOptionClick',
                    menuClass: 'pl-default-popup-label'
                };
                /*if (viewOptions.sourceid) {
                 gridOptions.viewControlOptions.menus.splice(1, 0,
                 {
                 label:AppViews.__selfquickviewcustomization__.viewOptions.label,
                 viewid:AppViews.__selfquickviewcustomization__.viewOptions.id
                 });
                 }*/

                gridOptions.onViewControl = "onViewControl";
            }
            $scope.data = data;
            if (aggregateData) {
                for (var i = 0; i < gridOptions.columns.length; i++) {
                    if (gridOptions.columns[i].aggregate) {
                        $scope.aggregateData = aggregateData;
                        gridOptions.aggregateData = "aggregateData";
                        break;
                    }
                }
            }


            viewOptions.viewTemplate = "<div class='app-view pl-grid' pl-grid='gridOptions' ng-class='{\"full-mode\":gridOptions.sharedOptions.viewPosition != \"right\", \"full-mode-no-child\": gridOptions.sharedOptions.resizable}' ng-controller='pl-grid-controller'></div>"
            $scope.gridOptions = gridOptions;
            unwatcher.selectedRowActionChanged = $scope.$watch("gridOptions.sharedOptions.selectedRowActionChanged", function (newValue, oldValue) {
                if (angular.isDefined(newValue)) {
                    if ($scope.gridOptions.nested) {
                        $scope.gridOptions.rowActions[0].nestedForm = true;
                    }
                    $scope.viewRowAction($scope.gridOptions.rowActions[gridOptions.sharedOptions.selectedRowAction])
                }
            }, true);

            unwatcher.selectedRowActionChanged = $scope.$watch("gridOptions.sharedOptions.selectedFieldActionChanged", function (newValue, oldValue) {
                if (angular.isDefined(newValue)) {
                    if ($scope.gridOptions.nested) {
                        $scope.gridOptions.rowActions[0].nestedForm = true;
                    }
                    var v = {};
                    v = angular.copy($scope.gridOptions.sharedOptions.selectedFieldAction);
                    v.watchParent = false;
                    $scope.viewRowAction(v);
                }
            }, true);

            // NOTE: add watch to sense parent changes in nested table case
            // when testing the crosstab work refreshGridModel is called form this watch and after testing the nested table work we found that there is no need for this watch
            // so we are commenting this code on 23/12/2014 (Manjeet Sangwan)
            /*if (dataModel instanceof FieldDataModel) {

             $scope.$parent.$watch("data." + dataModel.field, function (newValue, oldValue) {
             console.log("nested field watch..."+JSON.stringify(newValue));
             if (!newValue) {
             newValue = [];
             }
             dataModel.setData(newValue);
             $scope.refreshGridModel();
             });
             }*/

            //watch to show fk view,if we click on fk field
            unwatcher.referredView = $scope.$watch("gridOptions.sharedOptions.referredView", function (newValue, oldValue) {
                try {
                    if (!angular.equals(newValue, oldValue) && newValue !== undefined) {
                        var referredView = $scope.gridOptions.sharedOptions.referredView;
                        if (!referredView.referredView.id) {
                            var title = "ViewCtrl in pl.view";
                            var message = 'referredView id is mendatory to open referred view' + JSON.stringify(referredView.referredView);
                            $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                            return;
                        }

                        var v = {};
                        v.referredView = angular.copy(referredView.referredView);
                        v.currentRow = angular.copy(referredView.currentRow);
                        v.type = "referredView";
                        v.sourceid = newValue.sourceid;
                        $scope.viewRowAction(v);
                    }
                }
                catch (e) {
                    if ($scope.handleClientError) {
                        $scope.handleClientError(e);
                    }
                }

            });
            //watch closed to close view
            unwatcher.closed = $scope.$watch("gridOptions.sharedOptions.closed", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    $scope.closePLView();
                }
            }, true);

            unwatcher.reloadView = $scope.$watch("gridOptions.sharedOptions.reloadView", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue)) {
                    $scope.onQuickViewSelection($scope.view.viewOptions.requestView);
                }
            }, true);

            // watch to monitor the insertion of new record in dataModel
            unwatcher.insertInfoInsert = $scope.$watch("view.viewOptions.sharedOptions.insertInfo.insert", function (newValue, oldValue) {
                if (newValue) {
                    if ($scope.view.viewOptions.insertView) {
                        var clone = angular.copy($scope.view.viewOptions.insertView);
                        var insertRowAction = {
                            qviews: [clone],
                            type: "view"
                        };
                        $scope.viewRowAction(insertRowAction);
                    } else if ($scope.gridOptions.rowActions && $scope.gridOptions.rowActions.length > 0 && $scope.gridOptions.rowActions[0].type == "detail") {
                        var clone = angular.copy($scope.gridOptions.rowActions[0]);
                        clone.data = newValue.data;
                        clone.saveOptions = newValue.saveOptions;
                        clone.addNewRow = newValue.addNewRow;
                        clone.deAttached = true;
                        clone.watchParent = newValue.watchParent;
                        clone.refreshDataOnLoad = newValue.refreshDataOnLoad;
                        $scope.viewRowAction(clone);
                    }
                }
            });


            unwatcher.refereshInBackground = $scope.$watch('view.viewOptions.sharedOptions.refereshInBackground', function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    $scope.refreshGridModel(undefined, {background: true});
                }
            });

            unwatcher.pageOptionsCursor = $scope.$watch("gridOptions.sharedOptions.pageOptions.cursor", function (newCursor, oldCursor) {
                if (!angular.equals(newCursor, oldCursor)) {
                    gridOptions.dataModel.setCursor(newCursor);
                    $scope.refreshGridModel();
                }
            })

            // watch to monitor the changes in the data in the nested grid so that aggregate can be managed
            if (view.viewOptions.watchAggregates) {
                unwatcher.watchAggregatesData = $scope.$watch("data", function (newData, oldData) {
                    if (newData) {
                        populateNestedAggregateData(newData, viewOptions.aggregateFields, $scope.aggregateData);
                    }
                }, true);
            }
            unwatcher.openUpdateView = $scope.$watch("gridOptions.openUpdateView", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue)) {
                    var updateColumns = $scope.gridOptions.updateColumns;
                    if (angular.isUndefined(updateColumns) || updateColumns.length == 0) {
                        var title = "ViewCtrl in pl.view";
                        var message = "Update Columns are not found while update action";
                        $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                        return;
                    }

                    var v = {};
                    v.data = [

                    ];
                    var saveFunction = function (formUpdates) {
//                        if (formUpdates && formUpdates.$insert && formUpdates.$insert.length > 0) {
//                            formUpdates = formUpdates.$insert[0];
//                        } else {
//                            formUpdates = {};
//                        }/* code may be required for Object case.*/
                        if (v.data && v.data.length > 0) {
                            formUpdates = v.data[0];
                            /* we need to get updates from the v.data as data is required in Array but in formUpdates it comes in Object [for case with multiple fk field update using header action]*/
                        } else {
                            formUpdates = {};
                        }
                        //checking for selection of all rows from UI-- Rajit garg - 23/mar/2015
                        if ($scope.view && $scope.view.viewOptions && $scope.view.viewOptions.sharedOptions && $scope.view.viewOptions.sharedOptions.pageOptions && $scope.view.viewOptions.sharedOptions.pageOptions.allRowSeleceted) {
                            var options = {"formUpdates": formUpdates, "v": v, "update": true};
                            showConfirmationMessage(options);
                        } else {
                            var params = {"v": v};
                            updateAsync(formUpdates, params)
                        }
                    }
                    v.viewOptions = {
                        label: "Update",
                        ui: "form",
                        viewResize: false,
                        showLabel: true,
                        saveLabel: "Save",
                        data: "data",
                        saveOptions: {editMode: true},
                        saveFn: saveFunction,
                        events: $scope.view.viewOptions.events,
                        viewControl: false
                    };
                    v.viewOptions.fields = $scope.gridOptions.updateColumns;
                    v.popup = true;


                    if ($scope.gridOptions.openV) {
                        $scope[$scope.gridOptions.openV](v);
                    }
                }
            }, true);

            if (viewOptions.refreshDataOnLoad) {
                $scope.refreshGridModel();
            }

            //on opening the detail view cross tab data is populated using the parameters passed in the cross tab info
            if (viewOptions.crossTabInfo && viewOptions.crossTabInfo["x-axis"]/* && !viewOptions.nested*/) {
                $scope.resolveCrossTabParameters(viewOptions.crossTabInfo);
            }

            // cellDataReload is used to reload the data of grid view and form view when used in advanceDashboard.(By :Manjeet Sangwan)
            unwatcher.cellDataReload = $scope.$watch("view.viewOptions.cellDataReload", function (newValue) {
                if (angular.isDefined(newValue)) {
                    $scope.refreshGridModel($scope.view.data);
                }
            });
            if (dataField) {
                $scope.$parent.$watch("data." + dataField, function (value) {
                    //required for value change in dotted nested table -> address[] is a nested table in studentid and studentid is a fk column visible in form - case of afe  -shekhar - enquiry form
                    if (value === $scope.data) {
                        //if reference are same then do nothing, required to update only when fk value change in row data model and we need to refresh nested table on this - studentid selected in form (address[] data comes due to sub field defined)
                        return;
                    }
                    $scope.refreshGridModel();
                })
            }
            // aggregate data is populated in async is aggregateAsync is true on view.// manjeet
            // if the view has more data than the specified limit then $async:true is retured from the batchQuery
            if (aggregateData && aggregateData.$async) {
                $scope.populateAggregateDataInAsync();
            }


        }
        else if (ui == 'form') {
            viewOptions.sharedOptions.insertInfo = {};

            var formSharedOptions = viewOptions.sharedOptions;

            Util.sort(viewOptions.actions, "asc", "index");
            var headerActions = [];
            if (viewOptions.actions) {
                for (var i = 0; i < viewOptions.actions.length; i++) {
                    var action = viewOptions.actions[i];
                    if (action.actionField) {
                        continue;
                    }
                    if (action.onRow && (action.visibility || action.visibilityForm)) {
                        if (action.when) {
                            action.when = Util.replaceDollarAndThis(action.when);
                        }
                        if (action.when == undefined) {
                            action.when = true;
                        }
                        action.onClick = "viewRowAction";
                        action.rowActionIndex = (i + 1);
                        headerActions.push(action);
                    } else if (action.onHeader && (action.visibility || action.visibilityForm)) {
                        if (action.when) {
                            action.when = Util.replaceDollarAndThis(action.when, 'formOptions.parameters.');
                        }
                        if (action.when == undefined) {
                            action.when = true;
                        }
                        action.onClick = "viewHeaderAction";
                        action.showLabel = true;
                        action.actionClass = 'pl-header-actions app-populate-default-filter';
                        headerActions.push(action);
                    }
                }
            }

            var groups = angular.copy(view.viewOptions.groups) || [];
            Util.sort(groups, "asc", "index");
            var defaultGroup = {
                showLabel: true,
                columns: [],
                views: [],
                width: "200px",
                separator: false,
                noOfColumnsPerRow: 2,
                default: true
            };
            var defaultRteGroup = {
                showLabel: true,
                columns: [],
                views: [],
                width: "100%",
                singleColumn: true,
                separator: false,
                noOfColumnsPerRow: 1
            };
            groups.push(defaultRteGroup);
            groups.push(defaultGroup);

            populateColumns(ui, fields, undefined, undefined, undefined, undefined, undefined, undefined, undefined, groups, tabs, undefined, viewOptions);


            var row = dataModel.getData();
            $scope.data = row;
            // result is passed to refreshFormDataModel method to reload the data of grid and form views used in advanced dashboards (by manjeet sangwan)
            $scope.refreshFormDataModel = function (result) {
                try {
                    if ($scope.view.viewOptions.busyMessageOptions) {
                        $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
                    }
                    dataModel.refresh(result).then(
                        function (result) {
                            if ($scope.view.viewOptions.busyMessageOptions) {
                                delete $scope.view.viewOptions.busyMessageOptions.msg;
                            }
                            $scope.data = result;
                            $scope.formOptions.dataReloaded = !$scope.formOptions.dataReloaded;
                            $scope.formOptions.sharedOptions.currentRow = result;
                            $scope.formOptions.sharedOptions.currentRowIndex = dataModel.getIndex();
                            $scope.formOptions.sharedOptions.currentRowChanged = !$scope.formOptions.sharedOptions.currentRowChanged;

                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }


                        }).fail(function (err) {
                            if ($scope.view.viewOptions.busyMessageOptions) {
                                delete $scope.view.viewOptions.busyMessageOptions.msg;
                            }

                            $scope.view.viewOptions.warningOptions.error = err;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        })
                } catch (e) {
                    if ($scope.handleClientError) {
                        $scope.handleClientError(e);
                    }
                }
            }

            if (viewOptions.queryLookupData) {
                if (viewOptions.fields) {
                    for (var i = 0; i < viewOptions.fields.length; i++) {
                        if ((viewOptions.fields[i].type === "fk" || viewOptions.fields[i].type === "currency") && viewOptions.fields[i].cache) {
                            $scope.getLookupData("", viewOptions.fields[i], true);
                        }
                    }
                }
            }

            for (var i = 0; i < groups.length; i++) {
                if (angular.isDefined(groups[i].when) && groups[i].when.toString().trim().length > 0) {
                    groups[i].when = Util.replaceDollarAndThis(groups[i].when);
                }
                if (groups[i].type == "flow") {
                    delete groups[i].type;
                    groups[i].noOfColumnsPerRow = 2;

                }
                if ((!groups[i].columns || groups[i].columns.length == 0) && (!groups[i].views || groups[i].views.length == 0)) {
                    groups.splice(i--, 1);
                } else if (groups[i].columns) {
                    Util.sort(groups[i].columns, "asc", "index");
                }
            }

            var customizedFields = [];
            getAllFields(angular.copy($scope.view.viewOptions.fields), customizedFields, ui);
            Util.sort(customizedFields, "asc", "index");
            viewOptions.customizedFields = customizedFields;
            var formOptions = {
                admin: viewOptions.admin,
                autoWidthColumn: viewOptions.autoWidthColumn,
                alertMessageOptions: viewOptions.alertMessageOptions,
                label: viewOptions.label,
                headerActions: viewOptions.headerActions || headerActions,
                showLabel: viewOptions.showLabel,
                groups: groups,
                data: "data",
                openV: viewOptions.openV,
                closeV: viewOptions.closeV,
                resizeV: viewOptions.resizeV,
                dataModel: dataModel,
                close: viewOptions.close !== undefined ? viewOptions.close : false,
                viewResize: viewOptions.viewResize !== undefined ? viewOptions.viewResize : true,
                save: viewOptions.save !== undefined ? viewOptions.save : true,
                saveCustomization: viewOptions.saveCustomization,
                dataReloaded: false,
                viewControl: viewOptions.viewControl !== undefined ? viewOptions.viewControl : true,
                sharedOptions: viewOptions.sharedOptions,
                busyMessageOptions: viewOptions.busyMessageOptions,
                viewIndex: viewOptions.viewIndex,
                nested: viewOptions.nested || false,
                parentSharedOptions: viewOptions.parentSharedOptions,
                headerFreeze: viewOptions.headerFreeze !== undefined ? viewOptions.headerFreeze : true,
                headerTemplate: viewOptions.headerTemplate,
                toolbar: viewOptions.toolbar !== undefined ? viewOptions.toolbar : true,
                saveFn: viewOptions.saveFn,
                afterSaveFn: viewOptions.afterSaveFn,
                navigation: viewOptions.navigation,
                edit: viewOptions.edit,
                insert: viewOptions.insert,
                actions: viewOptions.actions,
                warningOptions: viewOptions.warningOptions,
                saveLabel: viewOptions.saveLabel,
                tabs: tabs,
                refreshParentInBackground: viewOptions.refreshParentInBackground,
                responsiveColumns: viewOptions.responsiveColumns,
                quickInsert: viewOptions.quickInsert,
                formType: viewOptions.formType,
                fullMode: viewOptions.fullMode,
                shortMessageOptions: viewOptions.shortMessageOptions,
                showZeroIfNull: viewOptions.showZeroIfNull,
                selfInsertView: viewOptions.selfInsertView,
                fieldCustomization: viewOptions.fieldCustomization,
                primaryFieldInfo: primaryFieldInfo,
                popupResize: viewOptions.popupResize,
                popupStyle: viewOptions.popupStyle,
                largeFont: viewOptions.largeFont,
                tabLabel: viewOptions.tabLabel
            };
            if (!$scope.workbenchOptions.developmentRight) {
                formOptions.viewControl = false;
            }
            $scope.formOptions = formOptions;
            populateFormPageOptions();

            if ($scope.formOptions.viewControl) {
                $scope.formOptions.viewControlOptions = {
                    menus: [
                        {
                            label: AppViews.__addfield__.viewOptions.label,
                            viewid: AppViews.__addfield__.viewOptions.id
                        },
                        {
                            label: AppViews.__selfquickview__.viewOptions.label,
                            viewid: AppViews.__selfquickview__.viewOptions.id
                        },
                        {
                            label: AppViews.__editfield__.viewOptions.label,
                            viewid: AppViews.__editfield__.viewOptions.id
                        },
                        {
                            label: AppViews.__editquickview__.viewOptions.label,
                            viewid: AppViews.__editquickview__.viewOptions.id
                        },
                        {
                            label: AppViews.__editaction__.viewOptions.label,
                            viewid: AppViews.__editaction__.viewOptions.id
                        },
                        {
                            label: AppViews.__managetrigger__.viewOptions.label,
                            viewid: AppViews.__managetrigger__.viewOptions.id
                        },
                        {
                            label: AppViews.__manageevents__.viewOptions.label,
                            viewid: AppViews.__manageevents__.viewOptions.id
                        },
                        {
                            label: AppViews.__manageworkflowevents__.viewOptions.label,
                            viewid: AppViews.__manageworkflowevents__.viewOptions.id
                        },
                        {
                            label: AppViews.__manageFormGroup__.viewOptions.label,
                            viewid: AppViews.__manageFormGroup__.viewOptions.id
                        },
                        {
                            label: AppViews.__manageIndexes__.viewOptions.label,
                            viewid: AppViews.__manageIndexes__.viewOptions.id
                        },
                        {
                            label: AppViews.__filterspace__.viewOptions.label,
                            viewid: AppViews.__filterspace__.viewOptions.id
                        },
                        {
                            label: AppViews.__edittemplates__.viewOptions.label,
                            viewid: AppViews.__edittemplates__.viewOptions.id
                        },
                        {
                            label: AppViews.__commit__.viewOptions.label,
                            function: "Commit.commit",
                            type: "invoke",
                            fields: AppViews.__commit__.viewOptions.fields,
                            async: true
                        },
                        {
                            label: AppViews.__otherFunctions__.viewOptions.label,
                            function: "Porting.otherFunctions",
                            type: "invoke",
                            fields: AppViews.__otherFunctions__.viewOptions.fields
                        }
                    ],
                    class: "app-bar-button app-menu-setting",
                    displayField: "label",
                    hideOnClick: true,
                    onClick: 'onViewControlOptionClick',
                    menuClass: 'pl-default-popup-label'
                };
                formOptions.onViewControl = "onViewControl";
            }
            viewOptions.viewTemplate = "<div class='app-view app-panel app-mediumn-font' pl-form='formOptions' ng-controller='pl-form-controller'></div>"
            if (viewOptions.parentSharedOptions && viewOptions.watchParent) {
                //this watch is used for showing columns in nested table on the basis of when value
                $scope.$watch("view.viewOptions.parentSharedOptions.dataChanged", function () {
                    $scope.view.viewOptions.sharedOptions.dataChanged = !$scope.view.viewOptions.sharedOptions.dataChanged;
                })

                $scope.$watch("view.viewOptions.parentSharedOptions.currentRowChanged", function (newValue, oldValue) {
                    if ((!angular.isDefined(newValue)) || (angular.equals(newValue, oldValue))) {
                        return;
                    }
                    if (viewOptions.deAttached) {
                        var newRow_id = $scope.view.viewOptions.parentSharedOptions.currentRow._id;
                        //TODO we may need to skip process default value at this time
                        dataModel.setParentData([
                            {_id: newRow_id}
                        ]);
                    } else {
                        dataModel.setIndex($scope.view.viewOptions.parentSharedOptions.currentRowIndex);
                    }
                    populateFormPageOptions();
                    $scope.refreshFormDataModel();
                })
                //NOTE: if we saveAndRefresh data from panel view then we dont fire refresh method for dataModel
                if (viewOptions.refreshDataOnLoad === undefined || viewOptions.refreshDataOnLoad === true) {
                    $scope.refreshFormDataModel();
                }
            }

            //watch to  navigate
            $scope.$watch("formOptions.sharedOptions.pageOptions.cursor", function (newCursor, oldCursor) {
                if (!angular.equals(newCursor, oldCursor) && formOptions.parentSharedOptions) {
                    var parentCursor = formOptions.parentSharedOptions.pageOptions.cursor;
                    var parentEndCursor = formOptions.parentSharedOptions.pageOptions.endCursor;
                    var parentPageSize = formOptions.parentSharedOptions.pageOptions.pageSize;
                    var parentHasNext = formOptions.parentSharedOptions.pageOptions.hasNext;
                    var now = (parentCursor + newCursor);
                    if (newCursor >= 0 && now < parentEndCursor) {
                        formOptions.parentSharedOptions.currentRowIndex = newCursor;
                    } else if (newCursor < 0 && parentCursor > 0) {
                        formOptions.parentSharedOptions.pageOptions.currentRowPointer = "Last";
                        formOptions.parentSharedOptions.pageOptions.cursor = formOptions.parentSharedOptions.pageOptions.cursor - formOptions.parentSharedOptions.pageOptions.pageSize;
                    } else if (newCursor > 0 && (now >= parentEndCursor) && parentHasNext) {
                        formOptions.parentSharedOptions.pageOptions.currentRowPointer = "First";
                        formOptions.parentSharedOptions.pageOptions.cursor = formOptions.parentSharedOptions.pageOptions.cursor + formOptions.parentSharedOptions.pageOptions.pageSize;
                    } else if (newCursor > 0) {
                        formOptions.sharedOptions.pageOptions.hasNext = false;
                        formOptions.sharedOptions.pageOptions.cursor = 0;
                    } else {
                        var title = "ViewCtrl in pl.view";
                        var message = "Not handle case >>>newCursor>>" + newCursor + ">>>parentCursor>>" + parentCursor + ">>parentEndCursor>>" + parentEndCursor + ">>parentPageSize>>>" + parentPageSize + ">>parentHasNext>>" + parentHasNext;
                        $scope.view.viewOptions.warningOptions.error = new Error(message + "-" + title);
                    }
                }
            }, true);

            //watch closed to close view
            $scope.$watch("formOptions.sharedOptions.closed", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    $scope.closePLView();
                }
            }, true);
            $scope.$watch("view.viewOptions.sharedOptions.insertInfo.insert", function (newValue, oldValue) {
                if (newValue) {
                    //set blank in parent data model
                    dataModel.setParentData(newValue.data || []);
                    if (newValue.addNewRow) {
                        $scope.formOptions.sharedOptions.saveOptions.editMode = true;
                        dataModel.insert().then(function () {
                            $scope.refreshFormDataModel();
                        })
                    } else {
                        //NOTE: if we saveAndRefresh data from panel view then we dont fire refresh method for dataModel
                        if (newValue.refreshDataOnLoad === undefined || newValue.refreshDataOnLoad === true) {
                            $scope.refreshFormDataModel();
                        }
                    }


                }
            });
            if (viewOptions.refreshDataOnLoad) {
                $scope.refreshFormDataModel();
            }

            // cellDataReload is used to reload the data of grid view and form view when used in advanceDashboard.(By :Manjeet Sangwan)
            $scope.$watch("view.viewOptions.cellDataReload", function (newValue) {
                if (angular.isDefined(newValue)) {
                    dataModel.setParentData($scope.view.data.result);
                    $scope.refreshFormDataModel($scope.view.data);
                }
            });


        }
        else if (ui == "dashboard") {
            toolbarActions = [];
            if (viewOptions.actions) {
                for (var i = 0; i < viewOptions.actions.length; i++) {
                    var action = viewOptions.actions[i];
                    if (action.actionField || action.onRow || action.onHeader) {
                        continue;
                    }
                    if (action.type == "invoke") {
                        if (action.when) {
                            action.when = Util.replaceDollarAndThis(action.when, 'dashboardOptions.parameters.');
                        }
                        if (action.when == undefined) {
                            action.when = true;
                        }
                        if (action.function == 'ExportViewService.exportExcelView') {
                            action.class = "exl";
                        } else if (!action.class) {
                            action.showLabel = true;
                        }

                        action.onClick = "viewHeaderAction";
                        toolbarActions.push(action);
                    }
                }
            }
            viewOptions.viewTemplate = "<div class='pl-dashboard-wrapper' pl-dashboard></div>";
            var filterColumns = [];
            getHeaderActionFilter(filterColumns, viewOptions.actions);
            $scope.populateFilterInfo(viewOptions.filterInfo, filterColumns);
            var newHeaderActions = [];
            if (viewOptions.actions) {
                for (var i = 0; i < viewOptions.actions.length; i++) {
                    var action = viewOptions.actions[i];
                    if (action.type != "filter") {
                        newHeaderActions.push(action);
                    }

                }
            }
            viewOptions.userPreferenceOptions = {};
            var dashboardOptions = {
                enableFts: viewOptions.enableFts,
                $parameters: viewOptions.$parameters,
                provideParentParameter: viewOptions.provideParentParameter,
                watchParentParameter: viewOptions.watchParentParameter,
                onViewControl: "onViewControl",
                parentSharedOptions: viewOptions.parentSharedOptions,
                sharedOptions: viewOptions.sharedOptions,
                userPreferenceOptions: viewOptions.userPreferenceOptions,
                filterInfo: viewOptions.filterInfo || [],
                fullMode: viewOptions.fullMode,
                dashboardType: viewOptions.dashboardType,
                resizeV: viewOptions.resizeV,
                close: viewOptions.close,
                viewControl: viewControl,
                showLabel: true,
                label: viewOptions.label,
                primaryFieldInfo: primaryFieldInfo,
                warningOptions: viewOptions.warningOptions
            };
            dashboardOptions.addUserPreference = false;
            if (filterColumns && filterColumns.length > 0) {
                dashboardOptions.filterColumns = filterColumns;
                dashboardOptions.addUserPreference = true;
            }
            dashboardOptions.label = viewOptions.label !== undefined ? viewOptions.label : 'Dashboard'
            dashboardOptions.views = viewOptions.views;
            dashboardOptions.aggregates = viewOptions.aggregates;
            dashboardOptions.dashboardGroups = viewOptions.dashboardGroups;
            dashboardOptions.dashboardLayout = viewOptions.dashboardLayout;
            dashboardOptions.userPreferenceOptions.filterInfo = [];
            dashboardOptions.quickViewMenuGroup = quickViewMenuGroup;
            $scope.dashboardOptions = dashboardOptions;
            $scope.dashboardOptions.viewControlOptions = {
                menus: [
                    {
                        label: AppViews.__selfquickview__.viewOptions.label,
                        viewid: AppViews.__selfquickview__.viewOptions.id
                    },
                    {
                        label: AppViews.__editquickview__.viewOptions.label,
                        viewid: AppViews.__editquickview__.viewOptions.id
                    },
                    {
                        label: AppViews.__editaction__.viewOptions.label,
                        viewid: AppViews.__editaction__.viewOptions.id
                    },
                    {
                        label: AppViews.__managetrigger__.viewOptions.label,
                        viewid: AppViews.__managetrigger__.viewOptions.id
                    },

                    {
                        label: AppViews.__commit__.viewOptions.label,
                        function: "Commit.commit",
                        type: "invoke",
                        fields: AppViews.__commit__.viewOptions.fields,
                        async: true
                    }
                ],
                menuClass: '',
                class: 'app-menu-setting ',
                displayField: "label",
                hideOnClick: true,
                onClick: 'onViewControlOptionClick'
            };
            $scope.dashboardOptions.headerActions = toolbarActions;
            $scope.$watch("dashboardOptions.sharedOptions.closed", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    $scope.closePLView();
                }
            }, true);
            // to show error in the aggregates dashboard
            unwatcher.dashboardError = $scope.$watch("view.viewOptions.error", function (newValue, oldValue) {
                if (newValue) {
                    $scope.view.viewOptions.warningOptions.error = $scope.view.viewOptions.error;
                }
            }, true)

            if (viewOptions.executeOnClient) {
                return dataModel.refresh(function () {
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                });

            }
        } else if (ui == "html") {
            var htmlOptions = {
                data: "data",
                onViewControl: "onViewControl",
                parentSharedOptions: viewOptions.parentSharedOptions,
                sharedOptions: viewOptions.sharedOptions,
                close: viewOptions.close,
                resizeV: viewOptions.resizeV,
                viewResize: viewOptions.viewResize,
                warningOptions: viewOptions.warningOptions,
                viewControl: viewOptions.viewControl,
                fullMode: viewOptions.fullMode
            };
            $scope.htmlOptions = htmlOptions;
            $scope.htmlOptions.label = viewOptions.label !== undefined ? viewOptions.label : 'Html';
            $scope.htmlOptions.quickViewMenuGroup = quickViewMenuGroup;
            if (htmlOptions.viewControl) {
                $scope.htmlOptions.viewControlOptions = {
                    menus: [
                        {
                            label: AppViews.__addfield__.viewOptions.label,
                            viewid: AppViews.__addfield__.viewOptions.id
                        },
                        {
                            label: AppViews.__editfield__.viewOptions.label,
                            viewid: AppViews.__editfield__.viewOptions.id
                        },
                        {
                            label: AppViews.__editaction__.viewOptions.label,
                            viewid: AppViews.__editaction__.viewOptions.id
                        },
                        {
                            label: AppViews.__managetrigger__.viewOptions.label,
                            viewid: AppViews.__managetrigger__.viewOptions.id
                        },
                        {
                            label: AppViews.__manageFormGroup__.viewOptions.label,
                            viewid: AppViews.__manageFormGroup__.viewOptions.id
                        },
                        {
                            label: AppViews.__editquickview__.viewOptions.label,
                            viewid: AppViews.__editquickview__.viewOptions.id
                        },
                        {
                            label: AppViews.__manageIndexes__.viewOptions.label,
                            viewid: AppViews.__manageIndexes__.viewOptions.id
                        },
                        {
                            label: AppViews.__filterspace__.viewOptions.label,
                            viewid: AppViews.__filterspace__.viewOptions.id
                        },
                        {
                            label: AppViews.__setfield__.viewOptions.label,
                            function: "Porting.repopulateSetFields",
                            type: "invoke",
                            fields: AppViews.__setfield__.viewOptions.fields
                        },
                        {
                            label: AppViews.__commit__.viewOptions.label,
                            function: "Commit.commit",
                            type: "invoke",
                            fields: AppViews.__commit__.viewOptions.fields,
                            async: true
                        }
                    ],
                    class: "app-bar-button app-menu-setting",
                    displayField: "label",
                    hideOnClick: true,
                    onClick: 'onViewControlOptionClick'
                };
            }
            for (var i = 0; i < viewOptions.actions.length; i++) {
                var headerAction = viewOptions.actions[i];
                if (headerAction.type === "print") {
                    headerAction.template = "<div class='printer-image' ng-click='printHTML()'></div>";
                }
            }
            $scope.htmlOptions.headerActions = viewOptions.actions;

            $scope.$watch("htmlOptions.sharedOptions.closed", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    $scope.closePLView();
                }
            }, true);
            $scope.data = data;
            $scope.close = function () {
                $scope.htmlOptions.sharedOptions.closed = true;
            }
            viewOptions.viewTemplate = "<div class='pl-html-view' pl-html></div>";
        } else if (ui == "graph") {
            toolbarActions = [];
            if (viewOptions.actions) {
                for (var i = 0; i < viewOptions.actions.length; i++) {
                    var action = viewOptions.actions[i];
                    if (action.actionField) {
                        continue;
                    }
                    if (action.type == "invoke" && action.function == 'ExportViewService.exportExcelView') {
                        action.onClick = "viewHeaderAction";
                        action.class = "exl";
                        toolbarActions.push(action);
                    }
                }
            }
            var filterColumns = [];
            getHeaderActionFilter(filterColumns, viewOptions.actions);
            $scope.populateFilterInfo(viewOptions.filterInfo, filterColumns);
            var newHeaderActions = [];
            if (viewOptions.actions) {
                for (var i = 0; i < viewOptions.actions.length; i++) {
                    var action = viewOptions.actions[i];
                    if (action.type != "filter") {
                        newHeaderActions.push(action);
                    }

                }
            }
            viewOptions.userPreferenceOptions = {};
            var graphOptions = {
                colors: viewOptions.colors,
                alertMessageOptions: viewOptions.alertMessageOptions,
                addUserPreference: viewOptions.addUserPreference !== undefined ? viewOptions.addUserPreference : true,
                close: viewOptions.close,
                data: data,
                fontSize: viewOptions.fontSize,
                height: viewOptions.height,
                label: viewOptions.label,
                viewControl: viewControl,
                onViewControl: "onViewControl",
                dataModel: dataModel,
                filterInfo: viewOptions.filterInfo || [],
                filterColumns: filterColumns,
                sharedOptions: viewOptions.sharedOptions,
                graphType: viewOptions.graphType || 'bar-chart', // options: bar and pie
                resizeV: viewOptions.resizeV,
                viewResize: viewOptions.viewResize,
                xAxisField: viewOptions.xAxisField,
                xAxisScale: viewOptions.xAxisScale,
                legendWidth: viewOptions.legendWidth,
                barWidthForTinyMode: viewOptions.barWidthForTinyMode,
                showHorizontalGridLine: viewOptions.showHorizontalGridLine,
                tinyMode: viewOptions.tinyMode,
                yAxisField: viewOptions.yAxisField,
                yAxisScale: viewOptions.yAxisScale,
                showLegend: viewOptions.showLegend,
                showToolTip: viewOptions.showToolTip,
                barGraphType: viewOptions.barGraphType,
                margin: viewOptions.margin,
                showTextOnBar: viewOptions.showTextOnBar,
                parentSharedOptions: viewOptions.parentSharedOptions,
                resize: viewOptions.resize,
                showLabel: true,
                quickViewMenuGroup: viewOptions.quickViewMenuGroup,
                warningOptions: viewOptions.warningOptions,
                width: viewOptions.width,
                uniqueViewId: viewOptions.uniqueViewId,
                userPreferenceOptions: viewOptions.userPreferenceOptions
            }
            if (viewOptions.graphType == 'pie-chart') {
                graphOptions.xAxisField = viewOptions.arcLable;
                graphOptions.yAxisField = viewOptions.arcValue;
            }
            $scope.graphOptions = graphOptions;
            $scope.graphOptions.viewControlOptions = {
                menus: [
                    {
                        label: AppViews.__editaction__.viewOptions.label,
                        viewid: AppViews.__editaction__.viewOptions.id
                    },
                    {
                        label: AppViews.__editquickview__.viewOptions.label,
                        viewid: AppViews.__editquickview__.viewOptions.id
                    },
                    {
                        label: AppViews.__commit__.viewOptions.label,
                        function: "Commit.commit",
                        type: "invoke",
                        fields: AppViews.__commit__.viewOptions.fields,
                        async: true
                    }
                ],
                class: "app-bar-button app-menu-setting",
                displayField: "label",
                hideOnClick: true,
                onClick: 'onViewControlOptionClick'
            };
            viewOptions.reloadViewOnFilterChange = true;
            viewOptions.viewTemplate = "<pl-graph></pl-graph>";
            unwatcher.sharedOptionsClosed = $scope.$watch("graphOptions.sharedOptions.closed", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    $scope.closePLView();
                }
            }, true);
            $scope.close = function () {
                $scope.graphOptions.sharedOptions.closed = true;
            }
        } else if (ui == "advance dashboard") {

            var filterColumns = [];
            getHeaderActionFilter(filterColumns, viewOptions.actions);
            $scope.populateFilterInfo(viewOptions.filterInfo, filterColumns);
            var newHeaderActions = [];
            if (viewOptions.actions) {
                for (var i = 0; i < viewOptions.actions.length; i++) {
                    var action = viewOptions.actions[i];
                    if (action.type != "filter") {
                        newHeaderActions.push(action);
                    }
                }
            }
            viewOptions.userPreferenceOptions = {};
            var adOptions = viewOptions.advancedDashboardOptions || {};
            adOptions.quickViewMenuGroup = quickViewMenuGroup;
            adOptions.viewControl = true;
            adOptions.openV = "openV";
            adOptions.closeV = "closeView";
            adOptions.resizeV = "resizeView";
            adOptions.popUpV = "openPopUpView";
            adOptions.getV = "getWorkbenchView";
            adOptions.onViewControl = 'onViewControl';
            adOptions.viewControlOptions = {
                menus: [
                    {
                        label: AppViews.__addfield__.viewOptions.label,
                        viewid: AppViews.__addfield__.viewOptions.id
                    },
                    {
                        label: AppViews.__editfield__.viewOptions.label,
                        viewid: AppViews.__editfield__.viewOptions.id
                    },
                    {
                        label: AppViews.__editaction__.viewOptions.label,
                        viewid: AppViews.__editaction__.viewOptions.id
                    },
                    {
                        label: AppViews.__managetrigger__.viewOptions.label,
                        viewid: AppViews.__managetrigger__.viewOptions.id
                    },
                    {
                        label: AppViews.__manageFormGroup__.viewOptions.label,
                        viewid: AppViews.__manageFormGroup__.viewOptions.id
                    },
                    {
                        label: AppViews.__editquickview__.viewOptions.label,
                        viewid: AppViews.__editquickview__.viewOptions.id
                    },
                    {
                        label: AppViews.__manageIndexes__.viewOptions.label,
                        viewid: AppViews.__manageIndexes__.viewOptions.id
                    },
                    {
                        label: AppViews.__filterspace__.viewOptions.label,
                        viewid: AppViews.__filterspace__.viewOptions.id
                    },
                    {
                        label: AppViews.__series__.viewOptions.label,
                        viewid: AppViews.__series__.viewOptions.id
                    },
                    {
                        label: AppViews.__setfield__.viewOptions.label,
                        function: "Porting.repopulateSetFields",
                        type: "invoke",
                        fields: AppViews.__setfield__.viewOptions.fields
                    },
                    {
                        label: AppViews.__commit__.viewOptions.label,
                        function: "Commit.commit",
                        type: "invoke",
                        fields: AppViews.__commit__.viewOptions.fields,
                        async: true
                    },
                    {
                        label: AppViews.__ensureindexes__.viewOptions.label,
                        function: "Porting.ensureIndexes",
                        type: "invoke",
                        fields: AppViews.__ensureindexes__.viewOptions.fields
                    },
                    {
                        label: AppViews.__edittemplates__.viewOptions.label,
                        viewid: AppViews.__edittemplates__.viewOptions.id
                    }
                ],
                menuClass: '',
                class: 'app-menu-setting ',
                displayField: "label",
                hideOnClick: true,
                onClick: 'onViewControlOptionClick'
            };
            $scope.adOptions = adOptions;
        } else if (ui == "aggregate") {
            var aggregateOptions = {
                quickViewMenuGroup: quickViewMenuGroup
            };
            viewOptions.viewTemplate = "<div class='' ng-controller='plAggregateCtrl' pl-aggregate-view></div>";
            $scope.aggregateOptions = viewOptions;
            $scope.aggregateOptions.openV = "openV";
            $scope.aggregateOptions.closeV = "closeView";
            $scope.aggregateOptions.resizeV = "resizeView";
            $scope.aggregateOptions.popUpV = "openPopUpView";
            $scope.aggregateOptions.getV = "getWorkbenchView";
            $scope.aggregateOptions.onViewControl = 'onViewControl';
        } else if (ui === "composite") {

            var filterColumns = [];
            getHeaderActionFilter(filterColumns, viewOptions.actions, viewOptions);
            $scope.populateFilterInfo(viewOptions.filterInfo, filterColumns);

            var compositeViewOptions = {
                parentParameters: viewOptions.parentParameters,
                watchParentParameter: viewOptions.watchParentParameter,
                provideParentParameter: viewOptions.provideParentParameter,
                viewClass: viewOptions.viewClass,
                parentSharedOptions: viewOptions.parentSharedOptions,
                viewIndex: viewOptions.viewIndex,
                showFilterInLeft: viewOptions.showFilterInLeft,
                addUserPreference: viewOptions.addUserPreference !== undefined ? viewOptions.addUserPreference : true,
                alertMessageOptions: viewOptions.alertMessageOptions,
                busyMessageOptions: viewOptions.busyMessageOptions,
                confirmMessageOptions: viewOptions.confirmMessageOptions,
                close: viewOptions.close !== undefined ? viewOptions.close : false,
                closeV: viewOptions.closeV,
                edit: viewOptions.edit !== undefined ? viewOptions.edit : true,
                filterColumns: filterColumns,
                filterInfo: viewOptions.filterInfo || [],
                groupColumns: groupColumns,
                groupInfo: viewOptions.groupInfo || [],
                headerTemplate: viewOptions.headerTemplate,
                label: viewOptions.label,
                lastSelectedInfo: viewOptions.lastSelectedInfo,
                $parameters: viewOptions.$parameters,
                navigation: viewOptions.navigation,
                openV: viewOptions.openV,
                popup: viewOptions.popup,
                quickViewMenuGroup: viewOptions.quickViewMenuGroup,
                refresh: viewOptions.refresh,
                viewResize: viewOptions.viewResize,
                showLabel: viewOptions.showLabel,
                sharedOptions: viewOptions.sharedOptions,
                shortMessageOptions: viewOptions.shortMessageOptions,
                showSelectionCheckbox: viewOptions.showSelectionCheckbox !== undefined ? viewOptions.showSelectionCheckbox : true,
                sortInfo: viewOptions.sortInfo || [],
                toolbar: viewOptions.toolbar !== undefined ? viewOptions.toolbar : true,
                userPreferenceOptions: viewOptions.userPreferenceOptions,
                warningOptions: viewOptions.warningOptions,
                primaryFieldInfo: primaryFieldInfo,
                handleFieldDragChanges: "handleFieldDragChanges"
            }
            if (viewOptions.views) {
                compositeViewOptions.views = viewOptions.views;
            }
            $scope.$watch("compositeViewOptions.sharedOptions.closed", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    $scope.closePLView();
                }
            }, true);
            $scope.compositeViewOptions = compositeViewOptions;
            $scope.compositeViewOptions.openV = "openV";
            $scope.compositeViewOptions.closeV = "closeView";
            $scope.compositeViewOptions.resizeV = "resizeView";
            $scope.compositeViewOptions.getV = "getWorkbenchView";
            $scope.compositeViewOptions.onViewControl = 'onViewControl';
            $scope.compositeViewOptions.viewControl = viewOptions.viewControl !== undefined ? viewOptions.viewControl : true;
            if (!$scope.workbenchOptions.developmentRight) {
                $scope.compositeViewOptions.viewControl = false;
            }
            $scope.compositeViewOptions.viewControlOptions = {
                menus: [
                    {
                        label: AppViews.__selfquickview__.viewOptions.label,
                        viewid: AppViews.__selfquickview__.viewOptions.id
                    },
                    {
                        label: AppViews.__editquickview__.viewOptions.label,
                        viewid: AppViews.__editquickview__.viewOptions.id
                    },
                    {
                        label: AppViews.__editaction__.viewOptions.label,
                        viewid: AppViews.__editaction__.viewOptions.id
                    },
                    {
                        label: AppViews.__managetrigger__.viewOptions.label,
                        viewid: AppViews.__managetrigger__.viewOptions.id
                    },
                    {
                        label: AppViews.__commit__.viewOptions.label,
                        function: "Commit.commit",
                        type: "invoke",
                        fields: AppViews.__commit__.viewOptions.fields,
                        async: true
                    }
                ],
                menuClass: '',
                class: 'app-menu-setting ',
                displayField: "label",
                hideOnClick: true,
                onClick: 'onViewControlOptionClick'
            };
            $scope.view.viewOptions.viewTemplate = "<div pl-composite-view='compositeViewOptions' ng-controller='pl-composite-ctrl'></div>";
        }
        $scope.$on('$destroy', function ($event) {
            //require in case of confirming saving using warning options -- Rajit garg 30-mar-2015
            if ($scope.workbenchOptions && $scope.workbenchOptions.warningOptions && $scope.workbenchOptions.warningOptions.confirmFunction && $scope.view && $scope.view.viewOptions && $scope.view.viewOptions.confirmFunction && $scope.workbenchOptions.warningOptions.confirmFunction === $scope.view.viewOptions.confirmFunction) {
                delete $scope.workbenchOptions.warningOptions.confirmFunction;
            }
            if ($scope.view && $scope.view.viewOptions && $scope.view.viewOptions.confirmFunction) {
                delete $scope.view.viewOptions.confirmFunction;
            }
            for (var key in unwatcher) {
                unwatcher[key]();
            }
            dataModel.cleanDataModel();
            dataModel = null;
            delete $scope.view.viewOptions;
            delete $scope.gridOptions;
            if ($scope.compositeViewOptions) {
                delete $scope.compositeViewOptions;
            }
            delete $scope.data;
            delete $scope.view;
        });
    }
    catch
        (e) {
        if ($scope.handleClientError) {
            $scope.handleClientError(e);
        }
    }

})
;

pl.directive('plView', ["$compile", "$timeout", function ($compile, $timeout) {
    return {
        restrict: "A",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var template = "<div class='app-busy-message-container-true' ng-show='view.viewOptions.backgroundOptions.msg'>" +
                        "               <div class='app-background-message' >" +
                        "                   <img ng-src='{{view.viewOptions.backgroundOptions.msg}}' class='pl-grid-refresh-box' />" +
                        "               </div>" +
                        "           </div>";
                    template += $scope.view.viewOptions.viewTemplate;
                    if ($scope.view.viewOptions.style && $scope.view.viewOptions.style.left == '65%') {
                        $scope.view.viewOptions.viewClass = 'pl-sub-view';
                    }
                    iElement.append($compile(template)($scope));
                    $timeout(function () {
                        if ($scope.view && $scope.view.viewOptions && $scope.view.viewOptions.dataError) {
                            if ($scope.view.viewOptions.dataError.businessLogicError) {
                                $scope.view.viewOptions.warningOptions.error = new BusinessLogicError($scope.view.viewOptions.dataError.message);
                            } else {
                                $scope.view.viewOptions.warningOptions.error = new Error($scope.view.viewOptions.dataError.message);
                            }
                        } else if ($scope.view && $scope.view.viewOptions && $scope.view.viewOptions.viewRenderError) {
                            $scope.view.viewOptions.warningOptions.error = new BusinessLogicError($scope.view.viewOptions.viewRenderError);
                        }
                    }, 1000);
                }
            };
        }
    }
}]);

/*requirejs starts from here*/
var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.1.11',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        ap = Array.prototype,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
    //PS3 indicates loaded and complete, but need to wait for complete
    //specifically. Sequence is 'loading', 'loaded', execution,
    // then 'complete'. The UA check is unfortunate, but not sure how
    //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
            /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
    //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value === 'object' && value &&
                        !isArray(value) && !isFunction(value) &&
                        !(value instanceof RegExp)) {

                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    function defaultOnError(err) {
        throw err;
    }

    //Allow getting a global that is expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite and existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds:7,
                baseUrl:'./',
                paths:{},
                bundles:{},
                pkgs:{},
                shim:{},
                config:{}
            },
            registry = {},
        //registry of just enabled modules, to speed
        //cycle breaking code when lots of modules
        //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            bundlesMap = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part, length = ary.length;
            for (i = 0; i < length; i++) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                        //End of the line. Keep at least one non-dot
                        //path segment at the front so it can be mapped
                        //correctly to disk. Otherwise, there is likely
                        //no path mapping for a path starting with '..'.
                        //This can still fail, but catches the most reasonable
                        //uses of ..
                        break;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
                foundMap, foundI, foundStarMap, starI,
                baseParts = baseName && baseName.split('/'),
                normalizedBaseParts = baseParts,
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name && name.charAt(0) === '.') {
                //If have a base name, try to normalize against it,
                //otherwise, assume it is a top-level require that will
                //be relative to baseUrl in the end.
                if (baseName) {
                    //Convert baseName to array, and lop off the last part,
                    //so that . matches that 'directory' and not name of the baseName's
                    //module. For instance, baseName of 'one/two/three', maps to
                    //'one/two/three.js', but we want the directory, 'one/two' for
                    //this normalization.
                    normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    name = name.split('/');
                    lastIndex = name.length - 1;

                    // If wanting node ID compatibility, strip .js from end
                    // of IDs. Have to do this here, and not in nameToUrl
                    // because node allows either .js or non .js to map
                    // to same file.
                    if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                        name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                    }

                    name = normalizedBaseParts.concat(name);
                    trimDots(name);
                    name = name.join('/');
                } else if (name.indexOf('./') === 0) {
                    // No baseName, so this is ID is resolved relative
                    // to baseUrl, pull off the leading dot.
                    name = name.substring(2);
                }
            }

            //Apply map config if available.
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');

                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break outerLoop;
                                }
                            }
                        }
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            // If the name points to a package's name, use
            // the package main instead.
            pkgMain = getOwn(config.pkgs, name);

            return pkgMain ? pkgMain : name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                        scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);
                context.require([id]);
                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        normalizedName = normalize(name, parentName, applyMap);
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                '_unnormalized' + (unnormalizedCounter += 1) :
                '';

            return {
                prefix:prefix,
                name:normalizedName,
                parentMap:parentModuleMap,
                unnormalized:!!suffix,
                url:url,
                originalName:originalName,
                isDefine:isDefine,
                id:(prefix ?
                    prefix + '!' + normalizedName :
                    normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                    fn(mod.error);
                } else {
                    mod.on(name, fn);
                }
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                //Array splice in the values since the context code has a
                //local var ref to defQueue, so cannot just reassign the one
                //on context.
                apsp.apply(defQueue,
                    [defQueue.length, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        handlers = {
            'require':function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports':function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return (defined[mod.map.id] = mod.exports);
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module':function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id:mod.map.id,
                        uri:mod.map.url,
                        config:function () {
                            return  getOwn(config.config, mod.map.id) || {};
                        },
                        exports:mod.exports || (mod.exports = {})
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
            //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function (mod) {
                var map = mod.map,
                    modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
             this.depMaps = [],
             this.enabled, this.fetched
             */
        };

        Module.prototype = {
            init:function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep:function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch:function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback:true
                    })(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load:function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check:function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    this.fetch();
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error. However,
                            //only do it for define()'d  modules. require
                            //errbacks should not be called for failures in
                            //their callbacks (#699). However if a global
                            //onError is set, use that.
                            if ((this.events.error && this.map.isDefine) ||
                                req.onError !== defaultOnError) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            // Favor return value over exports. If node/cjs in play,
                            // then will not have a return value anyway. Favor
                            // module.exports assignment over exports object.
                            if (this.map.isDefine && exports === undefined) {
                                cjsModule = this.module;
                                if (cjsModule) {
                                    exports = cjsModule.exports;
                                } else if (this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                err.requireType = this.map.isDefine ? 'define' : 'require';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin:function () {
                var map = this.map,
                    id = map.id,
                //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        bundleId = getOwn(bundlesMap, this.map.id),
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback:true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                            this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.init([], function () {
                                    return value;
                                }, null, {
                                    enabled:true,
                                    ignore:true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    //If a paths config, then just load that file instead to
                    //resolve the plugin, as it is built into that paths layer.
                    if (bundleId) {
                        this.map.url = context.nameToUrl(bundleId);
                        this.load();
                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () {
                            return value;
                        }, null, {
                            enabled:true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                    'fromText eval for ' + id +
                                    ' failed: ' + e,
                                e,
                                [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable:function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                            (this.map.isDefine ? this.map : this.map.parentMap),
                            false,
                            !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', bind(this, this.errback));
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on:function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit:function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node:node,
                id:node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
        }

        context = {
            config:config,
            contextName:contextName,
            registry:registry,
            defined:defined,
            urlFetched:urlFetched,
            defQueue:defQueue,
            Module:Module,
            makeModuleMap:makeModuleMap,
            nextTick:req.nextTick,
            onError:onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure:function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                //Save off the paths since they require special processing,
                //they are additive.
                var shim = config.shim,
                    objs = {
                        paths:true,
                        bundles:true,
                        config:true,
                        map:true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (!config[prop]) {
                            config[prop] = {};
                        }
                        mixin(config[prop], value, true, true);
                    } else {
                        config[prop] = value;
                    }
                });

                //Reverse map the bundles
                if (cfg.bundles) {
                    eachProp(cfg.bundles, function (value, prop) {
                        each(value, function (v) {
                            if (v !== prop) {
                                bundlesMap[v] = prop;
                            }
                        });
                    });
                }

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps:value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location, name;

                        pkgObj = typeof pkgObj === 'string' ? { name:pkgObj } : pkgObj;

                        name = pkgObj.name;
                        location = pkgObj.location;
                        if (location) {
                            config.paths[name] = pkgObj.location;
                        }

                        //Save pointer to main module ID for pkg name.
                        //Remove leading dot in main, so main paths are normalized,
                        //and remove any trailing .js, since different package
                        //envs have different conventions: some use a module name,
                        //some use a file name.
                        config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
                            .replace(currDirRegExp, '')
                            .replace(jsSuffixRegExp, '');
                    });
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports:function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }

                return fn;
            },

            makeRequire:function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                id +
                                '" has not been loaded yet for context: ' +
                                contextName +
                                (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled:true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser:isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl:function (moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                                relMap && relMap.id, true), ext, true);
                    },

                    defined:function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified:function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function (args, i) {
                            if (args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overridden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable:function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad:function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                    'No define call for ' + moduleName,
                                null,
                                [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl:function (moduleName, ext, skipExt) {
                var paths, syms, i, parentModule, url,
                    parentPath, bundleId,
                    pkgMain = getOwn(config.pkgs, moduleName);

                if (pkgMain) {
                    moduleName = pkgMain;
                }

                bundleId = getOwn(bundlesMap, moduleName);

                if (bundleId) {
                    return context.nameToUrl(bundleId, ext, skipExt);
                }

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');

                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/^data\:|\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                    ((url.indexOf('?') === -1 ? '?' : '&') +
                        config.urlArgs) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load:function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb:function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad:function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                    (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError:function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError('scripterror', 'Script error for: ' + data.id, evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) {
        fn();
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts:contexts,
        newContext:newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = defaultOnError;

    /**
     * Creates the node for the load command. Only used in browser envs.
     */
    req.createNode = function (config, moduleName, url) {
        var node = config.xhtml ?
            document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
            document.createElement('script');
        node.type = config.scriptType || 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        return node;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = req.createNode(config, moduleName, url);

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                //Check if node.attachEvent is artificially added by custom script or
                //natively supported by browser
                //read https://github.com/jrburke/requirejs/issues/187
                //if we can NOT find [native code] then it must NOT natively supported.
                //in IE8, node.attachEvent does not have toString()
                //Note the test for "[native code" with no closing brace, see:
                //https://github.com/jrburke/requirejs/issues/273
                !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation that a build has been done so that
                //only one script needs to be loaded anyway. This may need to be
                //reevaluated if other use cases become common.
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                context.onError(makeError('importscripts',
                        'importScripts failed for ' +
                        moduleName + ' at ' + url,
                    e,
                    [moduleName]));
            }
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser && !cfg.skipDataMain) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Preserve dataMain in case it is a path (i.e. contains '?')
                mainScript = dataMain;

                //Set final baseUrl if there is not already an explicit one.
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = mainScript.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/') + '/' : './';

                    cfg.baseUrl = subPath;
                }

                //Strip off any trailing .js since mainScript is now
                //like a module name.
                mainScript = mainScript.replace(jsSuffixRegExp, '');

                //If mainScript is still a path, fall back to dataMain
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain;
                }

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = null;
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps && isFunction(callback)) {
            deps = [];
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, '')
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
    };

    define.amd = {
        jQuery:true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));