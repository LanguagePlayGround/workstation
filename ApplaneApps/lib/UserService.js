/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 4/8/13
 * Time: 2:27 PM
 * To change this template use File | Settings | File Templates.
 */

var RequestConstants = require("./RequestConstants.js");
var AppsStudioConstants = require("./AppsStudioConstants.js");
var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var ApplaneError = require("ApplaneCore/apputil/ApplaneError.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MetadataProvider = require("ApplaneBaas/lib/metadata/MetadataProvider.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var ViewService = require("./UiViewService.js");
var http = require('http');
var QueryString = require("querystring");
var UdtModule = require("ApplaneBaas/lib/modules/UDTModule.js");
var LogUtility = require("ApplaneBaas/lib/util/LogUtility.js");
var Utils = require("ApplaneCore/apputil/util.js");
var OptionsUtil = require("ApplaneBaas/lib/util/OptionsUtil.js");

exports.getUserState = function (parameters, options, callback1) {

    if (!options.disablelogs && !options.logid) {
        throw new Error("Neither disable log Nor Log id found in UserService while getView.");
    }

    var subLogIdId = LogUtility.startLog(options.logid, "UserService >>>> exports.getUserState");
    var callback = function (err, data) {
        LogUtility.endLog(options.logid, subLogIdId);
        callback1(err, data);
    }

    var user = options.user;
    if (!user || user.length == 0) {
        throw new ApplaneError(Constants.ErrorCode.SESSION_NOT_FOUND);
    }
    var state = parameters.state || {};
    var userState = {};
    userState[Constants.UserService.USER_ID] = user[QueryConstants.Query._ID];
    userState[Constants.UserService.USER_NAME] = user[Constants.Baas.Users.USERNAME];
    userState[Constants.UserService.EMAILID] = user[Constants.Baas.Users.EMAILID];
    userState[Constants.UserService.USER_GROUP] = user[Constants.Baas.Users.USERGROUPID];
    userState[Constants.UserService.LOGIN] = true;
    ViewService.getUserStates(options, ApplaneCallback(callback, function (userStateUpdates) {
        getApplicationsAsDeveloper(user[QueryConstants.Query._ID], options, ApplaneCallback(callback, function (applicationsAsDeveloper) {
            var globalOrganization = Constants.Baas.Organizations.GLOBAL_ORGANIZATION;
            MetadataProvider.getOrganization(globalOrganization.osk, options, ApplaneCallback(callback, function (orgInfo) {
                globalOrganization[QueryConstants.Query._ID] = orgInfo[QueryConstants.Query._ID];
                if (user[QueryConstants.Query._ID] == "3753ea9c9b35e86509eea0bf7212f667") {
                    globalOrganization.admin = true;
                }
                var userApplications = populateUserApplications(user, applicationsAsDeveloper, globalOrganization);
                if (!userApplications || userApplications.length == 0) {
                    callback(null, userState);
                    return;
                }
                var userOrganizations = [];
                var userOrganizationsObj = {};
                for (var i = 0; i < userApplications.length; i++) {
                    var userApplication = userApplications[i];
                    var userOrganizationsArray = userApplication[Constants.Baas.Users.Applications.ORGANIZATIONS] ? userApplication[Constants.Baas.Users.Applications.ORGANIZATIONS] : [globalOrganization];
                    userOrganizationsArray.forEach(function (userOrganization) {
                        var userOrganizationId = userOrganization[Constants.Baas.Organizations.ID];
                        var organization = userOrganizationsObj[userOrganizationId] ? userOrganizationsObj[userOrganizationId] : Utils.deepClone(userOrganization);
                        var organizationApplications = organization[Constants.Baas.Organizations.APPLICATIONS] ? organization[Constants.Baas.Organizations.APPLICATIONS] : [];
                        organizationApplications.push(userApplication);
                        organization[Constants.Baas.Organizations.APPLICATIONS] = organizationApplications;
                        userOrganizationsObj[userOrganizationId] = organization;
                    });
                }
                for (var id in userOrganizationsObj) {
                    userOrganizations.push(userOrganizationsObj[id]);
                }
                userState[Constants.UserService.ORGANIZATIONS] = userOrganizations;
                if (!state.organization) {
                    state.organization = userStateUpdates[Constants.Baas.Users.UserState.LAST_ORGANIZATION] || userOrganizations[0][QueryConstants.Query._ID];
                }
                var selectedOrganization = getSelectedOrganization(userOrganizations, state, userStateUpdates);
                userState[Constants.UserService.SELECTED_ORGANIZATIONID] = selectedOrganization[QueryConstants.Query._ID];
                var userOrganizationApplications = selectedOrganization[Constants.Baas.Organizations.APPLICATIONS];
                removeApplicationsFromOrganizations(userOrganizations);
                if (!userOrganizationApplications || userOrganizationApplications.length == 0) {
                    callback(null, userState);
                    return;
                }
                getApplicationInfos(userOrganizationApplications, options, ApplaneCallback(callback, function (applicationInfos) {
                    if (!applicationInfos || applicationInfos.length == 0) {
                        callback(null, userState);
                        return;
                    }
                    userState[Constants.UserService.APPLICATIONS] = applicationInfos;
                    var selectedApplicationId = getSelectedApplicationId(applicationInfos, state, userStateUpdates);
                    userState[Constants.UserService.SELECTED_APPLICATIONID] = selectedApplicationId;
                    var developer = false;
                    var admin = false;
                    if (selectedOrganization[Constants.Baas.Organizations.ID] == Constants.Baas.Organizations.GLOBAL_ORGANIZATION.id && isDeveloper(applicationsAsDeveloper, selectedApplicationId)) {
                        developer = true;
                        userState[Constants.UserService.DEVELOPER] = developer;
                    }
                    if (selectedOrganization.admin) {
                        admin = true;
                        userState[Constants.UserService.ORGANIZATION_ADMIN] = admin;
                    }
                    getApplicationMenus(selectedApplicationId, selectedOrganization[QueryConstants.Query._ID], developer, options, ApplaneCallback(callback, function (menus) {
                        userState[Constants.UserService.MENUS] = menus || [];
                        if (!menus || menus.length == 0) {
                            delete userStateUpdates[Constants.Baas.Users.UserState.APPLICATION_WISE_STATE];
                            ViewService.updateUserState(userStateUpdates, options, ApplaneCallback(callback, function () {
                                callback(null, userState);
                            }));
                            return;
                        }
                        var selectedMenuDetails = getSelectedMenu(menus, selectedApplicationId, userStateUpdates);
                        if (!selectedMenuDetails) {
                            callback(null, userState);
                            return;
                        }
                        var selectedMenu = selectedMenuDetails.menu;
                        userState[Constants.UserService.SELECTED_MENUID] = selectedMenu[QueryConstants.Query._ID];
                        var menuApplicationId = selectedMenu[AppsStudioConstants.UI_MENUS.APPLICATIONID];
                        var vParameters = {};
                        vParameters[RequestConstants.UIViews.DEVELOPER] = developer;
                        vParameters[RequestConstants.UIViews.ORGANIZATION_ADMIN] = admin;
                        vParameters[RequestConstants.UIViews.ASK] = menuApplicationId[Constants.Baas.Applications.ASK];
                        vParameters[RequestConstants.UIViews.OSK] = selectedOrganization[Constants.Baas.Organizations.OSK];
                        vParameters[RequestConstants.UIViews.VIEW_ID] = selectedMenuDetails.quickview;
                        vParameters[RequestConstants.UIViews.FILTER] = selectedMenu[AppsStudioConstants.UI_MENUS.FILTER] || {};
                        vParameters[RequestConstants.UIViews.PARAMETER_MAPPINGS] = selectedMenu[AppsStudioConstants.UI_MENUS.PARAMETER_MAPPINGS] || {};
                        vParameters[RequestConstants.UIViews.MENUID] = selectedMenu[QueryConstants.Query._ID];
                        vParameters[RequestConstants.UIViews.USER_STATE] = userStateUpdates;
                        vParameters[RequestConstants.UIViews.SOURCE] = selectedMenu[QueryConstants.Query._ID];

                        ViewService.getView(vParameters, options, function (err, view) {
                            if (err) {
                                userState.exception = err.stack;
                            } else {
                                userState[Constants.UserService.VIEW] = view;
                            }
                            callback(null, userState);
                        });
                    }))
                }));
            }))
        }))
    }))
}

function isDeveloper(applicationsAsDeveloper, selectedApplicationId) {
    if (applicationsAsDeveloper && applicationsAsDeveloper.length > 0) {
        for (var j = 0; j < applicationsAsDeveloper.length; j++) {
            var applicationAsDeveloper = applicationsAsDeveloper[j];
            if (applicationAsDeveloper[QueryConstants.Query._ID] == selectedApplicationId) {
                return true;
            }
        }
    }
}

function populateUserApplications(user, applicationsAsDeveloper, globalOrganization) {
    var userApplications = user[Constants.Baas.Users.APPLICATIONS] || [];
    if (applicationsAsDeveloper && applicationsAsDeveloper.length > 0) {
        for (var i = 0; i < applicationsAsDeveloper.length; i++) {
            var applicationAsDeveloper = applicationsAsDeveloper[i];
            var applicationId = applicationAsDeveloper[QueryConstants.Query._ID];
            var userApplicationIndex = -1;
            for (var j = 0; j < userApplications.length; j++) {
                var userApplication = userApplications[j];
                if (userApplication[QueryConstants.Query._ID] == applicationId) {
                    userApplicationIndex = j;
                    break;
                }
            }
            if (userApplicationIndex == -1) {
                applicationAsDeveloper[Constants.Baas.Users.Applications.ORGANIZATIONS] = [globalOrganization];
                applicationAsDeveloper.developer = true;
                userApplications.push(applicationAsDeveloper);
            } else {
                var userApplication = userApplications[userApplicationIndex];
                if (!userApplication[Constants.Baas.Users.Applications.ORGANIZATIONS] || userApplication[Constants.Baas.Users.Applications.ORGANIZATIONS].length == 0) {
                    userApplication[Constants.Baas.Users.Applications.ORGANIZATIONS] = [globalOrganization];
                } else {
                    var userOrganizationApplications = userApplication[Constants.Baas.Users.Applications.ORGANIZATIONS];
                    var hasGlobalOrganization = false;
                    for (var j = 0; j < userOrganizationApplications.length; j++) {
                        var userOrganizationApplication = userOrganizationApplications[j];
                        if (userOrganizationApplication[QueryConstants.Query._ID] == globalOrganization._id) {
                            hasGlobalOrganization = true;
                            break;
                        }
                    }
                    if (!hasGlobalOrganization) {
                        userOrganizationApplications.push(globalOrganization);
                    }
                }
            }
        }
    }
    return userApplications;
}

function getApplicationsAsDeveloper(userId, options, callback) {
    var filter = {};
    filter[Constants.Baas.Applications.DEVELOPERS] = userId;
    var query = {};
    query[QueryConstants.Query.TABLE] = Constants.Baas.APPLICATIONS;
    query[QueryConstants.Query.COLUMNS] = [QueryConstants.Query._ID, Constants.Baas.Applications.ID, Constants.Baas.Applications.LABEL, Constants.Baas.Applications.ORGENABLED, Constants.Baas.Applications.ASK];
    query[QueryConstants.Query.FILTER] = filter;
    query.excludejobs = true;
    query.excludemodules = true;
    DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(options, Constants.Baas.ASK), ApplaneCallback(callback, function (result) {
        callback(null, result[QueryConstants.Query.Result.DATA]);
    }))
}

