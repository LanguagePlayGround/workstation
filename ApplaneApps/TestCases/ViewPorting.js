var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MongodbManager = require("ApplaneBaas/lib/database/mongodb/MongoDBManager.js");
var SELF = require("./ViewPorting.js");
var MetadataProvider = require("ApplaneBaas/lib/metadata/MetadataProvider.js");
var ServerPort = require("ApplaneCore/ServerPort.js")


exports.portBaasViews = function () {
    var OPTIONS = {ask: "baas", autocommit: true, disablelogs: true};
    DatabaseEngine.executeQuery({table: "views__baas"}, OPTIONS, function (err, data) {
        if (err) {
            console.log("Error while getting views " + err.stack);
        } else {
            var views = data.data;
            Utils.iterateArray(views, function (err) {
                if (err) {
                    console.log("Error while porting views " + err.stack);
                } else {
                    console.log("views ported>>>>");
                }
            }, function (view, callback) {
                var viewId = view.id;
                var tableName = view.table.id;
                if (viewId != tableName) {
                    console.log("going to port view " + viewId);
                    var viewQuery = null;
                    try {
                        viewQuery = JSON.parse(view.query);
                    } catch (err) {
                        console.log("error query parsing " + viewId);
                    }
                    if (!viewQuery) {
                        callback();
                        return;
                    }
                    var orders = viewQuery.orders;
                    if (orders instanceof Array) {
                        var newOrders = {};
                        orders.forEach(function (order) {
                            var orderKeys = Object.keys(order);
                            newOrders[orderKeys[0]] = order[orderKeys[0]];
                        });
                        orders = viewQuery.orders = newOrders;
                    }
                    var operation = {id: view.id, tableid: view.table, applicationid: view.application, query: viewQuery, __type__: "upsert"};
                    MongodbManager.startTransaction(OPTIONS);
                    UpdateEngine.executeUpdate({table: "queries__baas", operations: [operation]}, OPTIONS, function (err) {
                        if (err) {
                            console.log("Error while porting view " + viewId + "  error " + err.stack);
                            callback(err);
                        } else {
                            console.log("View ported>>>" + viewId);
                            MongodbManager.commitTransaction(OPTIONS.txnid, OPTIONS, function (err) {
                                if (err) {
                                    console.log("Error while porting view commit " + viewId + "  error " + err.stack);
                                    callback(err);
                                } else {
                                    callback();
                                }
                            })

                        }
                    });
                } else {
                    callback();
                }
            })
        }
    });
}

exports.portQueryViewIdInTemplate = function () {
    var OPTIONS = {ask: "frontend", autocommit: true, disablelogs: true};
    DatabaseEngine.executeQuery({table: "templates__frontend", columns: ["viewid"], filter: {viewid: {$ne: null}}, childs: [
        {"alias": "queryviewid", query: {table: "queries__baas", columns: ["_id", "id", "tableid"], filter: {organizationid: null, userid: null}}, "relatedcolumn": "id", parentcolumn: "viewid.id", usein: true, onetoone: true}
    ]}, OPTIONS, function (err, data) {
        if (err) {
            console.log("error while geting templates data.>>>" + err.stack);
        } else {
            var tempaltes = data.data;
            tempaltes.forEach(function (tempalte) {
                console.log("template>>>" + JSON.stringify(tempalte))
                if (tempalte.viewid.id == "teachers__baas") {
                    //do nothing here
                } else if (tempalte.queryviewid.id === tempalte.queryviewid.tableid.id) {
                    tempalte.query = {table: tempalte.queryviewid.id};
                } else {
                    tempalte.query = {view: tempalte.queryviewid.id};
                }
                delete tempalte.viewid;
                delete tempalte.queryviewid;
            });
            UpdateEngine.executeUpdate({table: "templates__frontend", "operations": tempaltes, excludejobs: true, excludemodules: true}, OPTIONS, function (err) {
                if (err) {
                    console.log("error while saving queryviewid in templates." + err.stack);
                } else {
                    console.log("Ported>>>>>>>>>>>>>>>>>");
                }
            })
        }
    });
}

