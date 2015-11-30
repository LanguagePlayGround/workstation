/***** move to app-models.js to generate minified version for before commit*******/

(function (definition) {

    if (typeof exports === "object") {
        module.exports = definition();
    } else {
        RowDataModel = definition();
    }

})(function () {
    "use strict";
    var Utility = require("ApplaneCore/apputil/util.js");
    var RowDataModel = function (index, query, dataModel) {
        this.index = index;
        this.query = query;
        this.dataModel = dataModel;
    }

    RowDataModel.prototype.setParentData = function (data) {
        this.dataModel.setData(data);
    }
    RowDataModel.prototype.save = function (options) {
        return this.dataModel.save(options);
    }


    RowDataModel.prototype.insert = function () {
        return this.dataModel.insert();
    }

    RowDataModel.prototype.getSelectedRow = function () {
        return this.getData();
    }

    RowDataModel.prototype.getData = function (index) {
        if (index == undefined) {
            index = this.index;
        }
        if (index === undefined) {
            alert("Index is not defined while getting getRow in dataModel")
        }
        var data = this.dataModel.getData(index);
        return data;
    }

    RowDataModel.prototype.getDataClone = function () {
        var index = this.index;
        if (index === undefined) {
            alert("Index is not defined while getting getRow in dataModel")
        }
        var data = this.dataModel.getDataClone(index);
        return data;
    }

    function mergeData(oldData, newData) {
        for (var k in newData) {
            var newValue = newData[k];
            if (oldData[k] === undefined || Array.isArray(newValue) || typeof newValue === "string") {
                oldData[k] = Utility.deepClone(newValue)
            } else if (Utility.isJSONObject(newValue) && Utility.isJSONObject(oldData[k])) {
                mergeData(oldData[k], newValue);
            } else {
                oldData[k] = Utility.deepClone(newValue)
            }
        }
    }


    RowDataModel.prototype.refresh = function (result) {
        try {
            var Q = require("q");
            var D = Q.defer();
            var data = this.getData();
            var cloneData = this.getDataClone();
            if (this.query && this.query.$fields) {
                var _id = data._id;
                if (data.__insert__) {
                    D.resolve(data);
                    return D.promise;
                }

                var newQuery = Utility.deepClone(this.query);
                var parentParameters = this.dataModel.query && this.dataModel.query.$parameters ? Utility.deepClone(this.dataModel.query.$parameters) : {};
                newQuery.$parameters = newQuery.$parameters || {};
                for (var k in parentParameters) {
                    if (newQuery.$parameters[k] === undefined) {
                        newQuery.$parameters[k] = parentParameters[k];
                    }
                }
                if (!_id && (!(newQuery.$filter) || (Object.keys(newQuery.$filter).length == 0))) {
                    D.reject(new Error("_id not found while refresh row data model"));
                    return D.promise;
                } else if (_id) {
                    newQuery.$filter = {_id: _id};
                }

                var that = this;
                resolveQuery(newQuery, that.dataModel.db, result, that.metadata).then(
                    function (result) {
                        var resultData = result.response.result;
                        if (resultData.length == 0) {
                            throw (new Error("No result found for Detail"));
                            return;
                        }
                        resultData = resultData[0];

                        mergeData(data, resultData)
                        mergeData(cloneData, resultData)
//                        for (var k in resultData) {
//                            cloneData[k] = Utility.deepClone(resultData[k]);
//                        }
                        that.dataModel.setLastProcessedResult();
                        D.resolve(data);
                    }).fail(function (err) {
//                        alert(">>>Row Datamodel refresh error>>>" + err);
                        D.reject(err);
                    });
            } else {
                D.resolve(data);
            }
            return D.promise;

        }
        catch (e) {
            alert(e.message + "\n" + e.stack);
            throw e;
        }


    }


    // result is passed to refreshFormDataModel method to reload the data of grid and form views used in advanced dashboards (by manjeet sangwan)
    // if the result is passed then the query is skipped and the same result is used
    function resolveQuery(query, db, result, metadata) {
        if (result) {
            var Q = require("q");
            var D = Q.defer();
            D.resolve({"response": {"result": result.result || [], "dataInfo": result ? result.dataInfo : {"hasNext": false}}, "status": "ok", "code": 200});
            return D.promise;
        } else {
            var options = undefined;
            if(metadata && metadata.token){
                options = {};
                options.token = metadata.token;
            }
            return db.query(query, options);
        }
    }

    RowDataModel.prototype.fireEvents = function (event, err, response) {
        this.dataModel.fireEvents(event, err, response);
    }

    RowDataModel.prototype.setIndex = function (index) {
        var data = this.dataModel.getData();
        var dataCount = data ? data.length : 0;
        if (index >= dataCount || index < 0) {
            throw new Error("Index out of bound");
        }
        this.index = index;
    }
    RowDataModel.prototype.getIndex = function () {
        return this.index;
    }

    RowDataModel.prototype.uploadFile = function (name, type, contents) {
        return this.dataModel.uploadFile(name, type, contents);
    }

    RowDataModel.prototype.getCurrentRow = function () {
        return this.dataModel.getCurrentRow(this.index);
    }

    RowDataModel.prototype.handleValueChange = function () {
        return this.dataModel.handleValueChange();
    }

    //Required for FK --> will return current row + query parameters
    RowDataModel.prototype.getRowParameters = function () {
        return this.dataModel.getRowParameters(this.index);
    }

    RowDataModel.prototype.invoke = function (functionName, parameters, options) {
        return this.dataModel.invoke(functionName, parameters, options);
    }

    RowDataModel.prototype.fkQuery = function (query, field, value, options) {
        return this.dataModel.fkQuery(query, field, value, options);
    }

    RowDataModel.prototype.getUpdatedData =function(){
        return this.dataModel.getUpdatedData();
    }

    RowDataModel.prototype.isTriggeringEvents = function(){
        return this.dataModel.isTriggeringEvents();
    }

    RowDataModel.prototype.cleanDataModel = function () {
        delete this.db ;
        delete this.query ;
        delete this.metadata ;
        delete this.callbacks;
        delete this.data ;
        delete this.dataClone;
        delete this.triggeringEvents ;
        delete this.lastProcessedResult;
        delete this.dataInfo
        delete this.aggregateData ;
    }

    return RowDataModel;
});

