var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");

exports.onPreSave = function (event, document, collection, db, option) {
    var fields = collection.getValue(Constants.Admin.Collections.FIELDS);
    if (document.type === "insert") {
        var sequenceField = getSequenceTypeField(fields);
        var sequenceInnerField = sequenceField ? sequenceField[Constants.Admin.Fields.FIELD] : undefined;
        if (sequenceInnerField) {
            var fieldValue = document.get(sequenceInnerField);
            if (!fieldValue || !(/\d$/.test(fieldValue))) {
                var series = "";
                if (fieldValue) {
                    series = fieldValue.trim();
                }
                return getNextNumber(db, collection, series).then(function (number) {
                    document.set(sequenceInnerField, series + number);
                });
            }
        }
    }
}

function getNextNumber(db, collection, series) {
    var number = undefined;
    var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
    return db.mongoUpdate({$collection:"pl.series", $upsert:[
        {$query:{series:series, "collection":collectionName}, $update:{ $inc:{ number:1 } }, $options:{new:true, upsert:true}}
    ]}).then(
        function (data) {
            if (data && data["pl.series"] && data["pl.series"].$upsert && data["pl.series"].$upsert.length > 0) {
                number = data["pl.series"].$upsert[0].number;
                var recordid = data["pl.series"].$upsert[0]._id;
                if (db.txid !== undefined) {
                    var TransactionModule = require("./TransactionModule.js");
                    return TransactionModule.insertTransaction({type:"sequence", update:{_id:recordid, series:series, collection:collectionName, number:number}, collection:"pl.series"}, db);
                }
            }
        }).then(function () {
            return number;
        });
}


function getSequenceTypeField(fields) {
    var length = fields ? fields.length : 0;
    for (var i = 0; i < length; i++) {
        if (fields[i].type === Constants.Admin.Fields.Type.SEQUENCE) {
            return fields[i];
        }
    }
}