exports.portMenus = function () {
    var OPTIONS = {ask: "appsstudio", autocommit: true, disablelogs: true};
    DatabaseEngine.executeQuery({table: "menus__appsstudio", columns: ["label", "applicationid", "visibleexpression", {expression: "parentmenuid", columns: ["label"]}, "filter", "index", "baasview.table.id"], childs: [
        {"alias": "queryviewid", query: {table: "queries__baas", columns: ["_id", "id", "tableid"], filter: {organizationid: null, userid: null}}, "relatedcolumn": "id", parentcolumn: "baasview.table.id", usein: true, onetoone: true}
    ]}, OPTIONS, function (err, data) {
        if (err) {
            console.log("Error while getting menues " + err.stack);
        } else {
            var menus = data.data;
            Utils.iterateArray(menus, function (err) {
                if (err) {
                    console.log("Error while porting menues " + err.stack);
                } else {
                    console.log("Menus ported...............");
                }
            }, function (menu, callback) {
                console.log("porting menu>>>" + JSON.stringify(menu));
                var operation = {type: "Menu", label: menu.label, applicationid: menu.applicationid, visibleExpression: menu.visibleexpression, filter: ((menu.filter && menu.filter.length > 0) ? menu.filter : null ), index: menu.index};
                if (menu.queryviewid) {
                    operation.tableid = menu.queryviewid.tableid;
                    operation.baasviewid = {_id: menu.queryviewid._id, id: menu.queryviewid.id};
                }
                if (menu.parentmenuid) {
                    operation.parentmenuid = {type: "Menu", label: menu.parentmenuid.label, applicationid: menu.applicationid};
                }
                operation.__type__ = "upsert";
                MongodbManager.startTransaction(OPTIONS);
                UpdateEngine.executeUpdate({table: "uimenus__appsstudio", operations: [operation]}, OPTIONS, function (err) {
                    if (err) {
                        console.log("Error while porting menu " + menu.label + "  error " + err.stack);
                        callback(err);
                    } else {
                        console.log("menu ported>>>" + menu.label);
                        MongodbManager.commitTransaction(OPTIONS.txnid, OPTIONS, function (err) {
                            if (err) {
                                console.log("Error while porting menu commit " + menu.label + "  error " + err.stack);
                                callback(err);
                            } else {
                                callback();
                            }
                        })
                    }
                });
            })
        }
    });
}

exports.portViewCustomization = function () {
    var OPTIONS = {ask: "appsstudio", autocommit: true, disablelogs: true};
    DatabaseEngine.executeQuery({table: "menus__appsstudio", columns: ["applicationid", "baasview.table.id", "viewid", "label"], filter: {viewid: {$ne: null}, baasview: {$ne: null}}, childs: [
        {"alias": "queryviewid", query: {table: "queries__baas", columns: ["_id", "id", "query"], filter: {organizationid: null, userid: null}}, "relatedcolumn": "id", parentcolumn: "baasview.table.id", usein: true, onetoone: true}
    ]}, OPTIONS, function (err, data) {
        if (err) {
            console.log("Error while getting menues " + err.stack);
        } else {
            var menus = data.data;
            console.log("menus " + JSON.stringify(menus));
            Utils.iterateArray(menus, function (err) {
                if (err) {
                    console.log("Error while porting view customization. " + err.stack);
                } else {
                    console.log("View customization ported...............");
                }
            }, function (menu, callback) {
                var oldViewId = menu.viewid;
                var newViewId = menu.baasview.table.id;
                var queryViewId = menu.queryviewid;
                portView(oldViewId, newViewId, queryViewId, null, function (err) {
                    if (err) {
                        console.log("Error while menu view " + oldViewId);
                    }
                    callback();
                });

            })
        }
    });
}

