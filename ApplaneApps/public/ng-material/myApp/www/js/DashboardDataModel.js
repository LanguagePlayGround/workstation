/***** move to app-models.js to generate minified version for before commit*******/
(function (definition) {

    if (typeof exports === "object") {
        module.exports = definition();
    } else {
        DashboardDataModel = definition();
    }

})(function () {
    "use strict";
    var Utility = require("ApplaneCore/apputil/util.js");
    var ViewUtility = require("ApplaneDB/public/js/ViewUtility.js");

    var DashboardDataModel = function (metadata, db) {
        this.metadata = metadata;
        this.db = db;
    }

    DashboardDataModel.prototype.refresh = function (callback) {
        var viewOptions = this.metadata.viewOptions;
        var views = viewOptions.views;
        var aggregates = viewOptions.aggregates;
        var db = this.db;
        var queryGroups = {};
        populateQueryGroups(views, queryGroups);
        populateQueryGroups(aggregates, queryGroups);
        return runQueryGroupWise(viewOptions, views, aggregates, queryGroups, db, callback);
    }

    DashboardDataModel.prototype.getRowParameters = function () {

    }

    DashboardDataModel.prototype.invoke = function (functionName, parameters, options) {
        var that = this;
        return this.db.invokeFunction(functionName, parameters, options);
    }

    function runQueryGroupWise(dashboardOptions, views, aggregates, queryGroups, db, callback) {
        var keys = Object.keys(queryGroups);
        return Utility.asyncIterator(keys, function (index, groupName) {
            var batchQueries = {};
            var groups = queryGroups[groupName];
            for (var j = 0; j < groups.length; j++) {
                var queries = groups[j].batchQueries;
                for (var key in queries) {
                    batchQueries[key] = queries[key];
                }
            }
            return db.batchQuery(batchQueries).then(function (result) {
                result = result.response;
                for (var j = 0; j < groups.length; j++) {
                    var index = Utility.isExists(views, {"alias": groups[j]["alias"]}, "alias");
                    var existsInAggregates = undefined;
                    if (index === undefined) {
                        existsInAggregates = true;
                        index = Utility.isExists(aggregates, {"alias": groups[j]["alias"]}, "alias");
                    }
                    if (index !== undefined) {
                        var viewMetaData = undefined
                        if (existsInAggregates) {
                            viewMetaData = aggregates[index];
                        } else {
                            viewMetaData = views[index];
                        }
                        viewMetaData.view.viewOptions.busyMessageOptions = viewMetaData.view.viewOptions.busyMessageOptions || {};
                        viewMetaData.view.viewOptions.busyMessageOptions.msg = undefined;
                        if (viewMetaData.view.viewOptions.ui === "aggregate") {
                            ViewUtility.populateDataInViewOptionsForAggregateView(result, viewMetaData.view, false);
                        } else {
                            var alias = viewMetaData.view.viewOptions.requestView.alias || viewMetaData.view.viewOptions.id;
                            var newResult = {
                                data: result[alias + "__data"],
                                aggregateData: result[alias + "__aggregateData"]
                            };
                            ViewUtility.populateDataInViewOptions(newResult, viewMetaData.view, false);
                            viewMetaData.view.viewOptions.cellDataReload = !viewMetaData.view.viewOptions.cellDataReload;
                        }
                        if (callback) {
                            callback();
                        }
                    }
                }
            }).catch(function (err) {
                    dashboardOptions.error = err;
                    handleError(views, aggregates, groups, callback);
                });
        });
    }

    function handleError(views, aggregates, groups, callback) {
        for (var j = 0; j < groups.length; j++) {
            var index = Utility.isExists(views, {"alias": groups[j]["alias"]}, "alias");
            var existsInAggregates = undefined;
            if (index === undefined) {
                existsInAggregates = true;
                index = Utility.isExists(aggregates, {"alias": groups[j]["alias"]}, "alias");
            }
            if (index !== undefined) {
                var viewMetaData = undefined
                if (existsInAggregates) {
                    viewMetaData = aggregates[index];
                } else {
                    viewMetaData = views[index];
                }
                viewMetaData.view.viewOptions.busyMessageOptions = viewMetaData.view.viewOptions.busyMessageOptions || {};
                viewMetaData.view.viewOptions.busyMessageOptions.msg = undefined;
                if (callback) {
                    callback();
                }
            }
        }
    }


    function populateQueryGroups(views, queryGroups) {
        var length = views ? views.length : 0;
        for (var i = 0; i < length; i++) {
            var dashboardView = views[i];
            // add the loading image in each dashboardCell
            dashboardView.view.viewOptions.busyMessageOptions = dashboardView.view.viewOptions.busyMessageOptions || {};
            dashboardView.view.viewOptions.busyMessageOptions.msg = "images/loadinfo.gif";

            var alias = dashboardView.alias || dashboardView.id;
            var group = dashboardView.queryGroup;
            var batchQueries = {};
            if (dashboardView.view.viewOptions.ui === "aggregate") {
                var viewBatchQueries = dashboardView.view.batchQueries;
                for (var key in viewBatchQueries) {
                    batchQueries[key] = viewBatchQueries[key];
                }
            } else {
                if (!dashboardView.parent) {
                    var alias = dashboardView.view.viewOptions.requestView.alias;
                    batchQueries[alias + "__data"] = dashboardView.view.viewOptions.queryGrid;
                    if (dashboardView.view.viewOptions.aggregateQueryGrid) {
                        batchQueries[alias + "__aggregateData"] = {
                            $query: dashboardView.view.viewOptions.aggregateQueryGrid,
                            $parent: alias + "__data",
                            $aggregate: true
                        };
                    }
                }else{
                    dashboardView.view.viewOptions.busyMessageOptions = dashboardView.view.viewOptions.busyMessageOptions || {};
                    dashboardView.view.viewOptions.busyMessageOptions.msg = undefined;
                }
            }
            if (Object.keys(batchQueries).length > 0) {
                queryGroups[group] = queryGroups[group] || [];
                queryGroups[group].push({
                    alias: alias,
                    batchQueries: batchQueries
                });
            }

        }
    }

    DashboardDataModel.prototype.fkQuery = function (query, field, value, queryOptions) {
        return Util.fkQuery(this.db, query, field, value, queryOptions);
    }
    DashboardDataModel.prototype.setUserPreference = function (userPreference) {
        var userPreferenceParameters = userPreference.queryParameters || {};
        var viewOptions = this.metadata.viewOptions;
        var views = viewOptions.views;
        var aggregates = viewOptions.aggregates;
        var length = views ? views.length : 0;
        for (var i = 0; i < length; i++) {
            var viewMetaData = views[i];
            setUserPreferenceOptions(viewMetaData, userPreferenceParameters);
        }
        var length = aggregates ? aggregates.length : 0;
        for (var i = 0; i < length; i++) {
            var viewMetaData = aggregates[i];
            setUserPreferenceOptions(viewMetaData, userPreferenceParameters);
        }

    }

    DashboardDataModel.prototype.cleanDataModel = function () {
        delete this.db;
        delete this.query;
        delete this.metadata;
        delete this.callbacks;
        delete this.data;
        delete this.dataClone;
        delete this.triggeringEvents;
        delete this.lastProcessedResult;
        delete this.dataInfo
        delete this.aggregateData;
    }

    function setUserPreferenceOptions(viewMetaData, userPreferenceParameters) {
        if (viewMetaData.view.viewOptions.ui === "aggregate") {
            var viewBatchQueries = viewMetaData.view.batchQueries;
            for (var key in viewBatchQueries) {
                var queryParameters = viewBatchQueries[key].$parameters || {};
                mergeUserPreferenceParameters(userPreferenceParameters, queryParameters);
                viewBatchQueries[key].$parameters = queryParameters;
            }
        } else if (viewMetaData.view.viewOptions.queryGrid) {
            var queryParameters = viewMetaData.view.viewOptions.queryGrid.$parameters || {};
            mergeUserPreferenceParameters(userPreferenceParameters, queryParameters);
            viewMetaData.view.viewOptions.queryGrid.$parameters = queryParameters;
            if (viewMetaData.view.viewOptions.aggregateQueryGrid) {
                var queryParameters = viewMetaData.view.viewOptions.aggregateQueryGrid.$parameters || {};
                mergeUserPreferenceParameters(userPreferenceParameters, queryParameters);
                viewMetaData.view.viewOptions.aggregateQueryGrid.$parameters = queryParameters;
            }
        }
    }

    function mergeUserPreferenceParameters(userPreferenceParams, queryParams) {
        for (var key1 in userPreferenceParams) {
            queryParams[key1] = userPreferenceParams[key1]
        }
    }


    return DashboardDataModel;
});


