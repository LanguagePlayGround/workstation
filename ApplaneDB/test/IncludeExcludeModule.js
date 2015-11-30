exports.onPreSave = function (event, document, collection, db, options) {
//    console.log("on Pre Save of IncludeExcludeModule>>>>>>>>>>>>>" + JSON.stringify(document));
      if(document.type==="insert"){
          var country = document.get("country");
          document.set("country", undefined);
          document.set("code1", 91);
      }else if(document.type==="delete"){
          document.setCancelUpdates();
          return db.update({$collection:"countries", $insert:[
              {"country":"USA", _id:"USA"}
          ], $modules:{IncludeExcludeModule1:1, IncludeExcludeModule:1}});
      }
}

