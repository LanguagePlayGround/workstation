var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MongodbManager = require("ApplaneBaas/lib/database/mongodb/MongoDBManager.js");
var apputil = require("ApplaneCore/apputil/util.js");


function portVoucher() {
    var query = {table:"voucher__books"};
    var options = {ask:"522f0f46d870c3ec170016e2", osk:"daffodil", disablelogs:true, autocommit:true};
    console.log("start query");
    DatabaseEngine.executeQuery(query, options, function (err, data) {
        console.log("end query");
        if (err) {
            console.log(err.stack);
            return;
        }
        if (data && data.data.length > 0) {
            console.log("lebth >>>>>>>>>>>" + data.data.length);
            apputil.iterateArrayWithIndex(data.data, function (err, result) {
                if (err) {
                    console.log("err >> " + err.stack);
                } else {
                    console.log("Porting successfully.");
                }
            }, function (index, update, callback) {
                console.log("index >>>>>>>>>>>" + index);
                update.__type__ = "upsert";
                if (update.voucher_line_item && update.voucher_line_item.length > 0) {
                    var voucherLineItems = update.voucher_line_item;
                    for (var i = 0; i < voucherLineItems.length; i++) {
                        var voucherLineItem = voucherLineItems[i];
                        if (!(voucherLineItem.amount)) {
                            var amount = 0;
                            if (voucherLineItem.cr_amount) {
                                var creditAmount = voucherLineItem.cr_amount.amount;
                                if (typeof creditAmount == "string") {
                                    creditAmount = parseFloat(creditAmount);
                                }
                                if (creditAmount < 0) {
                                    amount = creditAmount * -1;
                                } else if (creditAmount > 0) {
                                    amount = creditAmount;
                                }
                            } else if (voucherLineItem.dr_amount) {
                                var debitAmount = voucherLineItem.dr_amount.amount;
                                if (typeof debitAmount == "string") {
                                    debitAmount = parseFloat(debitAmount);
                                }
                                if (debitAmount < 0) {
                                    amount = debitAmount;
                                } else if (debitAmount > 0) {
                                    amount = debitAmount * -1;
                                }
                            }
                            voucherLineItem.amount = amount;
                        }
                    }
                }

                var updates = {table:"voucher__books", operations:update, excludejobs:true, excludemodules:false};
//                console.log("updates >>>>>>>>>>>>" + JSON.stringify(updates));
                var newOptions = {ask:"522f0f46d870c3ec170016e2", osk:"daffodil", disablelogs:true};
                MongodbManager.startTransaction(newOptions);
                UpdateEngine.executeUpdate(updates, newOptions, function (err, data) {
                    if (err) {
                        console.log("Error while updating ::::::::: " + err.stack);
                        callback(err);
                    }
                    MongodbManager.commitTransaction(newOptions.txnid, newOptions, function (err) {
                        if (err) {
                            console.log("Error while committing ::::::::: " + err.stack);
                            callback(err);
                        }
                        callback();
                    })
                });
            });
        }
    });
}


portVoucher();