function portView(oldViewId, newViewId, queryViewId, mainExpression, callback) {
    console.log("porting view>>>" + oldViewId);
    var OPTIONS = {ask: "appsstudio", autocommit: true, disablelogs: true};
    DatabaseEngine.executeQuery({table: "views__appsstudio", filter: {"id": oldViewId, userid: null, organizationid: null}}, OPTIONS, function (err, viewData) {
        if (err) {
            callback(err);
        } else {
            if (viewData.data.length > 0) {
                var oldViewMetadata = viewData.data[0];
                DatabaseEngine.executeQuery({table: "uiviews__appsstudio", filter: {"id": newViewId, userid: null, organizationid: null}}, OPTIONS, function (err, viewData) {
                    if (err) {
                        callback(err);
                    } else {
                        if (viewData.data.length > 0) {
                            var newViewMetadata = viewData.data[0];
                            var customization = oldViewMetadata.customization;
                            if (customization) {
                                customization = JSON.parse(customization);
                                portChilds(customization.childs, newViewMetadata._id, queryViewId, function (err) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        portColumns(customization.columns, queryViewId, mainExpression, function () {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                portAppsStudioColumns(customization, newViewMetadata._id, queryViewId, mainExpression, function () {
                                                    console.log("view ported>>>" + oldViewId);
                                                    callback();
                                                });
                                            }
                                        });
                                    }
                                })
                            } else {
                                callback();
                            }
                        } else {
                            callback();
                        }
                    }
                });
            } else {
                callback();
            }
        }
    });
}

function isParentEmbdededColumn(expression, childcolumn, columns) {
    var mainExpression = expression;
    var indexOfDot = mainExpression.indexOf(".");
    var startPart = null;
    while (indexOfDot != -1) {
        var firstPart = mainExpression.substr(0, indexOfDot);
        firstPart = startPart ? (startPart + "." + firstPart) : firstPart;
        mainExpression = mainExpression.substr(indexOfDot + 1);
        if (columns[(childcolumn ? (childcolumn + "." + firstPart) : firstPart)].visibility === "Embed") {
            return true;
        } else {
            startPart = firstPart;
            indexOfDot = mainExpression.indexOf(".");
        }
    }
    return false;
}

