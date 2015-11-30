/*
 * showGroupColumns : true/false, default false, used in notification to hide group columns because they are visible in group row : By Sachin Bansal 15-11-2014
 * fullMode : true/false, default false, used to open child view in fullMode if set to true, (use-case: show invoice detail in complete window not in 35%) : By Naveen Singh 15-11-2014.
 * showZeroIfNull : true/false , used at field level to show numeric zero if value is undeinfed, (use-case: set its value to true and make record value with empty value)(Naveen Singh)
 * largeFont : true/false , used at quick view level to show number , currency and duration in largeFont .(Naveen Singh)
 * spanreport : {"span":month,value:[{"field":"","label":""}],"date":""} , to show span wise data. Data is shown for the field defined in value and the parameterized date filter field should be provided corresponding to date field.(Manjeet)
 * qViewStyle : example {"font-weight":$participants.read ? "" : "bold" }  ||  to style row (Naveen Singh)
 * responsiveColumns :(Naveen Singh)
 * primaryField :specify the field expression to use for breadcrum (Naveen Singh)
 * template : if the ui of the view is html (Naveen Singh)
 * value : eg : invoice_amount_base_currency || shown in case of aggregate view . It specifies the expression of the field whose aggregate you want to show (Manjeet)
 * date : eg : invoice_date || shown in case of aggregate view . It specifies the expression of the field on which you want to apply the date filter. (Manjeet)
 * dueDate : eg : dueDate || shown in case of aggregate View . If the aggregate Type is equal to over_due.
 * receiveDate : eg : receiveDate || shown in case of aggregate View . If the aggregate Type is equal to over_due.
 * aggregateType : range,as_on,over_due,forecase,expression || shown in case of aggregate view . It specifies the type of date filter. (Manjeet)
 * aggregateExpression : shown if the aggregateType is expresssion | example : $revenue - $expense (Manjeet)
 * actionAvailability : Collection/Quick View (Manjeet)
 * filter :  filter to be applied on query of the  quick view (Sachin)
 * recursion : recursion to be applied on query of the quick view (Sachin)
 * group :  group to be applied on query of the  quick view (Sachin)
 * sort :  sorting to applied on query of the quick viwe (Sachin)
 * unwind :  example :["participants"]  . To unwind the data of a multiple field. (Sachin)
 * transform : example {"status_wise_sales":{"row-column":"$_id"}} | use case : status wise sales report (sachin bansal)
 * roleid :(Sachin)
 * roleField :(Sachin)
 * hidden : to hide this quick view.(Sachin)
 * limit :  limit to be applied on query of the quick viwe(Sachin)
 * fetchCount : to show the total count of the data on quick view(Manjeet)
 * fieldCustomization : true/false  to show the field customization widget (Rajit)
 * queryEvent :  Events that run when this quick view query executes. (Manjeet)
 * insert : true/false (default:true) to show the create button or not (Manjeet)
 * edit : true/false  (default:true) : to make the quick view editable or not (Manjeet)
 * delete :true/false (default:true) :  to delete rows on quick view or not (Manjeet)
 * detail :true/false (default:true) :    to show the detail row action or not (Manjeet)
 * insertMode : grid / form / both (Naveen Singh)
 * aggregatePosition  : header/ footer / both(Naveen Singh)
 * checkboxSelection (Show Selection ) : true/false (default :true) to show / hide the selection component on quick view (Naveen Singh)
 * hideUnit : true/false (default :false) to hide the units from currency or duration type fields (Naveen Singh)
 * autoWidthColumn : true/false (default:false ) to autoWidth all the fields.(Naveen Singh)
 * navigation : true/false  | set false to hide the navigation (Naveen Singh)
 * runAsBatchQuery : (Run As Batch on Dashboard View) true/false (default:false)(Manjeet)
 * reloadViewOnFilterChange : reload the view on change in filter(Naveen Singh)
 * updateMode : Async update/insert/delete support to avoid browser callback after 2 minutes. example :{"async":true,"processName":"XXXX"}(Manjeet)
 * crossTabInfo : to show nested table in cross tab mode.(Manjeet)
 * acrossDB : eg :"daffodilsw"  | use case (contact support) we want to save the image in daffodilsw (Rajit)
 * qFields : to show the field customization done on this quick view.(Manjeet)
 * views : to specify the views for a dashboard (Manjeet)
 * acrossDB : databaseName(String), required to upload/download file of any database with collection pl.contactSupports to this database tasks table: By Rajit garg 24-Nov-2014
 * dashboardGroups : used to show dashboard cell grouping : Naveen SIngh 28-11-2014
 * doNotMergeFieldCustomizations:  if you do not want to merge the field customizations
 * doNotMergeUserFieldCustomizations :if you do not want to merge the user field customizations
 * colSpan : specifies the total columns in advanced dashboard view.
 * dashboardLayout : specifies the number of columns in which dashboard screen would be divided.
 * graphType : used to specify graph type eg: bar-chart, pie-chart
 * yAxisField : used to specify x-axis field in bar-chart
 * yAxisField : used to specify y-axis field in bar-chart
 * arcLable : used to specify arcLabel field in bar-chart
 * arcValue : used to specify arcValue field in bar-chart
 * selectedDateParameter : used to specify the parameterized date filter used in aggregates in dashboard.
 * aggregateDefination : used to specify the alias for the aggregateExpression in aggregateQuery :: usecase :: gridQuery {"$group":{"purchase_amount":{"$sum":"$purchase.purchase_base_amount"}}} (in queryGrid $group is specified by user) and the  aggregateQueryGrid {"$group":{"$purchase_amount":{"$sum::"$purchase_amount"}}} created by us is wrong so  specify the aggregateDefination in the field (purchase_amount) as purchase.purchase_base_amount
 * theme : Required for mobile App, for grid View(Rajit)
 * listTitle : Required for mobile App, for grid View(Rajit)
 * listSubTitle : Required for mobile App, for grid View(Rajit)
 * listDesc : Required for mobile App, for grid View(Rajit)
 * listTitleIndicator : Required for mobile App, for grid View(Rajit)
 * listSubTitleIndicator : Required for mobile App, for grid View(Rajit)
 * listDescIndicator : Required for mobile App, for grid View(Rajit)
 * listCaption : Required for mobile App, for grid View(Rajit)
 *
 * ----------------------------------------Fields-------------------------------------
 *  alias :used to specify the alias for the aggregateExpression in aggregateQuery ::
 *  usecase :: in revenue dashboard group by is defined on invoicelineitems.deliveryid.productid and the group by is defined like group:{id:{"invoicelineitems_deliveryid_productid":"$invoicelineitems.deliveryid.productid"}}
 *  so to show this field on ui field alias should be defined on productid as "invoicelineitems_deliveryid_productid".
 *  supportedExtensions--This property is required for file type or image type field. In this, we can specify supportedExtensions, if uploaded file extension in not in supportedExtensions, then error will come. By default, all extensions are supported if supportedExtensions property is left blank.
 *  radioOptions--This property is for radio button support. It contains different values which user can select from radio button.
 *  anchorTarget--This property is for hyperlink support to specify the target of anchor tag.
 *  recursiveFilter--This property is required for showing filters on top used for SIS demo.
 *  recursiveFilterField--This property is required for asking recursive filter field for SIS demo.
 * * --------------------------------------end of --Fields-------------------------------------
 *
 * */
