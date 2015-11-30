/*
 * name
 * address not valid
 * address.cityname valid
 * getDocumnet(adddress) valid
 * isUpdated(address) not valid
 *
 * */
var Utility = require("ApplaneCore/apputil/util.js");

/**
 *
 * updates --> only $set, $unset, $inc, _id can be occur only otherise error throw  incase of update
 * insert--> no $set, $unset, $inc is there*
 * Also need to support required columns ------------------------------------>
 */


(function (definition) {

    if (typeof exports === "object") {
        module.exports = definition();
    } else {
        Document = definition();
    }

})(function () {
        "use strict";


// end of shims
// beginning of real work

        /**
         * Constructs a promise for an immediate reference, passes promises through, or
         * coerces promises from different systems.
         * @param value immediate reference or promise
         */
        var Document = function (updates, oldRecord, type, options) {
            this.updates = updates;
            this.oldRecord = oldRecord;
            this.type = type;
            options = options || {};
            this.requiredValues = options.requiredValues;
            this.transientValues = options.transientValues || {};
            this.fieldInfo = options.fieldInfo;
            this.collection = options.collection;
            Utility.populate_IdInArray(updates);
        }


        function validateUpdates(updates) {
            var validKeys = ["$set", "$unset", "$inc", "_id"];
            var keys = Object.keys(updates);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (validKeys.indexOf(key) === -1) {
                    throw Error("Invalid Key [" + key + "] in updates");
                }
            }
        }

        function validateProperty(property) {
            if (property.indexOf(".") > 0) {
                throw Error("Dotted Expression Not Supported>>>for property >>>" + property + ">>>document>>" + JSON.stringify(this));
            }
        }

        Document.prototype.getUpdatedFields = function () {
            var value = this.updates;
            var oldValue = this.oldRecord;
            if (value === null && Utility.isJSONObject(oldValue)) {
                // null value is provided in case of getDocumnents if we unset currency type field.Issue found in saving history and can not find updated field for innser currency type field.  Sachin Bansal
                return Object.keys(oldValue);
            }

            if (!value || !Utility.isJSONObject(value)) {
                return undefined;
            }
            if (oldValue && Utility.deepEqual(value, oldValue)) {
                return undefined;
            }
            oldValue = oldValue || {};
            var keys = [];
            if (this.type == "insert") {
                populateUpdatedFields(value, oldValue, keys, false);
            } else if (this.type == "update" || this.type == "delete") {
                var found = false;
                if (value.$set !== undefined) {
                    populateUpdatedFields(value.$set, oldValue.$set || {}, keys, true);
                    found = true;
                }
                if (value.$unset !== undefined) {
                    populateUpdatedFields(value.$unset, oldValue.$unset || {}, keys, true);
                    found = true;
                }
                if (value.$inc !== undefined) {
                    populateUpdatedFields(value.$inc, oldValue.$inc || {}, keys, true);
                    found = true;
                }
                if (!found) {
                    populateUpdatedFields(value, oldValue, keys, false);
                }
            }
            return keys;
        }


        Document.prototype.getRevisedUpdatedFields = function () {
            var value = this.convertToJSON();
            var oldValue = this.oldRecord;
            if (!value || !Utility.isJSONObject(value)) {
                return undefined;
            }


            if (oldValue && Utility.deepEqual(value, oldValue)) {
                return;        //$query fields if exists will be go, value and old value can be equal
            }
            oldValue = oldValue || {};
            var keys = [];
            populateUpdatedFields(value, oldValue, keys, false);
            return keys;
        }

        function populateUpdatedFields(value, oldValue, updatedFields, isSetType) {
            //isSetType will be true when value comes from $set...(if it comes in $est then array:[] shold be treated as updated fields
            for (var k in value) {
                if (!Utility.deepEqual(value[k], oldValue[k])) {
                    //if array is value is [ ] and previously undefined, then it will not consider a change, required for client side, nested table, onDetail , event fired again
                    var needToAdd = true;
                    if ((!isSetType) && value[k] instanceof Array && value[k].length == 0 && !oldValue[k]) {
                        needToAdd = false;
                    }
                    if (updatedFields.indexOf(k) >= 0) {
                        needToAdd = false;
                    }
                    if (needToAdd) {
                        updatedFields.push(k);
                    }

                }
            }
            for (var k in oldValue) {
                if (value[k] === undefined) {
                    //if array is value is [ ] and previously undefined, then it will not consider a change, required for client side, nested table, onDetail , event fired again
                    var needToAdd = true;
                    if (oldValue[k] instanceof Array && oldValue[k].length == 0) {
                        needToAdd = false;
                    }
                    if (updatedFields.indexOf(k) >= 0) {
                        needToAdd = false;
                    }
                    if (needToAdd) {
                        updatedFields.push(k);
                    }

                }
            }
        }

        Document.prototype.isInInc = function (property) {
            return this.updates && this.updates.$inc && this.updates.$inc[property] !== undefined ? true : false;
        }
        Document.prototype.isInUnset = function (property) {
            return this.updates && this.updates.$unset && this.updates.$unset[property] !== undefined ? true : false;
        }

        /*
         * if property is in $inc throw error
         * "addressinfo.city" --> error --> dotted --> error, as well as not supported in updates
         * first check in $set, $unset and if not then check in oldvalue and return
         * in
         * */
        Document.prototype.get = function (property, isTransient) {
            if (isTransient) {
                return this.transientValues && this.transientValues[property] !== undefined ? this.transientValues[property] : undefined;
            }
            if (this.updates === null) {
                return undefined;
            }
            else if (this.updates && this.updates[property] !== undefined) {
                return this.updates[property];
            }
            else if (this.updates && this.updates.$set && this.updates.$set[property] !== undefined) {
                return this.updates.$set[property];
            } else if (this.updates && this.updates.$unset && this.updates.$unset[property] !== undefined) {
                return null;
            }
            else if (this.updates && this.updates.$inc && this.updates.$inc[property] !== undefined) {
                return this.updates.$inc[property];
            }
            else if (this.requiredValues && this.requiredValues[property] !== undefined) {
                return this.requiredValues[property];
            }
            else if (this.oldRecord && this.oldRecord[property] !== undefined) {
                return this.oldRecord[property];
            } else {
                return undefined;
            }

        }

        /*
         * return only from old values
         * */
        Document.prototype.getOld = function (property) {
            validateProperty.call(this, property);
            if (this.oldRecord && this.oldRecord[property] !== undefined) {
                return this.oldRecord[property];
            } else {
                return null;
            }
        }

        /*
         * if property exists in unset --> throw error
         *  null and not exists in set
         *  lookup case
         * */


        Document.prototype.setParent = function (parent) {
            this.parent = parent;
        }

        Document.prototype.setChild = function (field, value) {
            this.child = this.child || {};
            this.child[field] = value;
        }

        Document.prototype.getDocuments = function (property, operation) {

            if (this.updates === null) {
                return;
            }
            validateProperty.call(this, property);
            var value = checkValue.call(this, property);
            var oldRecord = this.oldRecord ? this.oldRecord[property] : null;
            var requiredValue = this.requiredValues ? this.requiredValues[property] : null
            if (Array.isArray(value)) {
                var docs = handleArray(value, oldRecord, requiredValue, this.transientValues[property], operation, property);
                setDocAsParent(docs, this);
                return  docs;
            } else if (Utility.isJSONObject(value)) {
                if (value.$insert || value.$update || value.$delete) {
                    var docs = handleArray(value, oldRecord, requiredValue, this.transientValues[property], operation, property);
                    setDocAsParent(docs, this);
                    return docs;
                } else {
                    var docs = handleObject(value, oldRecord, this.type, requiredValue, this.transientValues[property], operation, property);
                    setDocAsParent(docs, this);
                    return docs;
                }
            } else if (value !== null && value !== undefined) {
                return undefined;
            } else if (value === null) {
                /*
                 * unset case or value set==null in $set
                 * */
                if (Array.isArray(oldRecord)) {
                    var docs = handleArray(null, oldRecord, requiredValue, this.transientValues[property], operation, property);
                    setDocAsParent(docs, this);
                    return docs;
                } else if (Utility.isJSONObject(oldRecord)) {
                    this.transientValues[property] = this.transientValues[property] || {};
                    var docs = handleObject(null, oldRecord, "update", requiredValue, this.transientValues[property], operation, property);
                    setDocAsParent(docs, this);
                    return docs;
                } else {
                    return undefined;
                }
            } else {
                if (Array.isArray(oldRecord)) {
                    var docs = handleArray(undefined, oldRecord, requiredValue, this.transientValues[property], operation, property, "nochange");
                    setDocAsParent(docs, this);
                    return docs;
                } else if (Utility.isJSONObject(oldRecord)) {
                    var docs = handleObject(undefined, oldRecord, "nochange", requiredValue, this.transientValues[property], operation, property);
                    setDocAsParent(docs, this);
                    return docs;
                } else {
                    var requiredValues = requiredValue;
                    var docsArray = [];
                    if (Array.isArray(requiredValues)) {
                        for (var i = 0; i < requiredValues.length; i++) {
                            docsArray.push(new Document(undefined, {}, "nochange", {requiredValues: requiredValues[i]}));
                        }
                        return docsArray;
//                        throw new Error("Array Document not supported for only requiredValues>>>>>>>>" + JSON.stringify(this));
                    } else if (Utility.isJSONObject(requiredValues)) {
                        var docs = handleObject(undefined, {}, "nochange", requiredValues, this.transientValues[property], operation, property);
                        setDocAsParent(docs, this);
                        return docs;
                    } else {
                        return undefined;
                    }

                }
            }
        }

        function setDocAsParent(docs, parent) {
            if (docs) {
                if (Array.isArray(docs)) {
                    for (var i = 0; i < docs.length; i++) {
                        docs[i].setParent(parent);
                    }
                } else {
                    docs.setParent(parent);
                }
            }
        }

        function handleObject(value, oldRecord, type, requiredValue, transientValue, operation, property) {
            if (!operation || operation.indexOf(type) !== -1) {
                if (value && (value.$set || value.$unset || value.$inc )) {
                    return new Document(value, oldRecord, type, {requiredValues: requiredValue, transientValues: transientValue, fieldInfo: {field: property, multiple: false}});
                } else {
                    if (Utility.deepEqual(value, oldRecord)) {
                        type = "nochange";
                    }
                    if (!operation || operation.indexOf(type) !== -1) {
                        return new Document(value, oldRecord, type, {requiredValues: requiredValue, transientValues: transientValue, fieldInfo: {field: property, multiple: false}});
                    }
                }
            }
        }

        function handleOperationInArray(documentArray, operation) {
            var newDocumentArray = [];
            for (var i = 0; i < documentArray.length; i++) {
                var document = documentArray[i];
                if (operation.indexOf(document.type) !== -1) {
                    newDocumentArray.push(document);
                }
            }
            return newDocumentArray;
        }

        function handleArray(value, oldRecord, requiredValue, transientValue, operation, property, isNoChange) {
            oldRecord = oldRecord || {};
            requiredValue = requiredValue || [];
            if (value && (value.$insert || value.$update || value.$delete)) {
                var documentArray = [];
                populateArrayRevised(value, oldRecord, requiredValue, documentArray, transientValue, property);
                if (operation) {
                    return handleOperationInArray(documentArray, operation);
                } else {
                    return documentArray;
                }
            } else {
                var newDocumentArray = [];
                if (value === undefined && oldRecord && oldRecord.length > 0 && Utility.isJSONObject(oldRecord[0])) {
                    for (var i = 0; i < oldRecord.length; i++) {
                        var rValue = matchRequiredValue(requiredValue, oldRecord[i]);
                        var tValue = matchTransientValue(transientValue, oldRecord[i]);
                        newDocumentArray.push(new Document(undefined, oldRecord[i], "nochange", {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
                    }
                    if (operation) {
                        return handleOperationInArray(newDocumentArray, operation);
                    }
                }
                else if ((value && value.length > 0 && Utility.isJSONObject(value[0])) || (oldRecord && oldRecord.length > 0 && Utility.isJSONObject(oldRecord[0]))) {
                    value = value || [];
                    var matchedInserts = [];
                    for (var i = 0; i < oldRecord.length; i++) {
                        var found = false;
                        for (var j = 0; j < value.length; j++) {
                            if (Utility.evaluateFilter({_id: value[j]._id}, oldRecord[i])) {
                                matchedInserts.push(value[j]._id);
                                var type = "update";
                                if (Utility.deepEqual(oldRecord[i], value[j])) {
                                    type = "nochange";
                                }
                                var rValue = matchRequiredValue(requiredValue, oldRecord[i]);
                                var tValue = matchTransientValue(transientValue, oldRecord[i]);
                                newDocumentArray.push(new Document(value[j], oldRecord[i], type, {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            var rValue = matchRequiredValue(requiredValue, oldRecord[i]);
                            var tValue = matchTransientValue(transientValue, oldRecord[i]);
                            newDocumentArray.push(new Document({_id: oldRecord[i]._id}, oldRecord[i], "delete", {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
                        }
                    }
                    for (var i = 0; i < value.length; i++) {
                        if (matchedInserts.indexOf(value[i]._id) < 0) {
                            var rValue = matchRequiredValue(requiredValue, value[i]);
                            var tValue = matchTransientValue(transientValue, value[i]);
                            newDocumentArray.push(new Document(value[i], null, "insert", {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
                        }
                    }
                    if (operation) {
                        return handleOperationInArray(newDocumentArray, operation);
                    }
                }
                return newDocumentArray;
            }
        }

        function checkValue(property) {
            if (this.updates && this.updates[property] !== undefined) {
                return this.updates[property];
            }
            if (this.updates && this.updates.$set && this.updates.$set[property] !== undefined) {
                return this.updates.$set[property];
            }
            if (this.updates && this.updates.$unset && this.updates.$unset[property] !== undefined) {
                return null;
            }
            if (this.updates && this.updates.$inc && this.updates.$inc[property] !== undefined) {
                return this.updates.$inc[property];
            }
            return undefined;
        }


        function getValue(property, updates, old) {
            if (updates && updates.$set && updates.$set[property] !== undefined) {
                return updates.$set[property];
            } else if (updates && updates.$unset && updates.$unset[property] !== undefined) {
                return undefined;
            }
            else if (updates && updates.$inc && updates.$inc[property] !== undefined) {
                throw Error("property [" + property + "] found in $inc");
            }
            else if (old && old[property] !== undefined) {
                return old[property];
            } else {
                return updates[property];
            }
        }

        Document.prototype.insertDocument = function (property, setValue) {
            var value = this.updates.$set || this.updates.$unset ? this.updates.$set[property] : this.updates[property];
            if (Utility.isJSONObject(setValue)) {
                setValue = [setValue];
            }
            if (value && Utility.isJSONObject(value)) {
                value.$insert = value.$insert || [];
            }
            if (value && value.$insert) {
                var insertArray = value.$insert;
                for (var i = 0; i < setValue.length; i++) {
                    insertArray.push(setValue[i]);
                }
            } else if (Array.isArray(value)) {
                for (var i = 0; i < setValue.length; i++) {
                    value.push(setValue[i]);
                }
            } else {
                if (this.updates.$set) {
                    this.updates.$set[property] = {$insert: setValue};
                } else {
                    this.updates[property] = setValue;
                }
            }
            Utility.populate_IdInArray(this.updates);
        }

        Document.prototype.deleteDocument = function (property, setValue) {
            var value = this.updates.$set || this.updates.$unset ? this.updates.$set[property] : this.updates[property];
            if (Utility.isJSONObject(setValue)) {
                setValue = [setValue];
            }
            if (value && Utility.isJSONObject(value)) {
                value.$delete = value.$delete || [];
            }
            if (value && value.$delete) {
                var deleteArray = value.$delete;
                for (var i = 0; i < setValue.length; i++) {
                    deleteArray.push(setValue[i]);
                }
            } else if (Array.isArray(value)) {
                removeFromArray(value, setValue);
            } else {
                if (this.updates.$set) {
                    this.updates.$set[property] = {$delete: setValue};
                }
            }
        }

        function removeFromArray(value, setValue) {
            var sLength = setValue ? setValue.length : 0;
            for (var i = 0; i < sLength; i++) {
                var index = Utility.isExists(value, setValue[i], "_id");
                if (index !== undefined) {
                    value.splice(index, 1);
                }
            }
        }

        Document.prototype.set = function (property, value, isTransient) {
            validateProperty.call(this, property);
            if (isTransient) {
                handleTransient(this, this.parent, this.fieldInfo);
                this.transientValues[property] = value;
            } else {
                if (value === undefined) {
                    if (hasSet(this.updates)) {
                        if (this.updates.$set) {
                            delete this.updates.$set[property];
                        }
                    } else {
                        this.updates[property] = null;
                    }
                } else {
                    if (this.updates === undefined) {
                        var that = this;
                        handleNoChangeDocument(that, that.parent, that.fieldInfo);
                    }
                    if (hasSet(this.updates)) {
                        this.updates.$set = this.updates.$set || {};
                        this.updates.$set[property] = value;
                    } else {
                        if (this.updates) {
                            this.updates[property] = value;
                        }
                    }
                }
            }
            Utility.populate_IdInArray(this.updates);
        }

        function handleNoChangeDocument(doc, parent, fieldInfo) {
            if (parent !== undefined) {
                if ((!parent.updates) && parent.parent) {
                    handleNoChangeDocument(parent, parent.parent, parent.fieldInfo);
                }
                parent.updates = parent.updates || {};
                var _id = fieldInfo.multiple ? doc.get("_id") : null;
                ensure(parent.updates, fieldInfo, _id);
                if (fieldInfo.multiple) {
                    var docs = parent.getDocuments(fieldInfo.field);
                    for (var i = 0; i < docs.length; i++) {
                        if (Utility.deepEqual(docs[i].get("_id"), _id)) {
                            doc.updates = docs[i].updates;
                        }
                    }
                } else {
                    doc.updates = parent.get(fieldInfo.field);
                }
            } else {
                throw new Error("Unhandle type in handle nochange document when parent is undefined, parent can not be null>>doc>>>" + JSON.stringify(doc) + ">>>fieldInfo>>>" + JSON.stringify(fieldInfo));
            }
        }

        function ensure(updates, fieldInfo, _id) {
            var value = getFieldValue(updates, fieldInfo.field);
            if (value && (!fieldInfo.multiple)) {
                return value;
            }
            var fieldUpdate = undefined;
            if (fieldInfo.multiple) {
                if (hasSet(updates)) {
                    fieldUpdate = {_id: _id, $set: {}};
                    updates.$set = updates.$set || {};
                    if (updates.$set[fieldInfo.field] && updates.$set[fieldInfo.field].$update) {
                        updates.$set[fieldInfo.field].$update.push(fieldUpdate);
                    } else {
                        updates.$set[fieldInfo.field] = {$update: [fieldUpdate]};
                    }
                } else {
                    fieldUpdate = {_id: _id};
                    if (updates[fieldInfo.field]) {
                        updates[fieldInfo.field].push(fieldUpdate);
                    } else {
                        updates[fieldInfo.field] = [fieldUpdate];
                    }
                }
            } else {
                fieldUpdate = {};
                if (hasSet(updates)) {
                    fieldUpdate = {$set: {}};
                    updates.$set = updates.$set || {};
                    updates.$set[fieldInfo.field] = fieldUpdate;
                } else {
                    fieldUpdate = {};
                    updates[fieldInfo.field] = fieldUpdate;
                }
            }
            return fieldUpdate;
        }

        function hasSet(updates) {
            if (updates && (updates.$set || updates.$unset || updates.$inc)) {
                return true;
            } else {
                return false;
            }
        }

        function getFieldValue(updates, field) {
            if (hasSet(updates)) {
                return updates.$set ? updates.$set[field] : undefined;
            } else {
                return updates[field];
            }
        }

        Document.prototype.unset = function (property, value) {
            validateProperty.call(this, property);
            if (value === undefined) {
                if (hasSet(this.updates)) {
                    if (this.updates.$unset) {
                        delete this.updates.$unset[property];
                    }
                } else {
                    delete this.updates[property];
                }
            } else {
                if (hasSet(this.updates)) {
                    this.updates.$unset = this.updates.$unset || {};
                    this.updates.$unset[property] = value;
                } else {
                    if (this.updates) {
                        this.updates[property] = value;
                    }
                }
            }
        }

        Document.prototype.inc = function (property, value) {
            validateProperty.call(this, property);
            this.updates.$inc = this.updates.$inc || {};
            this.updates.$inc[property] = value;
        }


        function fetchIndex(query, oldData) {


            var indexes = [];
            var length = oldData ? oldData.length : 0;

            for (var i = 0; i < length; i++) {
                if (Utility.evaluateFilter(query, oldData[i])) {
                    indexes.push({index: i, data: oldData[i]});
                }
            }
            return indexes;
        }

        Document.prototype.convertToJSON = function () {
            if (this.updates === null) {
                return undefined;
            }
            var jsonDocument = {};
            var fields = this.getFields();
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var fieldDoc = this.getDocuments(field);
                if (fieldDoc !== undefined) {
                    if (Array.isArray(fieldDoc)) {
                        var fieldArray = [];
                        for (var j = 0; j < fieldDoc.length; j++) {
                            var doc = fieldDoc[j];
                            if (doc.type !== "delete") {
                                var convertedJson = doc.convertToJSON();
                                fieldArray.push(convertedJson);
                            }
                        }
                        jsonDocument[field] = fieldArray;
                    } else {
                        jsonDocument[field] = fieldDoc.convertToJSON();
                    }
                } else {
                    if (this.isInInc(field)) {
//                    jsonDocument[field] = this.getOld(field) + this.get(field);
                        // recursion was made due to above line in onValue event, Rohit Bansal
                        jsonDocument[field] = this.get(field);
                    } else {
                        jsonDocument[field] = this.get(field);
                    }
                }
            }
            return jsonDocument;
        }


        Document.prototype.getFields = function () {
            var keys = [];
            var updates = this.updates || {};
            for (var key in updates) {
                if (key !== "$set" && key !== "$unset" && key !== "$inc") {
                    keys.push(key);
                }
            }
            for (var key in updates.$set) {
                if (keys.indexOf(key) === -1) {
                    keys.push(key);
                }
            }
            for (var key in updates.$unset) {
                if (keys.indexOf(key) === -1) {
                    keys.push(key);
                }
            }
            for (var key in updates.$inc) {
                if (keys.indexOf(key) === -1) {
                    keys.push(key);
                }
            }
            var updated_id = this.get("_id");
            var old_id = this.oldRecord ? this.oldRecord._id : undefined;
            if (!old_id) {
                old_id = this.requiredValues ? this.requiredValues._id : undefined;
            }
            if ((!old_id && !updated_id && (this.updates === undefined || this.updates.$set || this.updates.$unset || this.updates.$inc || Object.keys(this.updates).length == 0)) || (old_id && Utility.deepEqual(old_id, updated_id))) {
                //Rohit Bansal and Sachin Bansal 23-05-2014 --> for object merging, fk will be merged on the basis of _id, and simple object will have no _id but if object is completely overridden then old vlaue will not be consider otherwise if $set,$unset or $inc is there in simple object then we will consider old value in simple object :

                var oldRecord = this.oldRecord;
                for (var key in oldRecord) {
                    if (keys.indexOf(key) === -1) {
                        keys.push(key);
                    }
                }
            }

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (key === "$set" || key === "$unset" || key === "$inc") {
                    throw new Error("key cannot start with a $");
                }
            }
            return keys;
        }

        Document.prototype.setRequiredFieldsValues = function (requiredFieldValues) {
            this.requiredValues = requiredFieldValues;
        }
//    module.exports = Document;


        Document.prototype.clone = function () {
            return new Document(Utility.deepClone(this.updates), this.oldRecord, this.type, {requiredValues: this.requiredValues});
        }

        Document.prototype.setCancelUpdates = function () {
            this.cancelUpdates = true;
        }

        function getInsertIndex(insert, requiredValue) {
            if (insert._id !== undefined) {
                var requiredIndex = Utility.isExists(requiredValue, insert, "_id");
                return requiredIndex;
            } else {
                var requiredValue = requiredValue || [];
                for (var i = 0; i < requiredValue.length; i++) {
                    var obj = requiredValue[i];
                    if (requiredValue[i]._id === undefined) {
                        return i;
                    }
                }
            }
        }


        function populateArrayDocs(updates, oldValue, requiredValue, documentArray, transientValue, property) {
            oldValue = oldValue || [];
            requiredValue = requiredValue || [];
            updates.$update = updates.$update || [];
            updates.$delete = updates.$delete || [];
            updates.$insert = updates.$insert || [];
            var insertIndexes = [];
            for (var i = 0; i < oldValue.length; i++) {
                var old = oldValue[i];
                var found = false;
                for (var j = 0; j < updates.$update.length; j++) {
                    var query = prepareQuery(updates.$update[j]);
                    if (Utility.evaluateFilter(query, old)) {
                        var type = "update";
                        if (Utility.deepEqual(oldValue[j], updates.$update[j])) {
                            type = "nochange";
                        }
                        var rValue = matchRequiredValue(requiredValue, oldValue[i]);
                        var tValue = matchTransientValue(transientValue, oldValue[i]);
                        documentArray.push(new Document(updates.$update[j], oldValue[i], type, {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    for (var k = 0; k < updates.$delete.length; k++) {
                        var query = prepareQuery(updates.$delete[k]);
                        if (Utility.evaluateFilter(query, old)) {
                            var type = "delete";
                            var rValue = matchRequiredValue(requiredValue, oldValue[i]);
                            var tValue = matchTransientValue(transientValue, oldValue[i]);
                            documentArray.push(new Document(updates.$delete[k], oldValue[i], type, {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    for (var k = 0; k < updates.$insert.length; k++) {
                        var query = prepareQuery(updates.$insert[k]);
                        if (Utility.evaluateFilter(query, old)) {
                            var type = "update";
                            if (Utility.deepEqual(oldValue[j], updates.$insert[k])) {
                                type = "nochange";
                            }
                            var rValue = matchRequiredValue(requiredValue, oldValue[i]);
                            var tValue = matchTransientValue(transientValue, oldValue[i]);
                            insertIndexes.push(updates.$insert[k]._id);
                            documentArray.push(new Document(updates.$insert[k], oldValue[i], type, {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    var rValue = matchRequiredValue(requiredValue, oldValue[i]);
                    var tValue = matchTransientValue(transientValue, oldValue[i]);
                    documentArray.push(new Document(undefined, oldValue[i], "nochange", {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
                }
            }

            var inserts = updates && updates.$insert ? updates.$insert : [];
            var newInserts = [];
            for (var i = 0; i < inserts.length; i++) {
                if (insertIndexes.indexOf(inserts[i]._id) === -1) {
                    newInserts.push(inserts[i]);
                }
            }
            populateArrayInsertDocs(newInserts, requiredValue, documentArray, transientValue, property);
        }

        function prepareQuery(updates) {
            var query = undefined;
            query = {"_id": updates._id};
            return query;
        }

        function populateArrayInsertDocs(inserts, requiredValue, documentArray, transientValue, property) {
            for (var i = 0; i < inserts.length; i++) {
                var rValue = matchRequiredValue(requiredValue, inserts[i]);
                var tValue = matchTransientValue(transientValue, inserts[i]);
                documentArray.push(new Document(inserts[i], null, "insert", {requiredValues: rValue, transientValues: tValue, fieldInfo: {field: property, multiple: true}}));
            }
        }

        function populateArrayRevised(updates, oldValue, requiredValue, documentArray, transientValue, property) {
            if (Array.isArray(oldValue)) {
                populateArrayDocs(updates, oldValue, requiredValue, documentArray, transientValue, property);
            } else if (oldValue && Utility.isJSONObject(oldValue)) {
                var oldArray = oldValue.$insert || [];
                if (oldValue.$update !== undefined) {
                    for (var i = 0; i < oldValue.$update.length; i++) {
                        oldArray.push(oldValue.$update[i]);
                    }
                }
                if (oldValue.$delete !== undefined) {
                    for (var i = 0; i < oldValue.$delete.length; i++) {
                        oldArray.push(oldValue.$delete[i]);
                    }
                }
                populateArrayDocs(updates, oldArray, requiredValue, documentArray, transientValue, property);
            } else {
                var inserts = updates && updates.$insert ? updates.$insert : [];
                populateArrayInsertDocs(inserts, requiredValue, documentArray, transientValue, property);
            }
        }

        function matchTransientValue(transientValue, value) {
            var transientIndex = Utility.isExists(transientValue, value, "_id");
            var tValue = undefined;
            if (transientIndex !== undefined) {
                tValue = transientValue[transientIndex];
            }
            return tValue;
        }

        function matchRequiredValue(requiredValue, value) {
            var requiredIndex = Utility.isExists(requiredValue, value, "_id");
            var rValue = requiredIndex !== undefined ? requiredValue[requiredIndex] : null;
            return rValue;
        }

        function handleTransient(doc, parent, fieldInfo) {
            if (parent !== undefined) {
                if ((parent.transientValues && Object.keys(parent.transientValues).length === 0) && parent.parent) {
                    handleTransient(parent, parent.parent, parent.fieldInfo);
                }
                parent.transientValues = parent.transientValues || {};
                var _id = fieldInfo.multiple ? doc.get("_id") : null;
                ensureTransient(parent.transientValues, fieldInfo, _id);
                if (fieldInfo.multiple) {
                    var docs = parent.getDocuments(fieldInfo.field);
                    for (var i = 0; i < docs.length; i++) {
                        if (Utility.deepEqual(docs[i].get("_id"), _id)) {
                            doc.transientValues = docs[i].transientValues;
                        }
                    }
                } else {
                    doc.transientValues = parent.get(fieldInfo.field, true);
                }
            }
        }

        function ensureTransient(transientValues, fieldInfo, _id) {
            var value = transientValues[fieldInfo.field];
            if (value && (!fieldInfo.multiple)) {
                return value;
            }
            var fieldUpdate = undefined;
            if (fieldInfo.multiple) {
                fieldUpdate = {_id: _id};
                var found = false;
                var length = value ? value.length : 0;
                for (var i = 0; i < length; i++) {
                    if (Utility.evaluateFilter({"_id": _id}, value[i])) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    if (value) {
                        transientValues[fieldInfo.field].push(fieldUpdate);
                    } else {
                        transientValues[fieldInfo.field] = [fieldUpdate];
                    }
                }
            } else {
                fieldUpdate = {};
                transientValues[fieldInfo.field] = fieldUpdate;
            }
            return fieldUpdate;
        }

        return Document;

    }
)
;






