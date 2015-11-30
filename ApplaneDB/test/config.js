exports.config = {
    HOSTNAME:"127.0.0.1",
    PORT:"5100",
    URL:"mongodb://127.0.0.1:27017",
    MONGO_REMOTE_URL:"mongodb://127.0.0.1:27017",
    LOG_DB:"northwindtestcaselogdb",
    DB:"northwindtestcases",
    ADMIN_DB:"northwindtestcasesadmin",
    GLOBAL_DB:"northwindtestcaseglobal",
    SERVER_NAME:"local",
    DROP_GLOBAL_DB:true,
    Admin:{
        DB:"northwindtestcasesadmin",
        USER_NAME:"adminguest",
        PASSWORD:"adminpass"
    },
    MongoAdmin:{
        DB:"admin",
        USER_NAME:"daffodilsw",
        PASSWORD:"daffodil-applane"
    },
    MailCredentials:{
        SEND_ERROR_MAIL:false,
        ERROR_USERNAME:"daffodilsw",
        ERROR_PASSWORD:"applane@123"
    },
    OPTIONS:{
        username:"guest",
        password:"guest",
        ensureDB:true
    },
    ADMIN_OPTIONS:{
        db:"northwindtestcasesadmin",
        username:"adminguest",
        password:"adminpass",
        ensureDB:true
    },
    GLOBAL_DB_OPTIONS:{
        username:"guest",
        password:"guest",
        ensureDB:true
    },
    MONGO_ADMIN_OPTIONS:{
        username:"admin",
        password:"damin",
        db:"admin"
    }
}

var path = require.resolve("NorthwindSource");
var indexOfIndexJS = path.indexOf("index.js");
path = path.substring(0, indexOfIndexJS) + "/node_modules";

var requiredJS = require("requirejs");
requiredJS.config({baseUrl:path });