var Constants = require("./Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var SELF = require("./view.js");
var Role = require("ApplaneDB/lib/modules/Role.js");
var DBConstants = require("ApplaneDB/lib/Constants.js");
var ViewConstants = require("ApplaneDB/lib/ViewConstants.js");
var ViewUtility = require("ApplaneDB/public/js/ViewUtility.js");

exports.getView = function (v, db, options) {
    var viewId = v.id;
    // options are passed for the dashboard view to pass the parent view info
    if (!viewId) {
        var D = Q.defer();
        D.reject(new Error("id is not defined"));
        return D.promise;
    }
    var log = undefined;
    if (db.getLogger()) {
        log = db.getLogger().populateInitialLog("getView", {viewinfo: v._id}, db, true);
    }
    var viewQuery = {
        $collection: Constants.QViews.TABLE,
        $filter: {id: viewId}
    };
    var view = undefined;
    var viewCollection = undefined;
    var viewOptions = {};

    //view token is used to handle view with different token as in case of report An Issue, current db can be of girnarsoft or business_sb token, but we have required daffodilsw token -- Rajit garg
    if (v.token) {
        viewOptions.token = v.token;
    }
    viewOptions.saveCustomization = true;
    var requiredView = {};
    var gridQuery = undefined;
    requiredView.viewOptions = viewOptions;
    var metadata = undefined;
    var queryToExecute = undefined;
    var qViewFields = undefined;
    var qViewActions = undefined;
    var viewMainCollection = undefined;
    // properties used from v ---> fieldAvailability,qfields , parameters, paramermapping, sourceid, selectedApplication,selectedMenu
    var qviewProperties = ViewConstants.QViewProperties;
    var runOnES = options && options.es ? true : false;
    var parsableProperties = ["unwind", "filter", "sort", "queryEvent", "recursion", "group", "crossTabInfo", "margin"];
    return db.query(viewQuery).then(
        function (viewQueryResult) {
            view = viewQueryResult;
            if (!view || !view.result || view.result.length == 0) {
                throw new Error("view not found for id[" + viewId + "]");
            }
            if (view.result.length > 1) {
                throw new Error("More than one view found for id[" + viewId + "]");
            }
            view = view.result[0];
            viewCollection = view[Constants.QViews.COLLECTION];
            viewMainCollection = view[Constants.QViews.MAIN_COLLECTION];
            if (!viewCollection || !viewMainCollection) {
                throw new Error("View collection/mainCollection not defined");
            }

            if (!viewCollection.collection || !viewMainCollection.collection) {
                throw new Error("Collection not found in View collection/mainCollection");
            }

            if (viewMainCollection.collection !== viewCollection.collection) {
                viewOptions.insertView = {
                    id: viewMainCollection.collection,
                    limit: 0,
                    ui: "form"
                };
            }
            if (v.sourceid) {
                return getQviewCustomization(v.sourceid, db);
            }
        }).then(
        function (customizationData) {
            if (customizationData) {
                populateProperties(customizationData, view, qviewProperties);
                if (customizationData.filter !== undefined) {
                    view.filter = customizationData.filter;
                }
            }
            customizeV(v);
            populateProperties(v, view, qviewProperties);
            parseParsableProperties(view, parsableProperties);
            if (v.filter) {
                if (view.filter) {
                    for (var key in v.filter) {
                        view.filter[key] = v.filter[key];
                    }
                } else {
                    view.filter = v.filter;
                }
            }
            var customizationFields = customizationData ? customizationData.qFields : undefined;
            // if customization fields and view.qFields are available then we merge them otherwise if customization fields are available then we select those  otherwise if view.qActions are available then we select those
            qViewFields = getViewQFields(customizationFields, view.qFields);
            var customizationActions = customizationData ? customizationData.qActions : undefined;
            // if customization actions and view.qActions are available then we merge them otherwise if customization actions are available then we select those  otherwise is view.qActions are available then we select those
            qViewActions = getViewQActions(customizationActions, view.qActions);

            viewOptions.sourceid = v.sourceid;
            if (view.drildownView) {
                view.drildownView = getAdvancedViewInfo(view.drildownView, view.drildownViewDetail);
            }

            if (view.insertView) {
                view.insertView = getAdvancedViewInfo(view.insertView, view.insertViewDetail);
            }


            viewOptions._id = view._id;
            viewOptions.id = viewId;
            viewOptions.label = view.label || view.id;
            viewOptions.requestView = Utils.deepClone(v);
            populateViewOptions(viewOptions, view, qviewProperties);
            viewOptions.ui = view.ui || viewOptions.ui || "grid";
        }).
        then(
        function () {
            return getViewMetaData(viewCollection.collection, db);
        }).then(
        function (vMetaData) {
            metadata = vMetaData || {};
            if (viewOptions.fetchCount === undefined) {
                viewOptions.fetchCount = metadata.fetchCount;
            }
            if (viewOptions.aggregateAsync === undefined) {
                viewOptions.aggregateAsync = metadata.aggregateAsync;
            }
            if (viewOptions.primaryField === undefined) {
                viewOptions.primaryField = metadata.primaryField;
            }
            if (!viewOptions.responsiveColumns) {
                viewOptions.responsiveColumns = metadata.responsiveColumns;
            }
            if (metadata.userSorting) {
                viewOptions.userSorting = metadata.userSorting;
            }
            // merging of the metadata.actions and qviewActions based on view.actionAvailability
            mergeActions(metadata.actions, qViewActions, view.actionAvailability, db.token, viewOptions);
            viewOptions.actions = viewOptions.actions || [];
            populateCommentAction(metadata, viewOptions.actions, viewCollection.collection);
            populateCrossTabAction(viewOptions.actions, viewOptions.crossTabInfo);

            if (v.fieldAvailability && v.qFields) {
                metadata.fields = metadata.fields || [];
                mergeQFields(metadata.fields, v.qFields, v.fieldAvailability);
            } else {
                mergeFields(metadata.fields, qViewFields, view.fieldAvailability);
            }

            if (metadata.historyEnabled) {
                viewOptions.actions.push({label: "Show history", index: 10000, visibility: true, id: "showHistory", parameters: {collection: viewCollection.collection, "_id": "$_id", showDeletedHistoryLogs: "$showDeletedHistoryLogs"}, type: "view", onRow: true, qviews: [
                    {id: "pl_checkHistoryLogs"}
                ]});

                //did for showing history logs for deleted records
                viewOptions.actions.push({id: "showDeletedRecords", label: "Deleted records", type: "filter", visibility: true, filterType: "string", ui: "autocomplete", asParameter: true, field: "showDeletedHistoryLogs", options: ["show"], index: 10000});

            }
            viewOptions.fields = metadata.fields;
            viewOptions.groups = metadata.groups;
            viewOptions.collection = viewCollection.collection;
            viewOptions.collection_id = viewCollection._id;
            viewOptions.mainCollection_id = viewMainCollection._id;
            viewOptions.mainCollection = viewMainCollection.collection;
            viewOptions.events = mergeEvents(metadata.events, view.events);
            if (view.queryEvent) {
                if (Utils.isJSONObject(view.queryEvent)) {
                    view.queryEvent = [view.queryEvent];
                }
                var saveEvents = [];
                for (var i = 0; i < view.queryEvent.length; i++) {
                    var event = view.queryEvent[i];
                    if (event.event === "onSave" || event.event === "onInsert" || event.event.indexOf("onValue:") === 0) {
                        saveEvents.push(event);
                    }
                }

                if (view.eventAvailability && view.eventAvailability === "available") {    //this is done for qview event availability. -- Rajit garg
                    viewOptions.events = saveEvents;
                } else if (saveEvents && saveEvents.length > 0) {
                    mergeEvents(viewOptions.events, saveEvents);
                }
            }
            return populateChildFields(viewOptions.fields, db);
        }).then(
        function () {
            // view.doNotMergeFieldCustomizations is used to open the drilled down views from advance Dashboard without merging the field Customizations
            if (metadata.fields && viewCollection && viewCollection._id && (!view.doNotMergeFieldCustomizations)) {
                return require("./triggers/Fields.js").mergeFieldCustomizations(metadata.fields, viewCollection._id, viewOptions, db);
            }
        }).then(
        function () {
            // view.doNotMergeFieldCustomizations is used to open the drilled down views from advance Dashboard without merging the field Customizations
            if (metadata.fields && viewCollection && viewCollection._id && db.user && (!view.doNotMergeFieldCustomizations)) {
                return require("./triggers/Fields.js").mergeUserFieldCustomizations(metadata.fields, viewCollection._id, viewOptions, db);
            }
        }).then(
        function () {
            if (!metadata) {
                return;
            }
//            if (!viewOptions.fields || viewOptions.fields.length == 0) {
//                return;
//            }
            gridQuery = {
                $sort: {"_id": -1},
                $collection: viewCollection.collection,
                $limit: 50,
                runOnES: runOnES
            };

            if (view.recursion) {
                viewOptions.recursion = view.recursion;
                if (!view.recursionEnabled) {
                    gridQuery.$recursion = viewOptions.recursion;
                } else {
                    viewOptions.recursionEnabled = view.recursionEnabled;
                }
            }

            if (view.unwind) {
                gridQuery.$unwind = view.unwind;
            }
            if (view.queryEvent) {
                gridQuery.$events = view.queryEvent;
            }
            //did for showing history logs for deleted records
            if (metadata.historyEnabled) {
                gridQuery.$events = gridQuery.$events || [];
                if (Utils.isJSONObject(gridQuery.$events)) {
                    gridQuery.$events = [gridQuery.$events];
                }
                gridQuery.$events.push({"event": "onQuery", "function": "HistoryLogs.showDeletedHistoryLogs", "pre": true});
            }

            var viewGroup = undefined;
            if (view.group) {
                viewGroup = view.group;
            }
            if (viewGroup) {
                if (Array.isArray(viewGroup)) {
                    if (viewGroup.length > 0) {
                        if (typeof viewGroup[0] === "string") {
                            //rohit bansal with ashu on 27-01-2014 -- group is passed as json array for user analytics $group : [{"_id":{"username":"$username","db":"$db"}},{"_id":"$_id.db","count":{"$sum":1}}]
                            gridQuery.$group = populateQueryGroupAndGroupInfo(viewGroup, viewOptions);
                        } else {
                            gridQuery.$group = viewGroup;
                        }

                    }
                } else if (Object.keys(viewGroup).length > 0) {
                    gridQuery.$group = viewGroup;
                }
            }
            if (gridQuery.$unwind || gridQuery.$group) {
                delete gridQuery.$sort;              //We will not default sort in case of unwind or group
            }
            var sort = undefined;
            if (view.sort) {
                sort = view.sort;
            }
            if (sort) {
                if (Object.keys(sort).length === 0) {
                    delete gridQuery.$sort;
                } else {
                    gridQuery.$sort = sort;
                }
            }
            var formQuery = {
                $collection: viewCollection.collection,
                $events: gridQuery.$events,
                $limit: 1
            };
            viewOptions.queryGrid = gridQuery;
            viewOptions.queryForm = formQuery;
            if (viewOptions.ui === "html") {
                if (view.template) {
                    gridQuery.$template = view.template;
                    gridQuery.$templateType = view.templateType;
                }

            }
            if (view.filter) {
//                gridQuery.$filter = {$and: [view.filter]};  //for view having role for employee of me and my team  and he uses the filter of employee (then all the records will hide)
                gridQuery.$filter = view.filter;  //reverted due to issue in recursion module root filter not found.
            }
            if (v.$parameters) {
                gridQuery.$parameters = v.$parameters;
            }
            if (view.roleid) {
                gridQuery.$parameters = gridQuery.$parameters || {};
                var viewRole = view.roleid.id;
                if (view.roleField) {
                    gridQuery.$parameters["__role__" + view.roleField] = viewRole;
                } else {
                    gridQuery.$parameters["__role__"] = viewRole;
                }
            }
            if (v.$parametermappings) {
                viewOptions.$parametermappings = v.$parametermappings;
            }
            require("./QueryCreator.js").populateFields(viewOptions.fields, undefined, gridQuery, formQuery, viewOptions.ui == "form");
        }).then(
        function () {
            //TODO pass value
            // skipUserState in passed if the nested view is opened from the row action but the filterspace info saved in userstate is also skiped
            // so the query is executed on viewstate and filterspace info is extracted and the rest info i.e filterinfo,sortinfo and groupinfo and skiped on the basis of skipUserState
            // orders view has a invoices rowaction and the invoices view has a organizationid column which should be populated be default with the help of filtespace selected on the top.
            /*if (view.skipUserState) {
             return;
             }*/
            var viewStateKey = "viewstate." + v.sourceid + "." + viewId;
            var userViewStateQueryFields = {};
            userViewStateQueryFields[viewStateKey] = 1;
            userViewStateQueryFields["filterspace"] = 1;
            userViewStateQueryFields["no_of_records"] = 1;
            var userViewStateQuery = {
                $collection: "pl.users",
                $fields: userViewStateQueryFields,
                $filter: {_id: db.user._id},
                $modules: {"Role": 0}
            }
            return db.query(userViewStateQuery);
        }).then(
        function (userViewState) {
            if (!userViewState) {
                return;
            }
            if (userViewState.result && userViewState.result.length > 0 && viewOptions && viewOptions.queryGrid) {
                var userLimit = userViewState.result[0]["no_of_records"];
                if (userLimit && userLimit > 0 && userLimit < 201) {
                    viewOptions.queryGrid.$limit = userViewState.result[0]["no_of_records"];
                }
            }
            if (userViewState && userViewState.result && userViewState.result.length == 1 && ((userViewState.result[0].viewstate && userViewState.result[0].viewstate[v.sourceid] && userViewState.result[0].viewstate[v.sourceid][viewId]) || (userViewState.result[0].filterspace))) {
                var userFilterSpace = userViewState.result[0].filterspace;
                userViewState = userViewState.result[0].viewstate && userViewState.result[0].viewstate[v.sourceid] && userViewState.result[0].viewstate[v.sourceid][viewId] ? userViewState.result[0].viewstate[v.sourceid][viewId] : {};
                var newFilterInfo = [];
                for (var key in userFilterSpace) {
                    if (!Utils.isJSONObject(userFilterSpace[key].filter.filterInfo)) {
                        userFilterSpace[key].filter.filterInfo = JSON.parse(userFilterSpace[key].filter.filterInfo);
                    }
                    var userFilterSpaceFilterInfo = userFilterSpace[key].filter.filterInfo;
                    if (!userFilterSpaceFilterInfo) {
                        continue;
                    }

                    // populating the parameters from the filterspace info to be passed into the viewOptions.queryGrid.$parameters so that they are available when a fk query executes on that view.
                    var userFilterSpaceParameters = viewOptions.queryGrid && viewOptions.queryGrid.$parameters ? viewOptions.queryGrid.$parameters : {};
                    if (userFilterSpaceFilterInfo.filter) {
                        for (var key in userFilterSpaceFilterInfo.filter) {
                            if (userFilterSpaceParameters[key] === undefined) {
                                userFilterSpaceParameters[key] = userFilterSpaceFilterInfo.filter[key];
                            }
                        }
                    }
                    if (userFilterSpaceParameters && Object.keys(userFilterSpaceParameters).length > 0 && viewOptions.queryGrid) {
                        viewOptions.queryGrid.$parameters = userFilterSpaceParameters;
                    }
                    var fieldsLength = viewOptions.fields ? viewOptions.fields.length : 0;
                    for (var i = 0; i < fieldsLength; i++) {
                        var fieldInfo = viewOptions.fields[i];
                        if (fieldInfo.filterspace === key && fieldInfo.filterable) {
                            populateUserFilterSpaceFilterInfo(userFilterSpaceFilterInfo, fieldInfo);
                            newFilterInfo.push(userFilterSpaceFilterInfo);
                        }
                    }
                    var actionLength = viewOptions.actions ? viewOptions.actions.length : 0;
                    for (var i = 0; i < actionLength; i++) {
                        var action = viewOptions.actions[i];
                        if (action && action.filterspace === key && action.type === "filter" && (action.visibility || action.visibilityGrid )) {
                            populateUserFilterSpaceFilterInfo(userFilterSpaceFilterInfo, action);
                            newFilterInfo.push(userFilterSpaceFilterInfo);
                        }
                    }
                }
                if (userViewState.filter && userViewState.filter.filterInfo && !(view.skipUserState)) {
                    if (typeof userViewState.filter.filterInfo === "string") {
                        userViewState.filter.filterInfo = JSON.parse(userViewState.filter.filterInfo);
                    }
                    if (userViewState.filter.filterInfo.length > 0) {
                        for (var i = 0; i < userViewState.filter.filterInfo.length; i++) {
                            newFilterInfo.push(userViewState.filter.filterInfo[i]);
                        }
                    }
                }
                if (userViewState.lastSelectedInfo && !(view.skipUserState)) {
                    viewOptions.lastSelectedInfo = userViewState.lastSelectedInfo;
                }
                if (newFilterInfo.length > 0) {
                    viewOptions.queryGrid = viewOptions.queryGrid || {};//for dashboard
                    handleFilters(newFilterInfo, viewOptions, viewOptions.queryGrid);
                }
                if (userViewState.sort && userViewState.sort.sortInfo && !(view.skipUserState)) {
                    if (typeof userViewState.sort.sortInfo === "string") {
                        userViewState.sort.sortInfo = JSON.parse(userViewState.sort.sortInfo);
                    }
                    if (userViewState.sort.sortInfo.length > 0) {
                        handleSort(userViewState.sort, viewOptions, viewOptions.queryGrid);
                    }
                }
                if (userViewState.group && userViewState.group.groupInfo && !(view.skipUserState)) {
                    if (!Utils.isJSONObject(userViewState.group.groupInfo)) {
                        userViewState.group.groupInfo = JSON.parse(userViewState.group.groupInfo);
                    }
                    if (userViewState.group.groupInfo.appliedGroups && userViewState.group.groupInfo.appliedGroups.length > 0 && userViewState.group.groupInfo.queryGroup) {
                        handleGroup(userViewState.group.groupInfo, viewOptions, viewOptions.queryGrid);
                    }
                }
                if (userViewState.recursion && userViewState.recursion.recursionInfo && !(view.skipUserState)) {
                    if (typeof userViewState.recursion.recursionInfo === "string") {
                        userViewState.recursion.recursionInfo = JSON.parse(userViewState.recursion.recursionInfo);
                    }
                    if (userViewState.recursion.recursionInfo.length > 0) {
                        viewOptions.recursionInfo = userViewState.recursion.recursionInfo;
                        viewOptions.queryGrid.$recursion = viewOptions.recursion;
                    }
                }
            }
        }).then(
        function () {
            if (viewOptions.queryGrid) {
                viewOptions.queryGrid.$parameters = viewOptions.queryGrid.$parameters || {};
            }
            var viewParameters = viewOptions.queryGrid ? viewOptions.queryGrid.$parameters : {};
            return Role.manageRoleInMetadata(db.userRoles, viewOptions, viewParameters, db);
        }).then(
        function () {
            return populateMandatoryFilters(viewOptions, viewOptions.fields, viewOptions.filterInfo, db);
        }).then(
        function () {
            return populateMandatoryActionFilters(viewOptions, db);
        }).then(
        function () {
            return populateFilterInQuery(viewOptions);
        }).then(
        function () {
            requiredView.data = {
                result: []
            };
            requiredView.viewOptions.data = "data.result";
            requiredView.viewOptions.dataInfo = "data.dataInfo";
            var $parameters = undefined;
            if (viewOptions.ui === "dashboard" || viewOptions.ui === "composite") {
                if (requiredView.viewOptions.queryGrid && requiredView.viewOptions.queryGrid.$parameters) {
                    $parameters = requiredView.viewOptions.queryGrid.$parameters;
                }
                delete requiredView.viewOptions.queryGrid;
            }
            return populateView(view, requiredView, $parameters, db, runOnES);
        }).then(
        function () {
            if (viewOptions.ui === 'aggregate') {
                var aggregateView = require("./aggregateview.js");
                return aggregateView.getAggregateView(v, view, requiredView, db, options);
            }
        }).then(
        function () {
            if (!metadata || !viewOptions.queryGrid) {
                return;
            }
            queryToExecute = viewOptions.queryGrid;
            if (viewOptions.ui === "form") {
                queryToExecute = viewOptions.queryForm;
                if (viewOptions.queryGrid) {
                    queryToExecute.$filter = viewOptions.queryGrid.$filter;
                    queryToExecute.$parameters = viewOptions.queryGrid.$parameters;
                }
            }


            if (viewOptions.queryGrid.$group) {
                removeDottedFields(viewOptions.queryGrid.$fields);// remmoving fk dotted fields from the query  to apply group
            }
            var $limit = view.limit;
            if ($limit !== undefined) {
                if ($limit == -1) {
                    delete queryToExecute.$limit;
                } else {
                    queryToExecute.$limit = $limit;
                }
            }

            //if group by or recrusion then do not add $limit
            if (queryToExecute.$recursion) {
                delete queryToExecute.$limit;
            }
            return executeQueryEvents(queryToExecute, "pre", requiredView, db);
        }).then(
        function () {
            return populateAggregateQuery(db, requiredView);
        }).then(
        function (aggregateQuery) {
            if (queryToExecute) {
                if (queryToExecute.$limit == 0) {
                    return;
                }
                var batchQueries = {data: queryToExecute};
                if (aggregateQuery !== undefined) {
                    aggregateQuery.runOnES = runOnES;
                    batchQueries.aggregateData = {
                        $query: aggregateQuery,
                        $parent: "data",
                        $aggregate: true,
                        $fieldInfo: aggregateQuery.$fieldInfo,
                        $aggregateAsync: viewOptions.aggregateAsync
                    };
                    requiredView.data.aggregateResult = {};
                    requiredView.viewOptions.aggregateData = "data.aggregateResult";
                }
                var queryEvent = queryToExecute.$events;
                var batchQueryEvents = [];
                if (queryEvent !== undefined) {
                    if (Utils.isJSONObject(queryEvent)) {
                        queryEvent = [queryEvent];
                    }
                    for (var i = 0; i < queryEvent.length; i++) {
                        if (queryEvent[i].event === "onBatchQuery" || queryEvent[i].event === "onBatchResult") {
                            batchQueryEvents.push(queryEvent[i]);
                        }
                    }
                }
                if (view.spanreport) {
                    var DateComparison = require("./DateComparison.js");
                    var spanBatchQueries = DateComparison.populateSpanWiseQuery(view.spanreport, batchQueries, requiredView, runOnES);
                    if (spanBatchQueries && Object.keys(spanBatchQueries).length > 0) {
                        batchQueries = spanBatchQueries;
                    }
                }
                if (batchQueryEvents.length > 0) {
                    batchQueries.$events = batchQueryEvents;
                }
                if (view.runAsBatchQuery) {
                    return;
                }

                if ((viewOptions.ui !== "dashboard") && (!v.parent)) {
                    return db.batchQuery(batchQueries);
                }
            }
        }).then(
        function (result) {
            if (!result) {
                return;
            }
//            if (result && result.data && result.data.result && Array.isArray(result.data.result) && result.data.result.length > 1000) {
            // do not throw error for export view service
//                throw new Error("Too much data found in view [" + result.data.result.length + "], view id [" + v.id + "].Please add some filter to reduce result");
//            }
            ViewUtility.populateDataInViewOptions(result, requiredView, true);
        }).then(
        function () {
            if (queryToExecute) {
                return executeQueryEvents(queryToExecute, "post", requiredView, db);
            }
        }).then(
        function () {
            return populateCustomFilterOptions(viewOptions.fields, db);
        }).then(
        function () {
            if (viewOptions.actions) {
                return populateCustomFilterOptions(viewOptions.actions, db);
            }
        }).then(
        function () {
            // to open the reply view in editable mode from pl.comments
            if (viewOptions.ui === "form" && queryToExecute.$limit === 0 && (viewOptions.edit === undefined || viewOptions.edit === true)) {
                viewOptions.saveOptions = {editMode: true};
            }
            return updateUserState(db.user._id, v.selectedApplication, v.selectedMenu, view.id, db);
        }).then(
        function () {
            if (requiredView.viewOptions) {
                if (requiredView.viewOptions.views && requiredView.viewOptions.ui === "dashboard") {
                    var nestedViews = requiredView.viewOptions.views;
                    for (var i = 0; i < nestedViews.length; i++) {
                        var nestedView = nestedViews[i];
                        if (nestedView.view && nestedView.view.data) {
                            SELF.processDataForView(nestedView.view.data.result, nestedView.view.viewOptions);
                        }
                    }
                } else if (requiredView.data) {
                    SELF.processDataForView(requiredView.data.result, requiredView.viewOptions);
                }
            }
        }).then(
        function () {
            require("./DateComparison.js").mergeComparisonResult(requiredView);
        }).fail(
        function (err) {
            viewOptions.dataError = {message: err.message || err, businessLogicError: true, stack: err.stack};
            requiredView.data = {result: []};
        }).then(
        function () {
            return populateFunctionsDefInEvents(viewOptions.events, db);
        }).fail(
        function (err) {
            viewOptions.insert = false;
            viewOptions.edit = false;
            viewOptions.delete = false;
            viewOptions.detail = false;
            viewOptions.dataError = {message: err.message || err, businessLogicError: true, stack: err.stack};
        }).then(function () {
            if (db.getLogger()) {
                db.getLogger().populateFinalLog(db, log, true);
            }
            return requiredView;
        });
}

function populateUserFilterSpaceFilterInfo(userFilterSpaceFilterInfo, action) {
    var targetField = action.field;
    var field = userFilterSpaceFilterInfo.field;
    userFilterSpaceFilterInfo.field = targetField;
    userFilterSpaceFilterInfo[targetField] = userFilterSpaceFilterInfo[field];
    if (userFilterSpaceFilterInfo.filter) {
        userFilterSpaceFilterInfo.filter[targetField] = userFilterSpaceFilterInfo.filter[field];
    }
    if (field !== targetField) {
        delete userFilterSpaceFilterInfo[field];
        if (userFilterSpaceFilterInfo.filter) {
            delete userFilterSpaceFilterInfo.filter[field]
        }
    }
    if (action.asParameter) {
        userFilterSpaceFilterInfo.asParameter = true;
    }
}
function getAdvancedViewInfo(childViewId, viewDetail) {
    if (childViewId) {
        var viewInfo = {};
        viewInfo.id = childViewId;
        var viewDetailJSON = viewDetail ? JSON.parse(viewDetail) : undefined;
        if (viewDetailJSON) {
            for (var key in viewDetailJSON) {
                viewInfo[key] = viewDetailJSON[key];
            }
        }
        return viewInfo;
    } else {
        return undefined;
    }
}

exports.processDataForView = function (data, metadata) {
    var query = metadata ? metadata.queryGrid : undefined;
    ViewUtility.processDataForView(data, query, metadata);
    metadata.dataProcessedOnServer = true;
}

function executeQueryEvents(query, when, view, db) {
    return Utils.iterateArrayWithPromise(query.$events, function (index, queryEvent) {
        if (queryEvent.event === "onView" && queryEvent[when] === true) {
            return db.invokeFunction(queryEvent.function, [view]);
        }
    })
}

function populateAggregateQuery(db, view) {
    if (!view || !view.viewOptions.queryGrid) {
        view.viewOptions.navigation = false;
        return;

    }
    var queryGrid = view.viewOptions.queryGrid;
    var group = {};

    var fields = view.viewOptions.fields;
    var fieldInfo = {};
    if (view.viewOptions.ui === "grid" || !view.viewOptions.ui) {
        // fieldinfo is populated to help in manually calculating the aggregate in batchquery method
        // field information like alias is provided in customization and is not avaialable by loading the collection .
        // so all the required fieldinfo is passed along with the aggregate query.
        populateAggregateFields(fields, group, fieldInfo);
    }
    if (view.viewOptions.fetchCount) {
        group.__count = {$sum: 1};
    }
    if (Object.keys(group).length > 0) {
        group._id = null;
        group.$fields = false;
    } else {
        return;
    }

    var aggregateQuery = {
        $collection: queryGrid.$collection,
        $events: queryGrid.$events,
        $filter: queryGrid.$filter,
        $parameters: queryGrid.$parameters,
        $group: group,
        $unwind: queryGrid.$unwind,
        $fields: {_id: 1},
        $fieldInfo: fieldInfo
    }
    view.viewOptions.aggregateQueryGrid = aggregateQuery;
    return aggregateQuery;
}

function populateFunctionsDefInEvents(events, db) {
    return Utils.iterateArrayWithPromise(events, function (index, event) {
        var functionName = event.function;
        var functionDef = db.getFunctionDefinition(functionName);
        if (Q.isPromise(functionDef)) {
            return functionDef.then(function (result) {
                event.function = result;
            })
        } else {
            event.function = functionDef;
        }
    })
}

function populateCustomFilterOptions(fields, db) {
    return Utils.iterateArrayWithPromise(fields, function (index, field) {
        if ((field.type === "date" || field.filterType === "date" ) && field.customFilter && field.customFilter.collection && field.customFilter.displayField && field.customFilter.startRange && field.customFilter.endRange) {
            var customFilter = field.customFilter;
            var collection = customFilter.collection;
            var displayField = customFilter
                .displayField;
            var startRange = customFilter.startRange;
            var endRange = customFilter.endRange;
            var fields = {};
            fields[displayField] = 1;
            fields[startRange] = 1;
            fields[endRange] = 1;
            var sort = {};
            sort[startRange] = 1;
            return db.query({
                $collection: collection,
                $fields: fields,
                $sort: sort
            }).then(function (data) {
                    var result = data.result;
                    var filterOptions = [];
                    for (var i = 0; i < result.length; i++) {
                        var row = result[i];
                        var filterOption = {};
                        filterOption.label = row[displayField];
                        filterOption.startRange = row[startRange];
                        filterOption.endRange = row[endRange];
                        filterOptions.push(filterOption);
                    }
                    field.filterOptions = filterOptions;
                })
        }
    })
}


function handleFilters(filterInfo, viewOptions, gridQuery) {
    var count = filterInfo && filterInfo.length > 0 ? filterInfo.length : 0;

    if (count > 0) {
        viewOptions.filterInfo = filterInfo;
    }

    gridQuery.$filter = gridQuery.$filter || {};
    gridQuery.$parameters = gridQuery.$parameters || {};
    for (var i = 0; i < count; i++) {
        var filter = filterInfo[i].filter;
        if (filter) {
            var filterVal = filter[filterInfo[i].field];
            if (filterVal) {
                if (filterInfo[i].asParameter || filterVal.asParameter) {
                    gridQuery.$parameters[filterInfo[i].field] = filter[filterInfo[i].field];
                } else {
                    gridQuery.$filter[filterInfo[i].field] = filter[filterInfo[i].field];
                }
            }


        }
    }
}

function handleSort(sort, viewOptions, gridQuery) {
    viewOptions.sortInfo = sort.sortInfo;
    var count = sort.sortInfo && sort.sortInfo.length > 0 ? sort.sortInfo.length : 0;
    var $sort = undefined;
    for (var i = 0; i < count; i++) {
        $sort = $sort || {};
        var field = '';
        if (sort.sortInfo[i].displayField) {
            field = '.' + sort.sortInfo[i].displayField;
        }
        var field = sort.sortInfo[i].field + field;
        $sort[field] = sort.sortInfo[i].value == 'Asc' ? 1 : -1;
    }
    gridQuery.$sort = $sort;
}

function handleGroup(groupInfo, viewOptions, gridQuery) {
    viewOptions.groupInfo = groupInfo.appliedGroups;
    gridQuery.$group = JSON.parse(groupInfo.queryGroup);
    if (gridQuery.$sort && Object.keys(gridQuery.$sort).length === 1 && gridQuery.$sort._id) {
        delete gridQuery.$sort;              //We will not default sort in case of unwind or group
    }
}

function removeDottedFields(fields) {
    for (var key in fields) {
        var dotIndex = key.indexOf(".");
        if (dotIndex !== -1) {
            var firstPart = key.substring(0, dotIndex);
            delete fields[key];
            if (fields[firstPart] === undefined) {
                fields[firstPart] = 1;
            }
        }
    }
}

function mergeQFields(fields, qFields, fieldAvailability) {
    if (!fields) {
        return;
    }
    for (var i = fields.length - 1; i >= 0; i--) {
        var row = fields[i];
        var qViewField = undefined;
        if (qFields) {
            for (var j = 0; j < qFields.length; j++) {
                if (row.field === qFields[j].field) {
                    qViewField = qFields[j];
                    if (qViewField.fields && qViewField.fields.length > 0) {
                        row.fields = row.fields || [];
                        mergeQFields(row.fields, qViewField.fields, fieldAvailability);
                        if (fieldAvailability === "hidden") {
                            qViewField = undefined;
                        }
                    }
                    qFields.splice(j, 1);
                    break;
                }
            }
        }
        if ((fieldAvailability === "hidden" && qViewField !== undefined) || (fieldAvailability === "available" && qViewField === undefined)) {
            fields.splice(i, 1);
        } else if (fieldAvailability == "available" || fieldAvailability === "override") {
            for (var key in qViewField) {
                if (key !== "fields") {
                    row[key] = qViewField[key];
                }
            }
        }
    }
    if ((fieldAvailability == "available" || fieldAvailability === "override") && qFields && qFields.length > 0) {
        fields.push.apply(fields, qFields);
    }
}

function mergeQFieldProperties(qViewField, row) {
    if (qViewField.visibility !== undefined) {
        row.visibility = qViewField.visibility;
        row.visibilityGrid = qViewField.visibility;
    }
    if (qViewField.visibilityForm !== undefined) {
        row.visibilityForm = qViewField.visibilityForm;
    }
    if (qViewField.index !== undefined) {
        row.index = qViewField.index;
        row.indexGrid = qViewField.index;
    }
    if (qViewField.indexForm !== undefined) {
        row.indexForm = qViewField.indexForm;
    }
    if (qViewField.filter !== undefined) {
        row.filter = qViewField.filter;
    }
    if (qViewField.editableWhen !== undefined) {
        row.editableWhen = qViewField.editableWhen;
    }
    if (qViewField.when !== undefined) {
        row.when = qViewField.when;
    }
    if (qViewField.width !== undefined) {
        row.width = qViewField.width;
    }
}

function mergeActions(actions, qViewActions, actionAvailability, token, viewOptions) {
    if (!actions || actions.length == 0) {
        return;
    }
    actionAvailability = actionAvailability || "override";
    if (qViewActions && qViewActions.length > 0) {
        for (var i = actions.length - 1; i >= 0; i--) {
            var row = actions[i];
//        if (row[Constants.Actions.TYPE] == Constants.Actions.Type.EXPORT) {
//            row[Constants.Actions.HYPER_REFERENCE] = "/rest/invoke?function=ExportViewService.exportExcelView&parameters=[" + JSON.stringify({requestView:v}) + "]&token=" + token;
//        }
            var qViewAction = undefined;
            for (var j = 0; j < qViewActions.length; j++) {
                var qViewValue = qViewActions[j]["qaction"];
                if (qViewValue && Utils.deepEqual(qViewValue._id, row._id)) {
                    qViewAction = qViewActions[j];
                    break;
                }
            }
            if (actionAvailability == "available") {
                if (qViewAction === undefined) {
                    actions.splice(i, 1);
                } else {
                    mergeProperties(qViewAction, row, ViewConstants.ActionProperties);
                }
            } else if (actionAvailability === "hidden") {
                if (qViewAction !== undefined) {
                    actions.splice(i, 1);
                }
            } else if (actionAvailability == "override" && qViewAction) {
                mergeProperties(qViewAction, row, ViewConstants.ActionProperties);
            }
        }
    }
    var newActions = [];
    for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        if (action.visibility || action.visibilityGrid || action.visibilityForm) {
            newActions.push(action);
        }
    }
    viewOptions.actions = newActions;
}
exports.populateFilterOptions = function (params, filter) {
    return filter[params.filterType](params.pFilter, params.vFilter);
}

