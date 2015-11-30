var apputil = require("./util.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var SELF = require("./mergeutil.js");

/*Merge old values and operations for jobs and operations*/
/*Test case --> mergetest.js*/
exports.mergeJSONObject = function (oldValue, newValue, fieldsToOverride, columns) {
    return mergeUpdatedObject(oldValue, newValue, undefined, fieldsToOverride, columns);
}
function mergeUpdate(oldValue, newValue, field, fieldsToOverride, columns) {
    if (oldValue === undefined) {
        return mergeUpdatedObject(oldValue, newValue, field, fieldsToOverride, columns);
    } else if (newValue === undefined) {
        return apputil.deepClone(oldValue, columns, true);
    } else if (newValue === null || oldValue === null) {
        return newValue;
    } else if (newValue === true || newValue === false || oldValue === true || oldValue === false) {
        return newValue;
    } else if (typeof(newValue) === "string" && typeof(oldValue) === "string") {
        return newValue;
    } else if (!oldValue || !newValue) {
        return apputil.deepClone(newValue, columns, true);
    }
    else if (newValue instanceof Date) {
        return apputil.deepClone(newValue, columns, true);
    } else if ((Array.isArray(oldValue)) || (Array.isArray(newValue))) {
        return mergeUpdatedArray(oldValue, newValue, field, fieldsToOverride, columns);
    } else {
        return mergeUpdatedObject(oldValue, newValue, field, fieldsToOverride, columns);
    }
}

function mergeUpdatedObject(oldValue, newValue, field, fieldsToOverride, columns) {
    var oldJSONObject = apputil.isJSONObject(oldValue);
    var newJSONObject = apputil.isJSONObject(newValue);
    if (oldJSONObject && newJSONObject) {

        if (newValue.override && newValue.data) {
            if (fieldsToOverride && field) {
                fieldsToOverride[field] = fieldsToOverride[field] || {};
                fieldsToOverride[field].override = 1;
            }
            return apputil.deepClone(newValue.data, columns, true);
        } else {

            var mergedValue = undefined;
            if (newValue._id !== undefined && oldValue._id !== undefined && newValue._id === oldValue._id) {
                mergedValue = apputil.deepClone(oldValue, columns, true);
            } else {
                mergedValue = {};
            }

            Object.keys(newValue).forEach(function (newKey) {

                var oldKeyValue = mergedValue[newKey];
                var newKeyValue = newValue[newKey];
                var newKeyColumns = undefined;
                if (columns) {
                    var newKeyColumn = apputil.getColumnObject(newKey, columns)
                    if (newKeyColumn) {
                        if (newKeyColumn.type === "lookup" && newKeyValue && !apputil.isJSONObject(newKeyValue) && !(Array.isArray(newKeyValue))) {
                            throw new Error("Lookup value must be either object or array but found >>>" + JSON.stringify(newKeyValue) + "for column>>>>" + newKeyColumn.expression);
                        }
                        if (newKeyColumn.multiple && newKeyValue) {
                            if (!(Array.isArray(newKeyValue)) && !newKeyValue.override && !(Array.isArray(newKeyValue.data))) {
                                throw new Error("Multiple column value can be only array but found >>>" + JSON.stringify(newKeyValue) + "for column>>>>" + newKeyColumn.expression);
                            }


                        }
                        newKeyColumns = newKeyColumn.columns;
                    }
                }
                if (newKey === "$inc") {
                    if (!apputil.isJSONObject(newKeyValue)) {
                        throw new Error("New Value of $inc must be an object but found>>>>" + JSON.stringify(newKeyValue));
                    } else if (oldKeyValue && !apputil.isJSONObject(oldKeyValue)) {
                        throw new Error("Old Value of $inc must be an object but found>>>>" + JSON.stringify(oldKeyValue));
                    }
                    if (oldKeyValue) {
                        for (var autoIncKey in newKeyValue) {
                            oldKeyValue[autoIncKey] = oldKeyValue[autoIncKey] !== undefined ? oldKeyValue[autoIncKey] + newKeyValue[autoIncKey] : newKeyValue[autoIncKey];
                        }
                    } else {
                        mergedValue[newKey] = apputil.deepClone(newKeyValue, undefined, true);
                    }


                } else {
                    mergedValue[newKey] = mergeUpdate(oldKeyValue, newKeyValue, field ? field + "." + newKey : newKey, fieldsToOverride, newKeyColumns);
                }

            });
            return mergedValue;
        }
    } else {
        return apputil.deepClone(newValue, columns, true);
    }

}

function mergeUpdatedArray(oldValue, newValue, field, fieldsToOverride, columns) {
    if (apputil.isJSONObject(newValue) && newValue.override && newValue.data) {
        if (fieldsToOverride && field) {
            fieldsToOverride[field] = fieldsToOverride[field] || {};
            fieldsToOverride[field].override = 1;
        }
        return apputil.deepClone(newValue.data, columns, true);
    } else if ((Array.isArray(oldValue)) && (oldValue.length == 0)) {
        return apputil.deepClone(newValue, columns, true);
    } else {

        if (!Array.isArray(oldValue)) {
            throw new Error("Old value is not array >>>>" + JSON.stringify(oldValue) + ">>>field>>>" + field + ">>>>columns>>>" + JSON.stringify(columns))
        }
        if (!Array.isArray(newValue)) {
            throw new Error("New value is not array >>>>" + JSON.stringify(newValue) + ">>>field>>>" + field + ">>>>columns>>>" + JSON.stringify(columns))
        }

        var firstRecordOld = oldValue[0];
        if (apputil.isJSONObject(firstRecordOld)) {
            if (firstRecordOld._id === undefined) {
                /*old value instance json obejct but not have _id, we can't merge this*/
                return apputil.deepClone(newValue, columns, true);
            } else {
                /*WE will merge array*/
                var mergeArrayValue = apputil.deepClone(oldValue, columns, true);
                for (var i = 0; i < newValue.length; i++) {
                    /*check in old*/
                    if (newValue[i]._id === undefined) {
                        mergeArrayValue.push(apputil.deepClone(newValue[i], columns, true));
                    } else {
                        var index = apputil.isExists(mergeArrayValue, newValue[i], "_id");
                        if (index === undefined) {
                            if (!newValue[i].__type__ || newValue[i].__type__ != "delete") {
                                mergeArrayValue.push(apputil.deepClone(newValue[i], columns, true));
                            }
                        } else {
                            /*check for delete*/
                            if (newValue[i][QueryConstants.Update.Operation.TYPE] && newValue[i][QueryConstants.Update.Operation.TYPE] === QueryConstants.Update.Operation.Type.DELETE) {
                                mergeArrayValue.splice(index, 1);
                            } else {
                                /*merge these two records*/
                                mergeArrayValue[index] = mergeUpdatedObject(mergeArrayValue[index], newValue[i], field, fieldsToOverride, columns);
                            }
                        }

                    }


                }
                return  mergeArrayValue;
            }
        } else {
            /*old value instance of string and it will get override by new value, we can't merge this*/
            return apputil.deepClone(newValue, columns, true);
        }
    }

}

/*populate mongo updates based of only difference between old value and newValue, it will expect a blank mongoUpdate object which will be populated*/
/*Test case --> mongoupdatetest.js*/
exports.diffJSONObject = function (oldValue, newValue, fieldsToOverride, mongoUpdate) {
    if (oldValue) {
        oldValue = apputil.deepClone(oldValue)
    }
    if (newValue) {
        newValue = apputil.deepClone(newValue)
    }
    if (newValue && newValue.$inc) {
        mongoUpdate.$inc = newValue.$inc;
        for (var inck in newValue.$inc) {
            delete newValue[inck];
            if (oldValue) {
                delete oldValue[inck];
            }

        }
        delete newValue.$inc;
        if (oldValue) {
            delete oldValue.$inc;
        }
    }
    return diffUpdatedObject(oldValue, newValue, undefined, undefined, undefined, fieldsToOverride, mongoUpdate);
}

function diffUpdatedObject(oldValue, newValue, field, parentField, applaneField, fieldsToOverride, mongoUpdate) {
    if (oldValue === undefined) {
        if (newValue !== undefined) {
            diffUpdate(oldValue, newValue, field, parentField, applaneField, fieldsToOverride, mongoUpdate);
        } else {
            /*do nothing*/
        }
    } else {
        if (newValue === undefined || newValue === null) {
            diffUpdate(oldValue, newValue, field, parentField, applaneField, fieldsToOverride, mongoUpdate);
        } else {
            var isNewValueJSON = apputil.isJSONObject(newValue);
            if (!isNewValueJSON && !field) {
                throw new Error("Neither field is defined nor newValue is json object");
            } else if (!isNewValueJSON) {
                throw new Error("New value>>>>" + newValue + ">>>>Field>>>>" + field + ">>>>>Parent field>>>>" + parentField);
            } else {
                var newParentField = parentField;
                if (field) {
                    newParentField += "." + field;
                }

                var newApplaneField = applaneField;
                if (field) {
                    newApplaneField += "." + field;
                }

                for (var valueField in newValue) {
                    if (valueField.indexOf("$") == 0) {
                        continue;
                    }
                    if (SELF.isUpdated(oldValue, newValue, valueField)) {
                        var oldValueData = oldValue[valueField];
                        var newValueData = newValue[valueField];
                        diffUpdate(oldValueData, newValueData, valueField, newParentField, newApplaneField, fieldsToOverride, mongoUpdate);
                    }
                }
            }

        }
    }
    if (!oldValue && newValue !== undefined) {
        diffUpdate(oldValue, newValue, field, parentField, applaneField, fieldsToOverride, mongoUpdate);
    } else if (apputil.isJSONObject(newValue)) {
        if (!oldValue || !apputil.isJSONObject(oldValue)) {
            diffUpdate(undefined, newValueData, field, parentField, applaneField, fieldsToOverride, mongoUpdate);
        } else {

        }
    } else {

    }

}

function populateMongoUpdate(mongoUpdate, updateOperator, field, parentField, value) {
//    var a = b.l;
    var newField = undefined;
    if (parentField) {
        newField = parentField;
        if (field) {
            newField += "." + field;
        }
    } else {
        newField = field;
    }
    if (!newField) {
        throw new Error("Field not defiend while update in mongo object>>>>" + JSON.stringify(mongoUpdate) + ">>>>>update operator>>>>" + updateOperator + ">>>>value>>>>" + JSON.stringify(value));
    }
    mongoUpdate[updateOperator] = mongoUpdate[updateOperator] || {};
    mongoUpdate[updateOperator][newField] = value;
}

function diffUpdate(oldValue, newValue, field, parentField, applaneField, fieldsToOverride, mongoUpdate) {
    if (!oldValue) {
        populateMongoUpdate(mongoUpdate, "$set", field, parentField, newValue);
        return;
    } else if (newValue === undefined) {
        populateMongoUpdate(mongoUpdate, "$unset", field, parentField, 1);
        return;
    } else if (newValue === null) {
        populateMongoUpdate(mongoUpdate, "$unset", field, parentField, 1);
        return;
    } else if (newValue === true || newValue === false) {
        populateMongoUpdate(mongoUpdate, "$set", field, parentField, newValue);
        return;
    } else if (typeof(newValue) === "string") {
        populateMongoUpdate(mongoUpdate, "$set", field, parentField, newValue);
        return;
    } else if ((newValue instanceof Date)) {
        populateMongoUpdate(mongoUpdate, "$set", field, parentField, newValue);
        return;
    } else if (Array.isArray(newValue)) {
        if (!oldValue) {
            populateMongoUpdate(mongoUpdate, "$push", field, parentField, newValue);
        } else {

            //check if it exists in override

            var fieldToCheck = field;
            if (applaneField) {
                fieldToCheck = applaneField + "." + field;

            }

            if (fieldsToOverride && fieldsToOverride[fieldToCheck]) {
                populateMongoUpdate(mongoUpdate, "$set", field, parentField, newValue);
                return;
            }

            /**
             * https://jira.mongodb.org/browse/SERVER-1050
             * two operation on same field can not be done simultaneously, so if such operations occur, we have to override
             */
            var updatedValues = SELF.getArrayUpdates(oldValue, newValue);
            var deletedValues = SELF.getArrayDeletions(oldValue, newValue);
            var insertedValues = SELF.getArrayInserts(oldValue, newValue);


            var noOfTypeChanges = 0;

            /*if two different operation comes, ,means update or pull || push or pull || push or update , we have to override*/
            if (updatedValues && updatedValues.length > 0) {
                noOfTypeChanges += 1;
            }
            if (deletedValues && deletedValues.length > 0) {
                noOfTypeChanges += 1;
            }
            if (insertedValues && insertedValues.length > 0) {
                noOfTypeChanges += 1;
            }


            if (noOfTypeChanges == 0) {
                return;
            } else if (noOfTypeChanges > 1) {
                populateMongoUpdate(mongoUpdate, "$set", field, parentField, newValue);
                /*We have to use $set as in mongodb, two operatoin can not be performed on array*/
                return;
            }


            if (updatedValues && updatedValues.length > 0) {
                for (var i = 0; i < updatedValues.length; i++) {
                    var updatedValue = updatedValues[i];
                    var oldIndex = updatedValue._oldindex;
                    var newIndex = updatedValue._newindex;
                    var newField = field + "." + oldIndex;
                    var newApplaneField = field;
                    if (parentField) {
                        newField = parentField + "." + newField;
                        newApplaneField = applaneField + "." + newApplaneField;
                    }
                    diffUpdatedObject(oldValue[oldIndex], newValue[newIndex], undefined, newField, newApplaneField, fieldsToOverride, mongoUpdate)

                }
            }


            if (deletedValues && deletedValues.length > 0) {
                var asObject = false;
                if (apputil.isJSONObject(oldValue[deletedValues[0]._oldindex])) {
                    asObject = true;
                }
                var toDelete = [];
                for (var i = 0; i < deletedValues.length; i++) {
                    if (asObject) {
                        toDelete.push(oldValue[deletedValues[i]._oldindex]._id);
                    } else {
                        toDelete.push(oldValue[deletedValues[i]._oldindex]);
                    }
                }
                var requiredMongoDelete = undefined;
                if (asObject) {
                    requiredMongoDelete = {"_id":{"$in":toDelete}};
                } else {
                    requiredMongoDelete = {"$in":toDelete};
                }
                populateMongoUpdate(mongoUpdate, "$pull", field, parentField, requiredMongoDelete);
            }


            if (insertedValues && insertedValues.length > 0) {
                var toInserts = [];
                for (var i = 0; i < insertedValues.length; i++) {
                    toInserts.push(newValue[insertedValues[i]._newindex]);
                }
                populateMongoUpdate(mongoUpdate, "$push", field, parentField, {"$each":toInserts});
            }
        }
    } else if (apputil.isJSONObject(newValue)) {
        var newField = field;
        if (parentField) {
            newField = parentField + "." + field;
        }
        diffUpdatedObject(oldValue, newValue, undefined, newField, newField, fieldsToOverride, mongoUpdate)
    } else {
        populateMongoUpdate(mongoUpdate, "$set", field, parentField, newValue);
        return;
    }
}


/*Required for jobs and modules to check if field is updated or not in current operation*/
/*Test case --> isupdatedtest.js*/
exports.isUpdated = function (oldValue, newValue, field) {
    if (!field) {
        return (!apputil.deepEqual(oldValue, newValue));
    }
    var oldJSONObject = apputil.isJSONObject(oldValue);
    var newJSONObject = apputil.isJSONObject(newValue);
    if (oldJSONObject && newJSONObject) {
        var oldFieldValue = oldValue[field];
        var newFieldValue = newValue[field];
        if (apputil.deepEqual(oldFieldValue, newFieldValue)) {
            return false;
        } else {
            return true;
        }
    } else if (!oldJSONObject && !newJSONObject) {
        return false;
    } else if (oldJSONObject) {
        return true;
    } else if (newJSONObject) {
        if (newValue[field] !== undefined) {
            return true;
        } else {
            return false;
        }
    }
}
/*Required for jobs and modules get updated value, field is assumed without dotted expression*/
exports.getUpdatedValue = function (newValue, field) {
    if (!newValue || !field || !apputil.isJSONObject(newValue)) {
        return;
    }
    return newValue[field];

}

/*Required for jobs and modules to find out at what index there is updates, expects both arugment as array*/
/*if field is passed then those index will be passed which have updates for given field*/
exports.getArrayUpdates = function (oldValue, newValue, field) {
    if (!oldValue || !newValue || !(oldValue instanceof Array) || !(newValue instanceof Array) || oldValue.length == 0 || newValue.length == 0) {
        return;
    }
    var updatedIndexes = [];
    for (var i = 0; i < newValue.length; i++) {
        var oldIndex = apputil.isExists(oldValue, newValue[i], "_id")
        if (oldIndex !== undefined) {
            if (SELF.isUpdated(oldValue[oldIndex], newValue[i], field)) {
                updatedIndexes.push({_oldindex:oldIndex, _newindex:i});
            }
        }
    }
    return updatedIndexes;
}

/*Required for jobs and modules to find out at what index there is inserts, expects both arugment as array*/
exports.getArrayInserts = function (oldValue, newValue) {
    if (!newValue || !(newValue instanceof Array) || newValue.length == 0) {
        return;
    }
    var insertIndexes = [];
    for (var i = 0; i < newValue.length; i++) {
        var oldIndex = apputil.isExists(oldValue, newValue[i], "_id")
        if (oldIndex === undefined) {
            insertIndexes.push({_newindex:i});
        }
    }
    return insertIndexes;
}

/*Required for jobs and modules to find out at what index there is deletes, expects both arugment as array*/
exports.getArrayDeletions = function (oldValue, newValue) {
    if (!oldValue || !(oldValue instanceof Array) || oldValue.length == 0) {
        return;
    }
    var deleteIndexes = [];
    for (var i = 0; i < oldValue.length; i++) {
        var newIndex = apputil.isExists(newValue, oldValue[i], "_id")
        if (newIndex === undefined) {
            deleteIndexes.push({_oldindex:i});
        }
    }
    return deleteIndexes;
}