function portAppsStudioColumns(oldViewMetaData, sourceViewId, queryViewId, childcolumn, callback) {
    var OPTIONS = {ask: "appsstudio", autocommit: true, disablelogs: true};
    var columns = oldViewMetaData.columns || {};
    var query = queryViewId.query;
    var table = query.table;
    MetadataProvider.getTable(table, OPTIONS, function (err, table) {
        if (err) {
            callback(err);
        } else {
            var tableColumns = table.columns;
            var viewColumns = [];
            if (childcolumn) {
                tableColumns = Utils.getColumnObject(childcolumn, tableColumns).columns;
            }
            for (var column in columns) {
                var expression = column;
                if (childcolumn) {
                    if (column.indexOf(childcolumn) === 0) {
                        expression = column.substring(childcolumn.length + 1);
                    } else {
                        expression = null;
                    }
                }
                if (expression) {
                    var columnObject = Utils.getColumnObject(expression, tableColumns);
                    var customizationColumn = columns[column];

                    if (columnObject) {
                        var viewColumn = {};
                        viewColumn._id = columnObject._id;
                        viewColumn.label = customizationColumn.label;
                        viewColumn.width = customizationColumn.width;
                        viewColumn.update = customizationColumn.update;
                        viewColumn.visibleExpression = customizationColumn.tablevisibleexpression
                        viewColumn.editableExpression = customizationColumn.editableexpression
                        viewColumn.parametermappings = customizationColumn.parametermappings;
                        viewColumn.filter = customizationColumn.filter;
                        viewColumn.totalaggregates = customizationColumn.totalaggregates;
                        viewColumn.columngroup = customizationColumn.columngroup;
                        viewColumn.typeEditableExpression = customizationColumn.typeeditableexpression
                        viewColumn.viewDetail = customizationColumn.viewDetail;
                        viewColumn.filterRequiredColumns = customizationColumn.filterRequiredColumns;
                        viewColumn.visibleExpressionPanel = customizationColumn.visibleexpression;

                        var visibility = customizationColumn.visibility;
                        if (visibility === "None") {
                            viewColumn.showOnTable = false;
                            viewColumn.showOnPanel = false;
                            viewColumn.private = true;
                        } else if (visibility === "Off") {
                            viewColumn.showOnTable = false;
                            viewColumn.showOnPanel = false;
                        } else if (visibility === "Query") {
                            viewColumn.showOnTable = true;
                            viewColumn.showOnPanel = false;
                            viewColumn.visibleExpression = false;
                        } else if (visibility === "Embed") {
                            viewColumn.showOnTable = false;
                            viewColumn.showOnPanel = true;
                            viewColumn.uiPanel = "table";
                        } else if (visibility === "Panel") {
                            viewColumn.showOnTable = false;
                            viewColumn.showOnPanel = true;
                        } else if (visibility === "Table") {
                            if (isParentEmbdededColumn(expression, childcolumn, columns)) {
                                viewColumn.showOnTable = false;
                                viewColumn.showOnPanel = true;
                            } else {
                                viewColumn.showOnTable = true;
                                viewColumn.showOnPanel = false;
                            }
                        } else if (visibility === "Both") {
                            var lastIndexOfDot = expression.lastIndexOf(".");
                            if (isParentEmbdededColumn(expression, childcolumn, columns)) {
                                viewColumn.showOnTable = false;
                                viewColumn.showOnPanel = true;
                            } else {
                                viewColumn.showOnTable = true;
                                viewColumn.showOnPanel = true;
                            }
                        }
                        viewColumns.push(viewColumn);
                    }
                }
            }

            var viewColumnSequence = [];
            var oldTableSequence = oldViewMetaData.sequence;
            if (oldTableSequence) {
                console.log("oldTableSequence " + JSON.stringify(oldTableSequence));
                oldTableSequence.forEach(function (column) {
                    var expression = column;
                    if (childcolumn) {
                        if (column.indexOf(childcolumn) === 0) {
                            expression = column.substring(childcolumn.length + 1);
                        } else {
                            expression = null;
                        }
                    }
                    if (expression) {
                        var columnObject = Utils.getColumnObject(expression, tableColumns);
                        if (columnObject) {
                            viewColumnSequence.push(columnObject._id);
                        }
                    }
                });
            }

            var panelViewColumnSequence = [];
            var oldPanelSequence = oldViewMetaData.view ? oldViewMetaData.view.panelsequence : null;
            if (oldPanelSequence) {
                oldPanelSequence.forEach(function (columnId) {
                    var columnObject = getColumnFromId(columnId, tableColumns);
                    if (columnObject) {
                        panelViewColumnSequence.push(columnObject._id);
                    }
                });
            }

            var columnGroups = oldViewMetaData.columngroups || [];
            columnGroups.forEach(function (columnGroup) {
                columnGroup.showColumnLabel = columnGroup.showcolumnlabel;
                columnGroup.showTitle = columnGroup.showtitle;
                delete  columnGroup.showcolumnlabel;
                delete  columnGroup.showtitle;
            });

            var userActions = oldViewMetaData.actions || [];
            userActions.forEach(function (userAction) {
                userAction.filterType = userAction.filtertype;
                delete  userAction.filtertype;

                userAction.displaycolumns = userAction.lookupdisplaycolumns;
                delete  userAction.lookupdisplaycolumns;

                if (userAction.displaycolumns) {
                    if (!(userAction.displaycolumns instanceof Array)) {
                        userAction.displaycolumns = [userAction.displaycolumns];
                    }
                    var firstValue = userAction.displaycolumns[0];
                    if (Utils.isJSONObject(firstValue)) {
                        userAction.displaycolumns = firstValue.expression;
                    } else {
                        userAction.displaycolumns = firstValue;
                    }
                }

                userAction.asParameter = userAction.asparameter;
                delete  userAction.asparameter;

                userAction.invokeType = userAction.invoke_type;
                delete  userAction.invoke_type;

                userAction.jobname = userAction.job_name;
                delete  userAction.job_name;

                var userActionColumns = userAction.columns;
                if (userActionColumns) {
                    userActionColumns.forEach(function (userActionColumn) {
                        userActionColumn.ui = userActionColumn.type;
                        delete userActionColumn.type;
                        userActionColumn.displaycolumns = userActionColumn.lookupdisplaycolumns;
                        delete  userActionColumn.lookupdisplaycolumns;
                        if (userActionColumn.displaycolumns) {
                            if (!(userActionColumn.displaycolumns instanceof Array)) {
                                userActionColumn.displaycolumns = [userActionColumn.displaycolumns];
                            }
                            var firstValue = userActionColumn.displaycolumns[0];
                            if (Utils.isJSONObject(firstValue)) {
                                userActionColumn.displaycolumns = firstValue.expression;
                            } else {
                                userActionColumn.displaycolumns = firstValue;
                            }
                        }
                    });
                }
            });

            if (viewColumns.length > 0 || viewColumnSequence.length > 0 || panelViewColumnSequence.length > 0 || columnGroups.length > 0 || userActions.length > 0) {
                var operation = {_id: sourceViewId};
                if (viewColumns.length > 0) {
                    operation.columns = {data: viewColumns, override: true};
                }
                if (viewColumnSequence.length > 0) {
                    operation.sequence = {data: viewColumnSequence, override: true};
                }

                if (panelViewColumnSequence.length > 0) {
                    operation.sequencePanel = {data: panelViewColumnSequence, override: true};
                }

                if (userActions.length > 0) {
                    operation.actions = {data: userActions, override: true};
                }

                if (columnGroups.length > 0) {
                    operation.columngroups = {data: columnGroups, override: true};
                }

                MongodbManager.startTransaction(OPTIONS);
                UpdateEngine.executeUpdate({table: "uiviews__appsstudio", operations: [operation]}, OPTIONS, function (err) {
                    if (err) {
                        console.log("Error while saving column in ui view " + queryViewId.id + "  error " + err.stack);
                        callback(err);
                    } else {
                        console.log("saving ui viewcolumn ported>>>" + queryViewId.id);
                        MongodbManager.commitTransaction(OPTIONS.txnid, OPTIONS, function (err) {
                            if (err) {
                                console.log("Error while saving column in ui view commit " + queryViewId.id + "  error " + err.stack);
                                callback(err);
                            } else {
                                callback();
                            }
                        });
                    }
                });
            } else {
                callback();
            }
        }
    })
}