function mergeFields(fields, qViewFields, fieldAvailability) {
    if (!fields || fields.length == 0) {
        return;
    }
    fieldAvailability = fieldAvailability || "override";


    for (var i = fields.length - 1; i >= 0; i--) {
        var row = fields[i];
        if (row.__system__) {   //__system__ fields should not be available to view
            fields.splice(i, 1);
            continue;
        }
        if (row.fields) {
            mergeFields(row.fields, qViewFields, fieldAvailability);
        }
        if ((!qViewFields) || qViewFields.length == 0) {
            continue;
        }


        var qViewField = undefined;
        for (var j = 0; j < qViewFields.length; j++) {
            var qViewValue = qViewFields[j]["qfield"];
            if (Utils.deepEqual(qViewValue._id, row._id)) {
                qViewField = qViewFields[j];
                break;
            }
        }
        if (fieldAvailability == "available") {
            if (qViewField === undefined) {
                fields.splice(i, 1);
            } else {
                mergeProperties(qViewField, row, ViewConstants.FieldProperties);
            }
        } else if (fieldAvailability === "hidden") {
            if (qViewField !== undefined) {
                fields.splice(i, 1);
            }
        } else if (fieldAvailability == "override" && qViewField) {
            mergeProperties(qViewField, row, ViewConstants.FieldProperties);
        }
    }
}

