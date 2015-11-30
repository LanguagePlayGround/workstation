var Constants = require("../Constants.js");

exports.onPreSave = function (document, db) {
    if(document){
        var template = {};
        if(document.type === "insert"){
            template = document.get("template");
        }
        else if(document.type === "update"){
            var fields = document.getUpdatedFields();
            if(fields.indexOf("template")>-1)
                template = document.get("template");
            else
                return [];

        }
        else if (document.type === "delete"){
            return [];
        }
        var templates = findArgument(template);
        document.set("subTemplate",templates);
        console.log("templates >>>>>>"+ JSON.stringify(templates));

    }
}

function findArgument(template){
    var templates = [];
    while(template.indexOf("getTemplate") > 0){
        var pos1 = template.indexOf("getTemplate");
        template = template.substring(pos1+12,template.length);
        var pos2 = template.indexOf(")");
        var keyword = template.substring(0,pos2);
        keyword = keyword.substring(1,keyword.length-1);
        var element = {};
        element.id = keyword;
        templates.push(element);
    }
    return templates;
}