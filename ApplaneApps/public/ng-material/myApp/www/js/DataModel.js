/***** move to app-models.js to generate minified version for before commit*******/
(function (definition) {

    if (typeof exports === "object") {
        module.exports = definition();
    } else {
        DataModel = definition();
    }

})(function () {
    "use strict";
    var Utility = require("ApplaneCore/apputil/util.js");

    var DataModel = function (query, data, metadata, db) {
        this.db = db;
        this.query = query;


        this.metadata = metadata || {};
        DataModel.populateEvents(this.metadata.events);
        this.metadata.idFields = ["_id"];
        this.callbacks = undefined;
        this.dataClone = undefined;
        this.selectedRows = undefined;
        this.$transientData = undefined;
        this.setData(data);

    }


    DataModel.populateEvents = function (events) {
        if (!events) {
            return;
        }
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            var eventDef = event.event;
            var indexOf = eventDef.indexOf(":");
            if (indexOf < 0) {
                event.eventName = eventDef;
            } else {
                event.eventName = eventDef.substring(0, indexOf);
                event.fields = JSON.parse(eventDef.substring(indexOf + 1));
            }
        }
    }

    function ensure_ID(data) {
        if (!data) {
            return;
        }
        for (var i = data.length - 1; i >= 0; i--) {
            var row = data[i];
            if (row.__insert__ && !row._id) {
                row._id = Utility.getUniqueTempId();
            }
            for (var key in row) {
                if (Array.isArray(row[key])) {
                    ensure_ID(row[key]);
                }
            }
        }

    }

    function removeInsertAndDelete(data) {
        if (!data) {
            return;
        }
        for (var i = data.length - 1; i >= 0; i--) {
            var row = data[i];
            if (row.__insert__) {
                data.splice(i, 1);
                continue;
            }
            for (var key in row) {
                if (Array.isArray(row[key])) {
                    removeInsertAndDelete(row[key]);
                }
            }
        }

    }

    DataModel.cloneData = function (dataModel) {
        dataModel.dataClone = Utility.deepClone(dataModel.data);
        if (dataModel.metadata && dataModel.metadata.autoUpdates) {
            removeInsertAndDelete(dataModel.dataClone);
        }
    }

    DataModel.getFKUpdates = function (value, field, dataModel) {
        if (!value) {
            return value;
        }
        if (!Utility.isJSONObject(value)) {
            return undefined;
        }
        value = Utility.deepClone(value);
//        delete value.$$hashKey;
        if (!field.upsert) {
            if (value && !value._id) {
                throw new Error("_id is must if field is not upsert >>>" + JSON.stringify(value) + ">>Field>>>>" + JSON.stringify(field));
            } else {
                return value;
            }

        }
        if (!field.displayField) {
            alert("In upsert, display field is mandatory but not found in field >>" + JSON.stringify(field) + ">>Value>>>" + JSON.stringify(value));
            throw new Error("In upsert, display field is mandatory but not found in field >>" + JSON.stringify(field) + ">>Value>>>" + JSON.stringify(value));
            return;
        }
//        if (!value[field.displayField]) {
//            alert("In upsert, display field value is mandatory but not found in field >>" + JSON.stringify(field) + ">>Value>>>" + JSON.stringify(value));
//            throw new Error("In upsert, display field value is mandatory but not found in field >>" + JSON.stringify(field) + ">>Value>>>" + JSON.stringify(value));
//            return;
//        }
        var newUpdates = {$query:{}}
        if (value._id) {
            newUpdates.$query["_id"] = value._id;
        } else {
            var upsertFields = field.upsertFields;
            if ((!upsertFields) || upsertFields.length == 0) {
                upsertFields = [field.displayField]
            }
            for (var i = 0; i < upsertFields.length; i++) {
                var upsertField = upsertFields[i];
                newUpdates.$query[upsertField] = value[upsertField] !== undefined ? value[upsertField] : null;
            }
        }

        if (field.otherDisplayFields) {
            for (var i = 0; i < field.otherDisplayFields.length; i++) {
                newUpdates.$query[field.otherDisplayFields[i]] = value[field.otherDisplayFields[i]];
            }
        }
//        delete value[field.displayField];
        if (Object.keys(value).length > 0) {
            if (field.fields && field.fields.length > 0) {
                var nestedUpdates = DataModel.getUpdatedRows(dataModel, false, [value], undefined, undefined, field.fields, [], true);
                if (nestedUpdates && nestedUpdates.$insert && nestedUpdates.$insert.length > 0) {
                    newUpdates.$set = nestedUpdates.$insert[0];
                }
            }
        }
        return newUpdates;


    }

    function removeSpecialCharactor(data, removeChar) {
        if (!data && !removeChar) {
            return;
        }
        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                var dataObj = data[i];
                removeSpecialCharactor(dataObj, removeChar)
            }
        } else if (Utility.isJSONObject(data)) {
            for (var key in data) {
                if (Array.isArray(data[key])) {
                    removeSpecialCharactor(data[key], removeChar);
                } else {
                    for (var i = 0; i < removeChar.length; i++) {
                        var removeVal = removeChar[i];
                        if (removeVal == key) {
                            if (removeVal == '_id' && (!Utility.isTemp(data[key]))) {
                                continue;
                            }
                            delete data[key];
                        }
                    }
                }
            }
        }
    }

    DataModel.getUpdatedRows = function (dataModel, root, data, dataClone, $transientData, fields, idFields, insertAsOverride) {
        try {
            if (!fields) {
                alert("Error>>>No fields defined in datamodel");
                return;
            }

            var updatedRows = undefined;

            if (dataClone) {
                for (var i = 0; i < dataClone.length; i++) {
                    var dataCloneRecord = dataClone[i];
                    if (dataCloneRecord._id && Utility.isJSONObject(dataCloneRecord._id)) {
                        /*skip iteration if _id is object as this case leads error in groupby case : NAVEEN SINGH*/
                        continue;
                    }
                    if (Utility.isExists(data, dataCloneRecord, "_id") === undefined) {
                        updatedRows = updatedRows || {};
                        updatedRows.$delete = updatedRows.$delete || [];
                        updatedRows.$delete.push({_id:dataCloneRecord._id})
                    }
                }
            }

            var dataCount = data ? data.length : 0;
            for (var i = 0; i < dataCount; i++) {

                var unwindColumns = dataModel.query ? dataModel.query.$unwind : undefined;
                var filter = {"_id":data[i]._id};
                if (unwindColumns) {
                    for (var j = 0; j < unwindColumns.length; j++) {
                        var exp = unwindColumns[j];
                        if (data[i][exp]) {
                            filter[exp + "._id"] = data[i][exp]._id;
                        }
                    }
                }
                //var oldIndex = Utility.isExists(dataClone, data[i], "_id");
                var oldIndex = -1;
                var dataCloneCount = dataClone ? dataClone.length : 0;
                for (var j = 0; j < dataCloneCount; j++) {
                    if (Utility.evaluateFilter(filter, dataClone[j])) {
                        oldIndex = j;
                    }
                }
                var asInsert = oldIndex >= 0 ? false : true;


                var updatedRecord = data[i];
                if (updatedRecord._id && Utility.isJSONObject(updatedRecord._id)) {
                    /*skip iteration if _id is object as this case leads error in groupby case : NAVEEN SINGH*/
                    continue;
                }
                var oldRecord = undefined;
                if (asInsert) {
                    oldRecord = {};
                } else {
                    oldRecord = dataClone[oldIndex];
                }

                if (Utility.deepEqual(updatedRecord, oldRecord)) {
                    continue;
                }
                var updates = {};
                var updated = false;
                for (var j = 0; j < fields.length; j++) {
                    var field = fields[j];
                    var fieldExpression = field.field;
                    var updatedValue = updatedRecord[fieldExpression];
                    var oldValue = oldRecord[fieldExpression];

                    if (Utility.deepEqual(updatedValue, oldValue)) {
                        continue;
                    }
                    if (updatedValue === "" && !insertAsOverride) {
                        //NOTE: we will not set updatedValue to undefined if insertAsOverride is true.
                        updatedValue = undefined;
                    }
                    if (updatedValue !== undefined) {
                        if (field.type == 'file' && field.multiple) {
//                            removeSpecialCharactor(updatedValue, ['$$hashKey', '_id']);
                        } else if (field.type == "number") {
                            if (updatedValue !== null) {
                                updatedValue = Number(updatedValue);
                            }
                        } else if (field.type == "date") {
                            var timeEnabled = field.time;
                            if ((updatedValue instanceof Date) && (!timeEnabled)) {
                                updatedValue = Utility.setDateWithZeroTimezone(updatedValue);
                            }
                        } else if (field.multiple && field.type == "string" && !angular.isArray(updatedValue)) {
                            updatedValue = JSON.parse(updatedValue);
                        } else if (field.fields && field.multiple) {
                            if (Utility.isJSONObject(updatedValue)) {
                                updatedValue = [updatedValue];
                            }
                            if (Utility.isJSONObject(oldValue)) {
                                oldValue = [oldValue];
                            }
                            updatedValue = DataModel.getUpdates(dataModel, false, updatedValue, oldValue, undefined, field.fields, ["_id"], insertAsOverride);
                            if (insertAsOverride && updatedValue && updatedValue.$insert) {
                                updatedValue = updatedValue.$insert;
                            } else if (insertAsOverride && !updatedValue) {
                                updatedValue = [];                        //for upsert in fk - nested table, if remove all values then [ ] should be gone
                            }
                        } else if (field.type == "fk" && field.multiple) {
                            var newUpdatedFieldValue = undefined;
                            if (updatedValue) {
                                for (var k = 0; k < updatedValue.length; k++) {
                                    var updatedValueFieldRecord = updatedValue[k];
                                    var foundInOld = false;
                                    if (updatedValueFieldRecord._id && oldValue) {
                                        for (var l = 0; l < oldValue.length; l++) {
                                            var oldValueFieldRecord = oldValue[l];
                                            if (oldValueFieldRecord._id && oldValueFieldRecord._id == updatedValueFieldRecord._id) {
                                                foundInOld = true;
                                                break;
                                            }

                                        }
                                    }
                                    if (!foundInOld) {
                                        newUpdatedFieldValue = newUpdatedFieldValue || {};
                                        newUpdatedFieldValue.$insert = newUpdatedFieldValue.$insert || [];
                                        updatedValueFieldRecord = Utility.deepClone(updatedValueFieldRecord);
                                        if (updatedValueFieldRecord._id && Utility.isTemp(updatedValueFieldRecord._id)) {
                                            updatedValueFieldRecord._id = undefined;
                                        }
                                        updatedValueFieldRecord = DataModel.getFKUpdates(updatedValueFieldRecord, field, dataModel);
//                                        delete updatedValueFieldRecord.$$hashKey;
                                        newUpdatedFieldValue.$insert.push(updatedValueFieldRecord)
                                    }
                                }
                            }

                            if (oldValue) {
                                for (var l = 0; l < oldValue.length; l++) {
                                    var oldFoundInNew = false;
                                    var oldValueFieldRecord = oldValue[l];

                                    if (updatedValue) {
                                        for (var k = 0; k < updatedValue.length; k++) {
                                            var updatedValueFieldRecord = updatedValue[k];
                                            if (oldValueFieldRecord._id && oldValueFieldRecord._id == updatedValueFieldRecord._id) {
                                                oldFoundInNew = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (!oldFoundInNew) {
                                        newUpdatedFieldValue = newUpdatedFieldValue || {};
                                        newUpdatedFieldValue.$delete = newUpdatedFieldValue.$delete || [];
                                        newUpdatedFieldValue.$delete.push({_id:oldValueFieldRecord._id})
                                    }


                                }
                            }

                            updatedValue = newUpdatedFieldValue;
                            if (insertAsOverride && updatedValue && updatedValue.$insert) {
                                updatedValue = updatedValue.$insert;
                            }
                        } else if (field.type == "duration") {
                            updatedValue = populateUDTUpdates(oldValue, updatedValue, updatedRecord, insertAsOverride, "time", "unit");
                        } else if (field.type == "currency") {
                            updatedValue = populateUDTUpdates(oldValue, updatedValue, updatedRecord, insertAsOverride, "amount", "type");
                        } else if (field.type == "daterange") {
                            updatedValue = populateUDTUpdates(oldValue, updatedValue, updatedRecord, insertAsOverride, "from", "to");
                        } else if (field.type == "fk") {
                            updatedValue = DataModel.getFKUpdates(updatedValue, field, dataModel);
                        }
                        if (updatedValue !== undefined) {
                            updated = true;
                            if (field.transient) {
                                dataModel.ensureTransient(updatedRecord);
                                var $transientValue = DataModel.getTransientValue(root, $transientData, updatedRecord);
                                $transientValue[fieldExpression] = updatedValue;
                            } else if (asInsert || insertAsOverride) {
                                updates[fieldExpression] = updatedValue;
                            } else {
                                if (updatedValue === undefined || updatedValue === null) {
                                    updates.$unset = updates.$unset || {};
                                    updates.$unset[fieldExpression] = "";
                                } else {
                                    updates.$set = updates.$set || {};
                                    updates.$set[fieldExpression] = updatedValue;
                                }

                            }

                        }

                    } else if (!asInsert && !insertAsOverride && oldValue !== undefined) {
                        if (dataModel && dataModel.metadata && dataModel.metadata.setAsNull) {
                            updated = true;
                            updates.$set = updates.$set || {};
                            updates.$set[fieldExpression] = null;
                        } else {
                            updated = true;
                            updates.$unset = updates.$unset || {};
                            updates.$unset[fieldExpression] = "";
                        }
                    }
                }
                if (updated) {
                    var $transientValue = undefined;
                    if (root && $transientData) {
                        $transientValue = DataModel.getTransientValue(root, $transientData, updatedRecord);
                    }

                    if (root && dataModel.metadata && dataModel.metadata.upsert) {
                        var upsertFields = dataModel.metadata.upsertFields;
                        if (!upsertFields) {
                            throw new Error("UpsertFields is mandatory when upsert is defined.")
                        }
                        upsertFields = JSON.parse(upsertFields);
                        if (upsertFields && upsertFields.length > 1) {
                            throw new Error("UpsertFields length cannot be greater than one");
                        } else {
                            if (upsertFields[0] !== "_id") {
                                throw new Error("UpsertFields Cannot be other than _id");
                            }
                        }

                        if ($transientValue) {
                            updates.$transient = $transientValue;
                        }
                        var query = {};
                        for (var j = 0; j < upsertFields.length; j++) {
                            var upsertField = upsertFields[j];
                            if (updatedRecord[upsertField] !== undefined) {
                                query[upsertField] = updatedRecord[upsertField];
                                delete updatedRecord[upsertField];
                            } else {
                                query[upsertField] = null;
                            }
                        }
                        delete updatedRecord._id;
                        updates.$query = query;
//                        updates.$set = updatedRecord; //temp by rohit and manjeet, currently only _id is supported as upsert field requried for qviewcustomization saving
                        updatedRows = updatedRows || {};
                        updatedRows.$upsert = updatedRows.$upsert || [];
                        updatedRows.$upsert.push(updates)
                    } else if (asInsert) {
                        DataModel.putIdColumnValue(updatedRecord, updates, idFields);
                        if ($transientValue) {
                            updates.$transient = $transientValue;
                        }
                        updatedRows = updatedRows || {};
                        updatedRows.$insert = updatedRows.$insert || [];
                        updatedRows.$insert.push(updates)
                    } else {
                        DataModel.putIdColumnValue(updatedRecord, updates, idFields);
                        if ($transientValue) {
                            updates.$transient = $transientValue;
                        }
                        updatedRows = updatedRows || {};
                        updatedRows.$update = updatedRows.$update || [];
                        updatedRows.$update.push(updates)
                    }

                }


            }

            return updatedRows;
        } catch (e) {
            alert(e.message + "\n" + e.stack);
            throw e;
        }
    }

    function populateUDTUpdates(oldValue, updatedValue, updatedRecord, insertAsOverride, exp, type) {
        var oldExp = oldValue ? oldValue[exp] : undefined;
        var oldType = oldValue ? oldValue[type] : undefined;
        var newExp = updatedValue ? updatedValue[exp] : undefined;
        var newType = updatedValue ? updatedValue[type] : undefined;
        var udtUpdates = {};

        var expChanged = true;
        if ((oldExp === undefined || oldExp === null) && (newExp === undefined || newExp === null)) {
            expChanged = false;
        } else if (Utility.deepEqual(oldExp, newExp)) {
            expChanged = false;
        }
        if (expChanged) {
            udtUpdates[exp] = newExp;
        }
        var typeChanged = true;
        if ((oldType === undefined || oldType === null) && (newType === undefined || newType === null)) {
            typeChanged = false;
        } else if (Utility.deepEqual(newType, oldType)) {
            typeChanged = false;
        }
        if (typeChanged) {
            udtUpdates[type] = newType;
        }
        if (expChanged && typeChanged && !newExp && !newType) {
            udtUpdates = null;
        }
        if (udtUpdates === null) {
            updatedValue = null;
        } else if (Object.keys(udtUpdates).length > 0) {
            if ((!Utility.isTemp(updatedRecord._id)) && (!insertAsOverride) && oldType) {
                updatedValue = {$set:udtUpdates}
            }
        } else {
            updatedValue = undefined;
        }
        return updatedValue;
    }

    DataModel.getUpdates = function (dataModel, root, data, oldData, $transientData, fields, idFields, insertAsOverride) {
        data = Utility.deepClone(data)
        oldData = Utility.deepClone(oldData)
        removeSpecialCharactor(data, ["$$hashKey", "_id"])
        removeSpecialCharactor(oldData, ["$$hashKey", "_id"])
        var updates = DataModel.getUpdatedRows(dataModel, root, data, oldData, $transientData, fields, idFields, insertAsOverride);
        return updates;
    }

    DataModel.prototype.setData = function (data) {
        if (data && Array.isArray(data) && data.length > 0) {
            this.dataCount = data.length;
        } else {
            this.dataCount = 0;
        }
        if (this.metadata && this.metadata.autoUpdates) {
            ensure_ID(data);
        }
        this.data = data;
        Utility.validateData(this.data, this.query, this.metadata, this);
        Utility.populateDataKeyMapping(this.data, this);
        this.setLastProcessedResult();
        DataModel.cloneData(this);
    };
    DataModel.prototype.invoke = function (functionName, parameters, options) {
        if (this.metadata && this.metadata.token) {
            options = options || {};
            options.token = this.metadata.token;
        }
        if (this.metadata && this.metadata.viewId) {
            options = options || {};
            options.viewId = this.metadata.viewId;
        }
        return this.db.invokeFunction(functionName, parameters, options);
    }

    DataModel.putIdColumnValue = function (record, updates, idFields) {
        for (var i = 0; i < idFields.length; i++) {
            updates[idFields[i]] = record[idFields[i]];

        }
    }


    DataModel.prototype.delete = function (deletedRows) {
        var Q = require("q");
        var D = Q.defer();
        Utility.sort(deletedRows, "desc");
        for (var i = 0; i < deletedRows.length; i++) {
            this.data.splice(deletedRows[i], 1);    //splice this from data
        }
        Utility.populateDataKeyMapping(this.data, this);
        D.resolve();
        return D.promise;
    }

    DataModel.prototype.getCurrentRow = function (index) {
        if (index === undefined) {
            index = this.currentRowIndex;
        }
        if (index === undefined) {
            return undefined;
        }
        return this.data[index];
    }

    DataModel.prototype.getData = function (index) {
        if (index !== undefined) {
            return this.data[index];
        } else {
            return this.data;
        }

    }

    DataModel.prototype.getDataClone = function (index) {
        if (index !== undefined) {
            return this.dataClone[index];
        } else {
            return this.dataClone;
        }

    }

    DataModel.prototype.handleValueChange = function () {
        var Document = require("ApplaneDB/lib/Document.js");
        var that = this;
        /*if (that.triggeringEvents) {
         */
        /* if events are triggeringEvents then resolve promise with {triggeringEvents: true}, case on resolving values when more then one row in nested table is deleted, resolving message hides before data resolve*/
        /*
         var Q = require("q");
         var D = Q.defer();
         D.resolve({triggeringEvents: true});
         return D.promise;
         } else */
        if (Utility.deepEqual(that.data, that.lastProcessedResult)) {
            return;
        } else if (!that.data || !that.lastProcessedResult) {
            throw new Error("New value or oldValue can not be either undefined or not equal in length in handleValueChange of DataModel >>>that.data>>>" + JSON.stringify(that.data))
        } else if (that.data.length != that.lastProcessedResult.length) {
            //un equal case will be handle by insert, so do nothing here
        } else {
            return Utility.iterateArrayWithPromise(that.data, function (dataIndex, dataRow) {
                var oldRecord = that.lastProcessedResult[dataIndex];
                if (Utility.deepEqual(dataRow, oldRecord)) {
                    return;
                } else {
                    that.ensureTransient(dataRow);
                    var $transientValue = that.$transientData[Utility.getIndex(that.$transientData, "_id", dataRow._id)];
                    var doc = new Document(dataRow, oldRecord, "update", {transientValues:$transientValue});
                    var updatedFields = doc.getUpdatedFields();
                    if (updatedFields && updatedFields.length > 0) {
                        return that.triggerEvents("onValue", doc);
                    } else {
                        //do nothing here
                        return;
                    }
                }
            })
        }
    }

    DataModel.prototype.ensureTransient = function (record) {
        this.$transientData = this.$transientData || [];
        if (!record._id) {
            throw new Error("Record must have _id while getTranseint [" + JSON.stringify(record) + "]")
        }
        var index = Utility.getIndex(this.$transientData, "_id", record._id)
        if (index === undefined) {
            var newTransient = {_id:record._id}
            this.$transientData.push(newTransient);

        }
    }


    DataModel.prototype.triggerEvents = function (event, doc) {

        var that = this;
        var Q = require("q");
        var D = Q.defer();
        if (that.triggeringEvents) {
            D.resolve({triggeringEvents:true});
            return D.promise;
        }
        that.triggeringEvents = true;
        var Q = require("q");
        var D = Q.defer();
        var EventManager = require("ApplaneDB/lib/EventManager.js");
        that.fireEvents("onPreEvent");
        EventManager.triggerEvents(event, doc, that.metadata.events, that.metadata, that.db, {client:true}).then(
            function () {
                that.setLastProcessedResult();
                that.fireEvents("onPostEvent");
                D.resolve()
            }).fail(function (err) {
                that.triggeringEvents = false;
                that.fireEvents("onPostEvent", err);
                D.reject(err);
            })
        return D.promise;
    }

    DataModel.prototype.setLastProcessedResult = function () {
        this.triggeringEvents = false;
        this.lastProcessedResult = Utility.deepClone(this.data);
    }
    DataModel.prototype.insert = function (record) {
        var Document = require("ApplaneDB/lib/Document.js");
        var insertId = Utility.getUniqueTempId();
        var newRecrod = record || {__insert__:true};
        if (!newRecrod._id) {
            newRecrod._id = insertId
        }
        var cloneRecord = Utility.deepClone(newRecrod);
        var that = this;
        that.data.push(newRecrod)
//        this.dataClone.push(cloneRecord)

        that.ensureTransient(newRecrod);
        var $transientValue = that.$transientData[Utility.getIndex(that.$transientData, "_id", newRecrod._id)];
        var doc = new Document(newRecrod, cloneRecord, "insert", {transientValues:$transientValue});
        var index = this.data.length - 1;
        Utility.populateDataKeyMapping(this.data, this);
        this.setCurrentRowIndex(index);
        return that.triggerEvents("onInsert", doc).then(
            function () {
                that.fireEvents("onPreEvent");
                return DataModel.populateQueryFilter(that, newRecrod, that.query, that.metadata.fields);
            }).then(
            function () {
                that.fireEvents("onPostEvent");
                return {
                    entity:newRecrod,
                    index:index
                };
            }).fail(function (err) {
                that.fireEvents("onPostEvent", err);
                throw err;
            })
    };


    DataModel.prototype.on = function (event, callback) {
        this.callbacks = this.callbacks || {};
        this.callbacks[event] = this.callbacks[event] || [];
        this.callbacks[event].push(callback);
    }
    DataModel.populateQueryFilter = function (that, insert, query, fields) {
        if (!insert || !query || !query.$filter || !fields) {
            return;
        }
        var filter = query.$filter;
        var parameters = query.$parameters || {};
        var filterKeys = Object.keys(filter);
        return Utility.iterateArrayWithPromise(filterKeys, function (index, filterKey) {
            if (filterKey === "_id") {
                //Issue in create new collection,collection id is passed in insert new collection,_id filter in grid view pass in insert record.
                return;
            }
            var filterValue = filter[filterKey];
            //this is working for filter containing $$whenDefined -- Rajit garg
            if (filterValue && typeof filterValue == "object") {
                var innerfilterKeys = Object.keys(filterValue);
                if (innerfilterKeys && innerfilterKeys.length == 1 && innerfilterKeys[0] === "$$whenDefined") {
                    if (filterValue["$$whenDefined"] && filterValue["$$whenDefined"]["key"]) {
                        filterValue = filterValue["$$whenDefined"]["key"];
                    }
                }
            }
            if (filterValue && typeof filterValue == "string") {
                if (filterValue.indexOf("$$") === 0) {
                    //do nothing
                } else if (filterValue.indexOf("$") === 0) {
                    filterValue = Utility.resolveDot(parameters, filterValue.substring(1));
                }
            }
            var field = Utility.getField(filterKey, fields);
            if (field && field.type == "fk" && Utility.isJSONObject(filterValue) && filterValue._id && !filterValue.asParameter) {
                filterValue = filterValue._id;
            }
            if (filterValue && typeof filterValue === "string" && field !== undefined) {
                if (field.type && field.type === "string") {
                    Utility.putDottedValue(insert, filterKey, filterValue);
                } else if (field.type && field.type === "fk") {
                    if (filterValue) {
                        var fieldsToGet = {_id:1};
                        if (field.fields && field.fields.length > 0) {
                            for (var i = 0; i < field.fields.length; i++) {
                                var viewFieldChild = field.fields[i];
                                if (viewFieldChild.field) {
                                    fieldsToGet[viewFieldChild.field] = 1;
                                }
                            }
                        }
                        if (field.displayField) {
                            var displayField = field.displayField;
                            if (field.otherDisplayFields) {
                                for (var i = 0; i < field.otherDisplayFields.length; i++) {
                                    var otherDisplayField = field.otherDisplayFields[i];
                                    removeParentField(otherDisplayField, fieldsToGet);
                                    fieldsToGet[otherDisplayField] = 1;
                                }
                            }
                            removeParentField(displayField, fieldsToGet);
                            fieldsToGet[displayField] = 1;
                        }
                        var options = undefined;
                        if (that.metadata && that.metadata.token) {
                            options = {};
                            options.token = that.metadata.token;
                        }
                        if (that.metadata && that.metadata.viewId) {
                            options = options || {};
                            options.viewId = that.metadata.viewId;
                        }
                        return that.db.query({
                            $collection:field.collection,
                            $filter:{_id:filterValue},
                            $fields:fieldsToGet
                        }, options).then(function (data) {
                                var value = data.response.result[0];
                                Utility.putDottedValue(insert, filterKey, value);
                            })
                    }
                }
            }
        })
    }

    DataModel.prototype.fireEvents = function (event, err, response, warnings) {
        if (this.callbacks && this.callbacks[event]) {
            for (var i = 0; i < this.callbacks[event].length; i++) {
                this.callbacks[event][i](err, response, warnings);
            }
        }
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

    function proceeedSaveInTimeOut(that, options) {
        var Q = require("q");
        var D = Q.defer();
        if (that.saving) {
            var err = new Error("Saving is already in progress");
            that.fireEvents("onSave", err);
            D.reject(err);
            return D.promise;
        }


        that.fireEvents("onPreSave");
        that.saving = true;
        var D = Q.defer();

        checkForEventResolving(that).then(
            function () {
                var updates = undefined;
                if (options && options.updateAsyncData && options.async) {
                    var data = options.updateAsyncData;
                    var selectedRows = options.selectedRows;
                    var noOfRows = selectedRows ? selectedRows.length : 0;
                    var dataRows = [];
                    var dataRowsClone = [];
                    for (var i = 0; i < noOfRows; i++) {
                        var dataClone = angular.copy(data);
                        dataClone._id = selectedRows[i]._id;
                        dataRows.push(dataClone);
                        dataRowsClone.push({_id:selectedRows[i]._id});
                    }
                    updates = DataModel.getUpdates(that, true, dataRows, dataRowsClone, that.$transientData, that.metadata.fields, that.metadata.idFields, false);
                } else {
                    updates = DataModel.getUpdates(that, true, that.data, that.dataClone, that.$transientData, that.metadata.fields, that.metadata.idFields, false);

                }
                proceedSave(that, updates, options).then(
                    function (res) {
                        that.saving = false;
                        D.resolve(res);
                    }).fail(function (err) {
                        that.saving = false;
                        that.fireEvents("onSave", err);
                        D.reject(err);
                    });
            }).fail(function (err) {
                that.saving = false;
                that.fireEvents("onSave", err);
                D.reject(err);

            })


        return D.promise;

    }

    // When save button is direct clicked like fill some value in text box and press save button, default value need to be resovled first. so we took a timout of 100 ms, if it is still resolving, then we will wait for a finint period of time until default value resolving get complete.
    function checkForEventResolving(that) {
        var Q = require("q");
        var D = Q.defer();
        ensureEventResolving(that, D, 0);
        return D.promise;

    }

    function ensureEventResolving(that, d, counter) {
        setTimeout(function () {
            if (that.isTriggeringEvents()) {
                if (counter >= 50) {
                    d.reject(new Error("Too much time in resolving. Press save button again after resolving"));
                } else {
                    ensureEventResolving(that, d, counter + 1)
                }

            } else {
                d.resolve();
            }
        }, 100)
    }

    function proceedSave(that, updates, options) {
        var Q = require("q");
        var D = Q.defer();


        /* temp hold saving */
//        var err = new Error(JSON.stringify(updates));
//        that.fireEvents("onSave", err);
//        D.reject(err);
//        return D.promise;

        if (!updates || Object.keys(updates).length == 0) {
            var err = new BusinessLogicError("No changes found");
            D.reject(err);
            return D.promise;
        }
        options = options || {};
        var view_id = that.query && that.query.$parameters ? that.query.$parameters.view_id : undefined;

        if (view_id) {
            var parameters = {"view_id":view_id};
            if (updates.$update) {
                DataModel.populateTransient(updates.$update, that.query.$parameters);
            }
            if (updates.$insert) {
                DataModel.populateTransient(updates.$insert, that.query.$parameters);
            }
        }


        updates.$collection = that.query.$collection;
        updates.$parameters = that.query.$parameters;
        if (!updates.$collection) {
            D.reject(new Error("$collection not found for saving>>>>"));
            return D.promise;
        }
        updates.$onValueProcessed = true;
        if (options && options.$fields) {
            updates.$fields = that.metadata.onSaveQueryFields || {};
            if (that.query && that.query.$events) {
                updates.queryEvents = that.query.$events;
            }
        }

        that.saving = true;
        if (that.metadata && that.metadata.updateMode) {
            var updateMode = that.metadata.updateMode;
            if (typeof updateMode === "string") {
                updateMode = JSON.parse(updateMode);
            }
            if (updateMode.async) {
                options.async = true;
                options.successLogs = true;
                if (updateMode.processName) {
                    options.processName = updateMode.processName;
                } else {
                    options.processName = "Async Updates";
                }
            }
        }
        if (that.metadata && that.metadata.viewId) {
            options = options || {};
            options.viewId = that.metadata.viewId;
        }
        proceedSaveInternal.call(that, updates, options).then(
            function (result) {
                if (options && options.async) {
                    return checkProcessStatus(result, that.db, options);
                } else {
                    return result;
                }
            }).then(
            function (result) {
                that.saving = false;
                var additionalResult = {};
                additionalResult.warnings = result.warnings;
                additionalResult.postSaveMessage = result.response && result.response.postSaveMessage ? result.response.postSaveMessage : undefined;
                result = result.response ? result.response[that.query.$collection] : undefined;
                that.fireEvents("onSave", undefined, result, additionalResult);
                D.resolve(result);
            }).fail(function (err) {
                D.reject(err);
            });
        return D.promise;
    }

    function proceedSaveInternal(updates, options) {
        var that = this;
        var metadata = that.metadata;
        var viewFields = metadata.viewFields;
        // viewFields are used to solve the case of customization and qviews fields saving .(manjeet 13-01-2015)
        if (viewFields && viewFields.length > 0) {
            var viewField = viewFields[0];
            var viewFieldUpdates = {};
            if (updates.$update) {
                viewFieldUpdates.$update = updates.$update;
                delete updates.$update;
            }
            if (updates.$delete) {
                viewFieldUpdates.$delete = updates.$delete;
                delete updates.$delete;
            }
            if (updates.$insert) {
                viewFieldUpdates.$insert = updates.$insert;
                delete updates.$insert;
            }
            var update = {};
            update[viewField] = viewFieldUpdates;
            updates.$update = {_id:metadata._id, $set:update};

            if (that.metadata && that.metadata.token) {
                options = options || {};
                options.token = that.metadata.token;
            }
            if (that.metadata && that.metadata.viewId) {
                options = options || {};
                options.viewId = that.metadata.viewId;
            }
            return that.db.update([updates], options).then(function (result) {
                // the result is modified to to return only the updates viewField record     (manjeet 13-01-2015)
                if (result && result.response && result.response[updates.$collection] && result.response[updates.$collection].$update && result.response[updates.$collection].$update.length > 0) {
                    var resultToBeReturned = [];
                    var viewFieldResult = result.response[updates.$collection].$update[0][viewField];
                    if (viewFieldUpdates.$update && viewFieldUpdates.$update.length > 0) {
                        for (var i = 0; i < viewFieldUpdates.$update.length; i++) {
                            var viewFieldUpdate = viewFieldUpdates.$update[i];
                            var index = Utility.isExists(viewFieldResult, viewFieldUpdate, "_id");
                            if (index !== undefined) {
                                resultToBeReturned.push(viewFieldResult[index]);
                            }
                        }
                    }
                    result.response[updates.$collection].$update = resultToBeReturned;
                    return result;
                }
            });
        }
        else {
            if (that.metadata && that.metadata.token) {
                options = options || {};
                options.token = that.metadata.token;
            }
            if (that.metadata && that.metadata.viewId) {
                options = options || {};
                options.viewId = that.metadata.viewId;
            }
            return that.db.update([updates], options);
        }
    }

    function getProcesses(processId, db, options) {
        var Q = require('q');
        var result = undefined;
        return db.query({
            $collection:"pl.processes",
            $filter:{_id:processId}
        }, options).then(
            function (data) {
                if (data && data.response && data.response.result && data.response.result.length === 1) {
                    result = data.response.result[0];
                    if (result.status === "error") {
                        var detail = data.response.result[0].detail;
                        for (var i = 0; i < detail.length; i++) {
                            if (detail[i].status === "error") {
                                throw new Error("Error while saving >>>>" + detail[i].error);
                            }
                        }
                    }
                    else if (result.status === "In Progress") {
                        return Q.delay(5000);
                    }
                }
            }).then(function () {
                if (result.status === "In Progress") {
                    return getProcesses(processId, db)
                }
            })
    }

    function checkProcessStatus(result, db, options) {
        if (result && result.response && result.response.processid) {
            var processId = result.response.processid;
            return getProcesses(processId, db, options).then(function () {
                return createResponse(processId, db);
            });
        }
    }

    function createResponse(processId, db) {
        /*
         * We are returning only one result in response instead of returning the result of all the updates in the process.
         * */
        var response = {};
        var collection = undefined;
        var operation = undefined;
        return db.query({
            $collection:"pl.processes",
            $filter:{_id:processId}
        }).then(
            function (data) {
                if (data && data.response && data.response.result && data.response.result.length === 1) {
                    var details = data.response.result[0]["detail"];
                    if (details && details.length > 0) {
                        var detail = details[0];
                        var processDetail = detail.message || {};
                        if (typeof processDetail === "string") {
                            processDetail = JSON.parse(processDetail);
                        }
                        collection = processDetail.collection;
                        operation = processDetail.operation;
                        var recordid = processDetail.recordid;
                        response[collection] = response[collection] || {};
                        if (operation !== "delete") {
                            return db.query({
                                $collection:collection,
                                $filter:{_id:recordid}
                            });
                        } else {
                            response[collection]["$delete"] = response[collection]["$delete"] || [];
                            response[collection]["$delete"].push(1);
                        }
                    }
                }
            }).then(
            function (result) {
                if (result && result.response && result.response.result && result.response.result.length === 1) {
                    response[collection]["$" + operation] = response[collection]["$" + operation] || [];
                    response[collection]["$" + operation].push(result.response.result[0]);
                }
            }).then(function () {
                return {response:response};
            });
    }

    DataModel.prototype.save = function (options) {
        var that = this;
        return proceeedSaveInTimeOut(that, options)


    }

    DataModel.prototype.getUpdatedData = function () {
        var that = this;
        return checkForEventResolving(that).then(function () {
            return DataModel.getUpdates(that, true, that.data, that.dataClone, that.$transientData, that.metadata.fields, that.metadata.idFields, false);
        })

    }

    DataModel.prototype.saveCustomization = function (updates, type) {

        if (type == "fields") {
            var fieldUpdates = {
                $collection:"pl.fields",
                $update:updates
            };
            var options = undefined;
            if (this && this.metadata && this.metadata.token) {
                options = {};
                options.token = this.metadata.token;
            }
            if (this.metadata && this.metadata.viewId) {
                options = options || {};
                options.viewId = this.metadata.viewId;
            }
            return this.db.update(fieldUpdates, options)
        } else {
            var Q = require("q");
            var D = Q.defer();
            D.reject(new Error("Not supported customization>>>" + type));
            return D.promise;
        }

    }

    DataModel.prototype.setFts = function (value) {
        this.query.$filter = this.query.$filter || {};
        this.query.$filter.$text = undefined;
        if (value) {
            this.query.$filter.$text = {$search:'\"' + value + '\"'}
        }
    }
    DataModel.prototype.getSelectedRow = function (row) {
        return this.selectedRows;
    }
    DataModel.prototype.setSelectedRow = function (entity, __selected__) {
        if (!this.data || this.data.length == 0) {
            return;
        }
        var dataRowIndex = Utility.getDataMappingKey(entity, this.keyMapping);
        this.selectedRows = this.selectedRows || [];
        if (__selected__) {
            this.selectedRows.push(this.data[dataRowIndex]);
        } else if (this.selectedRows && this.selectedRows.length > 0) {
            for (var i = 0; i < this.selectedRows.length; i++) {
                if (angular.equals(this.selectedRows[i], entity)) {
                    this.selectedRows.splice(i, 1);
                    break;
                }
            }
        }
    }

    DataModel.prototype.setAggregateData = function (aggregateData) {
        this.aggregateData = aggregateData;
    }

    DataModel.prototype.setDataInfo = function (dataInfo) {
        this.dataInfo = dataInfo;
    }

    DataModel.prototype.setAggregateQuery = function (aggregateQuery) {
        this.aggregateQuery = aggregateQuery;
    }

    DataModel.prototype.setCursor = function (cursor) {
        this.query.$skip = cursor;
    }
    DataModel.prototype.setCurrentRowIndex = function (index) {
        this.currentRowIndex = index;
    }

    DataModel.prototype.setFilter = function (key, filter) {
        this.query.$filter = this.query.$filter || {};
        if (filter === undefined) {
            delete this.query.$filter[key];
        } else {
            this.query.$filter[key] = filter;
        }

    }
    DataModel.prototype.setGroup = function (group) {
        if (group) {
            removeDottedFields(this.query.$fields);// remmoving fk dotted fields from the query  to apply group
            this.query.$group = group;
            if (this.query.$sort && Object.keys(this.query.$sort).length === 1 && this.query.$sort._id) {
                delete this.query.$sort;              //We will not default sort in case of unwind or group
            }
        } else {
            if (!this.query.$sort) {
                this.query.$sort = {_id:-1};
            }
            delete this.query.$group;
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

    DataModel.prototype.setSort = function (sort) {
        if (sort) {
            this.query.$sort = sort;
        } else {
            delete this.query.$sort;
        }

    }

    DataModel.prototype.setParameters = function (parameters) {
        this.query.$parameters = parameters;
    }

    DataModel.prototype.setParameter = function (key, value) {
        this.query.$parameters = this.query.$parameters || {};
        if (value === undefined) {
            delete this.query.$parameters[key];
        } else {
            this.query.$parameters[key] = value;
        }
    }

    // in ledger view query parameters are required on next navigation to carry the closing balance(by Manjeet Sangwan)
    function modifyQueryParameters(batchQueries, resultBatchQueries) {
        if (resultBatchQueries) {
            for (var key in resultBatchQueries) {
                var resultQuery = resultBatchQueries[key].$query || resultBatchQueries[key];
                var parameters = resultQuery ? resultQuery.$parameters : undefined;
                if (parameters && batchQueries[key]) {
                    var batchQuery = batchQueries[key].$query || batchQueries[key];
                    batchQuery.$parameters = batchQuery.$parameters || {};
                    for (var pKey in parameters) {
                        if (!Utility.deepEqual(parameters[pKey], batchQuery.$parameters[pKey])) {
                            batchQuery.$parameters[pKey] = parameters[pKey];
                        }
                    }
                }
            }
        }
    }

// result is passed to refreshFormDataModel method to reload the data of grid and form views used in advanced dashboards (by manjeet sangwan)
// if the result is passed then the query is skipped and the same result is used
    function resolveQuery(batchQuery, db, result, metadata) {
        if (result || (batchQuery && batchQuery.data && batchQuery.data.$limit === 0)) {
            var Q = require("q");
            var D = Q.defer();
            D.resolve({
                "response":{
                    "data":{
                        "result":result ? result.result : [],
                        "dataInfo":result ? result.dataInfo : {"hasNext":false}
                    },
                    aggregateData:{"result":result ? [result.aggregateResult] : []}
                },
                "status":"ok",
                "code":200
            })
            return D.promise;
        } else {
            var options = undefined;
            if (metadata && metadata.token) {
                options = {};
                options.token = metadata.token;
            }
            if (metadata && metadata.viewId) {
                options = options || {};
                options.viewId = metadata.viewId;
            }
            return db.batchQuery(batchQuery, options)
        }
    }

// result is passed to refreshFormDataModel method to reload the data of grid and form views used in advanced dashboards (by manjeet sangwan)
    DataModel.prototype.refresh = function (result) {
        var that = this;
        var Q = require("q");
        var D = Q.defer();
        var batchQuery = {};
        batchQuery.data = this.query;
        var queryEvent = this.query.$events;
        var batchQueryEvents = [];
        if (queryEvent !== undefined) {
            if (Utility.isJSONObject(queryEvent)) {
                queryEvent = [queryEvent];
            }
            for (var i = 0; i < queryEvent.length; i++) {
                if (queryEvent[i].event === "onBatchQuery" || queryEvent[i].event === "onBatchResult") {
                    batchQueryEvents.push(queryEvent[i]);
                }
            }
            if (batchQueryEvents.length > 0) {
                batchQuery.$events = batchQueryEvents;
            }
        }
        if (this.aggregateQuery) {
            this.aggregateQuery.$filter = this.query.$filter;
            this.aggregateQuery.$parameters = Utility.deepClone(this.query.$parameters);
            batchQuery.aggregateData = {
                "$query":this.aggregateQuery,
                "$parent":"data",
                "$aggregate":true
            };
        }


        resolveQuery(batchQuery, this.db, result, this.metadata).then(
            function (result) {
                var resultQuery = result.query;
                modifyQueryParameters(batchQuery, resultQuery);
                var dataResult = result.response.data;
                if (that.aggregateQuery && that.aggregateData) {
                    var aggResult = result.response.aggregateData;
                    if (aggResult) {
                        if (aggResult.result && aggResult.result.length > 0) {
                            aggResult = aggResult.result[0];
                            for (var k in aggResult) {
                                that.aggregateData[k] = aggResult[k];
                            }
                        } else {
                            for (var key in that.aggregateData) {
                                that.aggregateData[key] = 0;
                            }
                        }
                    }
                }
                var resultData = dataResult.result;
                that.setData(resultData);
                that.dataInfo = dataResult.dataInfo;
                that.fireEvents("onRefresh", undefined, resultData)
                that.selectedRows = undefined;
                that.$transientData = undefined;
                D.resolve(resultData);


            }).fail(function (err) {
                that.fireEvents("onRefresh", err);
                D.reject(err);
            }
        )
        return D.promise;
    }
    DataModel.prototype.uploadFile = function (name, type, contents) {
        var options = undefined;
        if (this.metadata && this.metadata.token) {
            options = {};
            options.token = this.metadata.token;
        }
        if (this.metadata && this.metadata.viewId) {
            options = options || {};
            options.viewId = this.metadata.viewId;
        }
        return this.db.uploadFile(name, type, contents, options);
    };

    DataModel.prototype.getParameters = function () {
        if (this.query) {
            return this.query.$parameters;
        }
    }

//Required for FK --> will return current row + query parameters
    DataModel.prototype.getRowParameters = function (index) {
        var currentRow = this.getCurrentRow(index) || {};
        currentRow = Utility.deepClone(currentRow);
        var parameters = this.getParameters() || {};
        parameters = Utility.deepClone(parameters);
        for (var k in parameters) {
            if (currentRow[k] === undefined) {
                currentRow[k] = parameters[k];
            }
        }
        return currentRow;
    }

    DataModel.handleDelete = function (row, model) {
        var Document = require("ApplaneDB/lib/Document.js");
        var oldValue = {_id:row._id};
        var doc = new Document(row, oldValue, "update");
        var updatedFields = doc.getRevisedUpdatedFields();
        return Utility.iterateArrayWithPromise(updatedFields,
            function (index, updatedField) {
                var nestedDocs = doc.getDocuments(updatedField);
                if (nestedDocs) {
                    if (!Array.isArray(nestedDocs)) {
                        nestedDocs = [nestedDocs];
                    }
                    return Utility.iterateArrayWithPromise(nestedDocs, function (nestedDocIndex, nestedDoc) {
                        return DataModel.handleDelete(nestedDoc.updates, model);
                    })
                } else {
                    return;
                }
            }).then(function () {
                for (var k in row) {
                    if (k !== "_id") {
                        row[k] = null;
                    }
                }
                return model.handleValueChange();

            })


    }

    DataModel.populateTransient = function (updates, parameters) {
        for (var i = 0; i < updates.length; i++) {
            updates[i].$transient = updates[i].$transient || {};
            updates[i].$transient["__parameters__"] = parameters;
        }
    }

    DataModel.getTransientValue = function (root, $transientData, updatedRecord) {
        var transientValue = undefined;
        if (root && $transientData) {
            var $transientIndex = Utility.getIndex($transientData, "_id", updatedRecord._id);
            if ($transientIndex !== undefined) {
                transientValue = $transientData[$transientIndex];
            }
        }
        return transientValue;
    }

    DataModel.prototype.updateAsync = function (data, params) {
        var that = this;
        var selectedRows = that.getSelectedRow();
        //variables(requestQuery, __allrowselected__) will be available in case of selecting all rows from the UI for update case -- Rajit garg- 23/Mar/2015
        var requestQuery = params && params["requestQuery"] ? params["requestQuery"] : undefined;
        var __allrowselected__ = params && params["__allrowselected__"] ? params["__allrowselected__"] : undefined;
        return proceeedSaveInTimeOut(that, {
            async:true,
            processName:"Update Action",
            updateAsyncData:data,
            selectedRows:selectedRows,
            requestQuery:requestQuery,
            __allrowselected__:__allrowselected__
        });
    }


    DataModel.prototype.getKeyMapping = function () {
        if (this.keyMapping) {
            return this.keyMapping;
        }
        var data = this.getData();
        Utility.populateDataKeyMapping(data, this);
        return this.keyMapping;
    }

    /*
     *   Fk Query is cached on the basis of cacheEnabled set to  true.
     *   We are not caching queries in which $filter exits
     *   Firstly the data is checked in the cache with key. if the data exists then we will try  to manually filter the data and return the data to the user.
     *  if the filtered data is empty then we will query for the data and not cache the data.
     *   if the filtered data if not empty then it is returned to the user and we will query to verify the data
     *   if the verification query results in different data than that is returned to the user the cache key is deleted.
     *   On user signout we will clear the entire cache.
     * */

    DataModel.prototype.fkQuery = function (query, field, value, queryOptions) {
        if (this.metadata && this.metadata.token) {
            queryOptions = queryOptions || {};
            queryOptions.token = this.metadata.token;
        }
        if (this.metadata && this.metadata.viewId) {
            queryOptions = queryOptions || {};
            queryOptions.viewId = this.metadata.viewId;
        }
        return Util.fkQuery(this.db, query, field, value, queryOptions);
    }
    DataModel.prototype.isTriggeringEvents = function () {
        return this.triggeringEvents;
    }
    DataModel.prototype.cleanDataModel = function () {
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

    return DataModel;
});