function populateChildFields(fields, db) {
    return Utils.iterateArrayWithPromise(fields, function (index, field) {
        var fieldQuery = field.query;
        if (fieldQuery && typeof fieldQuery === "string") {
            fieldQuery = JSON.parse(fieldQuery);
        }
        if (fieldQuery && fieldQuery.$type === "child" && fieldQuery.$query && fieldQuery.$fk && field.type == "object" && field.multiple) {
            if ((!field.fields) || (field.fields.length == 0)) { // if fields are saved in this collection then we do nothing else we populate the fields on runtime (Manjeet 19-01-2015)
                var childQuery = fieldQuery.$query;
                return db.collection(childQuery.$collection).then(
                    function (childCollection) {
                        var fieldsResult = Utils.deepClone(childCollection.getValue("fields"));
                        mergeFields(fieldsResult);
                        if (childQuery.$fields && Object.keys(childQuery.$fields).length > 0) {
                            fieldsResult = populateNewChildFields(childQuery, fieldsResult);
                        }
                        var fkColumns = [fieldQuery.$fk];
                        var otherFks = fieldQuery.$otherfk;
                        if (otherFks && otherFks.length > 0) {
                            for (var i = 0; i < otherFks.length; i++) {
                                fkColumns.push(otherFks[i].fk);
                            }
                        }
                        var index = field.index || 1;
                        addExtraPropertyInFields(index, fieldsResult, field, fkColumns);
                        field.fields = fieldsResult;
                        return populateChildFields(field.fields, db);
                    })
            }
        }
    })
}

