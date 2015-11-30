exports.downloadImage = function (parameters, db) {
    var url = parameters.url ? parameters.url : undefined;
    var Q = require('q');
    var d = Q.defer();
    var maxFileSize = 2*1024*1024;//2mb
    if (!url) {
        d.reject(new Error("URL must be required to upload>>>>"));
        return d.promise;
    }
    var request = require('request');
    var Utils = require("ApplaneCore/apputil/util.js");
    request({url: url, encoding: "binary"}, function (err, response, binary) {
        var fileSize = response.headers["content-length"];
        if (fileSize > maxFileSize) {
            d.reject(new Error("File Size is greater than 2 Mb."));
            return ;
        }
        var filename = parameters.name || Utils.getObjectId();
        db.uploadFile(filename.toString(), binary).then(function (fileKey) {
            d.resolve({key: fileKey, name: filename});
        }).fail(function (err) {
                d.reject(err);
            });
    })
    return d.promise;
//    var mongo = require('mongodb');
//    var Grid = require('gridfs-stream');
//    var ObjectID = require("mongodb").ObjectID;
//    var objectId = new ObjectID();
//    var request = require('request');
//    var Utils = require("ApplaneCore/apputil/util.js");
//    var gfs = Grid(db.db, mongo);
//    var filename = Utils.getObjectId();
//    var writestream = gfs.createWriteStream({filename: filename.toString(), _id: objectId, mode: 'w'});
//    var resp = request(url);
//    resp.pipe(writestream);
//    writestream.on('err', function (error) {
//        d.reject(error);
//    });
//    d.resolve(objectId.toString());
}
