var Constants = require("./Constants.js");
var ApplaneDBConstants = require("ApplaneDB/lib/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var Role = require("ApplaneDB/lib/modules/Role.js");

var v = require("./view.js");
exports.getUserState = function (reqState, db, options) {
    var user = db.user;
    if (!user) {
        throw new Error("User not found in getUserState");
    }
    var userStateResult = {};
    var queryUserInfo = undefined;
    var selectedApplication = undefined;
    var defaultMenuId = undefined;
    return db.getAdminDB().then(
        function (adminDb) {
            return  adminDb.query({$collection: "pl.dbs", $filter: {db: db.db.databaseName}, $fields: {orgName: 1, developmentRight: 1, shortIcon: 1, longIcon: 1}});
        }).then(
        function (result) {
            if (result && result.result.length > 0) {
                userStateResult.developmentRight = result.result[0].developmentRight;
                userStateResult.dbShortIcon = result.result[0].shortIcon;
                userStateResult.dbLongIcon = result.result[0].longIcon;
                userStateResult.orgName = result.result[0].orgName || db.db.databaseName;
                if (userStateResult.orgName) {
                    userStateResult.showOrgName = true;
                }
            } else {
                userStateResult.developmentRight = false;
            }
            if (reqState.setup) {
                return updateUserSetupViews(reqState, db);
            }
        }).then(function () {
            return getUserState(db);
        })
        .then(
        function (userInfoResult) {
            if (userInfoResult.result.length == 0) {
                throw new Error("User not found while getting userInfo in getUserState");
                return;
            }
            queryUserInfo = userInfoResult.result[0];
            var userInfo = {_id: user._id, username: user.username, emailid: queryUserInfo.emailid, admin: queryUserInfo.admin, showRenderTime: queryUserInfo.showRenderTime, fullname: queryUserInfo.fullname, image: queryUserInfo.image, developer: queryUserInfo.developer, mobile_no: queryUserInfo.mobile_no, verificationStatus: queryUserInfo.verificationStatus, appcenterDeveloper: queryUserInfo.appcenterDeveloper};
            if (userStateResult.developmentRight) {
                userStateResult.developmentRight = userInfo.developer;   //override developmentRight with user.developer , use case for sixcontinent, some user need to entry test data in sandbox, so they should not have developmentRight
            }
            userStateResult.user = userInfo;
            userStateResult.setupViews = queryUserInfo.setupViews;
            userStateResult.setupStatus = queryUserInfo.setupStatus;
            userStateResult.googleServicesInfo = {mailtrackenabled: queryUserInfo.mailtrackenabled, googleRefreshToken: queryUserInfo.googleRefreshToken, calenderenabled: queryUserInfo.calenderenabled};
            return populateAttachedFilterSpace(userStateResult, queryUserInfo.filterspace, reqState, db);
        }).then(
        function () {
            if (queryUserInfo.verificationStatus === "pending") {
                return;
            } else {
                return userStateInner({queryUserInfo: queryUserInfo, userStateResult: userStateResult, reqState: reqState, db: db, options: options});
            }
        }).then(
        function () {
            return userStateResult;
        })
}

function userStateInner(params) {
    var userStateResult = params.userStateResult;
    var queryUserInfo = params.queryUserInfo;
    var selectedApplication = undefined;
    var defaultMenuId = undefined;
    var reqState = params.reqState;
    var options = params.options;
    var db = params.db;
    return getApplications(queryUserInfo.roles, reqState, db).then(
        function (applications) {
            if (!applications || applications.length == 0) {
                return;
            }
            userStateResult.applications = applications;
            return Role.resolveApplicationsMenusAsRole(userStateResult.applications, db.userRoles);
        }).then(
        function () {
            if (userStateResult.applications && userStateResult.applications.length > 0) {
                if (reqState.pathId) {
                    var selectedMenuIds = [];
                    var uris = Utils.deepClone(reqState.pathId);
                    getSlectedMenuId(userStateResult.applications, uris, selectedMenuIds);
                    if (selectedMenuIds.length > 2) {
                        reqState.selectedApplication = selectedMenuIds[0][reqState.pathId[0]];
                        if (selectedMenuIds[selectedMenuIds.length - 1].isQuickView) {
                            reqState.selectedMenu = selectedMenuIds[selectedMenuIds.length - 2][reqState.pathId[selectedMenuIds.length - 2]];
                            reqState.selectedQView = selectedMenuIds[selectedMenuIds.length - 1][reqState.pathId[selectedMenuIds.length - 1]];
                        }
                    }
                }
                selectedApplication = reqState.selectedApplication;
                if (!selectedApplication && queryUserInfo.state && queryUserInfo.state.selectedapplication) {
                    selectedApplication = queryUserInfo.state.selectedapplication;
                }
                var selectedApplicationInfo = getSelectedApplication(selectedApplication, userStateResult.applications);
                var context = selectedApplicationInfo.$context;
                //set application context at db level.
                if (context) {
                    db.setContext(context);
                }
                if (selectedApplicationInfo && selectedApplicationInfo[ApplaneDBConstants.Admin.Applications.DEFAULT_MENU] && selectedApplicationInfo[ApplaneDBConstants.Admin.Applications.DEFAULT_MENU]["_id"]) {
                    defaultMenuId = selectedApplicationInfo[ApplaneDBConstants.Admin.Applications.DEFAULT_MENU]["_id"].toString();
                }
                userStateResult.selectedApplication = selectedApplicationInfo._id.toString();
                return selectedApplicationInfo.menus;
            }
        }).then(
        function (menus) {
            if (!menus || menus.length == 0) {
                return;
            }
            var selectedMenu = reqState.selectedMenu;
            var selectedQView = reqState.selectedQView;
            var selectedAppInfoInUserState = selectedApplication && queryUserInfo.state && queryUserInfo.state.applications ? queryUserInfo.state.applications[selectedApplication] : undefined;
            if (selectedAppInfoInUserState) {
                selectedMenu = selectedMenu || selectedAppInfoInUserState.menu;
            }
            selectedMenu = selectedMenu || defaultMenuId;
            var selectedMenuResult = getSelectedMenuInfo(menus, selectedMenu);
            if (!selectedMenuResult) {
                return;
            }
            var selectedMenuInfoInUserState = selectedMenu && queryUserInfo.state && queryUserInfo.state.menus ? queryUserInfo.state.menus[selectedMenu] : undefined;
            if (selectedMenuInfoInUserState) {
                selectedQView = selectedQView || selectedMenuInfoInUserState.qview;
            }
            userStateResult.selectedMenu = selectedMenuResult._id.toString();
            return populateMenu(selectedMenuResult, selectedQView, userStateResult, db);
        })
}

function populateAttachedFilterSpace(userState, filterSpaceStateInfo, parameters, db) {
    return db.query({$collection: "pl.attachedfilterspace", $sort: {index: 1}}).then(function (attachedFilterSpaces) {
        attachedFilterSpaces = attachedFilterSpaces.result;
        if (attachedFilterSpaces.length === 0) {
            return;
        }
        var userFilters = [];
        var filterSpaceUpdates = {};
        var filterSpaceSelectedValues = {};
        var userFilter = parameters ? parameters.userFilter : undefined;
        return Utils.iterateArrayWithPromise(attachedFilterSpaces,
            function (index, attachedFilterSpace) {
                return saveFilterSpaceState(userFilter, attachedFilterSpace, filterSpaceStateInfo, filterSpaceUpdates, db).then(function (selectedFilterValue) {
                    var field = attachedFilterSpace.field;
                    var filterSpaceId = attachedFilterSpace.filterSpaceId;
                    var allValue = {_id: "__all__"};
                    allValue[field] = "All";
                    if (!selectedFilterValue && attachedFilterSpace.nullAllowed) {
                        selectedFilterValue = allValue;
                    }
                    if (!selectedFilterValue) {
                        return;
                    }
                    if (selectedFilterValue._id !== "__all__") {
                        filterSpaceSelectedValues[filterSpaceId] = selectedFilterValue;
                    }
                    var query = {$collection: attachedFilterSpace.collection, $fields: {}, $sort: {}};
                    query.$fields[field] = 1;
                    query.$sort[field] = 1;
                    var queryFilter = attachedFilterSpace.queryFilter;
                    if (queryFilter) {
                        queryFilter = JSON.parse(queryFilter);
                        query.$filter = queryFilter;
                        query.$parameters = filterSpaceSelectedValues;
                    }
                    return db.query(query).then(function (filterSpaces) {
                        filterSpaces = filterSpaces.result;
                        if (filterSpaces.length > 0) {
                            if (attachedFilterSpace.nullAllowed) {
                                filterSpaces.splice(0, 0, allValue);
                            }
                            for (var i = 0; i < filterSpaces.length; i++) {
                                var filterSpace = filterSpaces[i];
                                filterSpace.__filterSpaceId = filterSpaceId;
                            }
                            var userFilter = {label: attachedFilterSpace.label, displayField: field, parentfilterspace: attachedFilterSpace.parentfilterspace, filterSpaceId: filterSpaceId};
                            if (attachedFilterSpace.recursiveFilter) {
                                userFilter.recursiveFilter = true;
//                            userFilter.recursiveFilterValue  =false;
                                userFilter.recursiveFilterField = attachedFilterSpace.recursiveFilterField;
                                userFilter.collection = attachedFilterSpace.collection;
                                userFilter.recursionClick = 'onRecursiveClick';
                                userFilter.selectedValue = selectedFilterValue;
                                if (selectedFilterValue && selectedFilterValue.recursiveFilterValue) {
                                    userFilter.recursiveFilterValue = selectedFilterValue.recursiveFilterValue;
                                }

                            }

                            userFilter[field] = selectedFilterValue[field];
                            userFilter.menus = filterSpaces;
                            userFilters.push(userFilter);
                        }
                    })
                })
            }).then(
            function () {
                if (Object.keys(filterSpaceUpdates).length > 0) {
                    filterSpaceUpdates.$query = {_id: db.user._id};
                    return db.mongoUpdate({$collection: "pl.users", $update: filterSpaceUpdates});
                }
            }).then(function () {
                if (userFilters.length > 0) {
                    userState.userFilters = userFilters;
                    userState.showOrgName = false;
                }
            })
    })
}

function saveFilterSpaceState(userFilter, attachedFilterSpace, filterSpaceStateInfo, filterSpaceUpdates, db) {
    var D = Q.defer();
    var filterSpaceId = attachedFilterSpace.filterSpaceId;
    var field = attachedFilterSpace.field;
    if (userFilter && userFilter[filterSpaceId]) {
        var filterValue = userFilter[filterSpaceId];
        updateFilterSpaceInState(filterSpaceUpdates, filterSpaceId, filterValue._id === "__all__" ? undefined : filterValue);
        D.resolve(filterValue);
    } else if (filterSpaceStateInfo && filterSpaceStateInfo[filterSpaceId]) {
        var filterInfo = JSON.parse(filterSpaceStateInfo[filterSpaceId].filter.filterInfo);
        D.resolve(filterInfo ? filterInfo[filterInfo.field] : undefined);
    } else if (attachedFilterSpace.nullAllowed) {
        D.resolve();
    } else {
        var defaultFilter = attachedFilterSpace.defaultFilter;
        if (defaultFilter) {
            defaultFilter = JSON.parse(defaultFilter);
        }
        if (attachedFilterSpace.collection) {
            var query = {$collection: attachedFilterSpace.collection, $fields: {}, $sort: {}, $limit: 1};
            query.$fields[field] = 1;
            query.$sort[field] = 1;
            query.$filter = defaultFilter;
            db.query(query).then(
                function (result) {
                    var filterValue = result.result.length === 0 ? undefined : result.result[0];
                    updateFilterSpaceInState(filterSpaceUpdates, filterSpaceId, filterValue);
                    D.resolve(filterValue);
                }).fail(function (err) {
                    D.reject(err);
                })
        } else {
            D.resolve();
        }
    }
    return D.promise;
}

function updateFilterSpaceInState(updates, filterSpaceId, filterValue) {
    if (filterValue) {
        updates.$set = updates.$set || {};
        updates.$set["filterspace." + filterSpaceId] = getFilterSpaceState(filterSpaceId, filterValue);
    } else {
        updates.$unset = updates.$unset || {};
        updates.$unset["filterspace." + filterSpaceId] = "";
    }
}

function getFilterSpaceState(filterSpaceId, filterValue) {
    var filterInfo = {};
    filterInfo.field = filterSpaceId;
    filterInfo.ui = "autocomplete";
    filterInfo.filterspace = filterSpaceId;
    filterInfo.__selected__ = true;
    filterInfo.filter = {};
    filterInfo.filterOperators = {label: "=="}; //TODO.

    if (filterValue) {
        filterInfo.filter[filterSpaceId] = filterValue._id;
        filterInfo[filterSpaceId] = filterValue;
        if (filterValue.recursiveFilterValue) {
            filterInfo.filterOperators = {label: ".."}
            filterInfo.filter[filterSpaceId] = {"$in": {"$$getRecursive": {key: filterValue._id, recursiveCollection: filterValue.collection, recursiveField: filterValue.recursiveFilterField}}};

        }
    }

    return {filter: {filterInfo: JSON.stringify(filterInfo)}};
}

function populateMenu(selectedMenuResult, selectedQView, result, db) {
    return getQViews(selectedMenuResult).then(
        function (qViews) {
            if (!qViews || qViews.length == 0) {
                return;
            }
            populateMenuId(qViews, selectedMenuResult);
            Role.populateQviewsAsRole(db.userRoles, selectedMenuResult[Constants.Menus.COLLECTION], qViews, db);
            result.qviews = qViews;
            var defaultQView = selectedMenuResult[Constants.Menus.DEFAULT_QVIEW_ID] ? selectedMenuResult[Constants.Menus.DEFAULT_QVIEW_ID][Constants.QViews.ID] : undefined;
            var selectedQViewInfo = getSelectedQView(selectedQView, defaultQView, qViews);
            if (!selectedQViewInfo) {
                return;
            }
            result.selectedQView = selectedQViewInfo._id.toString();
            var viewOptions = {id: selectedQViewInfo.id, ui: selectedQViewInfo.ui, selectedApplication: result.selectedApplication, selectedMenu: result.selectedMenu, sourceid: result.selectedQView};
            // if the setupStatus is not defined or not equal to completed user has to complete the setup first before continuing// manjeet (14-may-2015)
            var setupStatus = result.setupStatus;
            if ((!setupStatus) || (setupStatus === "completed")) {
                return v.getView(viewOptions, db);
            } else {
                var setupView = getSetupView(result.setupViews);
                if (setupView) {
                    result.setupView = {_id: setupView._id, label: setupView.label};
                    var vOptions = {id: setupView.view};
                    if (setupView.ui) {
                        vOptions.ui = setupView.ui;
                    }
                    if (setupView.limit !== undefined) {
                        vOptions.$limit = setupView.limit;
                    }
                    return v.getView(vOptions, db);
                }
            }
        }).then(
        function (viewResult) {
            if (!viewResult) {
                return;
            }
            result.views = [viewResult];
        })
}


function getSlectedMenuId(menus, uris, selectedMenu, isQview) {
    if (menus == undefined || uris == undefined || selectedMenu == undefined) {
        return;
    }
    for (var i = 0; i < menus.length; i++) {
        var menu = menus[i];
        if (uris && uris.length > 0 && uris[0] == menu.uri) {
            var selected = {};
            if (isQview) {
                selected[menu.uri] = menu.id;
                selected.isQuickView = true;
            } else {
                selected[menu.uri] = menu._id.toString();
            }
            selectedMenu.push(selected);
            uris.splice(0, 1);
            if (menu.menus) {
                getSlectedMenuId(menu.menus, uris, selectedMenu);
            } else if (menu.qviews && menu.qviews.length > 0) {
                getSlectedMenuId(menu.qviews, uris, selectedMenu, true);
            }
            break;
        }
    }
}

function getApplications(roles, params, db) {
    return Role.resolveGroupRoles(roles, db).then(function (resolvedRoles) {
        if (!resolvedRoles || resolvedRoles.length == 0) {
            return;
        }
        var roleIds = [];
        var applicationIds = [];
        for (var i = 0; i < resolvedRoles.length; i++) {
            var role = resolvedRoles[i];
            if (role.role) {
                var roleId = role.role[ApplaneDBConstants.Query._ID];
                roleIds.push(roleId);
                var applicationId = role.appid;
                if (applicationId && applicationIds.indexOf(applicationId) === -1) {
                    applicationIds.push(applicationId);
                }
            }
        }
        var menuQuery = {
            $collection: Constants.Menus.TABLE,
            $filter: {parentmenu: null},
            $sort: {index: 1},
            $recursion: {
                parentmenu: "_id",
                $alias: "menus"
            }
        };
        var appFilter = {};
        if (applicationIds.length > 0) {
            appFilter.id = {$in: applicationIds};
        } else {
            appFilter["roles.role._id"] = {$in: roleIds};
        }
        if (params && params.appLabel) {
            appFilter.label = params.appLabel;
        } else {
            appFilter.unpublished = {$in: [null, false]};
        }
        //use only applications if defined in role otherwise get applications from userroles
        var applicationQuery = {$collection: Constants.Applications.TABLE, $fields: {uri: 1, label: 1, index: 1, defaultmenu: 1, menus: {$type: "n-rows", $query: menuQuery, $fk: "application", $parent: "_id"}}, $filter: appFilter, $sort: {index: 1}, $modules: {Role: 0}};
        return db.query(applicationQuery).then(
            function (applications) {
                applications = applications.result;
                addContextInApplications(applications, resolvedRoles);
                return applications;
            })
    })


}

function addContextInApplications(applications, roles) {
    if (applications) {
        for (var i = 0; i < applications.length; i++) {
            var applicationId = applications[i].id;
            var index = Utils.isExists(roles, {appid: applicationId}, "appid");
            if (index !== undefined) {
                applications[i].$context = {__role__: roles[index].role.id}
            }
        }
    }
}

function getSelectedApplication(selectedApplication, applications) {
    if (selectedApplication) {
        for (var i = 0; i < applications.length; i++) {
            if (selectedApplication === applications[i]._id.toString()) {
                return applications[i];
            }
        }
    }
    return applications[0];
}

function getMenus(application, db) {
    var D = Q.defer();
    if (!application) {
        D.resolve();
        return D.promise;
    }
    var menuQuery = {
        $collection: Constants.Menus.TABLE,
        $fields: {label: 1, collection: 1, index: 1, defaultqview: 1, qviews: 1, parentmenu: 1 },
        $filter: {application: application._id, parentmenu: null},
        $sort: {index: 1},
        $recursion: {
            parentmenu: "_id",
            $alias: "menus"
        }
    }

    db.query(menuQuery).then(
        function (menuResult) {
            D.resolve(menuResult.result)
        }).fail(function (err) {
            D.reject(err);
        })
    return D.promise;
}

function getSelectedMenuInfo(menus, selectedMenu) {
    var firstSelectableMenu = getFirstSelectableMenu(menus, selectedMenu);
    if (selectedMenu && !firstSelectableMenu) {
        firstSelectableMenu = getFirstSelectableMenu(menus);
    }
    return firstSelectableMenu;
}

function getFirstSelectableMenu(menus, selectedMenu) {
    if (!menus || menus.length == 0) {
        return undefined;
    }
    for (var i = 0; i < menus.length; i++) {
        var menu = menus[i];
        if (selectedMenu) {
            if (menu._id.toString() === selectedMenu) {
                return menu;
            }
        } else if (menu.collection) {
            return menu;
        }
        if (menu.menus) {
            var selectableMenu = getFirstSelectableMenu(menu.menus, selectedMenu);
            if (selectableMenu) {
                return selectableMenu;
            }
        }
    }
}

function getQViews(menu) {
    var D = Q.defer();
    if (!menu || !menu[Constants.Menus.COLLECTION]) {
        D.resolve();
    } else {
        var qviews = menu[Constants.Menus.QVIEWS];
        if (qviews) {
            for (var i = 0; i < qviews.length; i++) {
                qviews[i].sourceid = qviews[i]._id;
            }
        }
        D.resolve(qviews);
    }
    return D.promise;

}


function getSelectedQView(selectedQView, defaultQView, qViews) {
    if (!qViews || qViews.length == 0) {
        return;
    }
    var viewToSelect = selectedQView || defaultQView;
    if (!viewToSelect) {
        return qViews[0];
    }
    for (var i = 0; i < qViews.length; i++) {
        if (qViews[i].id.toString() === viewToSelect) {
            return qViews[i];
        }
    }
    if (selectedQView) {
        var requiredQView = getSelectedQView(undefined, defaultQView, qViews);
        if (requiredQView) {
            return requiredQView;
        }
    }
    if (defaultQView) {
        return getSelectedQView(undefined, undefined, qViews);
    }

}

exports.getMenuState = function (menuInfo, db, options) {
    var menuResult = {user: {_id: db.user._id}, selectedApplication: menuInfo.selectedApplication, selectedMenu: menuInfo._id};
    return getUserState(db).then(
        function (userstate) {
            var selectedQView = menuInfo.selectedQView || undefined;
            if (userstate && userstate.result && userstate.result.length > 0 && userstate.result[0].state && userstate.result[0].state.menus) {
                var menus = userstate.result[0].state.menus[menuInfo._id];
                if (selectedQView == undefined) {
                    selectedQView = menus ? menus["qview"] : undefined;
                }
            }
            return populateMenu(menuInfo, selectedQView, menuResult, db);
        }).then(function () {
            return menuResult;
        })
}


function getUserState(db) {
    var userInfoQuery = {$collection: ApplaneDBConstants.Admin.USERS, $fields: {"googleRefreshToken": 1, "mailtrackenabled": 1, "calenderenabled": 1, emailid: 1, roles: 1, state: 1, admin: 1, showRenderTime: 1, image: 1, fullname: 1, developer: 1, filterspace: 1, setupViews: 1, setupStatus: 1, "mobile_no": 1, verificationStatus: 1, appcenterDeveloper: 1}, $filter: {_id: db.user._id}, $modules: {"Role": 0}};
    return db.query(userInfoQuery);
}

function populateMenuId(qViews, selectedMenuResult) {
    var qViews = qViews || [];
    for (var i = 0; i < qViews.length; i++) {
        qViews[i].selectedMenu = selectedMenuResult._id;
    }
}

function updateUserSetupViews(params, userDb) {
    // first we will update that the user have completed a setup step and after that we will query and check that all the steps are verified or not and if all the steps are verified then we will mark the setupStatus as completed.
    return userDb.update([
        {$collection: "pl.users", $update: {_id: userDb.user._id, $set: {setupViews: {$update: [
            {_id: params.setupViewId, $set: {verified: true}}
        ]}, setupStatus: "inprogress"}}}
    ]).then(
        function () {
            return userDb.query({$collection: "pl.users", $filter: {_id: userDb.user._id}, $fields: {setupViews: 1}});
        }).then(function (userInfo) {
            if (userInfo && userInfo.result && userInfo.result.length > 0) {
                userInfo = userInfo.result[0];
                var setupViews = userInfo.setupViews;
                var found = false;
                if (setupViews && setupViews.length > 0) {
                    for (var i = 0; i < setupViews.length; i++) {
                        if (!setupViews[i].verified) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        return userDb.update({$collection: "pl.users", $update: {_id: userDb.user._id, $set: {setupStatus: "completed"}}});
                    }
                }
            }
        });
}
function getSetupView(setupViews) {
    if (setupViews && setupViews.length > 0) {
        Utils.sort(setupViews, "asc", "index");
        var setupView = undefined;
        for (var i = 0; i < setupViews.length; i++) {
            if (!setupViews[i].verified) {
                setupView = setupViews[i];
                break;
            }
        }
        return setupView;
    }
}