function populateNewChildFields(childQuery, fieldsResult) {
    var childQueryFields = childQuery.$fields;
    for (var key in childQueryFields) {
        if (childQueryFields[key] !== 1) {
            throw new Error("Field [" + key + "] with value [" + JSON.stringify(childQueryFields[key]) + "] is not supported in child Query [" + JSON.stringify(childQuery) + "]");
        }
    }
    var newFields = [];
    for (var key in childQueryFields) {
        populateFields(key, fieldsResult, newFields);
    }
    return newFields;
}

function addExtraPropertyInFields(index, fields, childField, fkColumns) {
    if (fields && fields.length > 0) {
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (fkColumns && fkColumns.indexOf(field.field) > -1) {
                fields.splice(i, 1);
                i = i - 1;
                continue;
            }
            field.index = index++;
            delete field.indexGrid;
            delete field.indexForm;
            delete field.ftsEnable;
            delete field.filterable;
            delete field.sortable;
            delete field.groupable;
            delete field.aggregatable;
            delete field.update;
            field.visibilityGrid = childField.visibilityGrid;
            field.visibilityForm = childField.visibilityForm;
            field.visibility = childField.visibility;
            if (field.fields) {
                addExtraPropertyInFields(index, field.fields, childField, null);
            }
        }
    }
}


