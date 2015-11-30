/***** move to app-models.js to generate minified version for before commit*******/

(function (definition) {

    if (typeof exports === "object") {
        module.exports = definition();
    } else {
        FieldDataModel = definition();
    }

})(function () {
    "use strict";
    var Utility = require("ApplaneCore/apputil/util.js");
    var FieldDataModel = function (field, rowDataModel) {
        this.field = field;
        this.rowDataModel = rowDataModel;
    }


    FieldDataModel.prototype.getData = function (index) {
        if (this.field === undefined) {
            alert("field is not defined while getting dataData in FieldDataModel")
        }
        var data = this.rowDataModel.getData();
        data = Utility.resolveDot(data, this.field);
        if(this.keyMapping === undefined){
            Utility.populateDataKeyMapping(data, this);
        }
        if (index !== undefined) {
            return data[index];
        } else {
            return data;
        }
    }

    FieldDataModel.prototype.getDataClone = function (index) {
        if (this.field === undefined) {
            alert("field is not defined while getting dataData in FieldDataModel")
        }
        var data = this.rowDataModel.getDataClone();
        data = data ? Utility.resolveDot(data, this.field) : undefined;
        if (index !== undefined) {
            return data ? data[index] : undefined;
        } else {
            return data;
        }
    }


    FieldDataModel.prototype.setParameters = function (parameters) {

    }
    FieldDataModel.prototype.refresh = function () {
        var Q = require("q");
        var D = Q.defer();
        var data = this.getData();
        Utility.populateDataKeyMapping(data, this);
        this.fireEvents("onRefresh", undefined, data);
        D.resolve(data);
        return D.promise;
    }
    FieldDataModel.prototype.fireEvents = function (event, err, response) {
        if (this.callbacks && this.callbacks[event]) {
            for (var i = 0; i < this.callbacks[event].length; i++) {
                this.callbacks[event][i](err, response);
            }
        }
    }
    FieldDataModel.prototype.setData = function (newData) {
        if (this.field === undefined) {
            alert("field is not defined while getting dataData in FieldDataModel")
        }
        var data = this.rowDataModel.getData();
        Utility.populateDataKeyMapping(data, this);
        Utility.putDottedValue(data, this.field, newData);

    }

    FieldDataModel.prototype.getKeyMapping = function () {
        if(this.keyMapping){
            return this.keyMapping;
        }
        var data=this.getData();
        Utility.populateDataKeyMapping(data, this);
        return this.keyMapping;



    }

    FieldDataModel.prototype.populateKeyMapping = function () {
        var data=this.getData();
        Utility.populateDataKeyMapping(data, this);
    }

    FieldDataModel.prototype.insert = function (newRecord) {
        var Q = require("q");
        var D = Q.defer();
        var data = this.getData();      //TODO: data comes in blank object instead of array
        var insertId = Utility.getUniqueTempId();
        newRecord = newRecord || {};
        newRecord.__insert__ = true;
        newRecord._id = insertId;
        data.push(newRecord);
        Utility.populateDataKeyMapping(data, this);
        D.resolve({entity: newRecord, index: data.length - 1});
        return D.promise;
    }

    FieldDataModel.prototype.delete = function (deletedRows) {


        var that = this;

        var data = that.getData();
        Utility.sort(deletedRows, "desc");
        for (var i = 0; i < deletedRows.length; i++) {
            data.splice(deletedRows[i], 1);
        }
        Utility.populateDataKeyMapping(data, that);
        var Q = require("q");
        var D = Q.defer();
        D.resolve();
        return D.promise;

    }

    FieldDataModel.handleDelete = function (fieldRow, fieldModel) {
        var Document = require("ApplaneDB/lib/Document.js");
        var DataModel = require("./DataModel.js");
        var oldValue = {_id: fieldRow._id};
        var doc = new Document(fieldRow, oldValue, "update");
        var updatedFields = doc.getRevisedUpdatedFields();
        return Utility.iterateArrayWithPromise(updatedFields,
            function (index, updatedField) {
                var nestedDocs = doc.getDocuments(updatedField);
                if (nestedDocs) {
                    if (!Array.isArray(nestedDocs)) {
                        nestedDocs = [nestedDocs];
                    }
                    return Utility.iterateArrayWithPromise(nestedDocs, function (nestedDocIndex, nestedDoc) {
                        return DataModel.handleDelete(nestedDoc.updates, fieldModel);
                    })
                } else {
                    return;
                }
            }).then(function () {
                for (var k in fieldRow) {
                    if (k !== "_id") {
                        fieldRow[k] = null;
                    }
                }
                return fieldModel.handleValueChange();

            })


    }


    FieldDataModel.prototype.uploadFile = function (name, type, contents) {
        return this.rowDataModel.uploadFile(name, type, contents);
    }

    FieldDataModel.prototype.getCurrentRow = function () {
        return this.rowDataModel.getCurrentRow();
    }

    FieldDataModel.prototype.on = function (event, callback) {
        this.callbacks = this.callbacks || {};
        this.callbacks[event] = this.callbacks[event] || [];
        this.callbacks[event].push(callback);
    }

    FieldDataModel.prototype.handleValueChange = function () {
        return this.rowDataModel.handleValueChange();
    }

    FieldDataModel.prototype.getRowParameters = function (index) {

        var currentRow = undefined;
        if (index === undefined) {
            currentRow = this.getCurrentRow() || {};
        } else {
            var data = this.getData();
            currentRow = data[index];
        }

        currentRow = Utility.deepClone(currentRow);
        var parentRow = this.rowDataModel.getRowParameters() || {};
        parentRow = Utility.deepClone(parentRow);
        for (var k in parentRow) {
            if (currentRow[k] === undefined) {
                currentRow[k] = parentRow[k];
            }
        }
        return currentRow;
    }

    FieldDataModel.prototype.invoke = function (functionName, parameters, options) {
        return this.rowDataModel.invoke(functionName, parameters, options);
    }

    FieldDataModel.prototype.fkQuery = function (query, field, value, options) {
        return this.rowDataModel.fkQuery(query, field, value, options);
    }

    FieldDataModel.prototype.isTriggeringEvents = function(){
        return this.rowDataModel.isTriggeringEvents();
    }

    FieldDataModel.prototype.cleanDataModel = function () {
        delete this.db;
        delete this.query;
        delete this.metadata ;
        delete this.callbacks;
        delete this.data;
        delete this.dataClone;
        delete this.triggeringEvents;
        delete this.lastProcessedResult;
        delete this.dataInfo;
        delete this.aggregateData;
    }


    return FieldDataModel;
});