function getColumnFromId(columnId, columns) {
    if (columns) {
        var length = columns.length;
        for (var i = 0; i < length; i++) {
            var column = columns[i];
            if (column._id == columnId) {
                return column;
            } else if (columns.columns) {
                return getColumnFromId(columnId, columns.columns);
            }
        }
    }
}

function portColumns(columns, queryViewId, childcolumn, callback) {
    if (columns) {
        var query = queryViewId.query;
        query.fields = {};
        query.aggregates = {};
        for (var column in columns) {
            var expression = column;
            var customizationColumn = columns[column];
            var visibility = customizationColumn.visibility;
            if (childcolumn) {
                if (column.indexOf(childcolumn) === 0) {
                    expression = column.substring(childcolumn.length + 1);
                } else {
                    expression = null;
                }
            }
            if (expression) {
                if (visibility === "None") {
                    query.fields[expression] = 0;
                } else if (visibility === "Off") {
                    query.fields[expression] = 0;
                } else if (visibility === "Query") {
                    query.fields[expression] = 1;
                } else if (visibility === "Embed") {
                    query.fields[expression] = 0;
                } else if (visibility === "Panel") {
                    query.fields[expression] = 0;
                } else if (visibility === "Table") {
                    if (isParentEmbdededColumn(expression, childcolumn, columns)) {
                        query.fields[expression] = 0;
                    } else {
                        query.fields[expression] = 1;
                    }
                } else if (visibility === "Both") {
                    if (isParentEmbdededColumn(expression, childcolumn, columns)) {
                        query.fields[expression] = 0;
                    } else {
                        query.fields[expression] = 1;
                    }
                }

                if (columns[column].totalaggregates) {
                    query.aggregates[expression] = columns[column].totalaggregates;
                }
            }
        }
        var OPTIONS = {ask: "appsstudio", autocommit: true, disablelogs: true};
        var operation = {_id: queryViewId._id, query: query};
        MongodbManager.startTransaction(OPTIONS);
        UpdateEngine.executeUpdate({table: "queries__baas", operations: [operation]}, OPTIONS, function (err) {
            if (err) {
                console.log("Error while saving column in baas " + queryViewId.id + "  error " + err.stack);
                callback(err);
            } else {
                console.log("saving column ported>>>" + queryViewId.id);
                MongodbManager.commitTransaction(OPTIONS.txnid, OPTIONS, function (err) {
                    if (err) {
                        console.log("Error while saving column in baas commit " + queryViewId.id + "  error " + err.stack);
                        callback(err);
                    } else {
                        callback();
                    }
                });
            }
        });
    } else {
        callback();
    }

}