function populateFields(expression, fields, newFields) {
    if (fields && fields.length > 0) {
        var index = expression.indexOf(".");
        if (index !== -1) {
            var firstPart = expression.substr(0, index);
            var rest = expression.substr(index + 1);
            var firstPartFields = get(firstPart, fields);
            if (!firstPartFields) {
                throw new Error("Fields not proper define for expression [" + expression + "] in fields [" + JSON.stringify(fields) + "]");
            }
            var firstPartFieldsClone = Utils.deepClone(firstPartFields);
            var fieldToPut = get(firstPart, newFields);
            if (!fieldToPut) {
                firstPartFieldsClone.fields = [];
                newFields.push(firstPartFieldsClone);
                fieldToPut = firstPartFieldsClone;
            }

            return populateFields(rest, firstPartFields.fields, fieldToPut.fields);
        } else {
            var fieldToPut = get(expression, fields);
            if (fieldToPut) {
                if (!(get(expression, newFields))) {
                    newFields.push(fieldToPut);
                }
            }
        }
    }
}

function get(expression, fields) {
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.field === expression) {
            return field;
        }
    }
}


function populateView(view, requiredView, $parameters, db, runOnES) {
    if ((!view.ui) || ((view.ui !== "dashboard") && (view.ui !== "composite"))) {
        return;
    }
    if (!view.views && !view.aggregates) {
        return;
    }
    requiredView.viewOptions.ui = view.ui;
    requiredView.viewOptions.views = view.views;
    if (view.ui === "composite") {
        for (var i = 0; i < view.views.length; i++) {
            var tabView = view.views[i];
            tabView.sourceid = tabView._id;
        }
        requiredView.viewOptions.$parameters = $parameters;
        return;
    }
    requiredView.viewOptions.dashboardType = view.dashboardType;
    requiredView.viewOptions.aggregates = view.aggregates;
    var executeOnClient = view.executeOnClient;
    requiredView.viewOptions.executeOnClient = executeOnClient;
    var queryEvent = view.queryEvent;
    var runAsBatchQuery = view.runAsBatchQuery;
    if (view.dashboardType === "AdvanceDashboard") {
//        if (!executeOnClient) {
        requiredView.viewOptions.reloadViewOnFilterChange = view.reloadViewOnFilterChange;
//        }
        if (view.views) {
            Utils.sort(view.views, "asc", "index");
        }
        if (view.aggregates) {
            Utils.sort(view.aggregates, "asc", "index");
        }
    } else {
        Utils.sort(view.views, "asc", "left");
    }
    return Utils.iterateArrayWithPromise(view.views,
        function (index, dashboardView) {
            populateInfoInDashboardView({view: dashboardView, $parameters: $parameters, runAsBatchQuery: runAsBatchQuery});
            if (dashboardView.group) {
                dashboardView.groupName = dashboardView.group;
                delete dashboardView.group;
            }
            if (dashboardView.parent === null) {
                delete dashboardView.parent;
            }
            dashboardView.sourceid = dashboardView._id;
            if (dashboardView.parametermappings) {
                var parametermappings = dashboardView.parametermappings
                dashboardView.$parametermappings = parametermappings ? (typeof parametermappings == "object" ? parametermappings : JSON.parse(parametermappings)) : [];
            }
            return SELF.getView(dashboardView, db, {parentViewInfo: view, es: runOnES}).then(
                function (result) {
                    dashboardView.view = result;
                })
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(view.aggregates, function (index, aggregateView) {
                populateInfoInDashboardView({view: aggregateView, $parameters: $parameters, runAsBatchQuery: runAsBatchQuery});
                if (aggregateView.group) {
                    aggregateView.groupName = aggregateView.group;
                    delete aggregateView.group;
                }
                return SELF.getView(aggregateView, db, {parentViewInfo: view, es: runOnES}).then(
                    function (result) {
                        aggregateView.view = result;
                    })
            })
        }).then(
        function () {
            if (runAsBatchQuery) {
                var batchQueries = {};
                populateBatchQueries(view.views, batchQueries);
                populateBatchQueries(view.aggregates, batchQueries);
                return batchQueries;
            }
        }).then(
        function (batchQueries) {
            if ((batchQueries && Object.keys(batchQueries).length > 0) && (!executeOnClient)) {
                if (queryEvent) {
                    if (typeof queryEvent === "string") {
                        queryEvent = JSON.parse(queryEvent);
                    }
                    batchQueries.$events = queryEvent;
                }
                return db.batchQuery(batchQueries);
            }
        }).then(function (result) {
            if (result) {
                populateDataInViewOptions(view.views, result);
                populateDataInViewOptions(view.aggregates, result);
            }
        });
}

function populateInfoInDashboardView(params) {
    var dashboardView = params.view;
    dashboardView.$parameters = params.$parameters;
    if (params.runAsBatchQuery) {
        dashboardView.runAsBatchQuery = true;
    }
    if (dashboardView.viewInfo) {
        var viewInfo = JSON.parse(dashboardView.viewInfo);
        for (var key in viewInfo) {
            dashboardView[key] = viewInfo[key]
        }
        delete dashboardView.viewInfo;
    }
    // in profit and loss report the subviews actions i.e. (date action ) are same as the dashboard actions is overriding the parameters
    if (!dashboardView.showAction) {
        dashboardView.hideAction = true;
    }
}


function getViewMetaData(collectionName, db) {
    if (!collectionName) {
        return;
    }
    var metaData = {};
    var collection = undefined;
    return db.collection(collectionName).then(
        function (dbCollection) {
            collection = dbCollection;
            metaData.historyEnabled = collection.getValue("historyEnabled");
            metaData.fetchCount = collection.getValue("fetchCount");
            metaData.aggregateAsync = collection.getValue("aggregateAsync");
            metaData.fields = collection.getValue("fields");
            metaData.actions = collection.getValue("actions");
            metaData.events = collection.getValue("events");
            metaData.primaryField = collection.getValue("primaryField");
            metaData.groups = collection.getValue("formgroups");
            metaData.responsiveColumns = collection.getValue("responsiveColumns");
            metaData.userSorting = collection.getValue("userSorting");
            populateComments(metaData, collection);
            return Utils.deepClone(metaData);
        })
}

function populateComments(metaData, collection) {
    var commentEnabled = collection.getValue(DBConstants.Admin.Collections.COMMENT_ENABLED);
    if (commentEnabled) {
        metaData[DBConstants.Admin.Collections.COMMENT_ENABLED] = commentEnabled;
        metaData[DBConstants.Admin.Collections.COMMENT_DISPLAY_FIELD] = collection.getValue(DBConstants.Admin.Collections.COMMENT_DISPLAY_FIELD);
        metaData[DBConstants.Admin.Collections.COMMENT_EVENT] = collection.getValue(DBConstants.Admin.Collections.COMMENT_EVENT);
        metaData[DBConstants.Admin.Collections.COMMENT_SOURCE] = collection.getValue(DBConstants.Admin.Collections.COMMENT_SOURCE);
    }
}

function populateAggregateFields(fields, group, fieldInfo, parentFieldLabel, parentField) {
    var noOfFields = fields ? fields.length : 0;
    for (var i = 0; i < noOfFields; i++) {
        var field = fields[i];
        var pFieldLabel = parentFieldLabel !== undefined ? parentFieldLabel + "_" + field.field : field.field;
        if (field.type === "object") {
            var pField = parentField !== undefined ? parentField + "." + field.field : field.field;
            populateAggregateFields(field.fields, group, fieldInfo, pFieldLabel, pField);
        }
        if ((field.aggregate === "sum" || field.aggregate === "avg") && (field.visibility || field.visibilityGrid)) {
            var gField = parentField !== undefined ? parentField + "." + field.field : field.field;
            fieldInfo[gField] = {ui: field.ui, alias: field.alias, type: field.type};
            group[pFieldLabel] = {};
            group[pFieldLabel]["$" + field.aggregate] = "$" + gField;
        }

    }
}

function updateUserState(userId, selectedApplication, selectedMenu, selectedQView, db) {
    var valuesToSet = {};
    if (selectedApplication && selectedMenu) {
        valuesToSet["state.selectedapplication"] = selectedApplication;
        if (selectedMenu) {
            valuesToSet["state.applications." + selectedApplication + ".menu"] = selectedMenu;
        }
    }
    if (selectedMenu && selectedQView) {
        if (selectedQView) {
            valuesToSet["state.menus." + selectedMenu + ".qview"] = selectedQView;
        }
    }
    if (Object.keys(valuesToSet).length == 0) {
        return;
    }
    var update = [
        {
            $collection: "pl.users",
            $update: [
                {
                    $query: {_id: userId},
                    $set: valuesToSet
                }
            ]
        }
    ];
    return db.mongoUpdate(update);
}


