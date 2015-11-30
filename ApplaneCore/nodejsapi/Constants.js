exports.Query = new function () {
    this.TABLE = "table";
    this.EXPRESSION = "expression";
    this.VIEW = "view";
    this.ASK = "ask";
    this.OSK = "osk";
    this._ID = "_id";
    this.COLUMNS = "columns";
    this.Columns = new function () {
        this.EXPRESSION = "expression";
        this.ALIAS = "alias";
        this.AGGERGATE = "aggregate";
        this.Aggregates = new function () {
            this.SUM = "sum";
            this.AVG = "avg";
            this.MAX = "max";
            this.MIN = "min";
            this.COUNT = "count";
        }
    };
    this.FIELDS = "fields";
    this.UNWIND_COLUMNS = "unwindcolumns";
    this.COLUMN_MERGE = "column_merge";
    this.FETCH_DOTTED = "fetchdotted";
    this.FILTER = "filter";
    this.Filter = new function () {
        this.Operator = new function () {
            this.QUERY = "$query";
            this.UDF = "$udf";
            this.IN = "$in";
            this.EQUAL = "$eq";
            this.NE = "$ne";
            this.GTE = "$gte";
            this.LTE = "$lte";
            this.GT = "$gt";
            this.LT = "$lt";
            this.WHEN = "$when";
            this.When = new function () {
                this.CONDITION = "$condition";
                this.FILTER = "$filter";
                this.CODE = "$code"
            }
        }
    }
    this.PARAMETERS = "parameters";
    this.ORDERS = "orders";
    this.Orders = new function () {
        this.ASC = "asc";
        this.DESC = "desc";
        this.ORDER = "$order";
        this.RECURSIVE = "$recursive"
        this.GROUP = "$group"
        this.COLUMNS = "$columns"
        this.RESULT = "$result"
        this.Result = new function () {
            this.LEVEL = "level";
            this.NESTED = "nested";
        }
    }
    this.TEMPLATE = "template";
    this.MAX_ROWS = "max_rows";
    this.COUNT = "$count";
    this.CURSOR = "cursor";
    this.METADATA = "metadata";
    this.CHILDS = "childs";
    this.Childs = new function () {
        this.ALIAS = "alias";
        this.RELATED_COLUMN = "relatedcolumn";
        this.PARENT_COLUMN = "parentcolumn";
        this.QUERY = "query";
        this.USE_IN = "usein";
        this.ONE_TO_ONE = "onetoone";
    }
    this.GROUPS = "groups";
    this.EXCLUDE_JOBS = "excludejobs";
    this.EXCLUDE_MODULES = "excludemodules";
    this.INCLUDE_MODULES = "includemodules";
    this.MODULE_PARAMETERS = "moduleparameters";
    this.KEEP_STRUCTURE = "keepstructure";
    this.Result = new function () {
        this.DATA = "data";
        this.ERROR = "error";
        this.Data = new function () {
            this.HTML = "__html";
        }
        this.METADATA = "metadata";


        this.CURSOR = "cursor";
        this.MODULE_RESULT = "moduleresult";
        this.ModuleResult = new function () {
            this.AGGREGATES = "aggregates";
            this.DATA = "data";
        }
        this.Tree = new function () {
            this.CHILDREN = "children";
            this.LEVEL = "_level";
            this.MODE = "_mode";
        }

        this.Group = new function () {
            this.GROUP = "_group";
        }
    }
};


exports.Update = new function () {
    this.EXCLUDE_JOBS = "excludejobs";
    this.EXCLUDE_MODULES = "excludemodules";
    this.INCLUDE_MODULES = "includemodules";
    this.OPERATIONS = "operations";
    this.Operation = new function () {
        this.OLD_VALUE = "$old";
        this.EXTRA_COLUMNS = "extracolumns";
        this.VETO = "__veto__";
        this.EXTRA_FLEX_COLUMNS = "extraflexcolumns";
        this.TYPE = "__type__";
        this.Type = new function () {
            this.INSERT = "insert";
            this.DELETE = "delete";
            this.UPDATE = "update";
            this.INSERT_IF_NOT_EXIST = "insertifnotexist";
            this.ERROR_IF_NOT_EXIST = "errorifnotexist";
            this.UPSERT = "upsert";
        }
        this.OVERRIDE = "override";
    };

};
