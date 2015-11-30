/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 31/1/14
 * Time: 6:44 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var MetadataProvider = require("ApplaneBaas/lib/metadata/MetadataProvider.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MongoDBManager = require("ApplaneBaas/lib/database/mongodb/MongoDBManager.js");
var OPTIONS = {ask:"baas", autocommit:true, disablelogs:true};
var ORGANIZATIONS = {"daffodil":"51ea494c2f00bfa41c00000c", "5226fa314d6d639a4c000015":"5226fa314d6d639a4c000016", "dhbvn":"522f1b06127a43d24200004d", "52301c08dda05ef40700001f":"52301c09dda05ef407000020", "52305da3ffbf160409000017":"52305da4ffbf160409000018", "5238207fc1e8a5bc7f00004b":"5238207fc1e8a5bc7f00004c", "523ae9239ebd19430100000c":"523ae9239ebd19430100000d", "5243be997ccf1a3268000044":"5243be997ccf1a3268000045", "524918eb4ce3c9200400003e":"524918eb4ce3c9200400003f", "524e615d1ccb46a7280000ed":"524e615d1ccb46a7280000ee", "524e90eb3fe114d90f0001a4":"524e90eb3fe114d90f0001a5", "524fda7b281c2d2c0d00002b":"524fda7b281c2d2c0d00002c", "5253d9ae4e84394a76000193":"5253d9ae4e84394a76000194", "525e29beb27178377300011c":"525e29beb27178377300011d", "52621334268db31d4d000031":"52621334268db31d4d000032", "527a40a9b23df6e9590005ac":"527a40a9b23df6e9590005ad", "5285a5df416bef2758000061":"5285a5df416bef2758000062", "52874d81394f14e47e00040f":"52874d81394f14e47e000410", "528f1b1a2b5a9ba72c000619":"528f1b1a2b5a9ba72c00061a", "5294a62568365e423800171e":"5294a62568365e423800171f", "52958c5c68365e4238003c6d":"52958c5c68365e4238003c6e", "52a080f370f162630f068383":"52a080f353b971240ff98667", "daffodilswltd":"52baa3db4a6254e319000001", "52bd1762530f616862000006":"52bd1762530f616862000007", "52c2604f3b4f320029000014":"52c2604f3b4f320029000015", "52c549994f293c1d19000087":"52c549994f293c1d19000088", "52ca33b092b2ca9d4cab4839":"52ca33b092b2ca9d4cab483a", "applanenew":"52d13981d024e03931000444"};

portOrganizationData(function (err, res) {
    if (err) {
        console.log("Error >>>>>>>>>>>>" + err);
    } else {
        console.log("Port Successful.......");
    }
})

function portOrganizationData(callback) {
    getTables(ApplaneCallback(callback, function (tables) {
        Utils.iterateArray(tables, callback, function (table, callback) {
            MetadataProvider.getTable(table.id, OPTIONS, ApplaneCallback(callback, function (tableInfo) {
                MetadataProvider.populateAppOrgDetails(tableInfo, OPTIONS, ApplaneCallback(callback, function (appOrgDetails) {
                    Utils.iterateArray(appOrgDetails, callback, function (appOrgDetail, callback) {
                        var newOptions = Utils.deepClone(OPTIONS);
                        newOptions.ask = appOrgDetail.ask;
                        newOptions.osk = appOrgDetail.osk;
                        MetadataProvider.getOrganization(appOrgDetail.osk, OPTIONS, ApplaneCallback(callback, function (organizationDetail) {
                            MetadataProvider.getAuthenticatedTable(table.id, newOptions, ApplaneCallback(callback, function (tableInfos) {
                                var database = tableInfos.database;
                                var filter = {};
                                if (!database[Constants.Baas.Organizations.DBSTATUS] || database[Constants.Baas.Organizations.DBSTATUS] != "dedicated") {
                                    filter._organizationid_ = organizationDetail._id;
//                                    filter._organizationid_ = ORGANIZATIONS[appOrgDetail.osk];
                                }
                                var update = {};
                                update._organizationid_ = {_id:organizationDetail._id, id:organizationDetail.id};
                                console.log("update >>>>>>>>>>>>>" + JSON.stringify(update) + ">>>>>database >>>>>>>>>" + database.db + ">>>>>filter>>>>>" + JSON.stringify(filter) + ">>>>>>table>>>>>" + tableInfo.id);
                                MongoDBManager.update(database[Constants.Baas.Organizations.DB], tableInfo.id, filter, {$set:update}, {"multi":true}, OPTIONS, callback);
                            }))
                        }))
                    })
                }))
            }))
        })
    }))
}

function getTables(callback) {
    var viewQuery = {};
    viewQuery[QueryConstants.Query.TABLE] = "tables__baas";
    viewQuery[QueryConstants.Query.COLUMNS] = ["_id", "id"];
    var filter = {};
    filter.orgenabled = true;
    viewQuery[QueryConstants.Query.FILTER] = filter;
    DatabaseEngine.executeQuery(viewQuery, OPTIONS, ApplaneCallback(callback, function (res) {
        callback(null, res.data)
    }))
}