function mergeEvents(metadataEvents, vEvents) {
    if (!metadataEvents) {
        return vEvents;
    }
    metadataEvents.push.apply(metadataEvents, vEvents);
    return metadataEvents;
}

function populateCrossTabAction(actions, crossTabInfo) {
    if (crossTabInfo) {
        if (typeof crossTabInfo === "string") {
            crossTabInfo = JSON.parse(crossTabInfo);
        }
        for (var key in crossTabInfo) {
            actions.push({
                "index": 1000,
                "id": "populateCrossTabInfo_" + key,
                "label": "PopulateData",
                "type": "invoke",
                "onHeader": true,
                "parameters": crossTabInfo[key]["parameters"],
                "function": "populateCrossTab",
                actionField: key,
                visibility: true
            });
        }
    }
}

function populateCommentAction(metadata, actions, collection) {
    var commentEnabled = metadata[DBConstants.Admin.Collections.COMMENT_ENABLED];
    var displayField = metadata[DBConstants.Admin.Collections.COMMENT_DISPLAY_FIELD];
    if (commentEnabled && displayField) {
        var events = [];
        var event = metadata[DBConstants.Admin.Collections.COMMENT_EVENT];
        if (event) {
            event = typeof event == "object" ? event : JSON.parse(event);
            events.push(event);
        }
        var actionParameters = {
            "collection": collection,
            "source": metadata[DBConstants.Admin.Collections.COMMENT_SOURCE],
            _id: "$_id",
            displayField: "$" + displayField
        };
        actions.push({
            "index": 1000,
            "id": "comment",
            "label": "Comment",
            "type": "view",
            "onRow": true,
            "collection": DBConstants.Admin.COMMENTS,
            "filter": {
                "collection": "$collection",
                "source": "$source",
                "fk._id": "$_id",
                "fk.value": "$displayField"
            },
            "parameters": actionParameters,
            events: events,
            insert: true,
            "qviews": [
                {
                    "collection": DBConstants.Admin.COMMENTS,
                    "id": "comment",
                    "label": "Comments"
                }
            ]
        });
    }
}

function populateViewOptions(viewOptions, view, properties) {
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        if (view[property] !== undefined) {
            viewOptions[property] = view[property];
        }
    }
}

function populateQueryGroupAndGroupInfo(viewGroups, viewOptions) {
    var groupInfos = [];
    var queryGroupInfo = {_id: []};
    var aggregateColumns = [];
    getAggregateColumns(aggregateColumns, viewOptions.fields);
    aggregateColumns.push({
        field: "count",
        aggregate: "count",
        type: "number",
        sortable: true
    });
    for (var i = 0; i < viewGroups.length; i++) {
        var groupField = viewGroups[i];
        var groupFieldInfo = getFieldInfo(groupField, viewOptions.fields);
        var element = {};
        element.field = groupField;
        if (groupFieldInfo.displayField) {
            element.displayField = groupFieldInfo.displayField;
        }
        element.label = groupFieldInfo.label || groupField;
        var groupRecursion = groupFieldInfo.recursion;
        if (groupRecursion && typeof groupRecursion === "string") {
            groupRecursion = JSON.parse(groupRecursion);
        }
        element.recursion = groupRecursion;
        if (groupRecursion && groupRecursion.$selected) {
            groupRecursion.$removeRollupHierarchy = true;
            groupRecursion.$rollupHierarchyField = "self";
            groupRecursion.$childrenAsRow = true;
            groupRecursion.$selfAsChildren = true;
            groupRecursion.$primaryColumn = groupField;
            if (!groupRecursion.$childrenAlias) {
                groupRecursion.$childrenAlias = "Team";
            }
            if (!groupRecursion.$alias) {
                groupRecursion.$alias = "recursiveChildren";
            }
            groupRecursion.$rollup = [];
            queryGroupInfo.$recursion = groupRecursion;
        }
        element.__selected__ = true;
        groupInfos.push(element);
        var group_IdField = {};

        group_IdField[groupField] = "$" + groupField;
        queryGroupInfo._id.push(group_IdField);
        queryGroupInfo[groupField] = {"$first": "$" + groupField};
    }
    for (var j = 0; j < aggregateColumns.length; j++) {
        var aggregateColumn = aggregateColumns[j];
        ViewUtility.populateSortInGroup(queryGroupInfo, aggregateColumn);
        if (aggregateColumn.aggregate == "count") {
            queryGroupInfo[aggregateColumn.field] = {$sum: 1};
            if (queryGroupInfo.$recursion && queryGroupInfo.$recursion.$rollup) {
                queryGroupInfo.$recursion.$rollup.push(aggregateColumn.field);
            }
        } else if (aggregateColumn.aggregate == "sum" || aggregateColumn.aggregate == "avg") {
            queryGroupInfo[aggregateColumn.field] = {};
            queryGroupInfo[aggregateColumn.field]["$" + aggregateColumn.aggregate] = "$" + aggregateColumn.field;
            if (queryGroupInfo.$recursion && queryGroupInfo.$recursion.$rollup) {
                if (aggregateColumn.type === "currency") {
                    var rollUpColumn = {};
                    rollUpColumn[aggregateColumn.field] = {
                        "amount": {"$sum": "$amount"},
                        "type": {"$first": "$type"}
                    };
                    queryGroupInfo.$recursion.$rollup.push(rollUpColumn);
                } else if (aggregateColumn.type === "duration") {
                    var rollUpColumn = {};
                    rollUpColumn[aggregateColumn.field] = {
                        "time": {"$sum": "$time"},
                        "unit": {"$first": "$unit"}
                    };
                    queryGroupInfo.$recursion.$rollup.push(rollUpColumn);
                }
            }
        }
    }
    viewOptions.groupInfo = groupInfos;
    return queryGroupInfo;
}

function getAggregateColumns(aggregateColumns, fields) {
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.aggregatable) {
            aggregateColumns.push({
                field: field.field,
                aggregate: field.aggregate,
                type: field.type,
                ui: field.ui,
                sortable: field.sortable
            });
        }
    }
}

function getFieldInfo(fieldName, fields) {
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.field === fieldName) {
            return field;
        }
    }
}

function createFilterInfo(pField, labelField, defaultValue, fieldtype, field) {
    var filter = {}
    filter[pField] = defaultValue.value;
    var info = {
        field: pField,
        ui: field.ui,
        __selected__: defaultValue.selected
    };
    if (filter[pField] !== undefined) {
        info.filter = filter;
    }
    if (fieldtype === "date") {
        info.value = defaultValue.label || " ";
    } else if (fieldtype === "string" || fieldtype === "fk") {
        info.filterOperators = {label: "=="};
        info[labelField] = defaultValue.value;
    }
    if (fieldtype === "fk") {
        info.filter = info.filter || {};
        if (defaultValue && defaultValue.value) {
            info.filter[pField] = defaultValue.value._id;
        }
    }
    if (field.defaultFilter) {
        info.mandatory = true;
    }
    if (field.asParameter) {
        info.asParameter = field.asParameter;
    }
    if (field.filterspace) {
        info.filterspace = field.filterspace;
    }

    return info;
}
function populateMandatoryFilters(viewOptions, fields, filterInfo, db, parentField) {
    if (viewOptions.hideAction || viewOptions.ui === "dashboard") {
        return;
    }
    var fields = fields || [];
    filterInfo = filterInfo || [];
    return Utils.iterateArrayWithPromise(fields,
        function (index, field) {
            var pField = parentField ? parentField + "." + field.field : field.field;
            if (field.fields) {
                return populateMandatoryFilters(viewOptions, field.fields, filterInfo, db, pField);
            }
            if (field.filterable && field.visibilityFilter === "Always" && (field.type === "fk" || field.type === "date" || field.type === "string")) {
                var labelField = parentField ? parentField : field.field;
                var found = false;
                for (var j = 0; j < filterInfo.length; j++) {
                    if (filterInfo[j].field === pField) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return getFilterDefaultValue(viewOptions, field.type, field, field["defaultFilter"], db).then(function (defaultValue) {
                        defaultValue = defaultValue || {};
                        var info = createFilterInfo(pField, labelField, defaultValue, field.type, field);
                        filterInfo.push(info);
                    });
                }
            }
        }).then(function () {
            viewOptions.filterInfo = filterInfo;
        })
}