function removeApplicationsFromOrganizations(userOrganizations) {
    for (var i = 0; i < userOrganizations.length; i++) {
        var userOrganization = userOrganizations[i];
        delete userOrganization [Constants.Baas.Organizations.APPLICATIONS];
    }
}

function getApplicationMenus(applicationId, organizationId, developer, options, callback) {
    var filter = {}
    filter[AppsStudioConstants.UI_MENUS.APPLICATIONID] = applicationId;
    filter[AppsStudioConstants.UI_MENUS.TYPE] = AppsStudioConstants.UI_MENUS.Type.MENU;
    if (!developer) {
        var orFilter = [];
        var nullOrganizationFilter = {};
        nullOrganizationFilter[AppsStudioConstants.UI_MENUS.ORGANIZATION_ID] = {$exists:false};
        orFilter.push(nullOrganizationFilter);
        var currentOrganizationFilter = {};
        currentOrganizationFilter[AppsStudioConstants.UI_MENUS.ORGANIZATION_ID] = organizationId;
        orFilter.push(currentOrganizationFilter);
        filter.$or = orFilter;
    }
    var viewQuery = {};
    viewQuery.keepstructure = true;
    viewQuery[QueryConstants.Query.TABLE] = AppsStudioConstants.UI_MENUS.TABLE;
    viewQuery[QueryConstants.Query.COLUMNS] = getMenuColumns();
    viewQuery[QueryConstants.Query.FILTER] = filter;
    viewQuery[QueryConstants.Query.PARAMETERS] = {"applicationid":applicationId, "organizationid":organizationId};
    viewQuery[QueryConstants.Query.ORDERS] = {index:"asc"};

    DatabaseEngine.executeQuery(viewQuery, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), ApplaneCallback(callback, function (menuResult) {
        callback(null, menuResult[QueryConstants.Query.Result.DATA]);
    }))
}