function portChilds(childs, sourceViewId, mainQueryViewId, callback) {
    if (childs) {
        Utils.iterateArrayWithIndex(childs, callback, function (index, child, callback) {
            var childOldViewId = child.viewid;
            var filter = child.filter;
            var childOldBaasView = child.view;
            var label = child.label;
            var parametermappings = child.parametermappings;
            var childcolumn = child.childcolumn;
            if (childcolumn && childcolumn.length > 0) {
                var childOldBaasViewId = childOldBaasView.id;
                childOldBaasView.id = childOldBaasView.id + "." + childcolumn;
                if (filter) {
                    for (var filterExp in filter) {
                        filter[childOldBaasViewId + "." + filterExp] = filter[filterExp];
                        delete filter[filterExp];
                    }
                }
            }
            if (mainQueryViewId.id === childOldBaasView.id) {
                callback();
            } else {
                var OPTIONS = {ask: "appsstudio", autocommit: true, disablelogs: true};
                DatabaseEngine.executeQuery({table: "queries__baas", filter: {"id": childOldBaasView.id, userid: null, organizationid: null}}, OPTIONS, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        var queries = data.data;
                        if (queries.length > 0) {
                            var childQueryView = queries[0];
                            var operation = {type: "Child", label: label, sourceviewid: {_id: sourceViewId}, filter: filter, index: index, parametermappings: parametermappings};
                            operation.tableid = childQueryView.tableid;
                            operation.baasviewid = {_id: childQueryView._id, id: childQueryView.id};
                            operation.__type__ = "upsert";
                            MongodbManager.startTransaction(OPTIONS);
                            UpdateEngine.executeUpdate({table: "uimenus__appsstudio", operations: [operation]}, OPTIONS, function (err) {
                                if (err) {
                                    console.log("Error while porting child " + label + "  error " + err.stack);
                                    callback(err);
                                } else {
                                    console.log("child ported>>>" + label);
                                    MongodbManager.commitTransaction(OPTIONS.txnid, OPTIONS, function (err) {
                                        if (err) {
                                            console.log("Error while porting child commit " + label + "  error " + err.stack);
                                            callback(err);
                                        } else {
                                            portView(childOldViewId, childQueryView.id, childQueryView, childcolumn, callback);
                                        }
                                    });
                                }
                            });
                        } else {
                            callback();
                        }
                    }
                });
            }
        });
    } else {
        callback();
    }
}

var commandStr = ServerPort.getCommandLineArgument("command");
if (commandStr == 'portbaasview') {
    SELF.portBaasViews();
} else if (commandStr == 'porttemplatequery') {
    SELF.portQueryViewIdInTemplate();
} else if (commandStr == 'portmenus') {
    SELF.portMenus();
} else if (commandStr == 'portviewcustomization') {
    SELF.portViewCustomization();
} else {
    console.log("Unknown command " + commandStr);
}