function getFilterDefaultValue(viewOptions, type, field, defaultValue, db, pValue) {
    var d = require("q").defer();
    if (!defaultValue && !pValue) {
        d.resolve();
        return d.promise;
    }
    if (type === "date") {
        var Moment = require("moment");
        var label = undefined;
        if (pValue) {
            if (Utils.isJSONObject(pValue)) {
                defaultValue = pValue;
                var gte = Moment(pValue.$gte);
                var lt = Moment(pValue.$lt);
                var diff = Math.abs(gte.diff(lt, 'days', true));
                if (diff >= 365) {// year
                    label = gte.format("YYYY") + " - " + lt.subtract("days", 1).format("YY");
                } else if (diff >= 80) { // quarter
                    label = gte.format("MMM-YYYY") + " - " + lt.subtract("days", 1).format("MMM-YYYY");
                } else if (diff >= 28) {// month
                    label = gte.format("MMM-YYYY");
                } else if (diff == 1) {//day
                    label = gte.format("DD/MM/YYYY");
                }
            } else {
                label = Moment(pValue).format("d/MM/YYYY");
            }
        } else if (defaultValue === "$$CurrentDateFilter") {
            label = Moment().format("DD/MM/YYYY");
        } else if (defaultValue === "$$CurrentMonthFilter") {
            label = Moment().format("MMMM-YYYY");
        } else if (defaultValue === "$$CurrentYearFilter") {
            label = Moment().format("YYYY");
        }
        d.resolve({
            value: defaultValue,
            selected: "manual",
            label: label
        });
    } else if (type === "fk") {
        var sort = undefined;
        var queryFilter = undefined
        if (defaultValue === "$$First") {
            sort = {_id: -1};
        } else if (defaultValue === "$$Last") {
            sort = {_id: 1};
        } else if (pValue) {
            queryFilter = {};
            queryFilter["_id"] = pValue;
        } else {
            queryFilter = {};
            try {
                defaultValue = JSON.parse(defaultValue);
            } catch (e) {
            }
            if (defaultValue.$filter || defaultValue.$sort) {
                if (defaultValue.$filter) {
                    queryFilter = defaultValue.$filter;
                }
                if (defaultValue.$sort) {
                    sort = defaultValue.$sort;
                }
            } else {
                queryFilter[field.displayField] = defaultValue;
            }
        }
        var query = {};
        query.$collection = field.collection;
        query.$limit = 1;
        if (sort) {
            query.$sort = sort;
        }
        if (queryFilter) {
            query.$filter = queryFilter;
        }
        query.$parameters = viewOptions.queryGrid.$parameters;
        var fields = {};
        fields[field.displayField] = 1;
        query.$fields = fields;
        var value = undefined;
        db.query(query).then(
            function (data) {
                if (data && data.result && data.result.length > 0) {
                    value = data.result[0];
                }
                d.resolve({
                    value: value,
                    selected: true
                });
            }).
            fail(function (err) {
                d.reject(err);
            });
    }
    else if (type === "string") {
        d.resolve({
            value: pValue || defaultValue,
            selected: true
        })
    }
    return d.promise;
}

function populateFilterInQuery(viewOptions) {
    var length = viewOptions.filterInfo ? viewOptions.filterInfo.length : 0;
    for (var i = 0; i < length; i++) {
        var filterInfo = viewOptions.filterInfo[i];
        var filter = filterInfo.filter;
        if (filter) {
            var filterVal = filter[filterInfo.field];
            if (filterVal) {
                if (filterInfo.asParameter || filterVal.asParameter) {
                    viewOptions.queryGrid.$parameters = viewOptions.queryGrid.$parameters || {};
                    viewOptions.queryGrid.$parameters[filterInfo.field] = filter[filterInfo.field];
                } else {
                    viewOptions.queryGrid.$filter = viewOptions.queryGrid.$filter || {};
                    viewOptions.queryGrid.$filter[filterInfo.field] = filter[filterInfo.field];
                }
            }
        }
    }
}

function populateMandatoryActionFilters(viewOptions, db) {
    if (viewOptions.hideAction) {
        return;
    }
    var actions = viewOptions.actions || [];
    var filterInfo = viewOptions.filterInfo || [];
    var parameters = viewOptions.queryGrid && viewOptions.queryGrid.$parameters ? viewOptions.queryGrid.$parameters : {};
    return Utils.iterateArrayWithPromise(actions,
        function (index, action) {
            if ((action.type === "filter" && action.visibilityFilter === "Always") || (action.type === "filter" && action.asParameter && parameters[action.field])) {
                var found = false;
                for (var j = 0; j < filterInfo.length; j++) {
                    if (filterInfo[j].field === action.field) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return getFilterDefaultValue(viewOptions, action.filterType, action, action["defaultFilter"], db, parameters[action.field]).then(function (defaultValue) {
                        defaultValue = defaultValue || {};
                        var info = createFilterInfo(action.field, action.field, defaultValue, action.filterType, action);
                        filterInfo.push(info);
                    });
                }
            }
        }).then(function () {
            viewOptions.filterInfo = filterInfo;
        });
}

function populateBatchQueries(views, batchQueries) {
    var length = views ? views.length : 0;
    for (var i = 0; i < length; i++) {
        var dashboardView = views[i];
        var alias = dashboardView.alias || dashboardView.id;
        if (dashboardView && dashboardView.view && dashboardView.view.batchQueries) {
            for (var key in dashboardView.view.batchQueries) {
                batchQueries[key] = dashboardView.view.batchQueries[key];
            }
        } else if (dashboardView && dashboardView.view.viewOptions.queryGrid) {
            if (!dashboardView.parent) {
                batchQueries[alias + "__data"] = dashboardView.view.viewOptions.queryGrid;
                if (dashboardView.view.viewOptions.aggregateQueryGrid) {
                    batchQueries[alias + "__aggregateData"] = {
                        $query: dashboardView.view.viewOptions.aggregateQueryGrid,
                        $parent: alias + "__data",
                        $aggregate: true,
                        $fieldInfo: dashboardView.view.viewOptions.aggregateQueryGrid.$fieldInfo
                    };
                }
            }
        }
    }
}

function populateDataInViewOptions(views, result) {
    return Utils.iterateArrayWithPromise(views, function (index, dashboardView) {
        if (dashboardView && dashboardView.view && dashboardView.view.batchQueries) {
            ViewUtility.populateDataInViewOptionsForAggregateView(result, dashboardView.view, true);
            delete dashboardView.view.batchQueries;
        } else {
            if (!dashboardView.parent) {
                var alias = dashboardView.alias || dashboardView.id;
                var newResult = {
                    data: result[alias + "__data"],
                    aggregateData: result[alias + "__aggregateData"]
                };
                ViewUtility.populateDataInViewOptions(newResult, dashboardView.view, true);
            }
        }
    });
}


function getQviewCustomization(sourceid, db) {
    return db.query({$collection: "pl.qviewcustomizations", "$filter": {_id: sourceid}}).then(function (customizationData) {
        if (customizationData && customizationData.result && customizationData.result.length > 0) {
            return customizationData.result[0];
        }
    });
}

function populateProperties(customizationData, view, qviewProperties) {
    for (var i = 0; i < qviewProperties.length; i++) {
        var property = qviewProperties[i];
        if (customizationData[property] === null) {
            delete view[property];
        } else if (customizationData[property] !== undefined) {
            view[property] = customizationData[property];
        }
    }
}

function parseParsableProperties(view, qviewProperties) {
    for (var i = 0; i < qviewProperties.length; i++) {
        var property = qviewProperties[i];
        if (view[property] !== undefined && view[property] !== null && typeof view[property] === "string") {
            var trimData = view[property].trim();
            if (trimData.length > 0) {
                try {
                    view[property] = JSON.parse(trimData);
                } catch (err) {
                    throw new Error(property + "[" + trimData + "] is not parsable.");
                }
            } else {
                delete view[property];
            }
        }
    }
}

function customizeV(v) {
    if (v.$filter !== undefined) {
        v.filter = v.$filter;
        delete v.$filter;
    }
    if (v.$sort !== undefined) {
        v.sort = v.$sort;
        delete v.$sort;
    }
    if (v.$group !== undefined) {
        v.group = v.$group;
        delete v.$group;
    }
    if (v.$unwind !== undefined) {
        v.unwind = v.$unwind;
        delete v.$unwind;
    }
    if (v.$limit !== undefined) {
        v.limit = v.$limit;
        delete v.$limit;
    }
}

function getViewQFields(customizationFields, qviewFields) {
    if (customizationFields && customizationFields.length > 0 && qviewFields && qviewFields.length > 0) {
        mergeCustomization(customizationFields, qviewFields, "qfield", ViewConstants.FieldProperties);
        return qviewFields;
    } else if (customizationFields && customizationFields.length > 0) {
        return customizationFields;
    } else if (qviewFields && qviewFields.length > 0) {
        return qviewFields;
    }
}

function getViewQActions(customizationActions, qviewActions) {
    if (customizationActions && customizationActions.length > 0 && qviewActions && qviewActions.length > 0) {
        mergeCustomization(customizationActions, qviewActions, "qaction", ViewConstants.ActionProperties);
        return qviewActions;
    } else if (customizationActions && customizationActions.length > 0) {
        return customizationActions;
    } else if (qviewActions && qviewActions.length > 0) {
        return qviewActions;
    }
}
function mergeCustomization(customizationFields, qviewFields, exp, properties) {
    for (var i = 0; i < qviewFields.length; i++) {
        var qviewField = qviewFields[i];
        for (var j = 0; j < customizationFields.length; j++) {
            var customizationField = customizationFields[j];
            if (Utils.deepEqual(qviewField[exp]._id, customizationField[exp]._id)) {
                mergeProperties(customizationField, qviewField, properties);
                customizationField.__merged = true;
            }
        }
    }
    for (var i = 0; i < customizationFields.length; i++) {
        var customizationField = customizationFields[i];
        if (customizationField.__merged === undefined) {
            qviewFields.push(customizationField);
        }

    }
}

function mergeProperties(customizationField, qviewField, properties) {
    for (var k = 0; k < properties.length; k++) {
        var property = properties[k];
        if (customizationField[property] === null) {
            delete qviewField[property];
        } else if (customizationField[property] !== undefined) {
            qviewField[property] = customizationField[property];
        }
    }
}