function getMenuColumns() {
    var columns = [];
    columns.push(AppsStudioConstants.UI_MENUS.INDEX);
    columns.push(AppsStudioConstants.UI_MENUS.LABEL);
    columns.push(AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID);
    columns.push(AppsStudioConstants.UI_MENUS.FILTER);
    columns.push(AppsStudioConstants.UI_MENUS.PARAMETER_MAPPINGS);
    columns.push(AppsStudioConstants.UI_MENUS.APPLICATIONID);
    columns.push(AppsStudioConstants.UI_MENUS.APPLICATIONID + "." + Constants.Baas.Applications.ASK);
    columns.push(AppsStudioConstants.UI_MENUS.TABLE_ID);
    columns.push(AppsStudioConstants.UI_MENUS.PARENT_MENUID);
    columns.push(AppsStudioConstants.UI_MENUS.VISIBLE_EXPRESSION);
    return columns;
}

function getSelectedOrganization(userOrganizations, state, userState) {
    for (var i = 0; i < userOrganizations.length; i++) {
        if (userOrganizations[i][QueryConstants.Query._ID] == state.organization) {
            userState[Constants.Baas.Users.UserState.LAST_ORGANIZATION] = state.organization;
            return userOrganizations[i];
        }
    }
    userState[Constants.Baas.Users.UserState.LAST_ORGANIZATION] = userOrganizations[0][QueryConstants.Query._ID];
    return userOrganizations[0];
}

