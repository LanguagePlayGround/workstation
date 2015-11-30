/**
 *
 this.TEXT_TYPE = "texttype";   >>>>>>>>>>>>>>>REMOVED

 * @type {String}
 */

exports.ASK = "appsstudio";
exports.UI_VIEWS = {
    TABLE:"uiviews__appsstudio",
    COLUMNS:"columns",
    Columns:{
        SHOW_ON_TABLE:"showOnTable",
        SHOW_ON_PANEL:"showOnPanel",
        UI:"ui",
        UI_PANEL:"uiPanel",
        LABEL:"label",
        WIDTH:"width",
        UITypes:{
            TABLE:"table",
            RICH_TEXT:"richtext",
            AUTO_TEXT:"autotext",
            TEXT:"text",
            LOOKUP:"lookup",
            STRING:"string",
            BOOLEAN:"boolean",
            DATE:"date",
            CURRENCY:"currency",
            DURATION:"duration",
            UNIT:"unit"
        },


        UPDATE:"update",
        VISIBLE_EXPRESSION:"visibleExpression",
        TIME:"time",
        EDITABLE_EXPRESSION:"editableExpression",
        PARAMETER_MAPPINGS:"parametermappings",
        FILTER:"filter",
        TOTAL_AGGREGATE:"totalaggregates",
        COLUMN_GROUP:"columngroup",
        FILTER_DEFAULT_EXPRESSION:"filterDefaultExpression",
        TYPE_EDITABLE_EXPRESSION:'typeEditableExpression',

        VIEW_DETAIL:"viewDetail",
        ORDERS:"orders",
        FILTER_REQUIRED_COLUMNS:"filterRequiredColumns",
        MULTIPLE_FILTER:"multipleFilter",
        UNIVERSAL_FILTER:"universalFilter",
        RANGE_MONTH:'month',
        RANGE_YEAR:'year',
        RANGE_DATE:'date',
        REMEMBER:"remember",
        DECIMAL_PLACE:"decimalplace",
        LOOK_UP_QUERY:"lookupquery",
        VISIBLE_EXPRESSION_PANEL:"visibleExpressionPanel",
        MAX_ROWS:"max_rows",
        MANDATORY:"mandatory",
        BREADCRUMB:"breadcrumb",
        VISIBLE_REQUIRED_COLUMNS:"visibleRequiredColumns",
        PRIVATE:"private",
        UNWIND:"unwind",
        FILTERABLE:"filterable",
        FTS_ENABLED:"ftsEnable"

    },
    LABEL:"label",
    ID:"id",
    ORGANIZATIONID:"organizationid",
    USERID:"userid",
    SEQUENCE:"sequence",
    SEQUENCE_PANEL:"sequencePanel",
    LAST_MODIFIED_TIME:"lastmodifiedtime",
    SCHEDULES:"schedules",
    ACTIONS:"actions",
    COLUMN_GROUPS:"columngroups",
    ColumnGroups:{
        INDEX:"index",
        LABEL:"label",
        SHOW_COLUMN_LABEL:"showColumnLabel",
        SHOW_TITLE:"showTitle",
        COLUMN_PER_ROW:"columnPerRow",
        SEPARATOR:"separator",
        TYPE:"type",
        COLUMN_WIDTH:"columnWidth"
    },
    Actions:{
        LABEL:"label",
        TYPE:"type",
        FILTER_TYPE:"filterType",
        EXPRESSION:"expression",
        TABLE:"table",
        DISPLAY_COLUMNS:"displaycolumns",
        AS_PARAMETER:"asParameter",
        INVOKE_TYPE:"invokeType",
        URL:"url",
        JOB_NAME:"jobname",
        METHOD:"method",
        MODULE:"module",
        ON_HEADER:"onHeader",
        ON_ROW:"onRow",
        PRE_MESSAGE:"preMessage",
        POST_MESSAGE:"postMessage",
        PARAMETER_MAPPINGS:"parametermappings",
        COLUMNS:"columns"
    },
    FILTER:"filter",
    MAX_ROWS:"max_rows",
    TEMPLATE:"template",
    TYPE:"type",
    INSERT:"insert",
    FTS_SEARCH:"ftsSearch",
    NAVIGATION:"navigation",
    DELETE:"delete",
    SAVE:"save",
    EDIT:"edit",
    ENABLE_SELECTION:"enableSelection",
    INSERT_MODE:"insertMode",

    Type:{
        TABLE:"table",
        PANEL:"panel",
        HTML:"html"
    },
    UPDATE_TYPE:"updatetype"

}

exports.UI_MENUS = {
    TABLE:"uimenus__appsstudio",
    INDEX:"index",
    LABEL:"label",
    PARENT_MENUID:"parentmenuid",
    TABLE_ID:"tableid",
    BAAS_VIEW_ID:"baasviewid",
    VISIBLE_EXPRESSION:"visibleExpression",
    FILTER:"filter",
    APPLICATIONID:"applicationid",
    SOURCE_VIEW_ID:"sourceviewid",
    TYPE:"type",
    Type:{
        MENU:"Menu",
        CHILD:"Child"
    },
    PARAMETER_MAPPINGS:"parametermappings",
    ORGANIZATION_ID:"organizationid"
}

exports.QUICK_VIEWS = {
    TABLE:"quickviews__appsstudio",
    SOURCE_ID:"sourceid",
    BAAS_VIEW_ID:"baasviewid",
    LABEL:"label",
    ORGANIZATION_ID:"organizationid"
}
