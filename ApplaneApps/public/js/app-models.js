/*Docement.js starts from here*/
var Utility = require("ApplaneCore/apputil/util.js");
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

});

/*EventManager.js starts from here*/
(function (definition) {

    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */
    // Sachin
    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

        // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

        // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

        // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

        // <script>
    } else {
        EventManager = definition();
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
    var Q = require("q");
    var Utils = require("ApplaneCore/apputil/util.js");
    var ModuleManager = require("../../lib/ModuleManager.js");
    var TotalCount = 0;

    function EventManager(value) {

    }

    EventManager.triggerEvents = function (event, document, events, collection, db, options) {
//        console.log("----------------Start triggerEvent called...." + event);
//        console.log("----------------document called...." + JSON.stringify(document));
//        console.log("----------------options called...." + JSON.stringify(options));
        var d = Q.defer();
        options = options || {};
        options = Utils.deepClone(options);
        if (options.level >= 50) {
            throw new Error("More than 50 retries, Recursion level >>>>>options>>>" + JSON.stringify(options) + ">>>>>document>>>" + JSON.stringify(document))
        }
        var mergedDocument = undefined;
        if (event == "onInsert") {
            mergedDocument = {};
        } else if (event == "onValue") {
            mergedDocument = document.convertToJSON();
            options.fields = options.fields || document.getRevisedUpdatedFields();
        } else if (event == "onSave") {
            mergedDocument = document.convertToJSON();
            if (!options.pre && !options.post) {
                d.reject(new Error("No pre/post found in onSave"));
                return d.promise;
            }
        }
        Utils.iterateArrayWithPromise(options.fields,
            function (index, updatedField) {
                var d1 = Q.defer();
                var updatedFieldDoc = document.getDocuments(updatedField, ["insert", "update", "delete"]);
                if (!updatedFieldDoc) {
                    d1.resolve();
                    return d1.promise;
                }
                if (!Array.isArray(updatedFieldDoc)) {
                    updatedFieldDoc = [updatedFieldDoc];
                }
//                console.log(">>NestedupdatedField >>>>>>>>>>>>>>>>>" + JSON.stringify(updatedField));
                Utils.iterateArrayWithPromise(updatedFieldDoc,
                    function (docIndex, nestedDoc) {
//                        console.log("nested doc>>>" + JSON.stringify(nestedDoc));
                        var nestedOptions = Utils.deepClone(options);
                        nestedOptions.parentFields = nestedOptions.parentFields || [];
                        nestedOptions.parentFields.push(updatedField);
                        var nestedEvent = undefined;
                        if (nestedDoc.type == "insert") {
                            delete nestedOptions.fields;
                            nestedEvent = "onInsert";
                        } else if (nestedDoc.type == "update") {
                            nestedOptions.fields = nestedDoc.getRevisedUpdatedFields();
                            nestedEvent = "onValue";
                        } else if (nestedDoc.type == "delete") {
                            nestedEvent = "onValue";
//                            nestedOptions.fields = nestedDoc.getRevisedUpdatedFields();
                        }
                        if (nestedDoc.type == "delete") {
                            return handleNestedDelete(nestedEvent, nestedDoc, collection, db, nestedOptions)
                        } else if (nestedEvent) {
                            return ModuleManager.triggerModules(nestedEvent, nestedDoc, collection, db, nestedOptions);
                        }
                    }).then(
                    function () {
                        //nested doc has done its all work, now it should
                        var documentJSON = document.convertToJSON();
                        mergedDocument[updatedField] = documentJSON[updatedField];
                        d1.resolve();
                    }).fail(function (err) {
                        d1.reject(err);
                    });


                return d1.promise;
            }).then(
            function () {
                //client side value should not be processed again
                if (!options.$onValueProcessed) {
                    return invokeTriggers(event, document, events, db, options);
                }
            }).then(
            function () {
                if (!options.post) {

                    document.oldRecord = mergedDocument;
                    var revisedUpdatedFields = document.getRevisedUpdatedFields();
//                    console.log(">>>>revisedUpdatedFields >>>>>>>>>>>>>>>>>>" + JSON.stringify(revisedUpdatedFields));
//                    console.log("$$$$$$$document is now" + JSON.stringify(document));
//                    console.log("options>>>>" + JSON.stringify(options));


                    if (revisedUpdatedFields && revisedUpdatedFields.length > 0) {
                        options.level = options.level || 0;
                        options.level = options.level + 1;
                        options.fields = revisedUpdatedFields;
                        delete options.pre;
                        delete options.post;
                        return ModuleManager.triggerModules("onValue", document, collection, db, options);
                    }
                }
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            })
        return d.promise;
    }

    function handleNestedDelete(nestedEvent, document, collection, db, nestedOptions) {
        var nestedDocUpdates = document.updates;
        var nestedDocUpdateOldRecord = Utils.deepClone(document.oldRecord);
        var updatedFields = Object.keys(document.oldRecord);
        var nestedOptions = Utils.deepClone(nestedOptions);

        document.updates = Utils.deepClone(document.oldRecord);
        document.type = "delete";
        nestedOptions.fields = updatedFields;

        return Utils.iterateArrayWithPromise(updatedFields,
            function (index, updatedField) {
                var innerNestedOptions = Utils.deepClone(nestedOptions);
                innerNestedOptions.parentFields = innerNestedOptions.parentFields || [];
                innerNestedOptions.parentFields.push(updatedField)
                var nestedDocs = document.getDocuments(updatedField);
                if (nestedDocs) {
                    if (!Array.isArray(nestedDocs)) {
//                        nestedDocs = [nestedDocs];
                        return;
                    }
                    return Utils.iterateArrayWithPromise(nestedDocs, function (nestedDocIndex, nestedDoc) {
                        return handleNestedDelete(nestedEvent, nestedDoc, collection, db, innerNestedOptions).then(function () {
                            document.oldRecord[updatedField] = null;
                        });
                    })
                } else {
                    return;
                }
            }).then(
            function () {
                for (var k in document.updates) {
                    if (k !== "_id") {
                        document.updates[k] = null;
                    }
                }
                return ModuleManager.triggerModules(nestedEvent, document, collection, db, nestedOptions);
            }).then(function () {
                document.updates = nestedDocUpdates;
                document.oldRecord = nestedDocUpdateOldRecord;
            })


    }

    function invokeTriggers(event, document, events, db, options) {
//        console.log("invoking triggers for event>>>" + event + ">>>options>>>>" + JSON.stringify(options));
        var d = Q.defer();
        getTriggers(event, events, options).then(
            function (triggers) {
//                console.log("triggers>>>>>>>>>>>>>>>>" + JSON.stringify(triggers));
                return executeTriggers(document, triggers, db, options);
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            })
        return d.promise;
    }

    function executeTriggers(document, triggers, db, options) {
        var d = Q.defer();
        Utils.iterateArrayWithPromise(triggers,
            function (index, trigger) {
                var triggerOptions = trigger.options;
                if (triggerOptions) {
                    triggerOptions = JSON.parse(triggerOptions);
                }
                if (options) {
                    triggerOptions = triggerOptions || {};
                    for (var k in options) {
                        if (triggerOptions[k] === undefined) {
                            triggerOptions[k] = options[k];
                        }
                    }
                }
                return db.invokeFunction(trigger.function, [document], triggerOptions);
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            })
        return d.promise;
    }

    function getTriggers(event, events, options) {
//        console.log("......getTriggers" + JSON.stringify(options) + ">>event>>>" + event)
        var d = Q.defer();
        var eventsToTrigger = [];
        if (events && (!options || options.$events !== false)) {
            for (var i = 0; i < events.length; i++) {
                var e = events[i];
                if (e.eventName == event) {
                    options = options || {};
                    if (e.client && !options.client) {
                        continue;
                    }
                    var needToAdd = false;
                    if (event == "onInsert") {
//                        console.log("options >>>>>>>>>>>>>>>" + JSON.stringify(options));
                        if (!options.parentFields && !e.fields) {
                            needToAdd = true;
                        } else if (options.parentFields && e.fields) {
                            if (needToAddEventFields(e.fields, options.fields, options.parentFields)) {
                                needToAdd = true;
                            }
                        } else {
                            //do not add
                        }
                    } else if (options.fields && e.fields) {
                        if (needToAddEventFields(e.fields, options.fields, options.parentFields)) {
                            needToAdd = true;
                        }
                    } else if ((options.pre && e.pre == options.pre)) {
                        needToAdd = true;
                    } else if (options.post && e.post == options.post) {
                        needToAdd = true;
                    }

                    if (needToAdd) {
//                        console.log(">>>>>>adding triger>>>>>>>>>>" + JSON.stringify(e));
                        var trigerAlreadyAdded = false;
                        for (var j = 0; j < eventsToTrigger.length; j++) {
                            var evetntToTrigger = eventsToTrigger[j];
                            if (Utils.deepEqual(evetntToTrigger.function, e.function) && (!e.options || Utils.deepEqual(evetntToTrigger.options, e.options) )) {
                                trigerAlreadyAdded = true;
                                break;

                            }

                        }
                        if (!trigerAlreadyAdded) {
                            eventsToTrigger.push(e);
                        }
                    }
                }
            }
        }
//    console.log(">>>eventsToTrigger>>>>" + JSON.stringify(eventsToTrigger))
        d.resolve(eventsToTrigger);
        return d.promise;
    }

    function needToAddEventFields(eventFields, fields, parentFields) {
//    console.log("eventFields>>>>" + JSON.stringify(eventFields))
//    console.log("fields>>>>" + JSON.stringify(fields))
//    console.log("parentFields>>>>" + JSON.stringify(parentFields))
        if ((!fields || fields.length == 0) && (!eventFields || eventFields.length == 0) && (!parentFields || parentFields.length == 0)) {
            //it will return onInsert/onSave
            return true;
        }
        if (eventFields) {
            for (var i = 0; i < eventFields.length; i++) {
                var eventField = eventFields[i];
                if (Utils.isJSONObject(eventField) && parentFields && parentFields.length > 0 && eventField[parentFields[0]]) {
                    var newParentFields = [];
                    for (var j = 1; j < parentFields.length; j++) {
                        newParentFields.push(parentFields[j]);
                    }
                    return needToAddEventFields(eventField[parentFields[0]], fields, newParentFields);
                } else if (typeof eventField == "string" && (!parentFields || parentFields.length == 0)) {
                    // check for  onValue
                    if (fields) {
                        for (var j = 0; j < fields.length; j++) {
                            var field = fields[j];
                            if (Utils.isExists(eventFields, field) !== undefined) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }

    return EventManager;

});

/*ViewUtility.js starts from here*/
(function (definition) {

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

        // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

        // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

        // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

        // <script>
    } else {
        ViewUtility = definition();
    }

})(function () {
    "use strict";
    var Q = require("q");
    var Utils = require("ApplaneCore/apputil/util.js");

    function ViewUtility(value) {

    }

    ViewUtility.populateSortInGroup = function (queryGroupInfo, aggregateColumn) {
        if (queryGroupInfo.$sort === undefined && aggregateColumn.sortable) {
            var type = aggregateColumn.ui || aggregateColumn.type;
            if (type === "number") {
                queryGroupInfo.$sort = {};
                queryGroupInfo.$sort[aggregateColumn.field] = -1;
            } else if (type === "currency") {
                queryGroupInfo.$sort = {};
                queryGroupInfo.$sort[aggregateColumn.field + ".amount"] = -1;
            } else if (type === "duration") {
                queryGroupInfo.$sort = {};
                queryGroupInfo.$sort[aggregateColumn.field + ".time"] = -1;
            }
        }
    }

    ViewUtility.processDataForView = function (data, query, metadata) {
        if (!data || data.length === 0 || !metadata) {
            return;
        }
        var alias = query && query.$recursion && query.$recursion.$alias ? query.$recursion.$alias : "children";
        if (query && query.$group && query.$group.$recursion && query.$group.$recursion.$childrenAsRow) {
            var groupLength = 1;
            if (Array.isArray(query.$group._id)) {
                groupLength = query.$group._id.length;
            }
            iterateGroupData(metadata, data, query.$group, "children", 0, groupLength);
        } else if (query && query.$recursion && query.$recursion.$childrenAsRow) {
            populatePrimaryColumnDisplayField(query.$recursion, metadata);
            resolveRecursiveData(metadata, data, query.$recursion, alias, true);
        }
        var transform = metadata.transform;   //for sales report
        if (transform && typeof transform === "string") {
            transform = JSON.parse(transform);
        }
        if (transform && Object.keys(transform).length > 0) {
            transformData(data, transform, alias);
        }
    }

    function iterateGroupData(metadata, data, groupInfo, groupAlias, groupLevel, groupLength) {
        if (!data || data.length == 0) {
            return;
        }
        for (var i = 0; i < data.length; i++) {
            var dataRecord = data[i];
            dataRecord.__groupLevel = groupLevel;
            dataRecord.__depth = groupLevel;
            if (groupLength > 1) {
                if (dataRecord[groupAlias]) {
                    iterateGroupData(metadata, dataRecord[groupAlias], groupInfo, groupAlias, groupLevel + 1, groupLength - 1)
                }
            } else {
                populatePrimaryColumnDisplayField(groupInfo.$recursion, metadata);
                resolveRecursiveData(metadata, data, groupInfo.$recursion, groupInfo.$recursion.$alias, true);
                var fieldsToMatch = [];
                if (groupInfo.$recursion.$rollup && groupInfo.$recursion.$rollup.length > 0) {
                    for (var j = 0; j < groupInfo.$recursion.$rollup.length; j++) {
                        var rollUpValue = groupInfo.$recursion.$rollup[i];
                        if (typeof rollUpValue === "string") {
                            fieldsToMatch.push(rollUpValue);
                        } else if (Utils.isJSONObject(rollUpValue)) {
                            fieldsToMatch.push(Object.keys(rollUpValue)[0]);
                        }
                    }
                } else {
                    fieldsToMatch.push(groupAlias);
                }
                convertRecursiveAliasToGroupAlias(data, groupInfo.$recursion, fieldsToMatch, groupAlias, groupLevel, groupLevel);
            }
        }
    }

    function isValueExists(data, fields) {
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (Utils.resolveValue(data, field)) {
                return true;
            }
        }
    }

    function convertRecursiveAliasToGroupAlias(data, recursion, fieldsToMatch, groupAlias, groupLevel, depth) {
        if (data && data.length > 0) {
            var recursionAlias = recursion.$alias;
            for (var i = (data.length - 1); i >= 0; i--) {
                if (data[i].__recursiveParent && !isValueExists(data[i], fieldsToMatch)) {
                    data.splice(i, 1);
                }
                if (data[i][recursionAlias]) {
                    var recursionAliasData = data[i][recursionAlias];
                    data[i][recursionAlias] = undefined;
                    if (recursionAliasData.length > 0) {
                        data[i][groupAlias] = recursionAliasData;
                        convertRecursiveAliasToGroupAlias(data[i][groupAlias], recursion, fieldsToMatch, groupAlias, groupLevel, depth + 1)
                    }
                }
                if (data[i][groupAlias]) {
                    data[i].__groupLevel = groupLevel;
                    data[i].__depth = depth;
                }
            }
        }
    }

    function resolveRecursiveData(metadata, data, queryRecursion, alias, isRoot) {
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (row[alias] && row[alias].length > 0 && !row.processed) {
                resolveRecursiveData(metadata, row[alias], queryRecursion, alias, false);
                var childRow = Utils.deepClone(row);
                childRow.__children = true;
                childRow.__self_id = childRow._id;
                childRow._id = childRow._id + "_children";
                childRow.processed = true;
                handleRollupData(childRow, queryRecursion, false);

                row[alias] = undefined;
                if (queryRecursion.$primaryColumn && queryRecursion.$childrenAlias) {
                    var separator = " ";
                    if (queryRecursion.$selfAsChildren) {
                        separator = " & ";
                    }
                    var primaryColumn = queryRecursion.$primaryColumn + ( metadata.recursionPrimaryColumnDisplayField ? "." + metadata.recursionPrimaryColumnDisplayField : "");
                    var resolvedValue = Utils.resolveDottedValue(childRow, primaryColumn) + separator + queryRecursion.$childrenAlias;
                    Utils.putDottedValue(childRow, primaryColumn, resolvedValue);
                }
                if (queryRecursion.$selfAsChildren) {
                    var toPut = Utils.deepClone(row);
                    toPut.__recursiveParent = true;
                    childRow[alias].splice(0, 0, toPut);
                    data[i] = childRow;
                } else {
                    data.splice(i + 1, 0, childRow);
                }
            }
        }
        if (isRoot && queryRecursion) {
            if ((queryRecursion.$expandChildren == 1) && data && (data.length == 1) && data[0][alias] && data[0][alias].length > 0) {
                for (var i = 0; i < data[0][alias].length; i++) {
                    data.push(data[0][alias][i]);
                }
                data.splice(0, 1);
            }
            if (queryRecursion.$rollup && queryRecursion.$rollup.length > 0) {
                manageRollUpData(data, alias, queryRecursion);
            }
        }
    }

    function populatePrimaryColumnDisplayField(queryRecursion, metadata) {
        if (!queryRecursion.$primaryColumn) {
            return;
        }
        var fieldDef = Utils.getField(queryRecursion.$primaryColumn, metadata.fields);
        if (fieldDef && fieldDef.type === "fk" && fieldDef.displayField) {
            metadata.recursionPrimaryColumnDisplayField = fieldDef.displayField;
        }
    }

    function manageRollUpData(data, alias, queryRecursion) {
        if (!data || data.length === 0) {
            return;
        }
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            manageRollUpData(row[alias], alias, queryRecursion);
            if (queryRecursion.$removeRollupHierarchy) {
                handleRollupData(row, queryRecursion, true);
            }
        }
    }

    function handleRollupData(row, queryRecursion, removeHierarchy) {
        var rollUp = queryRecursion.$rollup;
        if (rollUp && rollUp.length > 0) {
            for (var j = 0; j < rollUp.length; j++) {
                var rollUpField = rollUp[j];
                if (Utils.isJSONObject(rollUpField)) {
                    rollUpField = Object.keys(rollUpField)[0];
                }
                resolveRollUpData(row, rollUpField, queryRecursion, removeHierarchy);
            }
        }
    }

    function resolveRollUpData(childRow, rollUpField, queryRecursion, removeHierarchy) {
        var indexOf = rollUpField.indexOf(".");
        if (indexOf !== -1) {
            var firstPart = rollUpField.substring(0, indexOf);
            var nextPart = rollUpField.substring(indexOf + 1);
            var fieldValue = childRow[firstPart];
            if (fieldValue) {
                if (Array.isArray(fieldValue)) {
                    for (var i = 0; i < fieldValue.length; i++) {
                        resolveRollUpData(fieldValue[i], nextPart, queryRecursion, removeHierarchy);
                    }
                } else if (Utils.isJSONObject(fieldValue)) {
                    resolveRollUpData(fieldValue, nextPart, queryRecursion, removeHierarchy);
                }
            }
        } else {
            if (removeHierarchy) {
                var rollupHierarchyField = queryRecursion.$rollupHierarchyField || "self";
                Utils.putDottedValue(childRow, rollUpField, Utils.resolveDottedValue(childRow, rollUpField + "." + rollupHierarchyField));
            } else {
                var rollUpSelf = rollUpField + ".self";
                var rollUpChildren = rollUpField + (queryRecursion.$selfAsChildren ? ".total" : ".children");
                Utils.putDottedValue(childRow, rollUpSelf, Utils.resolveDottedValue(childRow, rollUpChildren));
            }
        }
    }

    function transformData(data, transform, alias) {
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            for (var key in transform) {
                var transformValue = transform[key];
                var transformProperty = Object.keys(transformValue)[0];
                var fieldToPut = transformValue[transformProperty];
                fieldToPut = fieldToPut.substring(1);
                if (transformProperty === "row-column") {
                    transformDataRowToColumnWise(row, key, fieldToPut);
                }

            }
            if (row[alias] && row[alias].length > 0) {
                transformData(row[alias], transform, alias);
            }
        }
    }

    function transformDataRowToColumnWise(row, field, fieldToPut) {
        var indexOf = field.indexOf(".");
        if (indexOf !== -1) {
            var firstPart = field.substring(indexOf);
            var nextPart = field.substring(indexOf + 1);
            var fieldValue = row[firstPart];
            if (fieldValue) {
                if (Array.isArray(fieldValue)) {
                    for (var i = 0; i < fieldValue.length; i++) {
                        transformDataRowToColumnWise(fieldValue[i], nextPart, fieldToPut);
                    }
                } else if (Utils.isJSONObject(fieldValue)) {
                    transformDataRowToColumnWise(fieldValue, nextPart, fieldToPut);
                }
            }
        } else {
            var transformFieldData = row[field];
            if (transformFieldData && Array.isArray(transformFieldData)) {
                row[field] = {};
                for (var k = 0; k < transformFieldData.length; k++) {
                    row[field][transformFieldData[k][fieldToPut].toString()] = transformFieldData[k];
                }
            }
        }
    }

    ViewUtility.populateDataInViewOptionsForAggregateView = function (result, requiredView, server) {
        requiredView.viewOptions.data = "data.result";
        requiredView.viewOptions.dataInfo = "data.dataInfo";
        var viewOptions = requiredView.viewOptions;
        var valueColumn = viewOptions.value;
        var valueui = viewOptions.valueui;
        var comparison = viewOptions.aggregateSpan.comparison;
        var viewId = viewOptions.requestView.alias || viewOptions.requestView.id;
        var newResult = [];
        if (viewOptions.groupColumns && viewOptions.groupColumns.length > 0) {
            // if groupColumns are defined then there can be multiple rows based on the groupby result.
            // we merge the data in different quries on the basis of _id in group by query and then handle it one by one like a non group by aggregate view.
            newResult = handleGroupInAggregates(result, viewOptions);
        } else {
            var properties = ["fy", "past__fy", "month", "past__month", "quarter", "past__quarter"];
            var newRow = {};
            for (var i = 0; i < properties.length; i++) {
                var property = properties[i];
                if (result && result[viewId + "__" + property] && result[viewId + "__" + property ].result && result[viewId + "__" + property ].result.length > 0) {
                    newRow[viewId + "__" + property ] = result[viewId + "__" + property ].result[0];
                }
            }
            newResult.push(newRow);
        }
        var finalData = [];
        for (var i = 0; i < newResult.length; i++) {
            var row = newResult[i];
            finalData.push(populateAggregateResult(viewOptions, row));
        }
        if (requiredView.data && requiredView.data.result) {
            if (server) {
                requiredView.data = {result: finalData, dataInfo: {hasNext: false}};
            } else {
                requiredView.data.result.splice(0, (requiredView.data.result.length));
                for (var i = 0; i < finalData.length; i++) {
                    requiredView.data.result.push(finalData[i]);
                }
                requiredView.data.dataInfo = {hasNext: false};
            }
        }
    }

    ViewUtility.populateDataInViewOptions = function (result, requiredView, server) {
        requiredView.viewOptions.data = "data.result";
        requiredView.viewOptions.dataInfo = "data.dataInfo";
        if (requiredView.data && requiredView.data.result && result && result.data && result.data.result && (Array.isArray(result.data.result)) && !server) {
            //at server no need to keep same reference

            requiredView.data.result.splice(0, (requiredView.data.result.length));
            if (result && result.data && result.data.result) {
                for (var i = 0; i < result.data.result.length; i++) {
                    requiredView.data.result.push(result.data.result[i]);
                }
            }
            if (result && result.data && result.data.dataInfo) {
                requiredView.data["dataInfo"] = result.data.dataInfo;
            }

        } else {
            requiredView.data = result.data;
        }
        if (result.aggregateData) {
            if (result.aggregateData.result && result.aggregateData.result.length > 0) {
                requiredView.data.aggregateResult = result.aggregateData.result[0];
                requiredView.viewOptions.aggregateData = "data.aggregateResult";
            } else {
                requiredView.aggregateResult = {__count: 0};
                requiredView.viewOptions.aggregateData = "data.aggregateResult";
            }
        }
        if (requiredView.spanMonths) {
            for (var i = 0; i < requiredView.spanMonths.length; i++) {
                var spanMonth = requiredView.spanMonths[i];
                var spanMonthExp = spanMonth.month + "" + spanMonth.year;
                requiredView[spanMonthExp] = result[spanMonthExp];
                if (result[spanMonthExp + "Aggregate"]) {
                    if (result[spanMonthExp + "Aggregate"].result && result[spanMonthExp + "Aggregate"].result.length > 0) {
                        requiredView[spanMonthExp].aggregateResult = result[spanMonthExp + "Aggregate"].result[0];
                    }
                }
            }
        }
        if (requiredView.spanreport && requiredView.spanreport.ytd) {
            requiredView.ytdData = result.ytdData;
            if (result.ytdAggregate) {
                if (result.ytdAggregate.result && result.ytdAggregate.result.length > 0) {
                    requiredView.ytdData.aggregateResult = result.ytdAggregate.result[0];
                }
            }
        }

    }

    function populateAggregateResult(viewOptions, row) {
        var valueColumn = viewOptions.value;
        var valueui = viewOptions.valueui;
        var comparison = viewOptions.aggregateSpan.comparison;
        var viewId = viewOptions.requestView.alias || viewOptions.requestView.id;
        var data = {};
        if (row[viewId + "__fy"]) {
            data.fy = {};
            populateData({
                data: data.fy,
                result: row,
                valueColumn: valueColumn,
                alias: "__fy",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__past__fy"]) {
            data.pastfy = {};
            populateData({
                data: data.pastfy,
                result: row,
                valueColumn: valueColumn,
                alias: "__past__fy",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__month"]) {
            data.month = {};
            populateData({
                data: data.month,
                result: row,
                valueColumn: valueColumn,
                alias: "__month",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__past__month"]) {
            data.pastmonth = {};
            populateData({
                data: data.pastmonth,
                result: row,
                valueColumn: valueColumn,
                alias: "__past__month",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__quarter"]) {
            data.quarter = {};
            populateData({
                data: data.quarter,
                result: row,
                valueColumn: valueColumn,
                alias: "__quarter",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__past__quarter"]) {
            data.pastquarter = {};
            populateData({
                data: data.pastquarter,
                result: row,
                valueColumn: valueColumn,
                alias: "__past__quarter",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row.aggregateLabel) {
            data.aggregateLabel = row.aggregateLabel;
        }
        return data;
    }

    function handleGroupInAggregates(result, viewOptions) {
        // we merge the data of fy,past__fy,month,past__month,quarter,past__quarter on the basis of the id field in group by query

        var valueColumn = viewOptions.value;
        var valueui = viewOptions.valueui;
        var comparison = viewOptions.aggregateSpan.comparison;
        var viewId = viewOptions.requestView.alias || viewOptions.requestView.id;
        var properties = ["fy", "past__fy", "month", "past__month", "quarter", "past__quarter"];
        var finalResult = [];
        for (var i = 0; i < properties.length; i++) {
            var iproperty = properties[i];
            if (result[viewId + "__" + iproperty] && result[viewId + "__" + iproperty].result && result[viewId + "__" + iproperty].result.length > 0) {
                for (var j = 0; j < result[viewId + "__" + iproperty].result.length; j++) {
                    var row = result[viewId + "__" + iproperty].result[j];
                    var newrow = {};
                    if (!row.matched) {
                        newrow[viewId + "__" + iproperty] = row;
                        for (var k = i + 1; k < properties.length; k++) {
                            var kproperty = properties[k];
                            if (result[viewId + "__" + kproperty] && result[viewId + "__" + kproperty].result && result[viewId + "__" + kproperty].result.length > 0) {
                                var index = Utils.isExists(result[viewId + "__" + kproperty].result, row, "_id");
                                if (index !== undefined && !(result[viewId + "__" + kproperty].result[index].matched)) {
                                    newrow[viewId + "__" + kproperty] = result[viewId + "__" + kproperty].result[index];
                                    result[viewId + "__" + kproperty].result[index].matched = true;
                                }
                            }
                        }
                    }
                    if (Object.keys(newrow).length > 0) {
                        finalResult.push(newrow);
                    }
                }
            }
        }
        // after merging we populate the aggregateLabel field to show on dashboard.
        var groupColumns = viewOptions.groupColumns;
        var fields = viewOptions.fields;
        var valueColumn = viewOptions.value;
        var valueui = viewOptions.valueui;
        for (var i = 0; i < finalResult.length; i++) {
            var row = finalResult[i];
            for (var j = 0; j < properties.length; j++) {
                var property = properties[j];
                if (row[viewId + "__" + property]) {
                    populateLabel(row, viewId + "__" + property);
                }
            }
        }

        function populateLabel(row, exp) {
            if (row[exp] && row.aggregateLabel == undefined) {
                var expValue = row[exp]
                var label = undefined;
                for (var j = 0; j < groupColumns.length; j++) {
                    var column = groupColumns[j];
                    var columnLabel = Utils.replaceDotToUnderscore(column);
                    var columnInfo = Utils.getField(column, fields);
                    if (columnInfo && columnInfo.displayField) {
                        var value = expValue[columnLabel];
                        if (value) {
                            label = label ? label + "-" + value[columnInfo.displayField] : value[columnInfo.displayField];
                        }
                    } else {
                        label = label ? label + "-" + expValue[columnLabel] : expValue[columnLabel];
                    }
                }
                row.aggregateLabel = label;
            }
        }

        return    finalResult;
    }

    function populateData(params) {
        var Utility = require("ApplaneCore/apputil/util.js");
        var data = params.data;
        var result = params.result;
        var valueColumn = params.valueColumn;
        var alias = params.alias;
        var valueui = params.valueui;
        var viewId = params.viewid;
        var comparison = params.comparison;
        var value = undefined;
        if (result[viewId + alias]) {
            var model = result[viewId + alias];
            value = Utility.resolveDottedValue(model, valueColumn);
            Utility.putDottedValue(data, valueColumn, value);
        }
        if (comparison) {
            if (result[viewId + "__past" + alias]) {
                var previousValue = Utility.resolveDottedValue(result[viewId + "__past" + alias], valueColumn);
                if (previousValue) {
                    calculatePercentage(value, previousValue, data, valueColumn, valueui);
                }
            }
        }
    }

    function calculatePercentage(value, previousValue, data, expression, ui) {
        var Utility = require("ApplaneCore/apputil/util.js");
        var percentage = undefined;
        if (ui === "currency") {
            var currentAmount = value ? value.amount : 0;
            var pastAmount = previousValue ? previousValue.amount : 0;
            percentage = calculate(currentAmount, pastAmount);
        } else if (ui === "duration") {
            var currentDuration = value ? value.time : 0;
            var pastDuration = previousValue ? previousValue.time : 0;
            percentage = calculate(currentDuration, pastDuration);
        } else if (ui === "number") {
            percentage = calculate(value, previousValue);
        }
        if (percentage) {
            Utility.putDottedValue(data, expression + "__percentage", percentage);
        }
        function calculate(current, past) {
            if (past === 0) {
                return;
            }
            return (((current - past ) / Math.abs(past)) * 100);
        }

    }

    return ViewUtility;

});

/*ApplaneDB starts form here*/
var ApplaneDB = {};
(function () {
    var DB = function (token, url, db, user) {
        this.token = token;
        this.url = url;
        this.db = db;
        this.user = user;
        this.userTimezoneOffset = new Date().getTimezoneOffset();
    };
    DB.prototype.getCache = function (key) {
        var cache = getCacheObject();
        return cache.get(key);
    };
    DB.prototype.setContext = function (context) {
        this.$context = context;
    };
    DB.prototype.removeCache = function (key) {
        var cache = getCacheObject();
        if (key !== undefined) {
            return cache.del(key);
        } else {
            return cache.reset();
        }
    }

    DB.prototype.setCache = function (key, value) {
        var cache = getCacheObject();
        return cache.set(key, value);
    };


    function getCacheObject() {
        if (this.cache) {
            return this.cache;
        } else {
            var options = { max:100, maxAge:1000 * 60 * 60 };
            var cache = LRUCache(options);
            this.cache = cache;
            return cache;
        }
    }


    function getDataUsingCache(query, options) {
        var that = this;
        var key = options.key ? options.key : "Query-" + JSON.stringify(query);
        var result = that.getCache(key);
        if (result) {
            var d = Q.defer();
            d.resolve(result);
            return d.promise;
        } else {
            return that.query(query).then(function (result) {
                if (result && result.response && result.response.result && result.response.result.length > 0 && !result.response.dataInfo.hasNext) {
                    that.setCache(key, result);
                }
                return result;
            });
        }
    }


    function getBatchDataUsingCache(batchQuery, options) {
        var that = this;
        var key = options.key ? options.key : "BatchQuery-" + JSON.stringify(batchQuery);
        var result = that.getCache(key);
        if (result) {
            var d = Q.defer();
            d.resolve(result);
            return d.promise;
        } else {
            return that.batchQuery(batchQuery).then(function (result) {
                if (result && result.response) {
                    var keys = Object.keys(batchQuery);
                    var setInCache = true;
                    for (var i = 0; i < keys.length; i++) {
                        var batchQuerykey = keys[i];
                        if ((batchQuery[batchQuerykey].$skip === undefined || batchQuery[batchQuerykey].$skip === 0) && result.response[batchQuerykey] && result.response[batchQuerykey].dataInfo && !result.response[batchQuerykey].dataInfo.hasNext) {
                            //do nothing as default is true
                        } else {
                            setInCache = false;
                            break;
                        }
                    }
                    if (setInCache) {
                        that.setCache(key, result);
                    }
                }
                return result;
            });
        }
    }

    DB.prototype.disconnect = function () {
        var Q = require("q");
        var D = Q.defer();
        var dbToken = this.token;
        var userTimezoneOffset = this.userTimezoneOffset;
        var p = {token:dbToken, userTimezoneOffset:userTimezoneOffset};
        var url = this.url;
        ApplaneDB.callRemoveService(url + "/rest/disconnect", p, "POST", "JSON").then(
            function () {
                var token = localStorage["token"];
                var roadMapToken = localStorage["roadMapToken"];
                var tokenToDelete = undefined;
                if (Util.deepEqual(token, dbToken)) {
                    tokenToDelete = roadMapToken;
                } else {
                    tokenToDelete = token;
                }
                if (tokenToDelete) {
                    return ApplaneDB.callRemoveService(url + "/rest/disconnect", {token:tokenToDelete, userTimezoneOffset:userTimezoneOffset}, "POST", "JSON");
                } else {
                    return;
                }
            }).then(
            function () {
                for (var k in localStorage) {
                    delete localStorage[k];
                }
                D.resolve();
            }).fail(function (err) {
                D.reject(err)
            });
        return D.promise;
    }
    DB.prototype.query = function (query, options) {
        var that = this;
        var tokenToPass = options && options.token ? options.token : this.token;
        if (options && options.cache) {
            return getDataUsingCache.call(that, query, options);
        }
        else {
            var params = {query:JSON.stringify(query), token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset, enablelogs:this.enableLogs};
            if (options && options.viewId) {
                params.viewId = options.viewId
            }
            params.options = JSON.stringify({$context:this.$context});
            return ApplaneDB.callRemoveService(this.url + "/rest/query", params, "POST", "JSON")
        }
    }

    DB.prototype.batchQuery = function (batchQuery, options) {
        var that = this;
        var tokenToPass = options && options.token ? options.token : this.token;
        if (options && options.cache) {
            return getBatchDataUsingCache.call(that, batchQuery, options);
        } else {
            var params = {query:JSON.stringify(batchQuery), token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset, enablelogs:this.enableLogs};
            if (options && options.viewId) {
                params.viewId = options.viewId
            }
            params.options = JSON.stringify({$context:this.$context});
            return ApplaneDB.callRemoveService(this.url + "/rest/batchquery", params, "POST", "JSON")
        }
    }

    DB.prototype.update = function (update, options) {
        options = options || {};
        options.$context = this.$context;
        var tokenToPass = options && options.token ? options.token : this.token;
        var params = {update:JSON.stringify(update), token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset, options:JSON.stringify(options), enablelogs:this.enableLogs};
        if (options && options.viewId) {
            params.viewId = options.viewId
        }
        return ApplaneDB.callRemoveService(this.url + "/rest/update", params, "POST", "JSON")
    }
    //here we are providing  acrossDBCode in params, if available - Rajit garg
    DB.prototype.uploadFile = function (name, type, contents, options) {
        var tokenToPass = options && options.token ? options.token : this.token;
        var params = {name:name, type:type, contents:contents, userTimezoneOffset:this.userTimezoneOffset, enablelogs:this.enableLogs, token:tokenToPass};
        if (options && options.viewId) {
            params.viewId = options.viewId
        }
        return ApplaneDB.callRemoveService(this.url + "/rest/file/upload", params, "POST", "JSON");
    }
    DB.prototype.invokeFunction = function (functionName, parameters, options) {
//        if(functionName=="getUserState"){
//            var Q = require("q");
//            var d = Q.defer();
//            d.resolve(AppViews.userState)
//            return d.promise;
//        }
        options = options || {};
        options.es = this.es;
        options.$context = this.$context;
        var tokenToPass = options && options.token ? options.token : this.token;

        if (typeof functionName == "string") {
            var p = {"function":functionName, token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset };
            if (options) {
                p.options = JSON.stringify(options);
            }
            if (parameters) {
                p.parameters = JSON.stringify(parameters);
            }
            if (this.enableLogs) {
                p.enablelogs = this.enableLogs;
            }
            if (options && options.viewId) {
                p.viewId = options.viewId
            }
            //this.pendingTime contain info about client render time and transfer time, and this info is updating/inserting into pl.servicelogs -- Rajit gar
            if (this.pendingTime) {
                p.pendingTime = JSON.stringify(this.pendingTime);
            }
            delete this.pendingTime;
            return ApplaneDB.callRemoveService(this.url + "/rest/invoke", p, "POST", "JSON");
        }


        var Q = require("q");
        var that = this;
        var d = Q.defer();
        var functionToCall = undefined;
        var dotIndex = -1;
        if (typeof functionName == "string") {
            dotIndex = functionName.indexOf(".");
        }
        if (dotIndex >= 0) {
            functionToCall = functionName.substring(dotIndex + 1);
            functionName = functionName.substring(0, dotIndex);
        }
        loadFunctionAsPromise(functionName).then(
            function (loadedFunction) {
                return executeLoadedFunction(loadedFunction, parameters, that, options);
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            });

        return d.promise;
    }
    DB.prototype.invokeService = function (service, params, options) {
        var tokenToPass = options && options.token ? options.token : this.token;
        var serviceParams = {service:JSON.stringify(service), token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset, enablelogs:this.enableLogs};
        if (params) {
            serviceParams.parameters = JSON.stringify(params);
        }
        if (options && options.viewId) {
            serviceParams.viewId = options.viewId
        }
        return ApplaneDB.callRemoveService(this.url + "/rest/service", serviceParams, "POST", "JSON").then(function (result) {
            return result.response;
        })
    }

    function executeLoadedFunction(loadedFunction, parameters, db, options) {
        var d = Q.defer();
        var funParmeters = [];
        if (parameters) {
            parameters.forEach(function (parameter) {
                funParmeters.push(parameter);
            });
        }
        funParmeters.push(db);
        if (options) {
            funParmeters.push(options);
        }
        var funcitonPromise = loadedFunction.apply(null, funParmeters);
        if (funcitonPromise) {
            funcitonPromise.then(
                function () {
                    d.resolve();
                }).fail(function (err) {
                    d.reject(err);
                })
        } else {
            d.resolve();
        }
        return d.promise;
    }

    function loadFunctionAsPromise(functionDef) {
        var d = Q.defer();
        if (!Util.isJSONObject(functionDef)) {
            d.reject(new Error("Function name can only be object but found>>>>>" + JSON.stringify(functionDef)));
            return;
        }
        ApplaneDB.loadJs(functionDef.source).then(function (loadedFunction) {
            var loadedFunctionValue = loadedFunction[functionDef.name];
            if (loadedFunctionValue) {
                d.resolve(loadedFunctionValue);
            } else {
                d.reject(new Error("Function not found for[" + JSON.stringify(functionDef) + "]"));
            }
        })
        return d.promise;
    }

    //is used to reconnect user with different token require in case of session timeout -- rajit 09/may/2015
    DB.prototype.reconnect = function (password, options) {
        that = this;
        var Q = require("q");
        var D = Q.defer();
        options = options || {};
        options.userTimezoneOffset = new Date().getTimezoneOffset();
        var params = {db: that.db, options: JSON.stringify({username: that.user.username, password: password, cachekey: "userdb"})};
        if (options && options.viewId) {
            params.viewId = options.viewId
        }
        ApplaneDB.callRemoveService(that.url + "/rest/connect", params, "POST", "JSON").then(
            function (result) {
                var token = result.response.token;
                var user = result.response.user;
                localStorage.token = token;
                that.token = token;
                that.user = user;
                localStorage["userdb"] = JSON.stringify({db: that.db, token: token, url: that.url, user: user});
                D.resolve();
            }).fail(function (err) {
                D.reject(err);
            })
        return D.promise;
    };

    ApplaneDB.connect = function (url, db, options) {
        var Q = require("q");
        var D = Q.defer();
        options = options || {};
        options.userTimezoneOffset = new Date().getTimezoneOffset();
        var params = {db:db, options:JSON.stringify(options)};
        if (options && options.viewId) {
            params.viewId = options.viewId
        }
        ApplaneDB.callRemoveService(url + "/rest/connect", params, "POST", "JSON").then(
            function (result) {
                var token = result.response.token;
                var user = result.response.user;
                if (options.cachekey) {
                    localStorage[options.cachekey] = JSON.stringify({db:db, token:token, url:url, user:user});
                }
                D.resolve(new DB(token, url, db, user));
            }).fail(function (err) {
                D.reject(err);
            })
        return D.promise;

    }
    ApplaneDB.connection = function (key, connection) {
        ApplaneDB.cache = ApplaneDB.cache || {};
        if (connection) {
            ApplaneDB.cache[key] = new DB(connection.token, connection.url, connection.db, connection.user);
            return ApplaneDB.cache[key];
        } else {
            if (ApplaneDB.cache[key]) {
                return ApplaneDB.cache[key];
            }
            var connection = localStorage[key];
            if (connection) {
                var keyConnection = JSON.parse(localStorage[key]);
                ApplaneDB.cache[key] = new DB(keyConnection.token, keyConnection.url, keyConnection.db, keyConnection.user);
                return ApplaneDB.cache[key];
            } else {
                return;
            }
        }
    };
    ApplaneDB.callRemoveService = function (url, requestBody, callType, dataType) {
        var Q = require("q");
        var D = Q.defer();
        $.ajax({
            type:callType,
            url:url,
            data:requestBody,
            success:function (returnData, status, xhr) {
                D.resolve(returnData);
            },
            error:function (jqXHR, exception) {
                var message = jqXHR.responseText;
                var parsedMessage = undefined;
                if (jqXHR.status == 0) {
                    parsedMessage = {businessLogicError:true};
                    message = Util.NOT_CONNECTED_MESSAGE;
                } else {
                    try {
                        parsedMessage = JSON.parse(jqXHR.responseText);
                        message = parsedMessage.response;
                    } catch (e) {

                    }
                }
                if (parsedMessage && parsedMessage.businessLogicError) {
                    //in case of saving confirm using businesslogic error we get promptUser, we are setting this here to show proceed to save in warning options -- Rajit garg 27-mar-15
                    var err = new BusinessLogicError(message);
                    if (parsedMessage.promptUserWarning) {
                        err.promptUserWarning = parsedMessage.promptUserWarning;
                    }
                    err.stack = parsedMessage.stack;
                    D.reject(err);
                } else {
                    // adding stack into error object for getting stack info   --Rajit garg 06/04/2015
                    var err = new Error(message);
                    err.stack = parsedMessage.stack;
                    D.reject(err);
                }
            },
            timeout:1200000,
            dataType:dataType,
            async:true
        });
        return D.promise;
    };

    ApplaneDB.loadJs = function (source) {
        var d = Q.defer();
        requirejs.config({
            waitSeconds:120
        });
        requirejs([source], function (loadedFunction) {
            if (loadedFunction) {
                d.resolve(loadedFunction);
            } else {
                d.reject(new Error("Function could not load for[" + source + "]"));
            }
        })
        requirejs.onError = function (err) {
            d.reject(err);
        };
        return d.promise;
    }


    ApplaneDB.loadFeedbackResources = function (source) {
        var d = Q.defer();

        var cssId = 'feedbackCss';  // you could encode the css path itself to generate id..
        if (!document.getElementById(cssId)) {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'css/feedback.css';
            link.media = 'all';
            head.appendChild(link);
        }

        requirejs.config({
            waitSeconds:120
        });
        requirejs([source], function () {
            d.resolve();
        })
        requirejs.onError = function (err) {
            d.reject(err);
        };
        return d.promise;
    }


    ApplaneDB.getRoadMapConnection = function () {
        if (localStorage && localStorage.roadMapDB) {
            var D = Q.defer();
            D.resolve(JSON.parse(localStorage.roadMapDB));
            return D.promise;
        } else {
            var userDb = ApplaneDB.connection("userdb");
            if (!userDb) {
                var D = Q.defer();
                D.reject("userdb not found while getRoadMapConnection");
                return D.promise;

            }

            return userDb.invokeFunction("RoadMap.getConnection", [
                {}
            ]).then(function (result) {
                if (result && result.response) {
                    result.response.url = "";
                    //localStorage is used to reuse token     -- Rajit
                    localStorage["roadMapDB"] = JSON.stringify(result);
                    localStorage["roadMapToken"] = result.response.token;
                    return result;
                }
            })
        }
    }
})();

/*dataModel starts from here*/
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

    DataModel.getFKUpdates = function (oldValue, value, field, dataModel) {
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
        var newUpdates = {$query: {}}
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
                var oldValuetoSend = undefined;
                var idFields = [];
                var insetAsOverride = true;
                if (oldValue && oldValue._id && value && value._id && oldValue._id === value._id) {
                    oldValuetoSend = [oldValue];
                    idFields = ["_id"];
                    insetAsOverride = false;
                }
                var nestedUpdates = DataModel.getUpdatedRows(dataModel, false, [value], oldValuetoSend, undefined, field.fields, idFields, insetAsOverride);
                if (nestedUpdates && nestedUpdates.$insert && nestedUpdates.$insert.length > 0) {
                    newUpdates.$set = nestedUpdates.$insert[0];
                } else if (nestedUpdates && nestedUpdates.$update && nestedUpdates.$update.length > 0) {
                    newUpdates.$set = nestedUpdates.$update[0].$set;
                    newUpdates.$unset = nestedUpdates.$update[0].$unset;
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

    DataModel.getUpdatedRows = function (dataModel, root, data, dataClone, $transientData, fields, idFields, insertAsOverride, warningOptions, returnWarnings, uiMandatoryOptions) {
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
                        updatedRows.$delete.push({_id: dataCloneRecord._id})
                    }
                }
            }

            var dataCount = data ? data.length : 0;
            for (var i = 0; i < dataCount; i++) {
                var warning = {_id: data[i]._id};
                var unwindColumns = dataModel.query ? dataModel.query.$unwind : undefined;
                var filter = {"_id": data[i]._id};
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

                    if (warningOptions) {
                        populateWarnings(updatedRecord, field, warning, undefined, uiMandatoryOptions);
                    }
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
                            var nestedWarnings = [];
                            updatedValue = DataModel.getUpdates(dataModel, false, updatedValue, oldValue, undefined, field.fields, ["_id"], insertAsOverride, nestedWarnings, returnWarnings, uiMandatoryOptions);
                            if (insertAsOverride && updatedValue && updatedValue.$insert) {
                                updatedValue = updatedValue.$insert;
                            } else if (insertAsOverride && !updatedValue) {
                                updatedValue = [];                        //for upsert in fk - nested table, if remove all values then [ ] should be gone
                            }
                            if (nestedWarnings.length > 0) {
                                warning[fieldExpression] = nestedWarnings;
                            }
                        } else if (field.type == "fk" && field.multiple) {
                            var newUpdatedFieldValue = undefined;
                            if (updatedValue) {
                                var updatedValueRecordsMap = {};
                                for (var k = 0; k < updatedValue.length; k++) {
                                    var updatedValueFieldRecord = updatedValue[k];
                                    if (updatedValueRecordsMap[updatedValueFieldRecord._id]) {
                                        continue;
                                    }
                                    updatedValueRecordsMap[updatedValueFieldRecord._id] = 1;
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
                                        updatedValueFieldRecord = DataModel.getFKUpdates(oldValue, updatedValueFieldRecord, field, dataModel);
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
                                        newUpdatedFieldValue.$delete.push({_id: oldValueFieldRecord._id})
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
                        } else if (field.type == "unit") {
                            updatedValue = populateUDTUpdates(oldValue, updatedValue, updatedRecord, insertAsOverride, "quantity", "unit");
                        } else if (field.type == "daterange") {
                            updatedValue = populateUDTUpdates(oldValue, updatedValue, updatedRecord, insertAsOverride, "from", "to");
                        } else if (field.type == "fk") {
                            updatedValue = DataModel.getFKUpdates(oldValue, updatedValue, field, dataModel);
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
                if (Object.keys(warning).length > 1) {
                    warningOptions.push(warning);
                }
            }

            return updatedRows;
        }
        catch
            (e) {
            alert(e.message + "\n" + e.stack);
            throw e;
        }
    }

    function populateUDTWarning(updatedValue, warning, field, exp, type) {
        var expValue = updatedValue ? updatedValue[exp] : undefined;
        var typeValue = updatedValue ? updatedValue[type] : undefined;
        if (!updatedValue || expValue === undefined || expValue === null || typeValue === undefined || typeValue === null) {
            Utility.putDottedValue(warning, field, true);
        }
    }

    function populateWarnings(updatedRecord, field, warning, pField, uiMandatoryOptions) {
        var fieldExpression = field.field;
        pField = pField ? pField + "." + field.field : field.field;
        var updatedValue = updatedRecord ? updatedRecord[fieldExpression] : undefined;
        if (field.uiMandatory) {  //when visibility of a field is false and uiMandatory is true then error was coming--to solve this issue this fieldVisibility work is added
            var savingSource = uiMandatoryOptions != undefined ? uiMandatoryOptions.savingSource : undefined;
            var $parse = uiMandatoryOptions != undefined ? uiMandatoryOptions.$parse : undefined;
            var fieldVisibility = field.visibility;
            var when = field.when;
            if (savingSource === "grid") {
                if (field.visibilityGrid != undefined) {
                    fieldVisibility = field.visibilityGrid;
                }
                if (field.whenGrid != undefined) {
                    when = field.whenGrid;
                }
            } else if (savingSource === "form") {
                if (field.visibilityForm != undefined) {
                    fieldVisibility = field.visibilityForm;
                }
                if (field.whenForm != undefined) {
                    when = field.whenForm;
                }
            }
            if (fieldVisibility && when != undefined && when != null) {
                if (when === "true" || when === true) {
                    fieldVisibility = true;
                } else if (when === "false" || when === false) {
                    fieldVisibility = false;
                } else if ($parse) {
                    when = Util.replaceDollarAndThis(when, "updatedRecord.");
                    var getter = $parse(when);
                    fieldVisibility = getter(updatedRecord);
                }
            }
            if (fieldVisibility) {
                if (updatedValue === "" || updatedValue === undefined || updatedValue === null) {
                    if (field.type === "fk" && field.displayField) {
                        Utility.putDottedValue(warning, pField + "." + field.displayField, true);
                    } else {
                        Utility.putDottedValue(warning, pField, true);
                    }
                } else {
                    if (field.ui === "currency") {
                        populateUDTWarning(updatedValue, warning, pField, "amount", "type");
                    } else if (field.ui === "duration") {
                        populateUDTWarning(updatedValue, warning, pField, "time", "unit");
                    } else if (field.ui === "unit") {
                        populateUDTWarning(updatedValue, warning, pField, "quantity", "unit");
                    } else if (field.ui === "daterange") {
                        populateUDTWarning(updatedValue, warning, pField, "from", "to");
                    }
                }
            }
        }
        if (field.fields && !field.multiple) {
            for (var i = 0; i < field.fields.length; i++) {
                populateWarnings(updatedValue, field.fields[i], warning, pField, uiMandatoryOptions);
            }
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
                updatedValue = {$set: udtUpdates}
            }
        } else {
            updatedValue = undefined;
        }
        return updatedValue;
    }

    DataModel.getUpdates = function (dataModel, root, data, oldData, $transientData, fields, idFields, insertAsOverride, warningOptions, returnWarnings, uiMandatoryOptions) {
        data = Utility.deepClone(data);
        oldData = Utility.deepClone(oldData);
        if (!returnWarnings) {
            removeSpecialCharactor(data, ["$$hashKey", "_id"]);
            removeSpecialCharactor(oldData, ["$$hashKey", "_id"]);
        }
        var updates = DataModel.getUpdatedRows(dataModel, root, data, oldData, $transientData, fields, idFields, insertAsOverride, warningOptions, returnWarnings, uiMandatoryOptions);
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
                    var doc = new Document(dataRow, oldRecord, "update", {transientValues: $transientValue});
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
            var newTransient = {_id: record._id}
            this.$transientData.push(newTransient);

        }
    }


    DataModel.prototype.triggerEvents = function (event, doc) {

        var that = this;
        var Q = require("q");
        var D = Q.defer();
        if (that.triggeringEvents) {
            D.resolve({triggeringEvents: true});
            return D.promise;
        }
        that.triggeringEvents = true;
        var Q = require("q");
        var D = Q.defer();
        var EventManager = require("ApplaneDB/lib/EventManager.js");
        that.fireEvents("onPreEvent");
        EventManager.triggerEvents(event, doc, that.metadata.events, that.metadata, that.db, {client: true}).then(
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
        var newRecrod = record || {__insert__: true};
        if (!newRecrod._id) {
            newRecrod._id = insertId
        }
        var cloneRecord = Utility.deepClone(newRecrod);
        var that = this;
        that.data.push(newRecrod)
//        this.dataClone.push(cloneRecord)

        that.ensureTransient(newRecrod);
        var $transientValue = that.$transientData[Utility.getIndex(that.$transientData, "_id", newRecrod._id)];
        var doc = new Document(newRecrod, cloneRecord, "insert", {transientValues: $transientValue});
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
                    entity: newRecrod,
                    index: index
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
        return populateQueryFilterInner(that, insert, filter, parameters, fields);
    }

    function populateQueryFilterInner(that, insert, filter, parameters, fields) {
        var filterKeys = Object.keys(filter);
        return Utility.iterateArrayWithPromise(filterKeys, function (index, filterKey) {
            if (filterKey === "_id") {
                //Issue in create new collection,collection id is passed in insert new collection,_id filter in grid view pass in insert record.
                return;
            }
            var filterValue = filter[filterKey];
            if (filterKey === "$and" && Array.isArray(filterValue)) {
                return Utility.iterateArrayWithPromise(filterValue, function (index, fvalue) {
                    return populateQueryFilterInner(that, insert, fvalue, parameters, fields);
                })
            } else {

                //this is working for filter containing $$whenDefined -- Rajit garg
                if (filterValue && typeof filterValue == "object") {
                    var innerfilterKeys = Object.keys(filterValue);
                    if (innerfilterKeys && innerfilterKeys.length == 1) {
                        if (innerfilterKeys[0] === "$$whenDefined" && filterValue["$$whenDefined"] && filterValue["$$whenDefined"]["key"]) {
                            filterValue = filterValue["$$whenDefined"]["key"];
                        } else if (innerfilterKeys[0] === "$in" && filterValue["$in"]["$$getRecursive"] && filterValue["$in"]["$$getRecursive"]["key"]) {
                            filterValue = filterValue["$in"]["$$getRecursive"]["key"];
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
                            var fieldsToGet = {_id: 1};
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
                                $collection: field.collection,
                                $filter: {_id: filterValue},
                                $fields: fieldsToGet
                            }, options).then(function (data) {
                                var value = data.response.result[0];
                                Utility.putDottedValue(insert, filterKey, value);
                            })
                        }
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
                        dataRowsClone.push({_id: selectedRows[i]._id});
                    }
                    updates = DataModel.getUpdates(that, true, dataRows, dataRowsClone, that.$transientData, that.metadata.fields, that.metadata.idFields, false);
                } else {
                    var uiMandatoryOptions = {};
                    if (options != undefined) {
                        if (options.savingSource) {
                            uiMandatoryOptions.savingSource = options.savingSource;
                        }
                        if (options.$parse) {
                            uiMandatoryOptions.$parse = options.$parse;
                        }
                    }
                    var warningOptions = [];
                    var returnWarnings = true;
                    updates = DataModel.getUpdates(that, true, that.data, that.dataClone, that.$transientData, that.metadata.fields, that.metadata.idFields, false, warningOptions, returnWarnings, uiMandatoryOptions);//getUpdates function is called here two times as _id was removing in getUpdates method but we have to use _id to show mandatory field as red so if no warnings come then this function is called again and _id is removed in this case
                    if (warningOptions.length > 0) {
                        var error = new Error();
                        error.validations = warningOptions;
                        throw error;
                    }
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
            var parameters = {"view_id": view_id};
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
            updates.$update = {_id: metadata._id, $set: update};

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
            $collection: "pl.processes",
            $filter: {_id: processId}
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
            $collection: "pl.processes",
            $filter: {_id: processId}
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
                                $collection: collection,
                                $filter: {_id: recordid}
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
                return {response: response};
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
                $collection: "pl.fields",
                $update: updates
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
            this.query.$filter.$text = {$search: '\"' + value + '\"'}
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
                this.query.$sort = {_id: -1};
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
                "response": {
                    "data": {
                        "result": result ? result.result : [],
                        "dataInfo": result ? result.dataInfo : {"hasNext": false}
                    },
                    aggregateData: {"result": result ? [result.aggregateResult] : []}
                },
                "status": "ok",
                "code": 200
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
                "$query": this.aggregateQuery,
                "$parent": "data",
                "$aggregate": true
            };
            if (this.metadata && this.metadata.aggregateAsync) {
                batchQuery.aggregateData.$aggregateAsync = this.metadata.aggregateAsync
            }
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
        var oldValue = {_id: row._id};
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
            async: true,
            processName: "Update Action",
            updateAsyncData: data,
            selectedRows: selectedRows,
            requestQuery: requestQuery,
            __allrowselected__: __allrowselected__
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
})
;


/* RowDataModel starts form here*/
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
            if (metadata && metadata.token) {
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

    RowDataModel.prototype.getUpdatedData = function () {
        return this.dataModel.getUpdatedData();
    }

    RowDataModel.prototype.isTriggeringEvents = function () {
        return this.dataModel.isTriggeringEvents();
    }

    RowDataModel.prototype.cleanDataModel = function () {
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

    return RowDataModel;
});

/* fieldDataModel starts form here*/
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
        if (this.keyMapping === undefined) {
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
        if (this.keyMapping) {
            return this.keyMapping;
        }
        var data = this.getData();
        Utility.populateDataKeyMapping(data, this);
        return this.keyMapping;



    }

    FieldDataModel.prototype.populateKeyMapping = function () {
        var data = this.getData();
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

    FieldDataModel.prototype.isTriggeringEvents = function () {
        return this.rowDataModel.isTriggeringEvents();
    }

    FieldDataModel.prototype.cleanDataModel = function () {
        delete this.db;
        delete this.query;
        delete this.metadata;
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

/*dashboardDataModel starts from here*/
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
                } else {
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

var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;
/*pl-form starts from here*/
pl.controller('pl-form-controller', function ($scope, $compile, $parse) {
    try {
        if (!$scope.formOptions.alertMessageOptions) {
            $scope.formOptions.alertMessageOptions = {};
            $scope.$watch("formOptions.alertMessageOptions.message", function (newMess) {
                if ($scope.formOptions.alertMessageOptions && $scope.formOptions.alertMessageOptions.message) {
                    //open a popup here
                    alert($scope.formOptions.alertMessageOptions.title + "\n" + $scope.formOptions.alertMessageOptions.message);
                }
            })
        }

        if (!$scope.formOptions.warningOptions) {
            $scope.formOptions.warningOptions = {};
            $scope.$watch("formOptions.warningOptions.warnings", function (newWarnings) {
                if ($scope.formOptions.warningOptions && $scope.formOptions.warningOptions.warnings && $scope.formOptions.warningOptions.warnings.length > 0) {
                    //open a popup here
                    alert($scope.formOptions.warningOptions.title + "\n" + JSON.stringify($scope.formOptions.warningOptions.warnings));
                }
            })
        }

        $scope.toolBarOptions = {};
        $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
        $scope.toolBarOptions.top = {left: [], center: [], right: []};
        $scope.toolBarOptions.header = {left: {}, center: [], right: []};
        $scope.toolBarOptions.header.left.rHeaderClass = 'flex-1 app-min-width-220px';
        var showResizeControl = $scope.formOptions.viewResize !== undefined ? $scope.formOptions.viewResize : true;
        if (showResizeControl && $scope.formOptions.parentSharedOptions) {
            $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" ng-hide='formOptions.sharedOptions.viewPosition == \"full\"' ng-class='{\"pl-transform-180\":formOptions.sharedOptions.viewPosition != \"right\"}'  class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
        }

        if ($scope.formOptions.showLabel) {
            $scope.toolBarOptions.header.center.push({template: '<span ng-class=\'{"menu-align-margin":formOptions.sharedOptions.viewPosition == \"full\"}\' class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
                '   <span  ng-bind="formOptions.label"></span>' +
                '   <span ng-if="formOptions.primaryFieldInfo && formOptions.primaryFieldInfo.label">' +
                '       <span>(<span ng-bind="formOptions.primaryFieldInfo.label"></span>)</span>' +
                '   </span>' +
                '</span>'});
        }

        if ($scope.formOptions.navigation) {
            $scope.toolBarOptions.top.right.push({template: '<div class="flex-box app-font-weight-bold app-navigation app-border-right-white app-padding-left-five-px app-padding-right-five-px app-text-align-center">' +
                '<div class="app-height-thirty-px app-float-left app-width-twenty-px app-cursor-pointer" ng-click="previous()" ng-show="formOptions.sharedOptions.pageOptions.hasPrevious"><i class="icon-chevron-left"></i></div>' +
                '<div ng-bind="formOptions.sharedOptions.pageOptions.label" class="app-float-left"></div>' +
                '<div class="app-height-thirty-px app-float-left app-width-twenty-px app-cursor-pointer" ng-click="next()" ng-show="formOptions.sharedOptions.pageOptions.hasNext" ><i class="icon-chevron-right"></i></div>' +
                '</div>'});
        }
        if ($scope.formOptions.close) {
            $scope.toolBarOptions.top.right.push({template: '<div ng-click="close()" class="pl-cancel-btn app-cursor-pointer responsive" title="Close">Cancel</div>'});
        }
        $scope.toolBarOptions.header.right.push({template: '<div ng-click="close()" ng-show="formOptions.close || formOptions.sharedOptions.saveOptions.editMode" class="pl-cancel-btn app-cursor-pointer" title="Close">Cancel</div>', class: "flex-1 app-text-align-right"});
        if ($scope.formOptions.saveAndClose) {
            $scope.toolBarOptions.top.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text responsive" ng-click="close()"><i class="icon-remove"></i></div>'});
            $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
        }
        if ($scope.formOptions.save) {
            $scope.formOptions.saveActions = [
                {onClick: 'saveAndNew', template: "<span class='app-float-left' >Save and new</span>", title: "Save and new", isShow: 'formOptions.insert'},
                {onClick: 'saveAndClose', template: "<span class='app-float-left'>Save and close</span>", title: "Save and close", isShow: true}
            ];
            if ($scope.formOptions.saveLabel) {
                $scope.toolBarOptions.top.right.push({template: '<div ng-show="formOptions.sharedOptions.saveOptions.editMode && formOptions.save" class="app-cursor-pointer pl-letter-spacing ng-scope responsive">' +
                    '<span ng-click="saveAndRefresh()" class="btn-blue default-save" ng-bind="formOptions.saveLabel" style="border-radius: 3px;"></span>' +
                    '</div>'});
                $scope.toolBarOptions.header.right.push({template: '<div ng-show="formOptions.sharedOptions.saveOptions.editMode && formOptions.save" class="app-cursor-pointer pl-letter-spacing ng-scope">' +
                    '<span ng-click="saveAndRefresh()" class="btn-blue default-save" ng-bind="formOptions.saveLabel" style="border-radius: 3px;"></span>' +
                    '</div>'});
            } else {
                $scope.toolBarOptions.top.right.push({template: '<div ng-show="formOptions.sharedOptions.saveOptions.editMode && formOptions.save" class="app-cursor-pointer pl-letter-spacing ng-scope responsive">' +
                    '<span ng-click="saveAndRefresh()" class="btn-blue default-save">Save</span>' +
                    '<span class="btn-blue custom-save" ng-click="saveAndEditActionPopup($event, \'formOptions.saveActions\')">' +
                    '<i class="icon-caret-down"> </i>' +
                    '</span>' +
                    '</div>'});
                $scope.toolBarOptions.header.right.push({template: '<div ng-show="formOptions.sharedOptions.saveOptions.editMode && formOptions.save" class="app-cursor-pointer pl-letter-spacing ng-scope">' +
                    '<span ng-click="saveAndRefresh()" class="btn-blue default-save">Save</span>' +
                    '<span class="btn-blue custom-save" ng-click="saveAndEditActionPopup($event, \'formOptions.saveActions\')">' +
                    '<i class="icon-caret-down"> </i>' +
                    '</span>' +
                    '</div>'});
            }
        }
        if ($scope.formOptions.edit) {
            $scope.toolBarOptions.top.right.push({template: '<div ng-click="edit()" title="Edit" ng-show="!formOptions.sharedOptions.saveOptions.editMode" class="btn-blue app-cursor-pointer pl-letter-spacing responsive">Edit</div>'});
            $scope.toolBarOptions.header.right.push({template: '<div ng-click="edit()" title="Edit" ng-show="!formOptions.sharedOptions.saveOptions.editMode" class="btn-blue app-cursor-pointer pl-letter-spacing">Edit</div>'});
        }

        if ($scope.formOptions.headerActions && $scope.formOptions.headerActions.length > 0) {
            $scope.toolBarOptions.header.right.push({template: '<div ng-click="parentHeaderActionPopUp($event)" class="pl-cancel-btn app-cursor-pointer" title="Actions"><span><i class="icon-reorder"></i><i class="icon-caret-down" style="padding-left: 3px;"> </i></div>', class: "app-text-align-right"});
        }


        $scope.parentHeaderActionPopUp = function ($event) {
            try {
                var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                    "<div ng-repeat='action in formOptions.headerActions' class='app-row-action app-cursor-pointer' ng-show='{{action.when}}'>" +
                    "   <div ng-if='action.href' class='app-padding-five-px'><a href='{{action.href}}' target='_blank' ng-bind='action.label' style='text-decoration: none; color: #58595b;'></a></div>" +
                    "   <div ng-if='!action.href' class='app-padding-five-px' ng-click='multiRowActionOptionClick($index, $event)' ng-bind='action.label'></div>" +
                    "</div>" +
                    "</div>";
                var popupScope = $scope.$new();
                var p = new Popup({
                    autoHide: true,
                    deffered: true,
                    escEnabled: true,
                    hideOnClick: true,
                    html: $compile(optionsHtml)(popupScope),
                    scope: popupScope,
                    element: $event.target
                });
                p.showPopup();
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        };
        $scope.multiRowActionOptionClick = function (newRownActionIndex, $event) {
            try {
                var multiRowAction = $scope.formOptions.headerActions[newRownActionIndex];
                var clone = angular.copy(multiRowAction);
                clone.sharedOptions = $scope.formOptions.sharedOptions;
                if (clone.onClick) {
                    $scope[clone.onClick](clone, $event);
                } else {
                    var title = "multiRowActionOptionClick in pl.grid";
                    var message = "No onclick defined in " + JSON.stringify(multiRowAction);
                    $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        };

        $scope.closeAndNew = function () {
            try {
                $scope.close();
                $scope.formOptions.parentSharedOptions.insertFromPanel = !$scope.formOptions.parentSharedOptions.insertFromPanel;
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.moveToNew = function () {
            if ($scope.formOptions.parentSharedOptions && $scope.formOptions.parentSharedOptions.insertInfo && (!$scope.formOptions.selfInsertView)) {
                $scope.formOptions.parentSharedOptions.insertInfo.insert = {saveOptions: {editMode: true}, addNewRow: true, deAttached: true};
            } else {
                $scope.formOptions.sharedOptions.insertInfo.insert = {editMode: true, addNewRow: true, deAttached: true};
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

        //in case of saving confirm we get warning options error, which display proceed to save , on click of this we are calling this call back function, which recall the same saving method -- Rajit garg 27-mar-15
        var confirmFunction = function () {
            var options = {"confirmUserWarning": true};
            if ($scope.view.viewOptions.saveType === "saveAndNew") {
                $scope.saveAndNew(options);
            }
            if ($scope.view.viewOptions.saveType === "saveAndClose") {
                $scope.saveAndClose(options);
            }
            if ($scope.view.viewOptions.saveType === "saveAndRefresh") {
                $scope.saveAndRefresh(options);
            }
        };
        $scope.view.viewOptions.confirmFunction = confirmFunction;

        $scope.saveAndNew = function (options) {
            try {
                options = options || {};
                options["$fields"] = 1;
                //defining saveType require in case of saving confirm using warning options , so that we call the same saving method again  -- Rajit garg 27-mar-15
                $scope.view.viewOptions.saveType = "saveAndNew";
                $scope.save(options).then(function () {
                    $scope.moveToNew();
                })
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }
        $scope.saveAndClose = function (options) {
            try {
                $scope.view.viewOptions.saveType = "saveAndClose";
                var savePromise = $scope.save(options);
                if (!savePromise) {
                    return;
                }
                savePromise.then(function () {
                    if ($scope.formOptions.parentSharedOptions && $scope.formOptions.parentSharedOptions.insertInfo) {
                        delete $scope.formOptions.parentSharedOptions.insertInfo.insert;
                    }
                    $scope.close();
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

        $scope.saveAndRefresh = function (options) {
            try {
                options = options || {};
                options["$fields"] = 1;
                $scope.view.viewOptions.saveType = "saveAndRefresh";
                var p = $scope.save(options);
                if (!p) {
                    return;
                }
                p.then(function (result) {
                    try {
                        var dataToShow = undefined;
                        if (result && result.$insert && result.$insert.length == 1) {
                            dataToShow = result.$insert[0];
                        } else if (result && result.$update && result.$update.length > 0) {
                            dataToShow = result.$update[result.$update.length - 1];
                        } else if (result && result.$upsert && result.$upsert.length > 0) {
                            dataToShow = result.$upsert[result.$upsert.length - 1];
                        }
                        if (!dataToShow) {
                            $scope.moveToNew();
                            return;
                        }
                        //NOTE: if form view is referredView than we dont refresh its parent, for this we check refreshParentInBackground.
                        if ($scope.formOptions.parentSharedOptions && $scope.formOptions.parentSharedOptions.insertInfo && !($scope.formOptions.refreshParentInBackground == false) && (!$scope.formOptions.selfInsertView)) {
                            $scope.formOptions.parentSharedOptions.insertInfo.insert = {editMode: false, data: [dataToShow], deAttached: true, watchParent: true, refreshDataOnLoad: false};
                            $scope.formOptions.sharedOptions.saveOptions.editMode = false;
                        } else {
                            $scope.formOptions.sharedOptions.saveOptions.editMode = false;
                            $scope.formOptions.sharedOptions.insertInfo.insert = {data: [dataToShow], refreshDataOnLoad: false};
                        }


                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    } catch (e) {
                        if ($scope.handleClientError) {
                            $scope.handleClientError(e);
                        }
                    }
                })
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.$watch("formOptions.sharedOptions.validations", function (validations) {
            if (angular.isDefined(validations)) {
                var row = $scope.row;
                for (var i = 0; i < validations.length; i++) {
                    var validation = validations[i];
                    if (Utility.deepEqual(validation._id, row.entity._id)) {
                        row.validations = validation;
                        break;
                    }
                }
            }
        });

        $scope.next = function () {
            $scope.formOptions.sharedOptions.pageOptions.cursor = $scope.formOptions.sharedOptions.pageOptions.cursor + $scope.formOptions.sharedOptions.pageOptions.pageSize;
        }

        $scope.previous = function () {
            $scope.formOptions.sharedOptions.pageOptions.cursor = $scope.formOptions.sharedOptions.pageOptions.cursor - $scope.formOptions.sharedOptions.pageOptions.pageSize;
        }

        $scope.save = function (options) {
            try {
                if ($scope.formOptions.saveFn) {
                    $scope.formOptions.dataModel.getUpdatedData().then(function (updatedData) {
                        $scope.formOptions.saveFn(updatedData);

                    }).fail(function (err) {
                        $scope.formOptions.warningOptions.error = err;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    })
                } else {
                    options = options || {};
                    options.savingSource = "form";
                    options.$parse = $parse;
                    return $scope.formOptions.dataModel.save(options).then(
                        function (response) {
                            if ($scope.formOptions.afterSaveFn) {
                                $scope.formOptions.afterSaveFn();
                            } else {
                                if ($scope.formOptions.parentSharedOptions && !($scope.formOptions.refreshParentInBackground == false)) {
                                    var refereshInBackground = $scope.formOptions.parentSharedOptions.refereshInBackground || 0;
                                    refereshInBackground = refereshInBackground + 1;
                                    $scope.formOptions.parentSharedOptions.refereshInBackground = refereshInBackground;
                                }
                                return response;
                            }
                        }).fail(function (err) {
                            if (err.message == Util.NOT_CONNECTED_MESSAGE) {
                                $scope.formOptions.save = false;
                            }
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                            throw err;
                        })
                }
            } catch (e) {
                var title = "save in pl.form";
                var message = e + "\n" + e.stack;
                $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
            }
        }
        $scope.edit = function () {
            $scope.formOptions.sharedOptions.saveOptions.editMode = !$scope.formOptions.sharedOptions.saveOptions.editMode;
        }

        $scope.close = function () {
            try {
                if ($scope.formOptions.parentSharedOptions) {
                    if ($scope.formOptions.parentSharedOptions.insertInfo) {
                        delete $scope.formOptions.parentSharedOptions.insertInfo.insert;
                    }
                }
                /*else {        // pop up view was not closing case-form view opened from invoke action--Ritesh bansal
                 $scope.formOptions.sharedOptions.saveOptions.editMode = false;
                 }*/
                $scope.formOptions.sharedOptions.closed = true;
            } catch (e) {
                var title = "close in pl.form";
                var message = "Error in close of pl.form" + e + "\n" + e.stack;
                $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
            }

        }

        $scope.resize = function (direction) {
            try {
                if ($scope.formOptions.resizeV && $scope.formOptions.sharedOptions && $scope.formOptions.sharedOptions.resizable != false) {
                    $scope[$scope.formOptions.resizeV]($scope.formOptions.viewIndex, direction);
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        if ($scope.formOptions.sharedOptions.viewPosition == "full") {
            $scope.resize('left');
        }
        $scope.formOptions.tabs = $scope.formOptions.tabs || [];
        $scope.formOptions.defaultActive = true;
        for (var i = $scope.formOptions.groups.length - 1; i >= 0; i--) {
            var group = $scope.formOptions.groups[i];

            if (group.views && group.views.length > 0) {
                for (var j = 0; j < group.views.length; j++) {
                    var view = group.views[j];
                    if (view.viewOptions && view.viewOptions.headerFreeze) {
                        if (group.views.length > 1) {
                            throw new Error('Only one view can be there if header is freezed in group >>>> but found ' + group.views.length);
                        } else {
                            group.tabLabel = group.tabLabel || group.title || view.viewOptions.label || 'Detail';
                        }
                    }
                }
            }

            if (angular.isDefined(group.tabLabel) && group.tabLabel != '') {
                var alreadyInList = false;
                for (var j = 0; j < $scope.formOptions.tabs.length; j++) {
                    var tab = $scope.formOptions.tabs[j];
                    if (tab.label == group.tabLabel) {
                        alreadyInList = true;
                        break;
                    }
                }
                if (alreadyInList) {
                    $scope.formOptions.tabs.groups.push(group);
                } else {
                    $scope.formOptions.tabs.push({label: group.tabLabel, groups: [group]});
                }
                $scope.formOptions.groups.splice(i, 1);
            }
        }
        if ($scope.formOptions.groups && $scope.formOptions.groups.length == 0 && $scope.formOptions.tabs.length > 0) {
            $scope.formOptions.tabs[0].active = true;
        }
    } catch (e) {
        var title = "Error in pl-form";
        var message = "Error in form >>>" + "\n" + e.stack;
        $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
    }
});

pl.controller('pl-form-group-controller', function ($scope) {
    var views = $scope.group.views;
    if (views) {
        for (var i = 0; i < views.length; i++) {
            views[i].viewOptions.viewIndex = i;
            views[i].viewOptions.openV = "openFormV";
            views[i].viewOptions.closeV = "closeFormV";
            views[i].viewOptions.getV = "getFormV";
        }
    }
    $scope.getFormV = function (index) {

        var views = $scope.group.views.views;
        var viewCount = views ? views.length : 0
        if (index >= viewCount) {
            return undefined;
        } else {
            return views[index]
        }
    }
    $scope.openFormV = function (view) {
        try {
            if (view.popup || view.viewOptions.popup) {
                $scope.openPopUpView(view);
                return;
            }

            view.viewOptions.openV = "openFormV";
            view.viewOptions.closeV = "closeFormV";
            view.viewOptions.getV = "getFormV";
            view.viewOptions.viewIndex = $scope.group.views.length;

            var viewCount = $scope.group.views.length;
            if (viewCount == 1) {
                $scope.group.views[0].viewOptions.style.display = "none"
            }

            view.viewOptions.style = view.viewOptions.style || {};
            $scope.group.views.push(view);
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }
    $scope.closeFormV = function (index) {
        try {
            var views = $scope.group.views;
            var viewCount = views ? views.length : 0;
            if (viewCount == 0) {
                var title = "closeFormV in pl.form";
                var message = "Error: No view found for close in formGroup with index[" + index + "]";
                $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
            if (index === undefined) {
                index = viewCount - 1;
            }
            if (index >= viewCount) {
                var title = "closeFormV in pl.form";
                var message = "Error: View index found for close in formGroup is [" + index + "], but total view count[" + viewCount + "]";
                $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
            views.splice(index, 1);
            viewCount = views.length;
            if (viewCount > 0) {
                var v = views[viewCount - 1];
                delete v.viewOptions.style.display;
            }

        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

});

pl.directive("plForm", ["$compile", "$timeout", function ($compile, $timeout) {
    'use strict';
    return {
        restrict: "A",
        scope: false,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {


                    if ($scope.formOptions.saveCustomization) {
                        $scope.toolBarOptions.header.right.push({template: '<div title="Save Customization" ng-show="formOptions.sharedOptions.saveCustomizationEnable" class="app-cursor-pointer pl-letter-spacing ng-scope ">' +
                            '<span ng-click="saveCustomizationOptions($event)" class="pl-header-actions save-icon"></span>' +
                            '</div>'});
                        if ($scope.formOptions.fieldCustomization) {
                            $scope.toolBarOptions.header.right.push({template: "<div title='Show/hide columns' ng-hide='formOptions.sharedOptions.saveOptions.editMode' class='manage-cols app-float-right' ng-click='showColumns($event)'><i class='dot'></i><i class='dot'></i><i class='dot'></i></div>"});
                        }

                    }

                    if ($scope.formOptions.popupResize) {
                        $scope.popupResize();
//                        $scope.toolBarOptions.header.right.push({template:'<div  ng-click="popupResize()" pl-toggle title="Resize" ng-show="!formOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer popup-resize"></div>'});
                    }
                    if ($scope.formOptions.viewControl && $scope.formOptions.viewControlOptions) {
                        var template = "<div pl-menu-group='formOptions.viewControlOptions' ></div>";
                        $scope.toolBarOptions.header.center.push({template: template});
                    }
                    $scope.onViewControlOptionClick = function (option) {
                        try {
                            if ($scope.formOptions.onViewControl) {
                                $scope[$scope.formOptions.onViewControl](option)
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.saveCustomizationOptions = function ($event, template) {
                        try {
                            if ($scope.formOptions.admin) {
                                var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                    "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveCustomization()' >Self</div>" +
                                    "   <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveAdminCustomization(true)' >Organization</div>" +
                                    "</div>";
                                var popupScope = $scope.$new();
                                var p = new Popup({
                                    autoHide: true,
                                    deffered: true,
                                    escEnabled: true,
                                    hideOnClick: true,
                                    html: $compile(optionsHtml)(popupScope),
                                    scope: popupScope,
                                    element: $event.target
                                });
                                p.showPopup();
                            } else {
                                $scope.saveCustomization();
                            }
                        } catch (e) {
                            var title = "saveCustomization in pl.form";
                            var message = 'Error in plForm saveCustomization >>>>' + e + '\n' + e.stack;
                            $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        }
                    }


                    $scope.saveAndEditActionPopup = function ($event, template) {
                        try {
                            $scope.optionsToShow = $scope.$eval(template);
                            if (angular.isDefined($scope.optionsToShow)) {
                                var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                    "<div ng-repeat='option in optionsToShow' ng-show='{{option.isShow}}' class='app-row-action app-cursor-pointer pl-popup-label app-float-left' title='{{option.title}}' ng-click='saveAndEditActionOptionClick($index, option)' ng-bind-html='option.template'></div>" +
                                    "</div>";
                                var popupScope = $scope.$new();
                                var p = new Popup({
                                    autoHide: true,
                                    deffered: true,
                                    escEnabled: true,
                                    hideOnClick: true,
                                    html: $compile(optionsHtml)(popupScope),
                                    scope: popupScope,
                                    element: $event.target
                                });
                                p.showPopup();
                            }
                        } catch (e) {
                            var title = "saveAndEditActionPopup in pl.form";
                            var message = 'Error in plForm saveAndEditActionPopup >>>>' + e + '\n' + e.stack;
                            $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        }
                    }

                    $scope.saveAndEditActionOptionClick = function ($index, saveAction) {
                        try {
                            if (saveAction.onClick) {
                                $scope[saveAction.onClick]();
                            }
                        }
                        catch (e) {
                            var title = "saveAndEditActionOptionClick in pl.form";
                            var message = 'Error in plForm saveAndEditActionOptionClick >>>>' + e + '\n' + e.stack;
                            $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        }
                    }


                    var template = "<div class='app-display-table app-width-full app-height-full app-position-relative'>";
                    if ($scope.formOptions.headerTemplate) {
                        template += $scope.formOptions.headerTemplate;
                    } else {
                        template += "               <div class='pl-header-toolbar' ng-class='{\"left\":formOptions.sharedOptions.viewPosition ==\"left\" || formOptions.sharedOptions.viewPosition ==\"full\",\"top\":formOptions.sharedOptions.viewPosition== \"right\"}' >" +
                            "                   <pl-tool-bar-header></pl-tool-bar-header>" +
                            "               </div>" +
                            "               <div pl-tool-bar class='pl-toolbar app-float-left app-width-full'></div>";
                    }
                    template += "               <div ";
                    if ($scope.formOptions.toolbar == false) {
                        template = "<div class='app-display-table app-width-full app-height-full app-position-relative'>" +
                            $scope.formOptions.headerTemplate +
                            "               <div ";
                    }

                    if (!$scope.formOptions.nested) {
                        template += " class='pl-form-wrapper' ng-class='{\"left\":formOptions.sharedOptions.viewPosition ==\"left\" || formOptions.sharedOptions.viewPosition ==\"full\",\"top\":formOptions.sharedOptions.viewPosition == \"right\"}'";
                    }
                    template += ">";

                    template += "   <div ng-if='formOptions.tabs.length > 0' pl-form-tabs></div>" +
                        "           <div ng-repeat='group in formOptions.groups' ng-show='formOptions.defaultActive' class='pl-form-group-wrapper-level-{{$index}}' pl-form-group ng-controller='pl-form-group-controller' ng-style='group.style'></div>" +
                        '                     <div class="app-text-align-right pl-clear app-padding-right-twenty-px app-padding-top-five-px" ng-show="formOptions.__isDescriptiveFields">' +
                        '                         <a ng-click="toggleMoreFields()" class="pl-link" ng-if="!formOptions.__descriptive">More fields...</a>' +
                        '                         <a ng-click="toggleMoreFields()" class="pl-link" ng-if="formOptions.__descriptive">Less fields...</a>' +
                        '                     </div>' +
                        "               </div>" +
                        "           </div>";
                    iElement.append($compile(template)($scope));


                    $scope.$watch("formOptions.dataReloaded", function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue) && angular.isDefined(oldValue)) {
                            var data = $scope.$eval($scope.formOptions.data);
                            $scope.row = {entity: data};
                        }
                    });
                    var data = $scope.$eval($scope.formOptions.data);
                    if (angular.isUndefined(data)) {
                        var title = "pl.form";
                        var message = "Data is not defined in pl-form";
                        $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        return;
                    }
                    if (angular.isArray(data)) {
                        var title = "pl.form";
                        var message = "Data expected object but got [" + JSON.stringify(data) + "]";
                        $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        return;
                    }
                    $scope.row = {entity: data};
                    if ($scope.formOptions.parentSharedOptions) {
                        $scope.formOptions.parentSharedOptions.resizable = true;
                    }
                },
                post: function ($scope, iElement) {
                    $timeout(function () {
                        if (iElement.find('input,textarea').length > 0) {
                            iElement.find('input,textarea')[0].focus();
                        }
                    }, 0);
                    $scope.toggleMoreFields = function () {
                        $scope.formOptions.__descriptive = !$scope.formOptions.__descriptive;
                    }
                }
            }
        }
    };
}]);

pl.directive('plFormTabs', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: "AE",
        scope: false,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                },
                post: function ($scope, iElement) {
                    var template = "<div class='pl-header-toolbar' style='min-height: 43px; height: auto;'>" +
                        "               <a ng-if='formOptions.groups.length > 0' class='block app-float-left pl-application-tab app-cursor-pointer' ng-class='{\"active-tab\":formOptions.defaultActive}' ng-click='onFormTabClick(\"reset\")' ng-bind='formOptions.tabLabel || formOptions.label'></a>" +
                        "               <a class='block app-cursor-pointer app-float-left pl-application-tab app-left-border' ng-repeat='tab in formOptions.tabs' ng-bind='tab.label' ng-class='{\"active-tab\":tab.active, \"app-right-border\":formOptions.tabs.length - 1 == $index}' ng-click='onFormTabClick(tab, $index)'></a>" +
                        "           </div>" +
                        "           <div ng-repeat='tab in formOptions.tabs' ng-show='tab.active' class='absolute-wrapper' style='top:43px;'>" +
                        "               <div ng-repeat='group in tab.groups' class='pl-form-group-wrapper-level-{{$index}} app-height-full' pl-form-group ng-controller='pl-form-group-controller' ng-style='group.style'></div>" +
                        "           </div>";
                    iElement.append($compile(template)($scope));
                    $scope.onFormTabClick = function (tab) {
                        try {
                            for (var i = 0; i < $scope.formOptions.tabs.length; i++) {
                                $scope.formOptions.tabs[i].active = false;
                            }
                            if (tab == 'reset') {
                                $scope.formOptions.defaultActive = true;
                            } else {
                                $scope.formOptions.defaultActive = false;
                                tab.active = true;
                            }

                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                }
            }
        }
    };
}]);

pl.directive('plFormGroup', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: "A",
        scope: false,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    if ($scope.group.columns && $scope.group.columns.length > 0) {
                        for (var i = 0; i < $scope.group.columns.length; i++) {
                            var column = $scope.group.columns[i];
                            column.style = column.style || {};
                            column.columnHolderStyle = column.columnHolderStyle || {};
                            column.style.width = column.style.width || column.width || "200px";

                            if (column.formType === "Short") {
                                $scope.formOptions.shortFieldDefined = true;
                            }

                            if ($scope.group.type == "flow") {
                                column.columnHolderStyle.width = $scope.group.width || "200px";
                            } else if (column.ui == "rte") {
                                column.columnHolderStyle.width = "100%";
                                column.singleColumn = true;
                                column.style.width = "100%";
                            } else {
                                column.columnHolderStyle.width = $scope.group.noOfColumnsPerRow > 0 ? (100 / $scope.group.noOfColumnsPerRow) + '%' : "50%";
                            }
                        }

                    }

                    if (($scope.formOptions.shortFieldDefined == undefined) && $scope.group.views && $scope.group.views.length > 0) {
                        for (var i = 0; i < $scope.group.views.length; i++) {
                            var view = $scope.group.views[i];
                            if (view.viewOptions.formType == 'Short') {
                                $scope.formOptions.shortFieldDefined = true;
                                break;
                            }
                        }
                    }
                    if (!$scope.formOptions.shortFieldDefined) {
                        $scope.formOptions.__descriptive = true;
                        $scope.formOptions.__isDescriptiveFields = false;
                    } else {
                        $scope.formOptions.__descriptive = false;
                        $scope.formOptions.__isDescriptiveFields = true;
                    }
                },
                post: function ($scope, iElement) {
                    var template = '<div class="app-width-full app-float-left pl-form-group app-height-full " ';
                    if (angular.isDefined($scope.group.when) && $scope.group.when.toString().trim().length > 0) {
                        template += ' ng-show=\'' + $scope.group.when + '\' ';
                    }
                    template += ' >' +
                        '               <div class="pl-form-group-level-{{$index}} app-font-weight-bold app-width-auto app-color-blue app-font-weight-bold app-font-size-sixteen-px app-padding-five-px app-background-grey " pl-accordion ng-show="group.showTitle">' +
                        '                   <span class="pl-group-title" ng-bind="group.title"></span>' +
                        '                   <span class="app-float-right pl-button-box" ng-click="toggleChild()">' +
                        '                       <i class=\"pl-accordion app-float-right icon-chevron-up\" ></i>' +
                        '                   </span>' +
                        '               </div>' +
                        '               <div ng-repeat="col in group.columns" ng-show="col.formType == \'Short\' || formOptions.__descriptive" class="pl-form-column-holder pl-form-container-' + $scope.group.noOfColumnsPerRow + '" pl-form-column-holder ng-style=\"col.columnHolderStyle\"></div>' +
//                        '               <pl-form-nested-column-holder></pl-form-nested-column-holder>' +
                        '               <div ng-repeat="view in group.views" ng-class="{\'app-height-full\':view.viewOptions.headerFreeze && view.viewOptions.ui==\'grid\'}" ng-style="view.viewOptions.style" ng-show="view.viewOptions.formType == \'Short\' || formOptions.__descriptive" pl-group-view></div>' +
                        '           </div>' +
                        '           <hr class="pl-form-hr" ng-show="group.separator"/>';
                    iElement.append($compile(template)($scope));
                }
            }
        }
    };
}]);

pl.directive('plAccordion', ['$compile', function ($compile) {
    return{
        restrict: "A",
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    $scope.toggleChild = function () {
                        try {
                            var iconChild = iElement.find('i.pl-accordion');
                            var iconClass = iconChild.hasClass('icon-chevron-up');
                            var siblins = iElement.siblings('div');
                            $(siblins).toggle();
                            if (iconClass) {
                                iconChild.removeClass('icon-chevron-up');
                                iconChild.addClass('icon-chevron-down');
                            } else {
                                iconChild.addClass('icon-chevron-up');
                                iconChild.removeClass('icon-chevron-down');
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    if ($scope.group && $scope.group.collapse) {
                        var iconChild = iElement.find('i.pl-accordion');
                        var siblins = iElement.siblings('div');
                        $(siblins).hide();
                        iconChild.removeClass('icon-chevron-up');
                        iconChild.addClass('icon-chevron-down');
                    }
                }
            }
        }
    }
}]);

pl.directive("plGroupView", ["$compile", function ($compile) {
    'use strict';
    return {
        restrict: "A",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var template = '<div pl-view ng-controller="ViewCtrl" class="app-float-left app-width-full app-height-full" ng-style="view.viewOptions.style" ';
                    if (angular.isDefined($scope.view.viewOptions.when) && $scope.view.viewOptions.when.toString().trim().length > 0) {
//                        var when = $scope.view.viewOptions.when.replace(/\$/g, "row.entity.");
//                        when = when.replace(/this./g, "row.entity.");
                        template += " ng-show='" + $scope.view.viewOptions.when + "' ";
                    }
                    template += " ></div>";
                    iElement.append($compile(template)($scope));
                },
                post: function ($scope, iElement) {
                }
            };
        }
    };
}]);

pl.directive('plFormEditCellTemplate', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: "A",
        scope: false,
        link: function ($scope, iElement) {
            var ngShow = '';
            var cellTemplate = "<div style='padding-left: 4px ; line-height: 28px;' ng-show='!formOptions.sharedOptions.saveOptions.editMode ";
            var editableTemplate = "<div ng-show='formOptions.sharedOptions.saveOptions.editMode ";
            if (angular.isDefined($scope.col.editableWhen)) {
                ngShow = $scope.col.editableWhen;
                cellTemplate += " || !(" + ngShow + ") ";
                editableTemplate += " && (" + ngShow + ") ";
            }
            cellTemplate += "' >" + $scope.col.cellTemplate + "</div>";
            editableTemplate += " '>" + $scope.col.editableCellTemplate + "</div>";
            iElement.append($compile(cellTemplate)($scope));
            iElement.append($compile(editableTemplate)($scope));
        }
    }
}]);

pl.directive("plFormColumnHolder", ["$compile", function ($compile) {
    'use strict';
    return {
        restrict: "AE",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {

                    $scope.col.cHolderChildStyle = $scope.col.cHolderChildStyle || {};
                    var template = '<div  class="app-width-full pl-form-content-holder" ng-style="col.cHolderChildStyle" ';
                    if (angular.isDefined($scope.col.when) && ($scope.col.when).trim().length > 0) {
//                        var when = $scope.col.when.replace(/\$/g, "row.entity.");
//                        when = when.replace(/this./g, "row.entity.");
                        template += " ng-show='" + $scope.col.when + "' ";
                    }
                    template += " >";
                    var lbl = $scope.col.label;
                    if (lbl && $scope.col.mandatory) {
                        lbl += "*";
                    }

                    template += ' <div  class="pl-form-label pl-form-text-' + $scope.$parent.group.noOfColumnsPerRow + '" title="{{col.label}}"  ng-style="col.columnLabelStyle" ng-show="group.showLabel">' + lbl + '</div>' +
                        '       <div class="pl-form-component app-float-left app-position-relative pl-form-editor-' + $scope.$parent.group.noOfColumnsPerRow + '"  pl-form-edit-cell-template ng-style="col.columnEditCellTemplateStyle"></div>' +
                        '   </div>';
                    iElement.append($compile(template)($scope));

                },
                post: function ($scope, iElement) {
                    $scope.col.columnLabelStyle = $scope.group.columnLabelStyle || {};
                    $scope.col.columnEditCellTemplateStyle = $scope.group.columnEditCellTemplateStyle || {};
                    if ($scope.formOptions.sharedOptions.saveOptions && $scope.formOptions.sharedOptions.saveOptions.editMode) {
                        $scope.col.columnLabelStyle['line-height'] = '26px';
                    }
//                    $scope.col.columnLabelStyle.width = "90%";
//                    $scope.col.columnLabelStyle["padding"] = "0px 5px";
//                    $scope.col.columnLabelStyle["text-align"] = "left";
////                    $scope.col.columnEditCellTemplateStyle.width = "90%";
//                    $scope.col.columnEditCellTemplateStyle.width = "99%";
                }
            };
        }
    };
}]);

/*pl-dashboard starts from here*/
pl.directive("plDashboard", ["$compile", function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var unwatcher = {};
                    if (!$scope.dashboardOptions.warningOptions) {
                        $scope.dashboardOptions.warningOptions = {};
                        unwatcher.warningOptions = $scope.$watch("dashboardOptions.warningOptions.warnings", function (newMess) {
                            if ($scope.dashboardOptions.warningOptions && $scope.dashboardOptions.warningOptions.warnings && $scope.dashboardOptions.warningOptions.warnings.length > 0) {
                                //open a popup here
                                alert($scope.dashboardOptions.warningOptions.title + "\n" + JSON.stringify($scope.dashboardOptions.warningOptions.warnings));
                            }
                        })
                    }
                    var views = $scope.dashboardOptions.views;
                    if (views) {
                        var ps = undefined;    //required for linking two dashboard
                        var parentAlias = undefined;
                        for (var j = 0; j < views.length; j++) {
                            if (views[j].parent) {
                                parentAlias = views[j].parent;
                                ps = {};
                                break;
                            }
                        }
                        $scope.dashboardOptions.$parameters = $scope.dashboardOptions.$parameters || {};
                        for (var i = 0; i < views.length; i++) {
                            if (parentAlias) {//required for linking two dashboard
                                if (views[i].alias === parentAlias) {
                                    views[i].view.viewOptions.sharedOptions = ps;
                                } else if (views[i].parent && views[i].parent === parentAlias) {
                                    views[i].view.viewOptions.parentSharedOptions = ps;
                                    views[i].view.viewOptions.watchParent = true;
                                }
                            }
                            views[i].view.viewOptions.resizable = false;
                            views[i].view.viewOptions.close = false;
                            views[i].view.viewOptions.parentSharedOptions = $scope.dashboardOptions.sharedOptions; //dashboard sharedOptions is passed to compositeViewOptions as parentSharedOptions so that composite view can add watch on parentSharedOptions.userPreferenceOptions--when we were applying filter in dashboard view,due to reloadUserPreference it was reloading view. and left dashboard's view filter was getting removed
                            views[i].view.viewOptions.parentParameters = $scope.dashboardOptions.$parameters; //this parentParameter is passed to each dashboard object,so that a dasbhoard view can notify change in other dashboard--case on click of row of project dashboard,filter should apply to task dashboard.
                            views[i].view.viewOptions.viewIndex = i;
                            views[i].view.viewOptions.openV = "openDashBoradV";
                            views[i].view.viewOptions.closeV = "closeDashBoradV";
                            views[i].view.viewOptions.getV = "getDashBoradV";
                        }
                    }
                    $scope.getDashBoradV = function (index) {
                        var views = $scope.dashboardOptions.views;
                        var viewCount = views ? views.length : 0
                        if (index >= viewCount) {
                            return undefined;
                        } else {
                            return views[index];
                        }
                    }

                    $scope.setKpiCellMetaData = function (viewOptions) {
                        try {
                            viewOptions.checkboxSelection = (viewOptions.checkboxSelection != undefined) ? viewOptions.checkboxSelection : false;
                            viewOptions.toolbar = false;
                            viewOptions.hyperlinkEnabled = false;
                            viewOptions.dashboardCellToolbar = true;
                            viewOptions.headerTemplate = "";
                            viewOptions.openV = "openV";
                            viewOptions.closeV = "closeView";
                            viewOptions.resizeV = "resizeView";
                            viewOptions.popUpV = "openPopUpView";
                            viewOptions.getV = "getWorkbenchView";
                            viewOptions.onViewControl = 'onViewControl';
                            viewOptions.active = true;
                            viewOptions.fieldResize = false;
                            viewOptions.fieldDragable = false;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }

                    }

                    $scope.openDashBoradV = function (v) {
                        try {
                            $scope.openV(v, function (view) {
                                var childView = {};
                                childView.view = view;
                                childView.view.viewOptions.viewIndex = $scope.dashboardOptions.views.length;
                                childView.view.viewOptions.openV = "openDashBoradV";
                                childView.view.viewOptions.closeV = "closeDashBoradV";
                                childView.view.viewOptions.getV = "getDashBoradV";

                                childView.left = $scope.dashboardOptions.views[view.viewOptions.parentViewIndex].left;
                                childView.right = $scope.dashboardOptions.views[view.viewOptions.parentViewIndex].right;
                                childView.top = $scope.dashboardOptions.views[view.viewOptions.parentViewIndex].top;
                                childView.bottom = $scope.dashboardOptions.views[view.viewOptions.parentViewIndex].bottom;
                                $scope.dashboardOptions.views.push(childView);
                                if ($scope.workbenchOptions.busyMessageOptions) {
                                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });
//                        $scope.dashboardOptions.views.push(v)
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.dashboardOptions.dashboardType = $scope.dashboardOptions.dashboardType || "AutoHeight";
                    var dashboardOptions = $scope.dashboardOptions;
                    //toolbar handling
                    $scope.$watch('dashboardOptions.userPreferenceOptions.reload', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue) && angular.isDefined(oldValue)) {
                            $scope.populateUserPreferene($scope.dashboardOptions.userPreferenceOptions, true);
                        }
                    });

                    $scope.resize = function (direction) {
                        try {
                            if ($scope.dashboardOptions.resizeV && $scope.dashboardOptions.sharedOptions && $scope.dashboardOptions.sharedOptions.resizable != false) {
                                $scope[$scope.dashboardOptions.resizeV]($scope.dashboardOptions.viewIndex, direction);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.close = function () {
                        try {
                            if ($scope.dashboardOptions.parentSharedOptions && $scope.dashboardOptions.parentSharedOptions.insertInfo) {
                                delete $scope.dashboardOptions.parentSharedOptions.insertInfo.insert;
                            }
                            $scope.dashboardOptions.sharedOptions.closed = true;
                        } catch (e) {
                            var title = "close in pl-dashboard";
                            var message = "Error in close of pl-dashboard" + e + "\n" + e.stack;
                            $scope.dashboardOptions.warningOptions.error = new Error(message + "-" + title);
                        }

                    }
                    $scope.closeChildView = function (v) {
                        try {
                            if (v && v.viewOptions) {
                                for (var i = 0; i < $scope.dashboardOptions.views.length; i++) {
                                    var view = $scope.dashboardOptions.views[i];
                                    if (view.view.viewOptions._id == v.viewOptions._id) {
                                        var parentSharedOptions = view.view.viewOptions.parentSharedOptions;
                                        if (parentSharedOptions) {
                                            delete parentSharedOptions.resizable;
                                            delete parentSharedOptions.referredView;
                                        }
                                        $scope.dashboardOptions.views.splice(i, 1);
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    if ($scope.dashboardOptions.parentSharedOptions && $scope.dashboardOptions.sharedOptions.viewPosition != "right") {
                        $scope.dashboardOptions.parentSharedOptions.resizable = true;
                        $scope.resize('left');
                    }
                    $scope.toolBarOptions = {};

                    $scope.dashboardOptions.userPreferenceOptions = $scope.dashboardOptions.userPreferenceOptions || {};
                    $scope.dashboardOptions.userPreferenceOptions.reload = false;
                    if ($scope.dashboardOptions.filterColumns && $scope.dashboardOptions.filterColumns.length > 0) {
                        $scope.dashboardOptions.userPreferenceOptions.filterColumns = $scope.dashboardOptions.filterColumns;
                        $scope.dashboardOptions.userPreferenceOptions.filterInfo = $scope.dashboardOptions.filterInfo || [];
                    }

                    if ($scope.dashboardOptions.filterInfo && $scope.dashboardOptions.filterInfo.length > 0) {
                        $scope.dashboardOptions.userPreferenceOptions.selectedType = "Filter";
                    }

                    $scope.toolBarOptions.header = {left: {}, center: [], right: []};
                    $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
                    if ($scope.dashboardOptions.close) {
                        $scope.toolBarOptions.header.right.push({template: '<div ng-click="close()" class="pl-cancel-btn app-cursor-pointer">Cancel</div>'});
                    }
                    var showResizeControl = $scope.dashboardOptions.resize !== undefined ? $scope.dashboardOptions.resize : true;

                    if (showResizeControl && $scope.dashboardOptions.parentSharedOptions) {
//                        $scope.toolBarOptions.header.center.push({template:"<div ng-click=\"resize('left')\" pl-resize ng-class='{\"pl-transform-180\":dashboardOptions.resized}' class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
                    }
                    if ($scope.dashboardOptions.showLabel && $scope.dashboardOptions.parentSharedOptions) {
                        $scope.toolBarOptions.header.center.push({
                            template: '<span class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold menu-align-margin">' +
                                '   <span  ng-bind="dashboardOptions.label"></span>' +
                                '   <span ng-if="dashboardOptions.primaryFieldInfo && dashboardOptions.primaryFieldInfo.label">' +
                                '       <span>(<span ng-bind="dashboardOptions.primaryFieldInfo.label"></span>)</span>' +
                                '   </span>' +
                                '</span>'
                        });
                    }
                    if ($scope.dashboardOptions.quickViewMenuGroup && $scope.dashboardOptions.quickViewMenuGroup.menus.length > 0) {
                        $scope.toolBarOptions.header.center.push({template: "<div pl-menu-group='dashboardOptions.quickViewMenuGroup' ></div>"});
                        $scope.toolBarOptions.header.left = $scope.dashboardOptions.quickViewMenuGroup;
                    }
                    if ($scope.dashboardOptions.viewControl) {
                        $scope.toolBarOptions.header.center.push({
                            template: "<div pl-menu-group='dashboardOptions.viewControlOptions' ></div>" +
                                ""
                        });
                    }

                    if ($scope.dashboardOptions.addUserPreference) {
                        $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":dashboardOptions.userPreferenceOptions.filterColumns}' pl-user-preference='dashboardOptions.userPreferenceOptions'></div>"});
                    }
                    if ($scope.dashboardOptions.headerActions) {
                        var template = "<div ng-repeat='action in dashboardOptions.headerActions' class='inline' ng-click='viewHeaderAction(action)' >" +
                            "               <span ng-if='!action.showLabel' ng-show='{{action.when}}' ng-class='action.class' class='inline' title='{{action.label}}' ></span>" +
                            "               <span ng-if='action.showLabel' ng-show='{{action.when}}' class='pl-cancel-btn tlbr-action-label text-overflow' title='{{action.label}}' ng-bind='action.label'></span>" +
                            "           </div>";
                        $scope.toolBarOptions.bottom.right.push({template: template});
                    }

                    if (dashboardOptions.dashboardType == "FixedHeight") {
                        $scope.dashboardColumns = dashboardOptions.views;
                        for (var i = 0; i < $scope.dashboardColumns.length; i++) {
                            var dashboardColumn = $scope.dashboardColumns[i];
                            if (dashboardColumn.left.indexOf("px") == -1 && dashboardColumn.left.indexOf("%") == -1) {
                                dashboardColumn.left += "%";
                            }
                            if (dashboardColumn.right.indexOf("px") == -1 && dashboardColumn.right.indexOf("%") == -1) {
                                dashboardColumn.right += "%";
                            }
                            if (dashboardColumn.top.indexOf("px") == -1 && dashboardColumn.top.indexOf("%") == -1) {
                                dashboardColumn.top += "%";
                            }
                            if (dashboardColumn.bottom.indexOf("px") == -1 && dashboardColumn.bottom.indexOf("%") == -1) {
                                dashboardColumn.bottom += "%";
                            }
                        }
                    }
                    else {
                        if (dashboardOptions.views && dashboardOptions.views.length > 0) {
                            $scope.dashboardColumns = [];
                            for (var i = 0; i < dashboardOptions.views.length; i++) {
                                var row = dashboardOptions.views[i];
                                var left = row.left ? row.left : 0;
                                var right = row.right ? row.right : 0;
                                var top = row.top ? row.top : 0;
                                var bottom = row.bottom ? row.bottom : 0;
                                var requiredCell = undefined;
                                for (var j = 0; j < $scope.dashboardColumns.length; j++) {
                                    if ($scope.dashboardColumns[j].left == left) {
                                        requiredCell = $scope.dashboardColumns[j];
                                        break;
                                    }
                                }
                                if (!requiredCell) {
                                    requiredCell = {left: left, right: right, top: top, bottom: bottom, cells: []};
                                    if ($scope.dashboardColumns.length > 0) {
                                        $scope.dashboardColumns[$scope.dashboardColumns.length - 1].right = 100 - left;
                                    }
                                    $scope.dashboardColumns.push(requiredCell);
                                }
                                requiredCell.cells.push(row);
                            }
                        }
                    }
                    $scope.$on('$destroy', function ($event) {
                        for (var key in unwatcher) {
                            unwatcher[key]();
                        }
                    });
                },
                post: function ($scope, iElement) {
                    var template = "";
                    if ($scope.dashboardOptions.dashboardType == "FixedHeight") {
                        template = "<div>" +
                            "                <div style='position: relative;width: 100%;'>" +
                            "                       <div class='pl-header-toolbar' >" +
                            "                           <pl-tool-bar-header></pl-tool-bar-header>" +
                            "                       </div>" +
                            "                    <div class='pl-toolbar' pl-tool-bar></div>" +
                            "                </div>" +
                            "           </div>" +
                            "           <div class='pl-dashboard-views' ng-class='{\"top-with-toolbar\": toolBarOptions.bottom.center.length > 0 }'>" +
                            "               <div>" +
                            "                   <div ng-repeat='cell in dashboardColumns' style='position: absolute;overflow-y: hidden; overflow-x: hidden;left:{{cell.left}}; right:{{cell.right}}; top:{{cell.top}}; bottom:{{cell.bottom}};'>" +
                            "<div style='position: relative;height: 100%;width:100%'>" +
                            "                       <div pl-dashboard-cell  style='position:absolute;left: 0px; right: 10px; top:0px;bottom: 10px;border:1px solid #dcdcdc;'>" +
                            " </div>   " +
                            "                   </div>" +
                            "</div>" +
                            "               </div>" +
                            "           </div>";
                    } else if ($scope.dashboardOptions.dashboardType == "AdvanceDashboard") {
                        template = "<pl-advance-dash-board></pl-advance-dash-board>";
                    } else {
                        template = "<div>" +
                            "                <div style='position: relative;width: 100%;'>" +
                            "                       <div class='pl-header-toolbar' >" +
                            "                           <pl-tool-bar-header></pl-tool-bar-header>" +
                            "                       </div>" +
                            "                    <div class='pl-toolbar' pl-tool-bar></div>" +
                            "                </div>" +
                            "           </div>" +
                            "           <div class='pl-dashboard-views'><div class=''>" +
                            "               <div ng-repeat='dashboardColumn in dashboardColumns' style='position: absolute;overflow-y: auto; overflow-x: hidden;margin-bottom: 4px;left:{{dashboardColumn.left}}%; right:{{dashboardColumn.right}}%; top:{{dashboardColumn.top}}%; bottom:{{dashboardColumn.bottom}}%;'}'>" +
                            "                   <div pl-dashboard-cell class='pl-dashboard-content' ng-repeat='cell in dashboardColumn.cells' ></div>   " +
                            "               </div>" +
                            "           </div></div>";
                    }

                    iElement.append($compile(template)($scope));

                    $scope.onViewControlOptionClick = function (option) {
                        try {
                            if ($scope.dashboardOptions.onViewControl) {
                                $scope[$scope.dashboardOptions.onViewControl](option)
                            }

                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                }
            }
        }
    };
}]);

pl.directive('plAdvanceDashBoard', ['$compile', function ($compile) {
    return {
        restrict: "EA",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement) {
                    var template = "<div class='adv-wrapper' ng-controller='plAdCtrl' pl-ad></div>";
                    $scope.dashboardOptions.addUserPreference = true;
                    $scope.dashboardOptions.openV = "openV";
                    $scope.dashboardOptions.closeV = "closeView";
                    $scope.dashboardOptions.popUpV = "openPopUpView";
                    $scope.dashboardOptions.getV = "getWorkbenchView";
                    $scope.dashboardOptions.onViewControl = 'onViewControl';
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive("plDashboardCell", ["$compile", function ($compile) {
    return {
        restrict: "A",
        replace: true,
        scope: true,
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var dashboardCellView = $scope.cell.view;
                    var viewToBind = undefined;
                    if (dashboardCellView.viewOptions.ui == "grid") {
                        viewToBind = "gridOptions";
                    } else if (dashboardCellView.viewOptions.ui == "form") {
                        viewToBind = "formOptions";
                    }
                    dashboardCellView.viewOptions.toolbar = false;
                    dashboardCellView.viewOptions.hyperlinkEnabled = false;
                    dashboardCellView.viewOptions.showSelectionCheckbox = false;
                    if (dashboardCellView.viewOptions.autoWidthColumn === undefined) {
                        dashboardCellView.viewOptions.autoWidthColumn = true;
                    }
                    dashboardCellView.viewOptions.parentSharedOptions = dashboardCellView.viewOptions.parentSharedOptions || $scope.dashboardOptions.sharedOptions;
                    var navigation = '<div ng-if="!view.viewOptions.$recursion && view.viewOptions.navigation" class="app-font-weight-bold app-text-align-center pl-horizontal-gap">' +
                        '<div class="app-float-left app-width-twenty-px app-cursor-pointer" ng-click="previous()" ng-show="' + viewToBind + '.sharedOptions.pageOptions.hasPrevious"><i class="icon-chevron-left"></i></div>' +
                        '<div ng-bind="' + viewToBind + '.sharedOptions.pageOptions.label" class="app-float-left"></div>' +
                        '<div ng-show="' + viewToBind + '.sharedOptions.pageOptions.fetchCount" class="app-float-left">{{"&nbsp;of&nbsp;"+' + viewToBind + '.sharedOptions.pageOptions.count}}</div>' +
                        '<div class="app-float-left app-width-twenty-px app-cursor-pointer" ng-click="next()" ng-show="' + viewToBind + '.sharedOptions.pageOptions.hasNext" ><i class="icon-chevron-right"></i></div>' +
                        '</div>';
                    dashboardCellView.viewOptions.headerTemplate = "<div pl-accordion class='app-background-grey dashboard-header'>" +
                        "                                               <span  class='text-overflow app-float-left flex-1' style='margin-left:10px;'>" +
                        '                                                   <span class="app-padding-five-px app-font-size-sixteen-px text-overflow">' +
                        '                                                      <span title="{{' + viewToBind + '.label}}" ng-bind="' + viewToBind + '.label"></span>' +
                        '                                                      <span title="{{' + viewToBind + '.primaryFieldInfo.label}}" ng-if="' + viewToBind + '.primaryFieldInfo && ' + viewToBind + '.primaryFieldInfo.label">' +
                        '                                                          <span>(<span ng-bind="' + viewToBind + '.primaryFieldInfo.label"></span>)</span>' +
                        '                                                      </span>' +
                        '                                                   </span>' +
                        "                                               </span>" +

                        "                                                   <span class='app-float-right ' style='display: inline-flex; margin-right: 10px;'>" +
                        navigation +
                        "                                                   <span ng-click='closeChildView(cell.view)' class='pl-cancel-btn app-cursor-pointer' ng-if='cell.view.viewOptions.parentViewIndex != undefined' style='margin: 0; padding: 3px 6px; height: 18px;'>Cancel</span>" +
                        "                                                   <span ng-if='dashboardOptions.dashboardType !== \"FixedHeight\"' class='app-float-left' ng-click='toggleChild()'>" +
                        "                                                       <i class=\"pl-accordion icon-chevron-up\" ></i>" +
                        "                                                   </span>" +
                        "                                               </span> " +
                        "                                           </div>";
                    if ($scope.dashboardOptions.dashboardType !== "FixedHeight") {
                        dashboardCellView.viewOptions.headerFreeze = false;
                        dashboardCellView.viewOptions.nested = true;
                    }

                    $scope.view = dashboardCellView;
                    var template = undefined;
                    if ($scope.dashboardOptions.dashboardType === "FixedHeight") {
                        template = "    <div>" +
                            "                       <div class='app-busy-message-container-true' ng-show='view.viewOptions.busyMessageOptions.msg'>" +
                            "                       <div class='app-busy-message' ng-bind='view.viewOptions.busyMessageOptions.msg'></div>" +
                            "                           </div>" +

                            "                   <div style='width: 100%;height: 100%; overflow-x: hidden; overflow-y: hidden;' pl-view ng-controller='ViewCtrl' class='app-position-absolute' ng-style='view.viewOptions.style'></div>" +
                            "           </div>";

                    } else {
                        template = "<div style='position:relative;float: left;width: 100%'>" +
                            "                   <div class='app-busy-message-container-true' ng-show='view.viewOptions.busyMessageOptions.msg'>" +
                            "                       <div class='app-busy-message' ng-bind='view.viewOptions.busyMessageOptions.msg'></div>" +
                            "                           </div>" +
                            "               <div pl-view  ng-controller='ViewCtrl' class='app-float-left app-width-full pl-dashboard-content-children' ng-style='view.viewOptions.style'>" +

                            "               </div>" +
                            "           </div>";
                    }


                    iElement.append($compile(template)($scope));
                }
            }
        }
    };
}]);

pl.controller('plAdCtrl', function ($scope) {

    function populateGroups(views, groups, defaultGroup, dashboardGroups) {
        for (var i = 0; i < views.length; i++) {
            var cell = views[i];
            cell.style = cell.style || {};
            if ($scope.dashboardOptions.dashboardLayout) {
                var dashboardColumns = Number($scope.dashboardOptions.dashboardLayout.substring(0, $scope.dashboardOptions.dashboardLayout.indexOf(" ")));
                if (dashboardColumns) {
                    $scope.dashboardOptions.availabelColSpan = dashboardColumns;
                    cell.style.width = (100 / dashboardColumns);
                }
                if (cell.colSpan) {
                    cell.style.width *= cell.colSpan;
                }
                if (cell.style.width) {
                    cell.style.width = cell.style.width + '%';
                }
            }
            if (cell.groupName && dashboardGroups && dashboardGroups.length > 0) {
                for (var j = 0; j < dashboardGroups.length; j++) {
                    var group = dashboardGroups[j];
                    if (cell.groupName == group.name) {
                        var adGroup = {
                            name: group.name,
                            cells: [],
                            noOfCellsPerRow: group.noOfCellsPerRow,
                            showName: group.showName,
                            height: group.height
                        }
                        var alreadyInGroup = false;
                        for (var k = 0; k < groups.length; k++) {
                            var adGroupCell = groups[k];

                            if (groups[k].name == group.name) {
                                alreadyInGroup = true;
                                adGroupCell.cells.push(cell);
                                break;
                            }
                        }
                        if (!alreadyInGroup) {
                            groups.push(adGroup);
                            adGroup.cells.push(cell);
                        }
                    }
                }
            } else {
                defaultGroup.cells.push(cell);
            }
        }

    }

    function populateAggregateColumns(aggGroups, aggCols) {
        for (var i = 0; i < aggGroups.length; i++) {
            var aggGroup = aggGroups[i];
            if (aggGroup.column === undefined) {
                aggGroup.column = 1;
            }
            if (aggGroup.column == 1) {
                aggCols[0].columns.push(aggGroup);
            } else if (aggGroup.column == 2) {
                aggCols[1].columns.push(aggGroup);
            } else if (aggGroup.column >= 3) {
                aggCols[2].columns.push(aggGroup);
            }

        }
    }

    $scope.dashboardOptions.aggregates = $scope.dashboardOptions.aggregates || [];
    var defaultGroup = {name: 'Default', cells: [], showName: false, height: '170px'};
    if ($scope.dashboardOptions.views && $scope.dashboardOptions.views.length > 0) {
        for (var i = $scope.dashboardOptions.views.length - 1; i >= 0; i--) {
            /*move primary views to aggregates to show seperate view in left side 33%*/
            var view = $scope.dashboardOptions.views[i];
            if ($scope.dashboardOptions.views[i].primary) {
                $scope.dashboardOptions.aggregates.push($scope.dashboardOptions.views[i]);
                $scope.dashboardOptions.views.splice(i, 1);
            }
        }

        var noOfCellsPerRows = $scope.dashboardOptions.views.length < 3 ? $scope.dashboardOptions.views.length : 3;
        $scope.dashboardOptions.adGroups = $scope.dashboardOptions.adGroups || [];
        populateGroups($scope.dashboardOptions.views, $scope.dashboardOptions.adGroups, defaultGroup, $scope.dashboardOptions.dashboardGroups);
        $scope.dashboardOptions.adGroups.push(defaultGroup);
    }
    if ($scope.dashboardOptions.aggregates && $scope.dashboardOptions.aggregates.length > 0) {
        if ($scope.dashboardOptions.views && $scope.dashboardOptions.views.length > 0) {
            $scope.dashboardOptions.groupStyle = {'float': 'right', 'width': '67%', 'left': '33%'};
        }

        $scope.dashboardOptions.aggregateGroups = $scope.dashboardOptions.aggregateGroups || [];

        $scope.dashboardOptions.aggregateColumnViews = $scope.dashboardOptions.aggregateColumnViews || [];
        for (var i = 0; i < 3; i++) {
            $scope.dashboardOptions.aggregateColumnViews.push({columns: []});
            $scope.dashboardOptions.aggregateGroups.push({views: []});
        }

        populateAggregateColumns($scope.dashboardOptions.aggregates, $scope.dashboardOptions.aggregateColumnViews);
        for (var i = 0; i < $scope.dashboardOptions.aggregateColumnViews.length; i++) {
            if ($scope.dashboardOptions.aggregateColumnViews[i].columns.length > 0) {
                $scope.dashboardOptions.totalViewColumns = i + 1;
            }
        }
        if ($scope.dashboardOptions.totalViewColumns > 1) {
            $scope.dashboardOptions.groupStyle = {};
            $scope.dashboardOptions.groupStyle.display = 'none';
            if ($scope.dashboardOptions.views && $scope.dashboardOptions.views.length > 0) {
                $scope.dashboardOptions.warningOptions.error = new Error("View can't be defined if aggregate is coming in more than one columns.");
            }
        }
        for (var i = 0; i < $scope.dashboardOptions.aggregateColumnViews.length; i++) {
            defaultGroup = {name: 'Default', cells: [], showName: false, height: '170px'};
            if ($scope.dashboardOptions.aggregateColumnViews[i].columns.length > 0) {
                populateGroups($scope.dashboardOptions.aggregateColumnViews[i].columns, $scope.dashboardOptions.aggregateGroups[i].views, defaultGroup, $scope.dashboardOptions.dashboardGroups);

            }
            if (defaultGroup && defaultGroup.cells && defaultGroup.cells.length > 0) {
                $scope.dashboardOptions.aggregateGroups[i].views.push(defaultGroup);

            }
            defaultGroup = undefined;
            $scope.dashboardOptions.aggregateGroups[i].style = {};

            if ($scope.dashboardOptions.totalViewColumns == 2) {
                $scope.dashboardOptions.aggregateGroups[i].style.width = '50%';
                $scope.dashboardOptions.aggregateGroups[i].style.left = (50 * i) + '%';
            } else {
                $scope.dashboardOptions.aggregateGroups[i].style.width = '33%';
                $scope.dashboardOptions.aggregateGroups[i].style.left = (33 * i) + '%';
            }
            $scope.dashboardOptions.aggregateGroups[i].style["z-index"] = '1';
        }
    }


    $scope.toolBarOptions = {};
    $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
    $scope.toolBarOptions.top = {left: [], center: [], right: []};
    $scope.toolBarOptions.header = {left: {}, center: [], right: []};
    $scope.dashboardOptions.style = $scope.dashboardOptions.style || {top: '38px;'};

    if ($scope.dashboardOptions.showLabel && $scope.dashboardOptions.parentSharedOptions) {
        $scope.toolBarOptions.header.center.push({template: '<span ng-class=\'{"menu-align-margin":dashboardOptions.sharedOptions.viewPosition != "right"}\' class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
            '   <span  ng-bind="dashboardOptions.label"></span>' +
            '   <span ng-if="dashboardOptions.primaryFieldInfo && dashboardOptions.primaryFieldInfo.label">' +
            '       <span>(<span ng-bind="dashboardOptions.primaryFieldInfo.label"></span>)</span>' +
            '   </span>' +
            '</span>'
        });
    }

    if ($scope.dashboardOptions.quickViewMenuGroup && $scope.dashboardOptions.quickViewMenuGroup.menus.length > 0) {
        $scope.toolBarOptions.header.left = $scope.dashboardOptions.quickViewMenuGroup;
    }
    if ($scope.dashboardOptions.viewControl && $scope.dashboardOptions.viewControlOptions) {
        var template = "<div pl-menu-group='dashboardOptions.viewControlOptions' ></div>";
        $scope.toolBarOptions.header.center.push({template: template});
    }
    $scope.dashboardOptions.userPreferenceOptions = $scope.dashboardOptions.userPreferenceOptions || {};
    $scope.dashboardOptions.userPreferenceOptions.reload = false;
    if ($scope.dashboardOptions.filterColumns && $scope.dashboardOptions.filterColumns.length > 0) {
        $scope.dashboardOptions.userPreferenceOptions.filterColumns = $scope.dashboardOptions.filterColumns;
        $scope.dashboardOptions.userPreferenceOptions.filterInfo = $scope.dashboardOptions.filterInfo || [];
    }

    if ($scope.dashboardOptions.filterInfo && $scope.dashboardOptions.filterInfo.length > 0) {
        $scope.dashboardOptions.userPreferenceOptions.selectedType = "Filter";
    }
    if ($scope.dashboardOptions.addUserPreference && !$scope.dashboardOptions.watchParentParameter) {  //check of watchParentParameter is added for calling a composite-view from a dashboard and we all calling a dashboard view from that composite view and we want to show the dashboard view of compositeview at top
        $scope.dashboardOptions.style.top = '92px';
        $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":dashboardOptions.userPreferenceOptions.filterColumns}' pl-user-preference='dashboardOptions.userPreferenceOptions'></div>"});
    }
    if ($scope.dashboardOptions.close) {
        $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
    }

    if ($scope.dashboardOptions.headerActions) {
        var template = "<div ng-repeat='action in dashboardOptions.headerActions' class='inline' ng-click='viewHeaderAction(action)' >" +
            "               <span ng-if='!action.showLabel' ng-show='{{action.when}}' ng-class='action.class' class='inline' title='{{action.label}}' ></span>" +
            "               <span ng-if='action.showLabel' ng-show='{{action.when}}' class='pl-cancel-btn tlbr-action-label text-overflow' title='{{action.label}}' ng-bind='action.label'></span>" +
            "           </div>";
        $scope.toolBarOptions.bottom.right.push({template: template});
    }

    $scope.ftsSearch = function (val) {   //to show the fts search box in dashboard and applying filter on composite
        $scope.dashboardOptions.$parameters = $scope.dashboardOptions.$parameters || {};
        $scope.dashboardOptions.$parameters.__fulltext__ = val;
        $scope.dashboardOptions.$parameters.__changed = !$scope.dashboardOptions.$parameters.__changed;
    };

    if ($scope.dashboardOptions.enableFts) {//to show the fts search box in dashboard and applying filter on composite on the basis of enableFts
        $scope.dashboardOptions.ftsInfo = {onClick: "ftsSearch"};
        $scope.toolBarOptions.bottom.right.push({
            template: "<pl-fts data-info='dashboardOptions.ftsInfo' class='pl-sub-fts' ></pl-fts>"
        });
    }

    $scope.onViewControlOptionClick = function (option) {
        try {
            if ($scope.dashboardOptions.onViewControl) {
                $scope[$scope.dashboardOptions.onViewControl](option)
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }

    }

    $scope.close = function () {
        try {
            if ($scope.dashboardOptions.parentSharedOptions && $scope.dashboardOptions.parentSharedOptions.insertInfo) {
                delete $scope.dashboardOptions.parentSharedOptions.insertInfo.insert;
            }
            $scope.dashboardOptions.sharedOptions.closed = true;
        } catch (e) {
            var title = "close in pl-dashboard";
            var message = "Error in close of pl-dashboard" + e + "\n" + e.stack;
            $scope.dashboardOptions.warningOptions.error = new Error(message + "-" + title);
        }

    }
});

pl.directive("plAd", ["$compile", function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                },
                post: function ($scope, iElement) {
                    var template = "";
                    var style = undefined;
                    if ($scope.dashboardOptions.watchParentParameter) {//check of watchParentParameter is added for calling a composite-view from a dashboard and we all calling a dashboard view from that composite view and we want to show the dashboard view of compositeview at top and do not want to show headerbar and toolbar
                        $scope.dashboardOptions.style.top = 0; //case showing profit and loss dashbord view for hitkarini
                        style = "0px";
                    } else {
                        style = "8px";
                        template += "<div>" +
                            "               <div style='position: relative;width: 100%;'>" +
                            "                   <div class='pl-header-toolbar' >" +
                            "                       <pl-tool-bar-header></pl-tool-bar-header>" +
                            "                   </div>" +
                            "                   <div class='pl-toolbar' pl-tool-bar></div>" +
                            "               </div>" +
                            "           </div>"
                    }
                    template += "<div class='adv-wrapper advanced-cell' style='top:" + $scope.dashboardOptions.style.top + "; margin-left: " + style + ";' pl-dashboard-body></div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    };
}]);

pl.directive('plDashboardBody', ['$compile', '$timeout', function ($compile, $timeout) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    $timeout(function () {
                        var template = "    <div class=' pl-clear'>" +
                            "                   <div class='app-float-left absolute-wrapper' ng-repeat='aggGroupContainer in dashboardOptions.aggregateGroups' ng-if='aggGroupContainer.views.length > 0' ng-style='aggGroupContainer.style'>" +
                            "                       <div class='absolute-wrapper app-overflow-auto'>" +
                            "                           <div pl-agg-group ng-repeat='aggGroup in aggGroupContainer.views'></div>" +
                            "                       </div>" +
                            "                   </div>" +
                            "                   <div ng-if='dashboardOptions.adGroups.length > 0' ng-style='dashboardOptions.groupStyle' class='absolute-wrapper app-overflow-auto'>" +
                            "                   <div ng-repeat='kGroup in dashboardOptions.adGroups' class='adv-group-wrapper'>" +
                            "                       <div ng-style='kGroup.style'>" +
                            "                           <div class='adv-gp-header' ng-if='kGroup.showName' >" +
                            "                               <div class='adv-header' ng-bind='kGroup.name'></div>" +
                            "                           </div>" +
                            "                       </div>" +
                            "                       <div pl-ad-group class='app-overflow-hiiden' ></div>" +
                            "                   </div>" +
                            "                   </div>" +
                            "               </div>";
                        iElement.append(($compile)(template)($scope));
                    }, 0);

                },
                post: function ($scope, iElement) {
                }
            }
        }
    }
}]);

pl.directive('plAggGroup', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope) {
                    if ($scope.aggGroup && $scope.aggGroup.cells && $scope.aggGroup.cells.length > 0) {
                        $scope.aggGroup.agHeaders = $scope.aggGroup.agHeaders || [];
                        $scope.aggGroup.agHeaders.push({label: $scope.aggGroup.name});
                        var agGroup = $scope.aggGroup;
                        $scope.kGroup = {cells: []};
                        /* populate kGroup here based on primary value in cells to show view in aggregate area*/
                        for (var i = $scope.aggGroup.cells.length - 1; i >= 0; i--) {
                            var cell = $scope.aggGroup.cells[i];
                            if (cell.primary) {
                                $scope.kGroup.cells.push(cell);
                                $scope.aggGroup.cells.splice(i, 1);
                            }
                        }
                        if (agGroup.cells[0] && agGroup.cells[0].view && agGroup.cells[0].view.viewOptions && agGroup.cells[0].view.viewOptions.aggregateSpan) {
                            var aggregateSpan = agGroup.cells[0].view.viewOptions.aggregateSpan;
                            aggregateSpan.month == true ? $scope.aggGroup.agHeaders.push({label: aggregateSpan.monthLabel, style: {width: '90px'}}) : '';
                            aggregateSpan.quarter == true ? $scope.aggGroup.agHeaders.push({label: aggregateSpan.quarterLabel, style: {width: '90px'}}) : '';
                            aggregateSpan.fy == true ? $scope.aggGroup.agHeaders.push({label: aggregateSpan.fyLabel, style: {width: '90px'}}) : '';
                        }
                    }
                },
                post: function ($scope, iElement, attrs) {
                    var template = "<div class='adv-group-wrapper adv-cell' style='padding: 0; border-left: 1px solid #d5d5d5; box-shadow: none; margin: 8px 8px 0 0 '>" +
                        "               <table class='app-width-full'>" +
                        "                   <tr class='agHeader' style='border-right: 1px solid #d5d5d5;'>" +
                        "                       <td class='agHeader-cell app-text-align-center' ng-repeat='agHeader in aggGroup.agHeaders' ng-style='agHeader.style' style='padding: 10px 0; font-weight: bold;' ng-bind='agHeader.label' ng-class={\"flex-1\":agHeader.fullWidth}></td>" +
                        "                   </tr>" +
                        "               </table>" +
                        "               <table class='app-width-full' style='margin-top: -1px;' ng-repeat='cell in aggGroup.cells' pl-agg-row-data>" +
                        "               </table>" +
                        "           </div>";
                    if ($scope.kGroup.cells && $scope.kGroup.cells.length > 0) {
                        /*add view in template if any primary view comes, we dont show aggregate if we have the simple views to show*/
                        template = " <div pl-ad-group class='app-overflow-hiiden' ></div>";
                    }
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plAggRowData', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope) {
                    if ($scope.cell && $scope.cell.view && $scope.cell.view.data && $scope.cell.view.data.result) {
                        if ($scope.cell.view.viewOptions.value) {
                            $scope.cell.valueExpression = $scope.cell.view.viewOptions.value;
                            $scope.cell.percentageExpression = $scope.cell.view.viewOptions.value + '__percentage';
                            if ($scope.cell.view.viewOptions.valueui == 'currency') {
                                $scope.cell.valueExpression += '.amount | number:0 | zero';
                            }
                        }
                        $scope.setKpiCellMetaData($scope.cell.view.viewOptions);
                    }

                    $scope.openDrilDownView = function (viewInfo, timePeriod) {
                        try {
                            var referredView = viewInfo;
                            var referredViewParameters = angular.copy(referredView.parameters);
                            var mainParameters = angular.copy($scope.cell.view.viewOptions.parameters);
                            mainParameters.__selectedSpanDate = mainParameters[timePeriod];
                            referredView.skipUserState = true;
                            if (mainParameters && referredViewParameters) {
                                var newParameters = angular.copy(mainParameters);
                                $scope.resolveParameters(referredViewParameters, mainParameters, newParameters);
                                referredView.$parameters = newParameters;
                            }
                            referredView.parentSharedOptions = viewInfo.parentSharedOptions || {};
                            referredView.fullMode = true;
                            referredView.dashboardLayout = $scope.dashboardOptions.dashboardLayout;
                            referredView.close = true;
                            referredView.showLabel = true;
                            referredView.parentSharedOptions.primaryFieldValue = {label: $scope.cell.name};
                            $scope[$scope.cell.view.viewOptions.openV](referredView);
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                },
                post: function ($scope, iElement) {
                    var template = "<tr ng-show='cell.view.viewOptions.busyMessageOptions.msg' style='height: 40px;' class='app-right-border'>" +
                        "           <td colspan='4' class='app-position-relative'>" +
                        "               <span class='adv app-border-none' style='box-shadow: none;'>" +
                        "                   <div class='app-busy-message-container-true' style='left: 50%; top:30%;' ng-show='cell.view.viewOptions.busyMessageOptions.msg'>" +
                        "                       <div class='app-background-message app-zero-margin' >" +
                        "                           <img ng-src='{{cell.view.viewOptions.busyMessageOptions.msg}}' style='padding: 0 5px; width: 15px;' class='pl-grid-refresh-box' />" +
                        "                       </div>" +
                        "                   </div>" +
                        "               </span>" +
                        "           </td></tr>" +
                        "  <tr ng-repeat='row in cell.view.data.result' style='border-right: 1px solid #d5d5d5; background: #ffffff; height: 56px;'> " +
                        "              <td class='agHeader-cell app-position-relative app-padding-left-five-px'>" +
                        "                   <span ng-bind='cell.name' ng-show='!cell.view.viewOptions.groupColumns'></span>" +
                        "                   <span ng-bind='row.aggregateLabel' ng-show='cell.view.viewOptions.groupColumns'></span>" +
                        "               </td>" +
                        "              <td class='agHeader-cell' style='line-height: 10px; width: 90px;' >" +
                        "                   <span '>" +
                        "                       <pl-indicator bind-to='month'></pl-indicator>" +
                        "                 </span>" +
                        "               </td>" +
                        "              <td class='agHeader-cell' style='line-height: 10px;  width: 90px;'>" +
                        "                   <span >" +
                        "                       <pl-indicator bind-to='quarter'></pl-indicator>" +
                        "                   </span>" +
                        "               </td>" +
                        "              <td class='agHeader-cell' style='line-height: 10px;  width: 90px;'>" +
                        "                   <span >" +
                        "                       <pl-indicator bind-to='fy'></pl-indicator>" +
                        "                   </span>" +
                        "               </td>" +
                        "          </tr>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plIndicator', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var arrowClass = undefined;
                    var textClass = undefined;
                    if ($scope.row[attrs.bindTo] && $scope.row[attrs.bindTo][$scope.cell.percentageExpression] >= 0) {
                        if ($scope.cell.view.viewOptions.indicator == 'decreasing') {
                            arrowClass = 'up red';
                            textClass = 'red';
                        } else {
                            arrowClass = 'up green';
                            textClass = 'green';
                        }
                    } else {
                        if ($scope.cell.view.viewOptions.indicator == 'decreasing') {
                            arrowClass = 'down green';
                            textClass = 'green';
                        } else {
                            arrowClass = 'down red';
                            textClass = 'red';
                        }
                    }
                    var template = " <span style='white-space: normal;'>" +
                        "               <a ng-if='cell.drildownView' class='block app-text-align-center' ng-click='openDrilDownView(cell.drildownView, \"" + attrs.bindTo + "\")' ng-bind='row." + attrs.bindTo + "." + $scope.cell.valueExpression + "'></a>" +
                        "               <span ng-if='!cell.drildownView' class='block app-text-align-center' ng-bind='row." + attrs.bindTo + "." + $scope.cell.valueExpression + "'></span>" +
                        "           </span>" +
                        "           <span class='right-text block app-text-align-center' style='padding: 0;' ng-if='row." + attrs.bindTo + "." + $scope.cell.percentageExpression + "'>" +
                        "               <span ng-bind='row." + attrs.bindTo + "." + $scope.cell.percentageExpression + " | zero | percentage' class='" + textClass + "'></span>" +
                        "               <span class='" + arrowClass + "'></span>" +
                        "           </span>" +
                        "           <span class='right-text block app-text-align-center' style='padding: 0;' ng-if='!row." + attrs.bindTo + "." + $scope.cell.percentageExpression + "'>-</span>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}])

pl.directive("plAdGroup", ["$compile", function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.kGroup.style = $scope.kGroup.style || {};
                    if (!$scope.dashboardOptions.availabelColSpan) {
                        $scope.dashboardOptions.availabelColSpan = 1
                    }
                    var availabelColSpan = $scope.dashboardOptions.availabelColSpan;
                    $scope.viewRowGroup = [];
                    var viewRowCells = [];
                    var maxHeight = 0;
                    for (var i = 0; i < $scope.kGroup.cells.length; i++) {
                        var cell = $scope.kGroup.cells[i];
                        viewRowCells.push(cell);
                        if (!cell.colSpan) {
                            cell.colSpan = 1;
                        }
                        if (cell.colSpan) {
                            availabelColSpan = availabelColSpan - cell.colSpan;
                        }
                        if (cell.height != undefined && cell.height > maxHeight) {
                            maxHeight = cell.height;
                        }
                        if (availabelColSpan <= 0 || (i == $scope.kGroup.cells.length - 1)) {
                            if (maxHeight > 0) {
                                for (var j = 0; j < viewRowCells.length; j++) {
                                    viewRowCells[j].maxHeight = {maxHeight: maxHeight + "px"};
                                }
                            }
                            $scope.viewRowGroup.push(viewRowCells);
                            maxHeight = 0;
                            viewRowCells = [];
                            availabelColSpan = $scope.dashboardOptions.availabelColSpan;
                        }
                    }
                },
                post: function ($scope, iElement) {
                    var template = "<div ng-repeat='viewRow in viewRowGroup' class='flex' >" +
                        "               <div ng-repeat='cell in viewRow' class='flex app-width-full inline app-vertical-align-top' ng-style='cell.style'>" +
                        "                   <div pl-arrange-cell class='adv app-width-full' ng-style='cell.childStyle'></div>" +
                        "               </div>" +
                        "           </div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    };
}]);

pl.directive('plArrangeCell', ['$compile', '$timeout', function ($compile, $timeout) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    if ($scope.cell.ui == 'form') {
                        $scope.cell.childStyle = $scope.cell.childStyle || {};
                        $scope.cell.childStyle.background = "url('../images/panel_bg.png')";
                    }
                    $scope.cell.viewControl = $scope.dashboardOptions.viewControl;
                    var template = "<div ng-style='cell.maxHeight' class='adv-cell'>" +
                        "               <pl-ad-cell ng-class='{\"flex\":(cell.watchParentParameter || cell.provideParentParameter)}' ng-controller='plAdCellCtrl'></pl-ad-cell>" +
                        "           </div>" +
                        "<div></div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.controller('plAdCellCtrl', function ($scope) {
    if ($scope.cell && $scope.cell.view && $scope.cell.view.viewOptions) {
        $scope.setKpiCellMetaData($scope.cell.view.viewOptions);
        $scope.cell.views = [$scope.cell.view];
    }

    $scope.cell.viewControlOptions = {
        menus: [

            {
                label: AppViews.__selfquickviewcustomization__.viewOptions.label,
                viewid: AppViews.__selfquickviewcustomization__.viewOptions.id
            },
            {
                label: AppViews.__editaction__.viewOptions.label,
                viewid: AppViews.__editaction__.viewOptions.id
            },
            {
                label: AppViews.__editfield__.viewOptions.label,
                viewid: AppViews.__editfield__.viewOptions.id
            }
        ],
        class: "app-bar-button app-menu-setting",
        displayField: "label",
        hideOnClick: true,
        onClick: 'onViewControlOptionClick',
        menuClass: 'pl-default-popup-label'
    };
    $scope.onHeaderActionClick = function (action, openViewType, viewIndex) {
        try {
            if ($scope.cell.views[viewIndex] && $scope.cell.views[viewIndex].viewOptions[openViewType]) {
                var referredView = angular.copy($scope.cell.views[viewIndex].viewOptions[openViewType]);
                var mainUI = $scope.cell.views[viewIndex].viewOptions.ui;
                var referredViewParameters = referredView.parameters;
                var mainParameters = undefined;
                if (mainUI == "aggregate") {
                    mainParameters = $scope.cell.views[viewIndex].viewOptions.parameters;
                }
                referredView.skipUserState = true;
                if (mainParameters && referredViewParameters) {
                    var newParameters = angular.copy(mainParameters);
                    $scope.resolveParameters(referredViewParameters, mainParameters, newParameters);
                    referredView.$parameters = newParameters;
                }
                if (referredView.viewMode == 'popup') {
                    referredView.popupResize = true;
                    $scope[$scope.cell.views[viewIndex].viewOptions.popUpV](referredView);

                } else if (referredView.viewMode == 'overlay') {
                    $scope[$scope.cell.views[viewIndex].viewOptions.openV](referredView, function (overlayView) {
                        if (overlayView) {
                            $scope.setKpiCellMetaData(overlayView.viewOptions);
                            for (var i = 0; i < $scope.cell.views.length; i++) {
                                var view = $scope.cell.views[i];
                                if (view.viewOptions) {
                                    view.viewOptions.active = false;
                                }
                            }
                            overlayView.viewOptions.close = true;
                            $scope.cell.views.push(overlayView);
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    });

                } else if (referredView.viewMode == 'aside') {
                    referredView.close = true;
                    referredView.fullMode = true;
                    $scope[$scope.cell.views[viewIndex].viewOptions.openV](referredView);

                } else {
                    $scope.expendedView(referredView);
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

    $scope.closeCell = function (viewIndex) {
        try {
            if (viewIndex && $scope.cell.views.length > viewIndex) {
                $scope.cell.views.splice(viewIndex, 1);
                if ($scope.cell.views.length > 0) {
                    $scope.cell.views[$scope.cell.views.length - 1].viewOptions.active = true;
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };
    $scope.expendedView = function (viewInfo) {
        try {
            if (viewInfo) {
                viewInfo.parentSharedOptions = viewInfo.parentSharedOptions || {};
                viewInfo.fullMode = true;
                viewInfo.close = true;
                viewInfo.showLabel = true;
                viewInfo.parentSharedOptions.primaryFieldValue = {label: $scope.cell.name};
                $scope[$scope.view.viewOptions.openV](viewInfo);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

});

pl.directive('plAdCell', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    var template = "<div ng-class='{\"app-position-relative\":dashboardOptions.watchParentParameter}' ng-style='childStyle' class='app-white-backgroud-color'>" +
                        "               <div class='app-busy-message-container-true' ng-show='cell.view.viewOptions.busyMessageOptions.msg'>" +
                        "                   <img src='images/loadinfo.gif' class='app-background-message pl-grid-refresh-box'/>" +
                        "               </div>" +
                        "               <div ng-repeat='view in cell.views' ng-mousedown='bindmouseMove()' ng-mouseup='unbindmouseMove()' ng-show='view.viewOptions.active' pl-view ng-controller='ViewCtrl' ng-style='view.viewOptions.style' ></div>" +
                        "           </div>";
                    setTimeout(function () {
//                        var eleWidth = iElement[0].offsetWidth; // we have to apply pl-sub-view class on dasboard if width is less than 400,case on click of row of one dashboard view,we have to notify other dashboard view
                        if ($scope.cell.view.viewOptions.provideParentParameter) {
                            $scope.cell.view.viewOptions.viewClass = "pl-sub-view";
                        }
                        iElement.append(($compile)(template)($scope));
                    }, 0);
                }
            }
        }
    }
}]);

pl.controller('plAggregateCtrl', function ($scope) {
    if (!$scope.aggregateOptions) {
        $scope.aggregateOptions = {};
    }
    if ($scope.view && $scope.view.data && $scope.view.data.result) {
        $scope.aggregateOptions.cellData = $scope.view.data.result;
    }
    if ($scope.aggregateOptions.valueui == 'currency') {
        $scope.aggregateOptions.valueExpression = $scope.aggregateOptions.value + '.amount | number:0 | zero';
        $scope.aggregateOptions.percentageExpression = $scope.aggregateOptions.value + '__percentage';
    } else if ($scope.aggregateOptions.valueui == 'number') {
        $scope.aggregateOptions.valueExpression = $scope.aggregateOptions.value + ' | number | zero';
        $scope.aggregateOptions.percentageExpression = $scope.aggregateOptions.value + '__percentage';
    }
});

pl.directive('plAggregateView', ['$compile', function ($compile) {
    return {
        restrict: 'EA',
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement) {

                },
                post: function ($scope, iElement) {
                    var template = "<div>";
                    if ($scope.aggregateOptions.headerTemplate) {
                        template += $scope.aggregateOptions.headerTemplate;
                    }
                    template += "   <div class='adv-body'>" +
                        "               <div ng-repeat='row in aggregateOptions.cellData' class='app-width-full'>" +
                        "                   <div class='adb-cell app-text-align-right' >" +
                        "                       <div class='top-layer'>" +
                        "                           <div title='Month' style='margin-right: 0;' class='app-width-full'>" +
                        "                               <i ng-class='{\"icon-rupee\":row.month." + $scope.aggregateOptions.value + ".type.currency == \"INR\", \"icon-dollar\":row.month." + $scope.aggregateOptions.value + ".type.currency == \"USD\"}' style='padding-left: 5px;'></i>" +
                        "                               <span ng-bind='row.month." + $scope.aggregateOptions.valueExpression + "'></span>" +
                        "                               <span class='right-text' style='padding: 0;' ng-if='row.month." + $scope.aggregateOptions.percentageExpression + "'>" +
                        "                                   <span ng-bind='row.month." + $scope.aggregateOptions.percentageExpression + " | zero | percentage' ng-class='{\"green\":row.month." + $scope.aggregateOptions.percentageExpression + " >=0 , \"red\":row.month." + $scope.aggregateOptions.percentageExpression + " < 0}'></span>" +
                        "                                   <span ng-class='{\"up\":row.month." + $scope.aggregateOptions.percentageExpression + " >=0 , \"down\":row.month." + $scope.aggregateOptions.percentageExpression + " < 0}'></span>" +
                        "                               </span>" +
                        "                               <div style='line-height: 15px;' class='block tailer-txt' >{{aggregateOptions.aggregateSpan.monthLabel}}</div>" +
                        "                           </div>" +
                        "                       </div>" +
                        "                       <div class='mid-layer flex' style='line-height: normal;'>" +
                        "                           <div class='flex-1 app-text-align-center' ng-if='row.quarter'>" +
                        "                               <i ng-class='{\"icon-rupee\":row.quarter." + $scope.aggregateOptions.value + ".type.currency == \"INR\", \"icon-dollar\":row.quarter." + $scope.aggregateOptions.value + ".type.currency == \"USD\"}'></i>" +
                        "                               <span class='txt' ng-bind='row.quarter." + $scope.aggregateOptions.valueExpression + "'></span>" +
                        "                               <span  ng-if='row.quarter." + $scope.aggregateOptions.percentageExpression + "'>" +
                        "                                   <span class='per-box' ng-class='{\"green\":row.quarter." + $scope.aggregateOptions.percentageExpression + " >=0, \"red\":row.quarter." + $scope.aggregateOptions.percentageExpression + "< 0 }'>{{row.quarter." + $scope.aggregateOptions.percentageExpression + " | zero | percentage}}</span>" +
                        "                                   <span class='small' ng-class='{\"up\":row.quarter." + $scope.aggregateOptions.percentageExpression + " >=0, \"down\":row.quarter." + $scope.aggregateOptions.percentageExpression + "< 0 }'></span>" +
                        "                               </span>" +
                        "                               <div class='center tailer-txt'>{{aggregateOptions.aggregateSpan.quarterLabel}}</div>" +
                        "                           </div>" +
                        "                           <div class='flex-1 app-text-align-center' ng-if='row.fy'>" +
                        "                               <i ng-class='{\"icon-rupee\":row.fy." + $scope.aggregateOptions.value + ".type.currency == \"INR\", \"icon-dollar\":row.fy." + $scope.aggregateOptions.value + ".type.currency == \"USD\"}'></i>" +
                        "                               <span class='txt'>{{row.fy." + $scope.aggregateOptions.valueExpression + "}}</span>" +
                        "                               <span ng-if='row.fy." + $scope.aggregateOptions.percentageExpression + "'>" +
                        "                                   <span class='per-box' ng-class='{\"green\":row.fy." + $scope.aggregateOptions.percentageExpression + " >=0, \"red\":row.fy." + $scope.aggregateOptions.percentageExpression + "< 0 }'>{{row.fy." + $scope.aggregateOptions.percentageExpression + " | zero | percentage}}</span>" +
                        "                                   <span class='small' ng-class='{\"up\":row.fy." + $scope.aggregateOptions.percentageExpression + " >=0, \"down\":row.fy." + $scope.aggregateOptions.percentageExpression + "< 0 }'></span>" +
                        "                               </span>" +
                        "                               <div class='center tailer-txt'>{{aggregateOptions.aggregateSpan.fyLabel}}</div>" +
                        "                           </div>" +
                        "                       </div>" +
                        "                   </div>" +
                        "               </div>" +
                        "       </div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);



/*pl-graph starts from here*/
pl.controller('plGraphCtrl', function ($scope) {

    $scope.toolBarOptions = {};
//    $scope.graphOptions.alertMessageOptions = $scope.graphOptions.alertMessageOptions || {};
    var unwatcher = {};
    if (!$scope.graphOptions.warningOptions) {
        $scope.graphOptions.warningOptions = {};
        unwatcher.warningOptions = $scope.$watch("graphOptions.warningOptions.warnings", function (newMess) {
            if ($scope.graphOptions.warningOptions && $scope.graphOptions.warningOptions.warnings && $scope.graphOptions.warningOptions.warnings.length > 0) {
                //open a popup here
                alert($scope.graphOptions.warningOptions.title + "\n" + JSON.stringify($scope.graphOptions.warningOptions.warnings));
            }
        })
    }
    $scope.graphOptions.busyMessageOptions = $scope.graphOptions.busyMessageOptions || {};
    $scope.graphOptions.style = $scope.graphOptions.style || {};
    $scope.graphOptions.style.top = '38px';
    $scope.toolBarOptions.top = {left: [], center: [], right: []};
    $scope.toolBarOptions.bottom = {left: {}, center: [], right: []};
    $scope.toolBarOptions.header = {left: {}, center: [], right: []};
    if ($scope.graphOptions.parentSharedOptions && $scope.graphOptions.sharedOptions && $scope.graphOptions.sharedOptions.resizable != false && $scope.graphOptions.viewPosition != "right") {
        $scope.graphOptions.resize = $scope.graphOptions.resize || true;
        $scope.graphOptions.fullMode = $scope.graphOptions.fullMode || true;
    }
    var showResizeControl = $scope.graphOptions.resize !== undefined ? $scope.graphOptions.resize : false;
    if (showResizeControl) {
        $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" pl-resize class=\"pl-resize-view app-cursor-pointer pl-transform-180\"><i class=\"icon-double-angle-left\"></i></div>"});
    }
    if ($scope.graphOptions.showLabel) {
        $scope.toolBarOptions.header.center.push({template: '<span style="margin-left: 0;" class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
            '   <span  ng-bind="graphOptions.label"></span>' +
            '   <span ng-if="graphOptions.primaryFieldInfo && graphOptions.primaryFieldInfo.label">' +
            '       <span>(<span ng-bind="graphOptions.primaryFieldInfo.label"></span>)</span>' +
            '   </span>' +
            '</span>'});
    }


    if ($scope.graphOptions.parentSharedOptions) {
        $scope.graphOptions.parentSharedOptions.resizable = true;
    }

    if ($scope.graphOptions.quickViewMenuGroup && $scope.graphOptions.quickViewMenuGroup.menus.length > 0) {
        $scope.toolBarOptions.top.left.push({template: "<div pl-menu-group='graphOptions.quickViewMenuGroup' ></div>"});
        $scope.toolBarOptions.header.left = $scope.graphOptions.quickViewMenuGroup;
    } else {
        $scope.toolBarOptions.header.center.push({label: $scope.graphOptions.label, showLabel: true, actionClass: 'app-float-left app-padding-five-px pl-quick-menu app-font-weight-bold'});
    }


    $scope.graphOptions.userPreferenceOptions = $scope.graphOptions.userPreferenceOptions || {};
    $scope.graphOptions.userPreferenceOptions.reload = false;
    if ($scope.graphOptions.filterColumns && $scope.graphOptions.filterColumns.length > 0) {
        $scope.graphOptions.userPreferenceOptions.filterColumns = $scope.graphOptions.filterColumns;
        $scope.graphOptions.userPreferenceOptions.filterInfo = $scope.graphOptions.filterInfo || [];
    }

    if ($scope.graphOptions.filterInfo && $scope.graphOptions.filterInfo.length > 0) {
        $scope.graphOptions.userPreferenceOptions.selectedType = "Filter";
    }
    if (!$scope.graphOptions.userPreferenceOptions.sortInfo && !$scope.graphOptions.userPreferenceOptions.filterInfo && !$scope.graphOptions.userPreferenceOptions.groupInfo) {
        $scope.graphOptions.addUserPreference = false;
    }
    if ($scope.graphOptions.addUserPreference) {
        $scope.graphOptions.style = $scope.graphOptions.style || {};
        $scope.graphOptions.style.top = '80px';
        $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":graphOptions.userPreferenceOptions.filterColumns}' pl-user-preference='graphOptions.userPreferenceOptions'></div>"});
    }

    if ($scope.graphOptions.viewControl) {
        $scope.onViewControlOptionClick = function (option) {
            try {
                if ($scope.graphOptions.onViewControl) {
                    $scope[$scope.graphOptions.onViewControl](option)
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }
        $scope.toolBarOptions.header.center.push({template: "<div pl-menu-group='graphOptions.viewControlOptions' ></div>"});
    }

    if ($scope.graphOptions.headerActions) {
        for (var i = 0; i < $scope.graphOptions.headerActions.length; i++) {
            $scope.toolBarOptions.header.center.push($scope.graphOptions.headerActions[i]);
        }
    }

    $scope.resize = function (direction) {
        try {
            if ($scope.graphOptions.resizeV && $scope.graphOptions.sharedOptions && $scope.graphOptions.sharedOptions.resizable != false) {
                $scope[$scope.graphOptions.resizeV]($scope.graphOptions.viewIndex, direction);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    if (($scope.graphOptions.parentSharedOptions && $scope.graphOptions.sharedOptions && $scope.graphOptions.sharedOptions.close != false) || $scope.graphOptions.close) {
        $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
    }

    if ($scope.graphOptions.parentSharedOptions && $scope.graphOptions.sharedOptions.viewPosition != "right") {
        $scope.resize('left');
    }

    try {
        unwatcher.reload = $scope.$watch("graphOptions.userPreferenceOptions.reload", function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue) && angular.isDefined(oldValue)) {
                $scope.populateUserPreferene($scope.graphOptions.userPreferenceOptions, true);
            }
        });
    } catch (e) {
        var title = "plGraph in pl.graph";
        var message = 'Error in plGraph >>> ' + e + '\n' + e.stack;
        $scope.graphOptions.warningOptions.error = new Error(message + "-" + title);
    }
    $scope.$on('$destroy', function ($event) {
        for (var key in unwatcher) {
            unwatcher[key]();
        }
    });
});

pl.directive('plGraph', ['$compile', function ($compile) {
    return{
        restrict: 'E',
        controller: 'plGraphCtrl',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    var template = "<div>" +
                        "                <div style='position: relative;width: 100%;'>" +
                        "                           <div style='overflow: hidden;' class='pl-header-toolbar' ng-class='{\"left\":graphOptions.sharedOptions.viewPosition == \"left\" || graphOptions.sharedOptions.viewPosition == \"full\",\"top\":graphOptions.sharedOptions.viewPosition == \"right\"}' >" +
                        "                               <pl-tool-bar-header></pl-tool-bar-header>" +
                        "                           </div>" +
                        "                    <div class='pl-toolbar' pl-tool-bar></div>" +
                        "                </div>" +
                        "           </div>" +
                        "           <div class='pl-graph-content pl-clear app-overflow-auto' ng-style='graphOptions.style'>";
                    if ($scope.graphOptions.graphType == 'bar-chart') {
                        template += "<div style='padding: 10px;'>" +
                            "           <div bar-graph='graphOptions'  />" +
                            "       </div>";
                    } else if ($scope.graphOptions.graphType == 'pie-chart') {
                        if (!$scope.graphOptions.uniqueViewId) {
                            $scope.graphOptions.uniqueViewId = 'pieChart';
                        }
                        template += "<div style='padding: 10px;'>" +
                            "           <div class='app-text-align-center' pie-chart='graphOptions' id='{{graphOptions.uniqueViewId}}'></div>" +
                            "       </div>";
                    }
                    template += '</div>';
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.controller('barGraphCtrl', ['$scope', function ($scope) {
    $scope.graphOptions = $scope.graphOptions || {};
    $scope.graphOptions.xaxis = {field: $scope.graphOptions.xAxisField};
    $scope.graphOptions.yaxis = {field: $scope.graphOptions.yAxisField};
    $scope.graphOptions.width = $scope.graphOptions.width || angular.element('body').width() - 200 || 800;
    $scope.graphOptions.height = $scope.graphOptions.height || 400;
}
]);

pl.controller('pieChartCtrl', ['$scope', function ($scope) {
    $scope.graphOptions = $scope.graphOptions || {};
    $scope.graphOptions.textOnPie = $scope.graphOptions.xAxisField;
    $scope.graphOptions.legend = true;
    $scope.graphOptions.showPercentageValue = true;
    $scope.graphOptions.arcValue = $scope.graphOptions.yAxisField;
    $scope.graphOptions.showData = {"insidePie": true, "outsidePie": true};
    $scope.graphOptions.width = $scope.graphOptions.width || angular.element('body').width() - 200 || 800;
    $scope.graphOptions.height = $scope.graphOptions.height || 800;
    $scope.graphOptions.margin = {left: 50};
}
])

pl.directive('pieChart', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        controller: 'pieChartCtrl',
        link: function (scope, element, attrs) {
            try {
                var pieData = scope.graphOptions.data;
                var textOnPie = scope.graphOptions.textOnPie;
                var arcValue = scope.graphOptions.arcValue;
                var viewId = scope.graphOptions.uniqueViewId;
                var data = [];
                scope.getData = function () {
                    try {
                        for (var i = 0; i < pieData.length; i++) {
                            var convertedData = {};
                            var pieText = Util.resolveDot(pieData[i], textOnPie);
                            convertedData.label = pieText;
                            var pieArcValue = Util.resolveDot(pieData[i], arcValue)
                            convertedData.value = pieArcValue;
                            data.push(convertedData);
                        }
                    } catch (e) {
                        if (scope.handleClientError) {
                            scope.handleClientError(e);
                        }
                    }
                }
                scope.getData();
                $timeout(function () {
                    var pie = new d3pie(viewId, {
                        "header": {
                        },
                        "footer": {
                        },
                        "size": {
                            "canvasWidth": scope.graphOptions.width,
                            "canvasHeight": scope.graphOptions.height
                        },
                        "data": {
                            "sortOrder": "value-desc",
                            "content": data
                        },
                        "labels": {
                            "outer": {
                                "pieDistance": 32
                            },
                            "inner": {
                                "hideWhenLessThanPercentage": 1
                            },
                            "mainLabel": {
                                "fontSize": 11
                            },
                            "percentage": {
                                "color": "#ffffff",
                                "decimalPlaces": 0
                            },
                            "value": {
                                "color": "#adadad",
                                "fontSize": 11
                            },
                            "lines": {
                                "enabled": true
                            }
                        },
                        "tooltips": {
                            "enabled": true,
                            "type": "placeholder",
                            "string": "{label}: {value} ({percentage}%)"
                        },
                        "effects": {
                            "pullOutSegmentOnClick": {
                                "effect": "linear",
                                "speed": 400,
                                "size": 8
                            }
                        },
                        "misc": {
                            "gradient": {
                                "enabled": true,
                                "percentage": 100
                            }
                        }
                    });
                }, 0)
            } catch (e) {
                var title = "pieChart in pl.Graph";
                var message = 'Error in plGraph pieChart >>>>' + e + '\n' + e.stack;
                scope.graphOptions.warningOptions.error = new Error(message + "-" + title);
            }
        }
    }
}]);

pl.directive('barGraph', [ function ($scope) {
    return{
        controller: 'barGraphCtrl',
        link: function (scope, element) {
            try {
                var data = scope.graphOptions.data;
                var mainKey = scope.graphOptions.xaxis.field;
                var yaxis = scope.graphOptions.yaxis.field;

                var margin = {top: 30, right: 30, bottom: 100, left: 30};
                var viewBoxWidth = element[0].offsetWidth;
                var viewBoxHeight = element[0].offsetHeight;

                if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.top != undefined) {
                    margin.top = scope.graphOptions.margin.top;
                }
                if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.left != undefined) {
                    margin.left = scope.graphOptions.margin.left;
                }
                if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.right != undefined) {
                    margin.right = scope.graphOptions.margin.right;
                }
                if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.bottom != undefined) {
                    margin.bottom = scope.graphOptions.margin.bottom;
                }
                if (scope.graphOptions.width != undefined) {
                    viewBoxWidth = scope.graphOptions.width;
                }
                if (scope.graphOptions.height != undefined) {
                    viewBoxHeight = scope.graphOptions.height;
                }

                var fontSize = scope.graphOptions.fontSize ? scope.graphOptions.fontSize : '12px';


                var width = viewBoxWidth - margin.left - margin.right,
                    height = viewBoxHeight - margin.top - margin.bottom;


                var legendWidth = undefined;
                var svgWidth = undefined;
                if (scope.graphOptions.showLegend) {
                    if (scope.graphOptions.legendWidth) {
                        svgWidth = (100 - scope.graphOptions.legendWidth) + "%";
                        legendWidth = scope.graphOptions.legendWidth + "%";
                    } else {
                        svgWidth = "70%";
                        legendWidth = "30%";
                    }
                } else {
                    svgWidth = "100%";
                }
                var showToolTip = scope.graphOptions.showToolTip;
                if (showToolTip) {
                    var tip = d3.tip()
                        .attr('class', 'd3-tip')
                        .offset([-10, 0])
                        .html(function (d, i) {
                            var label = d.mainKey ? d.mainKey : d.subKey;
                            return "<strong>" + label + " : </strong> <span style='color:red'>" + d.value + "</span>";
                        })
                }


                var barGraphType = scope.graphOptions.barGraphType;

                var duration = 1500;
                var subKeys = [];
                if (barGraphType === "grouped") {
                    subKeys = d3.keys(data[0]).filter(function (key) {
                        return (key !== mainKey && key != "_id");
                    });
                } else {
                    subKeys = [yaxis];
                }
                var y0 = 0;
                var negativeDataCount = 0;
                var y = d3.scale.linear()
                    .range([height, 0]);

                data.forEach(function (d) {
                    d.mainKeyValues = subKeys.map(function (name) {
                        if (Math.abs(d[name]) > y0) {
                            y0 = Math.abs(d[name]);
                        }
                        if (d[name] < 0) {
                            negativeDataCount += 1;
                        }
                        var valueToReturn = {subKey: name, value: d[name]};
                        if (barGraphType !== "grouped") {
                            valueToReturn.mainKey = d[mainKey];
                        }
                        return valueToReturn;
                    });
                });

                if (negativeDataCount === 0) {
                    y.domain([0, y0]);
                } else {
                    if (negativeDataCount > 0) {
                        y.domain([-y0, y0]);
                    }
                    if (negativeDataCount === data.length) {
                        y.domain([-y0, 0]);
                    }
                }


                var subKeysForColorsAndLegends = undefined;
                if (barGraphType != "grouped") {
                    subKeysForColorsAndLegends = data.map(function (d) {
                        return {mainKey: d[mainKey], value: d[yaxis]};
                    });
                }


                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");
                if (scope.graphOptions.showHorizontalGridLine) {
                    yAxis.tickSize(-width, 0, 0);
                }
//                .tickFormat("")
                yAxis.tickFormat(d3.format(".2s"));


                var tinyMode = true;
                if (scope.graphOptions.tinyMode != undefined) {
                    tinyMode = scope.graphOptions.tinyMode;
                }
                var barWidthForTinyMode = 40;
                if (tinyMode && barGraphType != "grouped" && scope.graphOptions.barWidthForTinyMode != undefined) {
                    barWidthForTinyMode = scope.graphOptions.barWidthForTinyMode;
                }
                var totalItems = data.length;
                var x0 = d3.scale.ordinal()
                    .rangeRoundBands([0, width], .1)
                    .domain(data.map(function (d) {
                        return d[mainKey];
                    }));
                if (tinyMode && barGraphType != "grouped") {
                    x0.rangeRoundBands([1, (totalItems * (barWidthForTinyMode + 10))]);
                } else {
                    x0.rangeRoundBands([0, width], .2);
                }

                var x1 = d3.scale.ordinal().domain(subKeys).rangeRoundBands([0, x0.rangeBand()]);

                var xAxis = d3.svg.axis()
                    .scale(x0)
                    .orient("bottom");


                var color = d3.scale.category20();
                if (scope.graphOptions.colors != undefined && scope.graphOptions.colors.length > 0) {
                    color = d3.scale.ordinal()
                        .range(scope.graphOptions.colors);
                }
                var svg = d3.select(element[0]).append("svg")
                    .attr('width', svgWidth)
                    .attr('style', 'float:left')
                    .attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight)
                    .attr("preserveAspectRatio", "xMidYMid meet")
                    .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                if (showToolTip) {
                    svg.call(tip);
                }

                if (scope.graphOptions.xAxisScale === undefined || scope.graphOptions.xAxisScale) {
                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(xAxis)
                        .selectAll("text")
                        .style("text-anchor", "end")
                        .style("font-size", fontSize)
                        .attr("dx", "1em")
//                        .attr("dx", "-.8em")
//                        .attr("dy", "-.55em")
//                        .attr("transform", "rotate(-30)");
                }
                if (scope.graphOptions.yAxisScale === undefined || scope.graphOptions.yAxisScale) {
                    svg.append("g")
                        .attr("class", "y axis")
                        .call(yAxis)
//                        .style("stroke-dasharray", ("3, 3"))
                        .selectAll("text")
                        .style("font-size", fontSize)
                }

                var state = svg.selectAll(".state")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "g")
                    .attr("transform", function (d) {
                        return "translate(" + x0(d[mainKey]) + ",0)";
                    });

                var bars = state.selectAll("rect")
                    .data(function (d) {
                        return d.mainKeyValues;
                    }).enter().append("g");

                var index = 0;
                var rect = bars.append("rect")
                    .style("fill", function (d) {
                        if (barGraphType === "grouped") {
                            return color(d.subKey);
                        } else {
                            var val = subKeysForColorsAndLegends[index].mainKey;
                            index += 1;
                            return color(val);
                        }
                    }).attr("y", height)
                    .attr("height", 0);
                if (showToolTip) {
                    rect.on('mouseover', tip.show)
                        .on('mouseout', tip.hide)
                }
                rect.transition()
//                    .ease('elastic')
                    .duration(duration)
                    .attr("width", function (d, i) {
                        if (tinyMode && barGraphType != "grouped") {
                            return barWidthForTinyMode;
                        } else {
                            return x1.rangeBand()
                        }
                    })
                    .attr("x", function (d, i) {
                        if (tinyMode && barGraphType != "grouped") {
                            return 1;
                        } else {
                            return x1(d.subKey);
                        }
                    }).attr("y", function (d) {
                        return y(Math.max(0, d.value));
//                        return y(d.value);
                    }).attr("height", function (d) {
                        if (negativeDataCount === 0) {
                            return height - y(d.value);
                        }
                        if (d.value > 0) {
                            return height - y(d.value) - y(0);
                        } else {
                            return y(d.value) - y(0);
                        }
                    });

                if (scope.graphOptions.showTextOnBar === undefined || scope.graphOptions.showTextOnBar) {
                    bars.append("text")
                        .text(function (d) {
                            return d.value;
                        }).attr("y", height)
                        .attr("height", 0)
                        .transition()
//                        .ease('elastic')
                        .duration(duration)
                        .attr("x", function (d) {
                            return x1(d.subKey) + x1.rangeBand() / 5;
                        }).attr("y", function (d) {
                            return  d.value >= 0 ? y(d.value) - 5 : y(d.value) + 15
                        })
                        .style("font-size", fontSize);
                }

                function legend() {
                    var legend = d3.select(element[0]).append("table").attr('class', 'legend')
                        .attr('width', legendWidth)
                    if (barGraphType === "grouped") {
                        legend.attr("style", "margin-top:" + height / 2 + "px")
                    }
                    // create one row per segment.
                    var tr = legend.append("tbody").selectAll("tr")
                        .data(barGraphType === "grouped" ? subKeys : subKeysForColorsAndLegends)
                        .enter()
                        .append("tr");

                    // create the first column for each segment.
                    tr.append("td").append("svg").attr("width", '15').attr("height", '15').append("rect")
                        .attr("width", '15').attr("height", '15')
                        .attr("fill", function (d) {
                            if (barGraphType === "grouped") {
                                return color(d);
                            } else {
                                return color(d.mainKey);
                            }
                        });

                    // create the second column for each segment.
                    tr.append("td").text(function (d) {
                        if (barGraphType === "grouped") {
                            return d;
                        } else {
                            return d.mainKey;
                        }
                    });

                    if (barGraphType !== "grouped") {
                        tr.append("td").text(function (d) {
                            return d.value;
                        });
                    }
                }

                if (scope.graphOptions.showLegend) {
                    legend();
                }


            }
            catch
                (e) {
                var title = "barChart in pl.Graph";
                var message = 'Error in plGraph barChart >>>>' + e + '\n' + e.stack;
                scope.graphOptions.warningOptions.error = new Error(message + "-" + title);
            }
        }

    };

}
]);

/*pl-html starts from here*/
pl.directive("plHtml", ["$compile", function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    var htmlOptions = $scope.htmlOptions;
                    $scope.toolBarOptions = {};
                    $scope.handleAction = function (actionId, param1, param2, param3, param4) {
                        try {
                            var action = undefined;
                            if ($scope.htmlOptions.headerActions) {
                                for (var i = 0; i < $scope.htmlOptions.headerActions.length; i++) {
                                    if ($scope.htmlOptions.headerActions[i].id == actionId) {
                                        action = $scope.htmlOptions.headerActions[i];
                                        break;
                                    }
                                }
                            }
                            if (!action) {
                                throw new Error('Action not found with id [' + actionId + ']');
                            }
                            $scope.htmlOptions.sharedOptions = $scope.htmlOptions.sharedOptions || {};
                            $scope.htmlOptions.sharedOptions.currentRow = {};
                            $scope.htmlOptions.sharedOptions.currentRow.param1 = param1;
                            $scope.htmlOptions.sharedOptions.currentRow.param2 = param2;
                            $scope.htmlOptions.sharedOptions.currentRow.param3 = param3;
                            $scope.htmlOptions.sharedOptions.currentRow.param4 = param4;
                            $scope.viewRowAction(action);
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };
                    $scope.toolBarOptions.top = {left: [], center: [], right: []};
                    $scope.toolBarOptions.header = {left: {}, center: [], right: []};
                    $scope.printHTML = function () {
                        try {
                            $scope.print($scope.$eval($scope.htmlOptions.data));
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    var showResizeControl = $scope.htmlOptions.resize !== undefined ? $scope.htmlOptions.resize : false;
                    if (showResizeControl) {
                        $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" ng-hide='htmlOptions.fullMode' pl-resize class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
                    }

                    if ($scope.htmlOptions.parentSharedOptions) {
                        $scope.htmlOptions.parentSharedOptions.resizable = true;
                    }

                    if ($scope.htmlOptions.quickViewMenuGroup && $scope.htmlOptions.quickViewMenuGroup.menus.length > 0) {
                        $scope.toolBarOptions.top.left.push({template: "<div pl-menu-group='htmlOptions.quickViewMenuGroup' ></div>"});
                        $scope.toolBarOptions.header.left = $scope.htmlOptions.quickViewMenuGroup;
                    } else {
                        $scope.toolBarOptions.header.center.push({label: $scope.htmlOptions.label, showLabel: true, actionClass: 'app-float-left app-padding-five-px pl-quick-menu app-font-weight-bold'});
                    }

                    if ($scope.htmlOptions.viewControl) {
                        $scope.toolBarOptions.header.center.push({template: "<div pl-menu-group='htmlOptions.viewControlOptions' ></div>"});
                    }

                    if ($scope.htmlOptions.close) {
                        $scope.toolBarOptions.header.right.push({template: '<div ng-click="close()" class="pl-cancel-btn app-cursor-pointer">Cancel</div>'});
                    }

                    if ($scope.htmlOptions.headerActions) {
                        for (var i = 0; i < $scope.htmlOptions.headerActions.length; i++) {
                            $scope.toolBarOptions.header.center.push($scope.htmlOptions.headerActions[i]);
                        }
                    }
                    $scope.resize = function (direction) {
                        try {
                            if ($scope.htmlOptions.resizeV && $scope.htmlOptions.sharedOptions && $scope.htmlOptions.sharedOptions.resizable != false) {
                                $scope[$scope.htmlOptions.resizeV]($scope.htmlOptions.viewIndex, direction);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    if ($scope.htmlOptions.parentSharedOptions && $scope.htmlOptions.sharedOptions.viewPosition != "right") {
                        $scope.resize('left');
                    }
                },
                post: function ($scope, iElement) {
                    var template = "<div>" +
                        "                <div style='position: relative;width: 100%;'>" +
                        "                           <div class='pl-header-toolbar' >" +
                        "                               <pl-tool-bar-header></pl-tool-bar-header>" +
                        "                           </div>" +
                        "                    <div class='pl-toolbar' pl-tool-bar></div>" +
                        "                </div>" +
                        "           </div>" +
                        "           <div class='pl-html-content'>" +
                        //"           <div style='padding: 5px;margin: 4px;overflow-x: auto;overflow-y: auto;bottom: 0px;position: absolute;top: 61px;left: 0px;right: 0px;'> " + "<b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                    <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                        <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                            <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                    <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                        <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                            <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                    HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                        HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                            HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                                HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                                    HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>" +                        "           </div>"
                        $scope.$eval($scope.htmlOptions.data) +
                        "</div>";
                    iElement.append($compile(template)($scope));

                    $scope.onViewControlOptionClick = function (option) {
                        try {
                            if ($scope.htmlOptions.onViewControl) {
                                $scope[$scope.htmlOptions.onViewControl](option)
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }

                    }
                }
            }
        }
    };
}]);


/*-pl-composite starts from here*/
pl.controller('pl-composite-ctrl', function ($scope, $compile, $parse, $timeout, $http, $q) {

        var unwatcher = {};

        $scope.compositeView = [];

        Util.sort($scope.compositeViewOptions.views, "asc", "index");
        $scope.populateToolbar = function () {

            try {
                $scope.toolBarOptions = {};
                $scope.compositeViewOptions.busyMessageOptions = $scope.compositeViewOptions.busyMessageOptions || {};

                $scope.compositeViewOptions.userPreferenceOptions = $scope.compositeViewOptions.userPreferenceOptions || {};
                $scope.compositeViewOptions.userPreferenceOptions.reload = false;
                if ($scope.compositeViewOptions.filterColumns && $scope.compositeViewOptions.filterColumns.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.filterColumns = $scope.compositeViewOptions.filterColumns;
                    $scope.compositeViewOptions.userPreferenceOptions.filterInfo = $scope.compositeViewOptions.filterInfo;
                }
                if ($scope.compositeViewOptions.sortColumns && $scope.compositeViewOptions.sortColumns.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.sortColumns = $scope.compositeViewOptions.sortColumns;
                    $scope.compositeViewOptions.userPreferenceOptions.sortInfo = $scope.compositeViewOptions.sortInfo;
                }

                if ($scope.compositeViewOptions.groupColumns && $scope.compositeViewOptions.groupColumns.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.groupColumns = $scope.compositeViewOptions.groupColumns;
                    $scope.compositeViewOptions.userPreferenceOptions.aggregateColumns = $scope.compositeViewOptions.aggregateColumns;
                    $scope.compositeViewOptions.userPreferenceOptions.groupInfo = $scope.compositeViewOptions.groupInfo;
                }

                if ($scope.compositeViewOptions.lastSelectedInfo) {
                    $scope.compositeViewOptions.userPreferenceOptions.selectedType = $scope.compositeViewOptions.lastSelectedInfo;
                } else if ($scope.compositeViewOptions.filterInfo && $scope.compositeViewOptions.filterInfo.length > 0) {    // TODO: need to change with compositeViewOptions
                    $scope.compositeViewOptions.userPreferenceOptions.selectedType = "Filter";
                } else if ($scope.compositeViewOptions.sortInfo && $scope.compositeViewOptions.sortInfo.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.selectedType = 'Sort';
                } else if ($scope.compositeViewOptions.groupInfo && $scope.compositeViewOptions.groupInfo.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.selectedType = 'Group';
                }


                $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
                $scope.toolBarOptions.top = {left: [], center: [], right: []};
                $scope.toolBarOptions.header = {left: {}, center: [], right: []};
                var showResizeControl = $scope.compositeViewOptions.viewResize !== undefined ? $scope.compositeViewOptions.viewResize : true;


                if (showResizeControl && $scope.compositeViewOptions.parentSharedOptions) {
                    $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" ng-hide='compositeViewOptions.sharedOptions.viewPosition == \"full\" || compositeViewOptions.sharedOptions.resizable' ng-class='{\"pl-transform-180\":compositeViewOptions.sharedOptions.viewPosition != \"right\"}' class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
                }
                if (!$scope.compositeViewOptions.userPreferenceOptions.sortInfo && !$scope.compositeViewOptions.userPreferenceOptions.filterInfo && !$scope.compositeViewOptions.userPreferenceOptions.groupInfo) {
                    $scope.compositeViewOptions.addUserPreference = false;
                    /*dont set false as filter bar visible by default*/
                }
                if ($scope.compositeViewOptions.addUserPreference) {
                    $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":compositeViewOptions.userPreferenceOptions.sortColumns || compositeViewOptions.userPreferenceOptions.groupColumns  || compositeViewOptions.userPreferenceOptions.filterColumns}' pl-user-preference='compositeViewOptions.userPreferenceOptions'></div>"});
                }

                if ($scope.compositeViewOptions.quickViewMenuGroup && $scope.compositeViewOptions.quickViewMenuGroup.menus.length > 0) {
                    $scope.toolBarOptions.top.left.push({template: "<div pl-menu-group='compositeViewOptions.quickViewMenuGroup' ></div>"});
                    $scope.toolBarOptions.header.left = $scope.compositeViewOptions.quickViewMenuGroup;
                }

                if ($scope.compositeViewOptions.showLabel) {
                    $scope.toolBarOptions.header.center.push({template: '<span ng-class=\'{"menu-align-margin":compositeViewOptions.sharedOptions.viewPosition == \"full\" || compositeViewOptions.sharedOptions.resizable}\' class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
                        '   <span  ng-bind="compositeViewOptions.label"></span>' +
                        '   <span ng-if="compositeViewOptions.primaryFieldInfo && compositeViewOptions.primaryFieldInfo.label">' +
                        '       <span>(<span ng-bind="compositeViewOptions.primaryFieldInfo.label"></span>)</span>' +
                        '   </span>' +
                        '</span>'});
                }


                if ($scope.compositeViewOptions.viewControl && $scope.compositeViewOptions.viewControlOptions) {
                    var template = "<div pl-menu-group='compositeViewOptions.viewControlOptions' ></div>";
                    $scope.toolBarOptions.header.center.push({template: template});
                }
                if (showResizeControl) {
                    $scope.toolBarOptions.header.right.push({template: "<div ng-click=\"resize('right')\" pl-resize  ng-show=\"compositeViewOptions.sharedOptions.resizable\" class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-right\"></i></div>"});
                }
                if ($scope.compositeViewOptions.close) {
                    $scope.toolBarOptions.top.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
                    $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
                }

            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.onViewControlOptionClick = function (option) {
            try {
                if ($scope.compositeViewOptions.onViewControl) {
                    $scope[$scope.compositeViewOptions.onViewControl](option)
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.populateToolbar();

        $scope.openVComposite = function () {
            $scope.loadTabView($scope.compositeViewOptions.selectedTabIndex, false);
        }


        $scope.loadTabData = function (view, index, reloadUserPreference) {
            if (reloadUserPreference || $scope.compositeViewOptions.selectedTabIndex !== index) {
                $scope.compositeViewOptions.filterStateChanged = !$scope.compositeViewOptions.filterStateChanged;
            }
            $scope.compositeViewOptions.selectedTabIndex = index;
            view.viewOptions.toolbar = false;

            if ($scope.compositeViewOptions.$parameters) {
                view.viewOptions.$parameters = $scope.compositeViewOptions.$parameters;
            }
            if ($scope.compositeViewOptions.getV) {
                view.viewOptions.getV = $scope.compositeViewOptions.getV;
            }
            if ($scope.compositeViewOptions.openV) {
                view.viewOptions.openV = $scope.compositeViewOptions.openV;
            }
            if ($scope.compositeViewOptions.busyMessageOptions) {
                view.viewOptions.busyMessageOptions = $scope.compositeViewOptions.busyMessageOptions;
            }
            if ($scope.compositeViewOptions.backgroundOptions) {
                view.viewOptions.backgroundOptions = $scope.compositeViewOptions.backgroundOptions;
            }
            if ($scope.compositeViewOptions.shortMessageOptions) {
                view.viewOptions.shortMessageOptions = $scope.compositeViewOptions.shortMessageOptions;
            }
            if ($scope.compositeViewOptions.confirmMessageOptions) {
                view.viewOptions.confirmMessageOptions = $scope.compositeViewOptions.confirmMessageOptions;
            }
            if ($scope.compositeViewOptions.warningOptions) {
                view.viewOptions.warningOptions = $scope.compositeViewOptions.warningOptions;
            }
            if ($scope.compositeViewOptions.provideParentParameter) {
                view.viewOptions.provideParentParameter = $scope.compositeViewOptions.provideParentParameter;
            }
            if ($scope.compositeViewOptions.watchParentParameter) {
                view.viewOptions.watchParentParameter = $scope.compositeViewOptions.watchParentParameter;
            }
            if ($scope.compositeViewOptions.parentParameters) {
                view.viewOptions.parentParameters = $scope.compositeViewOptions.parentParameters;
            }
            if ($scope.compositeViewOptions.close != undefined) {
                view.viewOptions.close = $scope.compositeViewOptions.close;
            }
//            if ($scope.compositeViewOptions.edit != undefined) {                      //commented as edit was coming false in task dashboard due to this--TODO
//                view.viewOptions.edit = $scope.compositeViewOptions.edit;
//            }

            view.viewOptions.openVComposite = "openVComposite"; //after saving customizations, view was opening in right side. Now we have reloaded the currently loaded tab view.
            var headerTemplate = "";
            if ($scope.compositeViewOptions.headerTemplate) {
                headerTemplate += $scope.compositeViewOptions.headerTemplate;
            }
            if ($scope.compositeViewOptions.views && $scope.compositeViewOptions.views.length > 1) {
                headerTemplate += "<pl-composite-tabs></pl-composite-tabs>";
            }
            view.viewOptions.headerTemplate = headerTemplate;
            $scope.compositeView.splice(0, $scope.compositeView.length);
            $scope.compositeView.push(view);
        }

        $scope.close = function () {
            $scope.compositeViewOptions.sharedOptions.closed = true;
        };


        $scope.resize = function (direction) {
            try {
                if ($scope.compositeViewOptions.resizeV && $scope.compositeViewOptions.sharedOptions && $scope.compositeViewOptions.sharedOptions.resizable != false) {
                    $scope[$scope.compositeViewOptions.resizeV]($scope.compositeViewOptions.viewIndex, direction);
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }
        if ($scope.compositeViewOptions.parentSharedOptions && $scope.compositeViewOptions.sharedOptions.viewPosition != "right") {
            $scope.resize('left');
        }

        $scope.loadTabView = function (index, reloadUserPreference) {

            var views = $scope.compositeViewOptions.views;
            var view = views[index];
            var parameters = $scope.compositeViewOptions.$parameters;
            var fullTextSearchValue = undefined;
            if (parameters != undefined) {
                if (parameters.__fulltext__) {  // to apply fts in composite
                    fullTextSearchValue = parameters.__fulltext__;
                    delete parameters.__fulltext__;
                }
                var filterColumns = $scope.compositeViewOptions.filterColumns;
                var viewFilter = undefined;
                var viewParameters = undefined;
                var selectedFilterIds = undefined;
                for (var i = 0; i < filterColumns.length; i++) {
                    var filterColumn = filterColumns[i];
                    var filterValue = parameters[filterColumn.field];
                    if (filterValue) {
                        var filterField = filterColumn.field;
                        var asParameter = filterColumn.asParameter;
                        var actionView = getActionViewInfo(filterColumn.views, view.alias);
                        if (actionView) {
                            asParameter = actionView.asParameter;
                            filterField = actionView.filterField || filterField;
                        }
                        if (asParameter) {
                            viewParameters = viewParameters || {};
                            viewParameters[filterField] = filterValue;
                        } else {
                            viewFilter = viewFilter || {};
                            viewFilter[filterField] = filterValue;
                        }
                        selectedFilterIds = selectedFilterIds || {};
                        selectedFilterIds[filterColumn.field] = filterValue;
                    }
                }

                $scope.compositeViewOptions.selectedFilterIds = selectedFilterIds;
                view.$filter = viewFilter;
                view.$parameters = viewParameters;
                if (fullTextSearchValue) { // to apply fts in composite view
                    view.$filter = view.$filter || {};
                    view.$filter.$text = {$search: fullTextSearchValue};
                }
                if ($scope.compositeViewOptions.parentParameters) { //parentParameters must be passed in $parameters of right view--case for notifying other dashboard on click of one dashboard view--Ritesh bansal
                    view.$parameters = view.$parameters || {};
                    for (var key in parameters) {
                        view.$parameters[key] = parameters[key];
                    }
                }
            }

            $scope[$scope.compositeViewOptions.openV](view, function (view) {
                $scope.loadTabData(view, index, reloadUserPreference);
            });
        }

        function getQuery(action, recursion) {
            var viewQuery = angular.copy($scope.compositeView[0].viewOptions.queryGrid);
            var groupField = action.field;
            var actionView = getActionViewInfo(action.views, $scope.compositeView[0].viewOptions.alias);
            if (actionView && actionView.filterField) {
                groupField = actionView.filterField;
            }
            delete viewQuery.$fields;
            if (viewQuery.$filter) {
                delete viewQuery.$filter[groupField];
            }
            viewQuery.$group = {_id: null, count: {$sum: 1}, $fields: false};
            var query = {};
            query.$collection = action.collection;
            query.$fields = {};
            query.$fields[action.displayField] = 1;
            var countQuery = {};
            countQuery.$type = {scalar: "count"};
            countQuery.$query = viewQuery;
            countQuery.$fk = groupField;
            query.$fields.count = countQuery;
            query.$recursion = recursion;
            if (action.filter) {
                var filter = action.filter;
                if (typeof filter === "string") {
                    filter = JSON.parse(filter);
                }
                query.$filter = filter;
            }
            return query;
        }

        function loadFilterViews(action, callback) {
            if (action.filterViews) {
                callback();
                return;
            }
            $scope[$scope.compositeViewOptions.openV]({id: action.view}, function (view) {
                action.showPlusButton = view.viewOptions.insert;
                action.filterViews = view.viewOptions.views;
                callback();
            });
        }


        function ensureActionView(action) {
            var D = require("q").defer();
            if (action.view) {
                loadFilterViews(action, function () {
                    if (action.filterTabIndex === undefined) {
                        action.filterTabIndex = 0;
                    }
                    if (action.oldFilterTabIndex === action.filterTabIndex && action.loadedFilterTabView) {
                        D.resolve(action.loadedFilterTabView.viewOptions.queryGrid);
                        return;
                    }
                    $scope[$scope.compositeViewOptions.openV](action.filterViews[action.filterTabIndex], function (nesView) {
                        action.loadedFilterTabView = nesView;
                        D.resolve(nesView.viewOptions.queryGrid);
                    })
                });
            } else {
                D.resolve();
            }
            return D.promise;
        }


        $scope.populateFilters = function (action, recursion, callback) {
            var userDB = ApplaneDB.connection("userdb");
            return ensureActionView(action).then(function (loadedFilterViewQueryGrid) {
                var queryToExecute = undefined;
                var query = getQuery(action, recursion);
                if (loadedFilterViewQueryGrid) {
                    queryToExecute = loadedFilterViewQueryGrid;
                    queryToExecute.$fields = query.$fields;
                    if (queryToExecute.$recursion) {
                        queryToExecute.$recursion = query.$recursion;
                    }
                } else {
                    queryToExecute = query;
                }
                return userDB.query(queryToExecute);
            }).then(function (result) {
                result = result.response.result;
                callback(result);
            }).fail(function (err) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(err);
                }
            })
        };

        $scope.compositeViewOptions.changeCurrentFilter = function (row, field, displayField) {
            $scope.compositeViewOptions.currentFilter = {currentRow: row, field: field, displayField: displayField};
            $scope.compositeViewOptions.filterValueChanged = !$scope.compositeViewOptions.filterValueChanged;
        }

        function getActionViewInfo(actionViews, loadedViewAlias) {
            if (actionViews && actionViews.length > 0) {
                for (var j = 0; j < actionViews.length; j++) {
                    var actionView = actionViews[j];
                    if (actionView.alias === loadedViewAlias) {
                        return actionView;
                    }
                }
            }
        }

        function populateFilterInfo(field, fieldValue, parameters) {
            $scope.compositeViewOptions.userPreferenceOptions.queryParameters = $scope.compositeViewOptions.userPreferenceOptions.queryParameters || {};
            for (var key in parameters) {
                $scope.compositeViewOptions.userPreferenceOptions.queryParameters[key] = parameters[key];
            }
            $scope.compositeViewOptions.userPreferenceOptions.filterInfo = $scope.compositeViewOptions.userPreferenceOptions.filterInfo || [];
            var filterColumns = $scope.compositeViewOptions.filterColumns;
            for (var i = 0; i < filterColumns.length; i++) {
                var filterColumn = filterColumns[i];
                if (filterColumn.field === field) {
                    var index = Util.isExists($scope.compositeViewOptions.userPreferenceOptions.filterInfo, filterColumn, "field");
                    if (index === undefined) {
                        filterColumn[field] = fieldValue;
                        $scope.compositeViewOptions.userPreferenceOptions.filterInfo.push(filterColumn);
                    } else {
                        $scope.compositeViewOptions.userPreferenceOptions.filterInfo[index][field] = fieldValue;
                    }
                    break;
                }
            }
        }

        function populateCompositeViewParameters(parameters) {
            $scope.compositeViewOptions.$parameters = $scope.compositeViewOptions.$parameters || {}; //to add $parameter to loaded tab view...
            for (var key in parameters) {
                if (key === "__changed") { //__changed property need not to be passed as parameters---case for notifying one dashboard view on click of other dashboard view..--Ritesh Bansal
                    continue;
                }
                $scope.compositeViewOptions.$parameters[key] = parameters[key];
            }
        }

        function saveUserStateAndLoadView(parameters, reloadUserPreference) {
            $scope.populateUserPreferene($scope.compositeViewOptions.userPreferenceOptions, true);
            populateCompositeViewParameters(parameters);
            $scope.loadTabView($scope.compositeViewOptions.selectedTabIndex, reloadUserPreference);
        }

        unwatcher.reload = $scope.$watch('compositeViewOptions.userPreferenceOptions.reload', function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                var parameters = $scope.compositeViewOptions.userPreferenceOptions.queryParameters;
                saveUserStateAndLoadView(parameters, true);
            }
        });
        if ($scope.compositeViewOptions.watchParentParameter && $scope.compositeViewOptions.parentSharedOptions) { //reloadViewOnFilterChange was set true hardcoded for advance dashboard, whole view was reloading on filter applied and that was removing filter applied from left dashboard view on right view.--case on row click of project dashboard,filter of that project should be applied on the tasks dashboard
            unwatcher.parentUserPreferenceOptionsReload = $scope.$watch("compositeViewOptions.parentSharedOptions.userPreferenceOptions.reload", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && angular.isDefined(newValue)) {
                    var parameters = $scope.compositeViewOptions.parentSharedOptions.userPreferenceOptions.queryParameters;
                    populateCompositeViewParameters(parameters);
                    $scope.loadTabView($scope.compositeViewOptions.selectedTabIndex, false);

                }
            });
        }

        if ($scope.compositeViewOptions.watchParentParameter) { //this work is required for passing parameters to composite view's $parameters--case for notifying one dashboard view on click of other dashboard view..--RItesh Bansal
            unwatcher.childViewParameters = $scope.$watch('compositeViewOptions.parentParameters', function (newValue, oldValue) {
                if (angular.equals(newValue, oldValue)) {
                    return;
                }
                var parameters = $scope.compositeViewOptions.parentParameters;
                populateCompositeViewParameters(parameters);
                $scope.loadTabView($scope.compositeViewOptions.selectedTabIndex || 0, false);
            }, true);
        }

        unwatcher.filterValueChanged = $scope.$watch('compositeViewOptions.filterValueChanged', function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                var currentRowInfo = $scope.compositeViewOptions.currentFilter;
                var currentRow = currentRowInfo.currentRow;
                var field = currentRowInfo.field;
                var displayField = currentRowInfo.displayField;

                var parameters = {};
                parameters[field] = currentRow._id;
                var filterValue = {_id: currentRow._id};
                filterValue[displayField] = currentRow[displayField];

                populateFilterInfo(field, filterValue, parameters);
                saveUserStateAndLoadView(parameters, false);
            }
        });

        $scope.$on('$destroy', function () {
            for (var key in unwatcher) {
                unwatcher[key]();
            }
        });

    }
)

pl.directive('plCompositeView', ["$compile", function ($compile) {
    return {
        restrict: "A",
        compile: function () {
            return {

                post: function ($scope, iElement) {
                    var views = $scope.compositeViewOptions.views;
                    var template = "<div ng-show='compositeViewOptions.toolbar'>" +
                        "               <div class='pl-header-toolbar'>" +
                        "                   <pl-tool-bar-header></pl-tool-bar-header>" +
                        "               </div>" +
                        "               <div class='pl-toolbar' pl-tool-bar ></div>" +
                        "           </div>" +
                        "            <div class='pl-clear pl-composite-wrapper flex' ng-class='{\"app-padding-top-four-px\":!compositeViewOptions.provideParentParameter && !compositeViewOptions.watchParentParameter}' style='top:90px;'>" +
                        "               <div style='width: 20%;overflow: auto;overflow-x: hidden' ng-show='compositeViewOptions.showFilterInLeft'>" +
                        "                   <div ng-repeat='action in compositeViewOptions.filterColumns'>" +
                        "                       <div class='pl-filter-columns-tab medium' pl-filter-columns></div>" +
                        "                   </div>" +
                        "               </div>" +
                        "               <div ng-class='{\"app-position-relative\":!compositeViewOptions.watchParentParameter}' class='flex-1'>" +
                        "                   <div ng-repeat='view in compositeView'>" +
                        '                       <div pl-view ng-class="compositeViewOptions.viewClass" ng-controller="ViewCtrl" class="pl-grid-body" ></div>' +
                        "                   </div>" +
                        "               </div>" +
                        "           </div>";
                    iElement.append($compile(template)($scope));

                    if (views && views.length > 0 && !$scope.compositeViewOptions.watchParentParameter) {
                        $scope.loadTabView(0);
                    }

                }
            };
        }
    }
}]);


function mergeFilterData(oldData, data, alias) {
    if (!oldData) {
        return;
    }

    for (var i = 0; i < oldData.length; i++) {
        var row = oldData[i];
        var index = Util.isExists(data, row, "_id");
        var newDataValue = index != undefined ? data[index] : undefined;
        row.count = newDataValue ? newDataValue.count : 0;
        mergeFilterData(row[alias], (newDataValue ? newDataValue[alias] : undefined), alias);
    }
}


pl.directive('plFilterColumns', ['$compile', function ($compile) {
    return{
        restrict: "A",
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    var unwatcher = {};
                    if (!$scope.action.showFilterInLeft) {
                        return;
                    }
                    var recursion = $scope.action.recursion;
                    if (recursion) {
                        if (typeof recursion === "string") {
                            recursion = JSON.parse(recursion);
                        }
                        $scope.alias = recursion.$alias || "children";
                    }
                    $scope.showLoadedFilters = function (data) {
                        $scope.hideLoadingImage = true;
                        if ($scope.action.filterTabIndex == $scope.action.oldFilterTabIndex && $scope.loadedData && $scope.loadedData[0] && $scope.loadedData[0].length > 0) {
                            mergeFilterData($scope.loadedData[0], data, $scope.alias);
                        } else {
                            $scope.loadedData = [data];
                        }
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }

                    $scope.loadFilterTabView = function (index) {
                        $scope.action.oldFilterTabIndex = $scope.action.filterTabIndex;
                        $scope.action.filterTabIndex = index;
                        $scope.hideLoadingImage = false;
                        $scope.populateFilters($scope.action, recursion, $scope.showLoadedFilters);
                    }

                    unwatcher.filterStateChanged = $scope.$watch('compositeViewOptions.filterStateChanged', function (newValue, oldValue) {
                        if (angular.isDefined(newValue)) {
                            if ($scope.action.view) {
                                $scope.action.oldFilterTabIndex = $scope.action.filterTabIndex;
                            }
                            $scope.populateFilters($scope.action, recursion, $scope.showLoadedFilters);
                        }
                    });

                    $scope.openPopUp = function () {
                        $scope[$scope.compositeViewOptions.openV]({id: $scope.action.collection, popup: true, ui: "form", $limit: 0});
                    };

                    var template = "" +
                        '               <div class="app-text-align-center app-position-relative app-padding-five-px pl-header-toolbar">' +
                        '                    <span class="absolute-wrapper" style="top:13px;" ng-class="{\'ng-hide\':hideLoadingImage}" >' +
                        '                       <img src="../images/loadinfo.gif" width="20px" />' +
                        '                    </span>' +
                        '                    <span class="tab-filter" >{{action.label}}</span>' +
                        '                    <span ng-click="openPopUp()" style="color:#f2994b;" title="Create {{action.label}}" ng-show="action.showPlusButton"><i class="icon-plus"></i></span>' +
                        '                </div>';
                    if ($scope.action.view) {
                        template += '<div ng-if="action.view" pl-filter-tabs style="padding: 0px;font-size: 13px;background: rgb(248,248,248);float: left;border-bottom: 1px solid #fff;box-shadow: inset 0px 3px 6px rgb(239,239,239);white-space: nowrap;width: 100%;height: 44px;" ></div>';
                    }
                    template += '<div class="app-padding-five-px pl-clear" ng-repeat="data in loadedData">';
                    if (recursion) {
                        template += '<div pl-tab-filter-recursive options="compositeViewOptions" field="{{action.field}}" alias="{{alias}}" displayfield="{{action.displayField}}" info="data" visible="true"></div>';
                    } else {
                        template += '<div  style="overflow: auto;overflow-x: hidden" pl-tab-filter-without-recursion filterdata="data"></div>';
                    }
                    template += '</div>';

                    iElement.append($compile(template)($scope));

                    $scope.$on('$destroy', function () {
                        for (var key in unwatcher) {
                            unwatcher[key]();
                        }
                    });
                }
            }
        }
    }
}])

pl.directive('plFilterTabs', ["$compile", function ($compile) {
    return {
        restrict: "A",
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var template = '<div style="min-height: 48px" class="flex">' +
                        '               <ul style="padding-left: 0px">' +
                        '                   <li class="pl-filter-tabs" ng-class="{\'qview-selecetd\':action.filterTabIndex== $index}"  ng-repeat="view in action.filterViews"> ' +
                        '                       <span style="display: inline-block;line-height: 20px;" class="app-cursor-pointer" ng-click="loadFilterTabView($index)">{{view.alias}}</span>' +
                        '                   </li>' +
                        '               </ul>' +
                        '           </div>';
                    iElement.append($compile(template)($scope));
                }
            };
        }
    }
}]);

pl.directive('plTabFilterRecursive', ["$compile", function ($compile) {
    return {
        restrict: "A",
        replace: true,
        scope: {recursiveFilterData: '=info', options: '=options', visible: '=visible'},
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    if (!$scope.recursiveFilterData) {
                        return;
                    }

                    $scope.field = attrs.field;
                    $scope.alias = attrs.alias;
                    $scope.displayField = attrs.displayfield;

                    $scope.toggleTree = function (filter) {
                        filter.visible = !filter.visible;
                        if (!filter.visible) {
                            removeVisibilityFromData(filter[$scope.alias], $scope.alias);
                        }
                    }

                    var template =
                        '           <div style="white-space: nowrap" ng-repeat="filter in recursiveFilterData">' +
                        '               <span ng-show="visible" >' +
                        '                   <div class="flex">' +
                        '                      <div class="flex-1" style="overflow: hidden;text-overflow: ellipsis"> ' +
                        '                          <span class="icon-plus pl-group-toggle-box" style="padding-right: 3px" ng-show="filter[alias] && filter[alias].length > 0 " pl-grid-group ng-click="toggleTree(filter)"></span>' +
                        '                          <span  ng-class="{\'tab-filter-selected\':options.selectedFilterIds[field] == filter._id,\'pl-recursive-filter-label\':!filter[alias] || (filter[alias] && filter[alias].length===0)}"  class="app-cursor-pointer" ng-click="options.changeCurrentFilter(filter,field,displayField)">{{filter[displayField]}}</span>' +
                        '                      </div> ' +
                        '                      <span ng-class="{\'tab-filter-selected\':options.selectedFilterIds[field] == filter._id}" >( {{filter.count || 0}} )</span>' +
                        "                   </div>" +
                        "                   <div ng-if='filter.visible' style='margin-left:10px ' pl-tab-filter-recursive options='options' field='{{field}}' alias='{{alias}}' displayfield='{{displayField}}' visible='filter.visible' info='filter[alias]'></div>" +
                        "               </span>" +
                        '           </div>';

                    iElement.append($compile(template)($scope));
                }
            }
        }
    }
}
])

function removeVisibilityFromData(data, alias) {
    if (!data || data.length === 0) {
        return;
    }
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var visible = row.visible;
        if (visible) {
            row.visible = false;
            removeVisibilityFromData(row[alias], alias);
        }
    }
}


pl.directive('plTabFilterWithoutRecursion', ["$compile", function ($compile) {
    return {
        restrict: "A",
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    $scope.filter = $scope.$eval(attrs.filterdata);

                    var template = "" +
                        '               <div>' +
                        '                    <div class="flex" ng-repeat="value in filter">' +
                        '                        <span style="text-overflow: ellipsis;overflow: hidden" ng-class="{\'tab-filter-selected\':compositeViewOptions.selectedFilterIds[action.field] == value._id}" class="app-cursor-pointer flex-1" ng-click="compositeViewOptions.changeCurrentFilter(value,action.field,action.displayField)">{{value[action.displayField]}}</span>' +
                        '                        <span ng-class="{\'tab-filter-selected\':compositeViewOptions.selectedFilterIds[action.field] == value._id}" >( {{value.count || 0}} )</span>' +
                        '                    </div>' +
                        '               </div>'
                    iElement.append($compile(template)($scope));

                }
            }
        }
    }
}
])

pl.directive('plCompositeTabs', ["$compile", "$timeout", function ($compile, $timeout) {
    return {
        restrict: "E",
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    if ($scope.toolBarOptions.header) {
                        $scope.toolbarHeaders = $scope.toolBarOptions.header.left;
                        $scope.toolbarCenterHeaders = $scope.toolBarOptions.header.center;
                        $scope.toolbarRightHeadersActions = $scope.toolBarOptions.header.right;

                    }
                    $scope.toolbarRowOptions = $scope.toolBarOptions.bottom;

                    $scope.loadView = function (view, index, $event) {
                        if (view._id == "__more") {
                            qViewHeaderPopup($event);
                        } else {
                            $scope.loadTabView(index);
                        }
                    };
                    function qViewHeaderPopup($event) {
                        try {
                            var html = "<div class='pl-overflow-y-scroll app-max-height-two-hundred'>" +
                                "           <div ng-repeat='view in compositeViewOptions.views' class='app-white-space-nowrap app-cursor-pointer'>" +
                                "               <div ng-show='view.hide' ng-click='loadView(view,$index,$event)' ng-class='{\"selected-Recursive-filter\":compositeViewOptions.selectedTabIndex== $index}' class='app-row-action pl-popup-label'>{{view.alias}}" +
                                "               </div>" +
                                "           </div>" +
                                "       </div>";
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: true,
                                html: $compile(html)(popupScope),
                                scope: popupScope,
                                element: $event.target,
                                event: $event
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.createRecordPopUp = function () {
                        $scope[$scope.compositeViewOptions.openV]({id: $scope.compositeView[0].viewOptions.collection, popup: true, ui: "form", $limit: 0});
                    };

                    var template = '<div id="plCompositeTabs' + $scope.compositeViewOptions.viewIndex + '" class="pl-header-toolbar" >' +
                        '           <div class="flex" style="min-height: 48px;">' +
                        '               <div  style="display: block" class="app-float-left header-l-bar app-overflow-hiiden" ng-class="toolbarHeaders.lHeaderClass" >' +
                        "                   <div>" +
                        "                       <ul style='padding-left: 0px;' id='tabs" + $scope.compositeViewOptions.viewIndex + "'>" +
                        "                           <li ng-if='compositeViewOptions.views' ng-repeat='view in compositeViewOptions.views'  ng-hide='view.hide' ng-class='{\"qview-selecetd\":(compositeViewOptions.selectedTabIndex== $index) || (view._id===\"__more\" && compositeViewOptions.selectedTabIndex >= compositeViewOptions.splitIndex-1)}'>" +
                        "                               <span class='app-cursor-pointer' ng-click='loadView(view,$index,$event)' >{{view.alias}}</span> " +
                        "                           </li>" +
                        "                       </ul>" +
                        "                   </div>" +
                        '               </div>' +
                        '               <div class="app-bar-basic flex-1 header-r-bar">' +
                        '                   <div pl-button ng-repeat="action in toolbarCenterHeaders" title="{{action.title}}" class="app-float-left"></div>' +
                        '               </div>';
                    if ($scope.compositeViewOptions.provideParentParameter) {// this is required to show plus button for creating record--case for notifying one dashboard view on click of other dashboard view.--Ritesh Bansal
                        if ($scope.compositeView.length > 0 && $scope.compositeView[0].viewOptions.insert) {
                            template += '<div class="app-float-right header-r-bar" ng-class="toolbarHeaders.rHeaderClass">' +
                                '           <span ng-click="createRecordPopUp()" style="color:#f2994b;display:inline-block;line-height: 44px;font-size: 15px" title="Create {{action.label}}"><i class="icon-plus"></i></span>' +
                                '        </div>';
                        }
                    } else {
                        template += '<div class="app-float-right header-r-bar" ng-class="toolbarHeaders.rHeaderClass">' +
                            '              <div pl-button ng-repeat="action in toolbarRightHeadersActions" ng-class="action.class" title="{{action.title}}" class="app-float-left"></div>' +
                            '        </div>' +
                            '        <pl-right-tool-bar style="margin: 6px 2px 2px 5px;"></pl-right-tool-bar>';
                    }
                    template += '</div>' +
                        '       </div>';

                    $timeout(function () {
                        if ($scope.compositeViewOptions.views && $scope.compositeViewOptions.views.length > 0) {
                            var compositeTabsWidth = angular.element('#plCompositeTabs' + $scope.compositeViewOptions.viewIndex).width();
                            var tabsUlElement = angular.element('#tabs' + $scope.compositeViewOptions.viewIndex);
                            $(tabsUlElement).find("li").each(function (index) {
                                if (index === 0) {
                                    compositeTabsWidth += $(this).offset().left;
                                }
                                var tabPosition = $(this).offset().left + $(this).width();
                                if (tabPosition > (compositeTabsWidth - 100) && $scope.compositeViewOptions.splitIndex === undefined) {
                                    $scope.compositeViewOptions.splitIndex = index;
                                }
                            });

                            if ($scope.compositeViewOptions.splitIndex != undefined && $scope.compositeViewOptions.splitted === undefined) {
                                var views = $scope.compositeViewOptions.views;
                                for (var i = 0; i < views.length; i++) {
                                    views[i].hide = (i >= $scope.compositeViewOptions.splitIndex - 1);
                                }
                                var otherMenu = {
                                    alias: "More..",
                                    _id: '__more'
                                };
                                views.push(otherMenu);
                                $scope.compositeViewOptions.splitted = true;
                            }
                        }
                    }, 0);
                    iElement.append($compile(template)($scope));
                }
            };
        }
    }
}]);