function getSelectedApplicationId(applications, state, userState) {
    userState[Constants.Baas.Users.UserState.ORGANIZATION_WISE_STATE] = userState[Constants.Baas.Users.UserState.ORGANIZATION_WISE_STATE] || [];
    var organizationWiseStates = userState[Constants.Baas.Users.UserState.ORGANIZATION_WISE_STATE];
    var lastOrganization = userState[Constants.Baas.Users.UserState.LAST_ORGANIZATION];

    if (state.application) {
        updateOrganizationWiseState(organizationWiseStates, lastOrganization, state.application);
        return state.application;
    }
    if (organizationWiseStates.length > 0) {
        for (var i = 0; i < organizationWiseStates.length; i++) {
            var organizationWiseState = organizationWiseStates[i];
            if (organizationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.ORGANIZATION] == lastOrganization) {
                return organizationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.APPLICATION];
            }
        }
    }
    updateOrganizationWiseState(organizationWiseStates, lastOrganization, applications[0][QueryConstants.Query._ID]);
    return applications[0][QueryConstants.Query._ID];
}

function updateOrganizationWiseState(organizationWiseStates, lastOrganization, application) {
    var organizationApplicationWiseState = false;
    for (var j = 0; j < organizationWiseStates.length; j++) {
        var organizationWiseState = organizationWiseStates[j];
        if (organizationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.ORGANIZATION] == lastOrganization) {
            organizationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.APPLICATION] = application;
            organizationApplicationWiseState = true;
            break;
        }
    }
    if (!organizationApplicationWiseState) {
        var organizationWiseState = {};
        organizationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.APPLICATION] = application;
        organizationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.ORGANIZATION] = lastOrganization;
        organizationWiseStates.push(organizationWiseState);
    }
}

function getSelectedMenu(menus, lastApplication, userState) {
    var applicationWiseStates = userState[Constants.Baas.Users.UserState.APPLICATION_WISE_STATE] || [];
    var lastOrganization = userState[Constants.Baas.Users.UserState.LAST_ORGANIZATION];
    var menu;
    var viewId;
    if (applicationWiseStates.length > 0) {
        for (var i = 0; i < applicationWiseStates.length; i++) {
            var applicationWiseState = applicationWiseStates[i];
            if (applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.ORGANIZATION] == lastOrganization && applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.APPLICATION] == lastApplication) {
                menu = applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.MENU];
                viewId = applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.QUICK_VIEW];
                break;
            }
        }
    }
    if (menu) {
        for (var i = 0; i < menus.length; i++) {
            if (menu == menus[i][QueryConstants.Query._ID]) {
                return {menu:menus[i], quickview:viewId};
            }
        }
    }
    for (var i = 0; i < menus.length; i++) {
        if (menus[i][AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID]) {
            return {menu:menus[i], quickview:menus[i][AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID][Constants.Baas.Queries.ID]};
        }
    }
}


function getApplicationInfos(userOrganizationApplications, options, callback) {
    var applications = [];
    for (var i = 0; i < userOrganizationApplications.length; i++) {
        applications.push(userOrganizationApplications[i][QueryConstants.Query._ID]);
    }
    var filter = {};
    filter[QueryConstants.Query._ID] = {$in:applications};

    var viewQuery = {};
    viewQuery[QueryConstants.Query.TABLE] = Constants.Baas.APPLICATIONS;
    viewQuery[QueryConstants.Query.COLUMNS] = [Constants.Baas.Applications.ID, Constants.Baas.Applications.LABEL, {expression:Constants.Baas.Applications.CHILD_APPLICATIONS, columns:[
        {expression:Constants.Baas.Applications.CHILD_APPLICATIONS, columns:[Constants.Baas.Applications.ID, Constants.Baas.Applications.LABEL, "level"]}
    ]}];
    viewQuery[QueryConstants.Query.FILTER] = filter;
    viewQuery.keepstructure = true;
    DatabaseEngine.executeQuery(viewQuery, OptionsUtil.getOptions(options, Constants.Baas.ASK), ApplaneCallback(callback, function (applicationsResult) {
        callback(null, applicationsResult[QueryConstants.Query.Result.DATA]);
    }))
}
