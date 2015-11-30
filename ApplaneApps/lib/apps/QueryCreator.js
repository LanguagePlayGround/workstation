var SELF = require("./QueryCreator.js")

function removeParentField(field, query) {
    var fields = query.$fields;
    if (!fields) {
        return;
    }
    for (var qField in fields) {
        if (field.indexOf(qField + ".") == 0) {
            delete fields[qField];
        }
    }

}

function childFieldExists(field, query) {
    var fields = query.$fields;
    if (!fields) {
        return;
    }
    for (var qField in fields) {
        if (qField.indexOf(field + ".") == 0) {
            return true;
        }
    }

}

exports.populateFields = function (fields, parentField, gridQuery, formQuery, ensureForm) {
    var fieldCount = fields ? fields.length : 0;
    for (var i = 0; i < fieldCount; i++) {
        var field = fields[i];
        var queryField = parentField ? parentField + "." + field.field : field.field;

        var visibilityGrid = field.visibilityGrid || field.visibility;
        var visibilityForm = field.visibilityForm || field.visibility;

        var fieldQuery = field.query;
        if (fieldQuery) {
            fieldQuery = JSON.parse(fieldQuery);
        }
        if (fieldQuery && fieldQuery.$type !== "child" && !visibilityGrid) {
            // if subquery type query defined in fields, and atleast one column is visible in field then dont need to add that column,need to add only parent column.
            if (isVisible(field.fields)) {
                visibilityGrid = true;
            }
        }
        //check for groupby
        if (gridQuery && gridQuery.$group && gridQuery.$group[queryField]) {
            //this is a part of group by query so we will not add
//            continue;
        }
        if (visibilityGrid) {
            gridQuery.$fields = gridQuery.$fields || {};
            removeParentField(queryField, gridQuery);
            //In case of Child type query ,donot need to add query in fields,it is handled by child module.
            if (fieldQuery && fieldQuery.$type !== "child") {
                gridQuery.$fields[queryField] = fieldQuery;
            } else {
                gridQuery.$fields[queryField] = 1;
            }
        }
        if (visibilityForm && (ensureForm || !visibilityGrid )) {
            formQuery.$fields = formQuery.$fields || {};
            removeParentField(queryField, formQuery);
            formQuery.$fields[queryField] = 1
        }
        //donot need to add fields in query if query is defined in fields.Already handled for child type query and other query.
        if (!fieldQuery) {
            if (field.fields) {

                SELF.populateFields(field.fields, queryField, gridQuery, formQuery, ensureForm)
                if (field.multiple) {
                    if (childFieldExists(queryField, gridQuery)) {
                        gridQuery.$fields = gridQuery.$fields || {};
                        gridQuery.$fields[queryField + "._id"] = 1
                    }

                    if (childFieldExists(queryField, formQuery)) {
                        if (field.multiple && !ensureForm) {
                            //if some field of nested table is shown at form only, then all formVisibility=true need to be ensure in formQuery even if they are added to gridQuery
                            SELF.populateFields(field.fields, queryField, gridQuery, formQuery, true);
                        }
                        formQuery.$fields = formQuery.$fields || {};
                        formQuery.$fields[queryField + "._id"] = 1
                    }
                }
            }
            if (field.type == "fk" && field.displayField) {
                var displayField = {field:field.displayField, visibility:field.visibility, visibilityGrid:field.visibilityGrid, visibilityForm:field.visibilityForm}
                var _idField = {field:"_id", visibility:field.visibility, visibilityGrid:field.visibilityGrid, visibilityForm:field.visibilityForm}
                var fkFields = [displayField, _idField]
                if (field.otherDisplayFields) {
                    for (var j = 0; j < field.otherDisplayFields.length; j++) {
                        fkFields.push({field:field.otherDisplayFields[j], visibility:field.visibility, visibilityGrid:field.visibilityGrid, visibilityForm:field.visibilityForm});
                    }
                }
                SELF.populateFields(fkFields, queryField, gridQuery, formQuery, ensureForm)
            }
        }
    }

}

function isVisible(fields) {
    if (fields && fields.length > 0) {
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (field.visibility || field.visibilityGrid || isVisible(field.fields)) {
                return true;
            }
        }
    }
}


