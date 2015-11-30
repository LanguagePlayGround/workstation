//TODO columnsclone groupcolumns
var SERVER_DATE_FORMAT = "yyyy-mm-dd'T'HH:MM:ss";
var TOOL_BAR_ID = 'app-tool-bar';
var BAAS_SERVER = "/rest";
var PRIMARY_COLUMN = "primarycolumn";
var KEY = "_id";
var COMPONENT_ID_KEY = "view-component";
var SERVER_KEY = "server-key";
var ACTION_METHOD = /ACTION_METHOD/g;
var ACTION_LABEL = /ACTION_LABEL/g;
var ACTION_CLASS = /ACTION_CLASS/g;
var COMPONENT_ID = "componentid";
var USER_CURRENT_ROW = "usecurrentrow";
var appStrapDirectives = angular.module('$appstrap.directives', []);
var appStrapServices = angular.module('$appstrap.services', []);
var SHOW_AS = "showas";
var CHILD_COMPONENT_ID = "childcomponentid";
var PARENT_COMPONENT_ID = "parentcomponentid";
var VIEW_CONTAINER = "#view-container";
var APPLANE_DEVELOPER_APP_ID = "applanedeveloper";
var APPLANE_DEVELOPER_ASK = "appsstudio";
var FILTERABLE_COLUMN = 'filterableColumn';


var UNIT_TYPE = 'unit';
var CELL_TEMPLATE = "<span >{{row[col.expression] | json}}</span>";

var DEFAULTS_KEY = "defaults";
var VALIDATIONS_KEY = "validations";
var TOTAL_AGGREGATES = "totalaggregates";
var SPAN = 'span';
var DEFAULT_ACTION_TEMPLATE = "<div class='ACTION_CLASS' title='ACTION_LABEL' ng-click='ACTION_METHOD'></div>";

var SEQUENCE = "sequence";
var SEQUENCE_PANEL = "sequencePanel";
var COLUMNS_TABLE = "columnsTable";
var COLUMNS_PANEL = "columnsPanel";
var VIEW_TABLE = "table";


var UI = "ui";
var UI_PANEL = "uiPanel";
var SHOW_ON_TABLE = "showOnTable";
var SHOW_ON_PANEL = "showOnPanel";
var VISIBLE_EXPRESSION = "visibleExpression";
var VISIBLE_EXPRESSION_PANEL = "visibleExpressionPanel";
var VIEW_PANEL = "panel";
var FILE_KEY = 'key';
var FILE_NAME = 'name';
var EDITABLE_EXPRESSION = "editableExpression";
var EDITABLE_EXPRESSION_PANEL = "editableExpressionPanel";

var UI_TYPE_TABLE = "table";        //alternate of embed
var UI_TYPE_DURATION = 'duration';
var UI_TYPE_COMPOSITE_LOOK_UP = "compositelookup";
var UI_TYPE_CURRENCY = 'currency';
var UI_TYPE_DATE = "date";
var UI_TYPE_AUTO_INCREMENT = "autoincrement";
var UI_TYPE_NUMBER = "number";
var UI_TYPE_DECIMAL = "decimal";
var UI_TYPE_STRING = "string";
var UI_TYPE_LOOK_UP = 'lookup';
var UI_TYPE_IMAGE = 'image';
var UI_TYPE_FILE = 'file';
var UI_TYPE_SELECTION = "selection";
var UI_TYPE_SR = "sr";
var UI_TYPE_INDEX = "index";
var UI_TYPE_BOOLEAN = "boolean";
var UI_TYPE_RANGE = 'range';
var UI_TYPE_AGGREGATE = 'aggregate';
var UI_TYPE_TIME = 'time';
var UI_TYPE_TEXT = 'text';
var UI_TYPE_AUTO_HEIGHT = 'autoheight';
var UI_TYPE_RICHTEXT = 'richtext';
var UI_TYPE_JSON = 'json';
var UI_TYPE_SCHEDULE = 'schedule';

function AppUtil() {
}


AppUtil.breakBreadCrumbLabel = function (label) { // break label if label is length is > 15
    if (label && label.toString().length > 15) {
        label = label.substring(0, 10) + '..';
    }
    return label;
};
AppUtil.getNestedColumns = function (columns, expression) {
    var nestedColumns = [];
    if (!columns) {
        return undefined;
    }
    for (var i = 0; i < columns.length; i++) {
        if (columns[i].expression.indexOf(expression + ".") == 0) {
            var nestedColumn = angular.copy(columns[i]);
            var nestedColumnExp = nestedColumn.expression;

            nestedColumnExp = nestedColumnExp.substring(expression.length + 1);
            nestedColumn.expression = nestedColumnExp;
            nestedColumns.push(nestedColumn)
        }

    }
    if (nestedColumns.length == 0) {
        return undefined;
    } else {
        return nestedColumns;
    }


}
AppUtil.populateColumn = function (column, viewType, model, filters, appliedfilters, $scope, $dataModel) {
    var type = column[UI];
    if (viewType == VIEW_PANEL) {
        type = column[UI_PANEL] || type;
    }

    var placeholder = column.label;
    if (viewType == VIEW_PANEL) {
        placeholder = false;
    }

    column.style = column.style || {};
    if (!model) {
        model = "row";
    }
    column.model = model;
    var field = column.expression;
    if (type == UI_TYPE_TABLE) {
        column.panelElementId = 'nested_panel_' + column.expression + '_' + $scope[COMPONENT_ID];
        column.editableCellTemplate = '<div class="app-width-full">' +
            '<app-nested-view></app-nested-view>' +
            '</div>';
        column.noBorder = true;
    } else if (type == UI_TYPE_LOOK_UP || (column.multiple && type != 'object' && type != UI_TYPE_IMAGE && type != UI_TYPE_FILE) || (type == UI_TYPE_STRING && (column.lookupquery || (column.options && column.options.length > 0)))) {
        var bindtype = false;
        if (type == UI_TYPE_STRING && column.lookupquery) {
            var lookUpQueryColumns = (column.lookupquery);
            Object.keys(lookUpQueryColumns).forEach(function (k) {
                column[k] = lookUpQueryColumns[k];
            })
            bindtype = column.bindtype = "string";
        }
        var displayExp = false;
        var lookupSource = $scope[COMPONENT_ID] + "_" + AppUtil.getComponentId("lookup-ds");
        if (column.options && angular.isArray(column.options) && column.options.length > 0) {
            $scope.setLookUpDataSource(lookupSource, column.options);
            bindtype = column.bindtype = "string";
        } else if (column.table) {
            column[COMPONENT_ID] = $scope[COMPONENT_ID];
            column.ask = $scope.view.ask;
            column.osk = $scope.view.osk;
            $scope.setLookUpDataSource(lookupSource, new $dataModel.getLookupDataSource(column));
            if (!bindtype) {
                displayExp = AppUtil.getDisplayExp(column.lookupdisplaycolumns[0]);
            }

        } else if (type != UI_TYPE_LOOK_UP) {
            $scope.setLookUpDataSource(lookupSource, [""]);
            bindtype = column.bindtype = "string";
        }
        var multiple = column.multiple;
        if (multiple === undefined) {
            multiple = false;
        }

        if (!filters && !appliedfilters) {
            var template = "<app-lookup placeholder='" + placeholder + "' border=false model='" + model + "' field='" + field + "' datasource='" + lookupSource + "' multiple=" + multiple + " insert='" + column.view + "'";
            if (displayExp) {
                template += " display='" + displayExp + "'";
            }
            if (bindtype) {
                template += " bindtype='" + bindtype + "'";
            }
            template += "></app-lookup>";
            column.editableCellTemplate = template;

            if (column[FILTERABLE_COLUMN] && column[VISIBLE_EXPRESSION] === undefined && viewType == VIEW_TABLE) {
                column[VISIBLE_EXPRESSION] = "!this." + column.expression;
            }
        }

        if (column[FILTERABLE_COLUMN] && filters && appliedfilters && column.expression.indexOf(".") == -1) {
            var filterTemplate = "<div class='app-filter-view-margin app-float-left'";
            if (column.multiple) {
                filterTemplate += "style='width:475px;'>";
            } else {
                filterTemplate += "style='width:235px;'>";
            }
            filterTemplate += "<div style='height:20px;' class='app-blue-text-color app-float-left app-font-weight-bold app-white-space-nowrap' >" + column.label + "</div>" +
                "<app-lookup class='app-float-left' style='width: 70px;height:20px;' border=false showaslabel='true' model='view.metadata.filterparameters' field='" + column.expression + "_filteroperator' datasource='operator' dropdownclass='app-filter-operator'></app-lookup>" +
                "<app-lookup";
            if (column.multiple) { /* check multiple filter property*/
                filterTemplate += " style='width:475px; min-height: 30px; height:auto;' ";
            } else {
                filterTemplate += " style='width:235px;height: 30px;' ";
            }
            filterTemplate += " class=' app-float-left' datasource='" + lookupSource + "' model='view.metadata.filterparameters' field='" + field + "' multiple='" + column.multiple + "'";
            if (displayExp) {
                filterTemplate += " display='" + displayExp + "'";
            }
            filterTemplate += "></app-lookup></div>";
            column.filterTemplate = filterTemplate;

            column.filterEditCellTemplate = "<app-lookup class='app-float-left' style='height: 21px;padding-top: 3px;' border=false showaslabel='true' model='view.metadata.filterparameters' field='" + column.expression + "_filteroperator' datasource='operator' dropdownclass='app-filter-operator'></app-lookup>" +
                "<app-lookup class='app-float-left' style='width:100px;' placeholder='" + placeholder + "' border=false model='view.metadata.filterparameters' field='" + field + "' datasource='" + lookupSource + "' multiple=" + multiple + " insert='" + column.view + "'";
            if (displayExp) {
                column.filterEditCellTemplate += " display='" + displayExp + "'";
            }
            if (bindtype) {
                column.filterEditCellTemplate += " bindtype='" + bindtype + "'";
            }
            column.filterEditCellTemplate += "></app-lookup>";

            var filter = angular.copy(column);
            if (column.multipleFilter) {
                filter.multiple = true;
            }
            var expression = filter.expression;
            if ($dataModel.isFilterApplied(expression, $scope.view.metadata.filterparameters)) {
                appliedfilters.push(filter);
            }
            filters.push(filter);
        }


    } else if (type == UI_TYPE_DURATION) {
        column.editableCellTemplate = "<app-duration placeholder='" + placeholder + "' border=false model='" + model + "' field='" + column.expression + "' ></app-duration>";
        column.style["text-align"] = "right";
    } else if (type == UI_TYPE_COMPOSITE_LOOK_UP) {
        var firstlookupSource = $scope[COMPONENT_ID] + "_" + AppUtil.getComponentId("lookup-ds");
        var secondlookupSource = $scope[COMPONENT_ID] + "_" + AppUtil.getComponentId("lookup-ds");
        column[COMPONENT_ID] = $scope[COMPONENT_ID];
        column.ask = $scope.view.ask;
        column.osk = $scope.view.osk;
        if (column.compositeoptions && column.compositeoptions.length > 0) {
            for (var i = 0; i < column.compositeoptions.length; i++) {
                if (column.compositeoptions[i].displaycolumns && column.compositeoptions[i].displaycolumns.length > 0) {
                    column.compositeoptions[i].lookupdisplaycolumns = [
                        {type:"string", expression:column.compositeoptions[i].displaycolumns[0]}
                    ];
                }
            }
            $scope.setLookUpDataSource(firstlookupSource, column.compositeoptions);
        }

        $scope.setLookUpDataSource(secondlookupSource, new $dataModel.getLookupDataSource(column));
        if (!filters && !appliedfilters) {
            column.editableCellTemplate = "<app-composite-look-up placeholder='" + placeholder + "' border=false model='" + model + "' field='" + column.expression + "' first='" + firstlookupSource + "' second='" + secondlookupSource + "'></app-composite-look-up>";
            if (column[FILTERABLE_COLUMN] && column[VISIBLE_EXPRESSION] === undefined && viewType == VIEW_TABLE) {
                column[VISIBLE_EXPRESSION] = "!this." + column.expression;
            }
        }

        if (column[FILTERABLE_COLUMN] && filters && appliedfilters && column.expression.indexOf(".") == -1) {
            var filter = angular.copy(column);
            filter.model = 'view.metadata.filterparameters';
            filter.type = UI_TYPE_COMPOSITE_LOOK_UP;
            var secondlookupfilterSource = $scope[COMPONENT_ID] + "_" + AppUtil.getComponentId("lookup-ds");
            $scope.setLookUpDataSource(secondlookupfilterSource, new $dataModel.getLookupDataSource(filter));
            filter.filterTemplate = "<div style='width: 235px;height: 50px;' class='app-filter-view-margin app-float-left'>" +
                "<div style='height:20px;width:200px;float:left;'  class='app-blue-text-color app-float-left app-font-weight-bold app-white-space-nowrap' >" + column.label + "</div>" +
                "<div style='width: 235px;height: 30px;' class='app-float-left'>" +
                "<app-composite-look-up model='view.metadata.filterparameters'  field='" + field + "' first='" + firstlookupSource + "' second='" + secondlookupfilterSource + "'></app-composite-look-up>" +
                "</div></div>";

            filter.filterEditCellTemplate = "<app-composite-look-up model='view.metadata.filterparameters' placeholder=true field='" + field + "' first='" + firstlookupSource + "' second='" + secondlookupfilterSource + "' border=false></app-composite-look-up>";
            var expression = filter.expression;
            if ($dataModel.isFilterApplied(expression, $scope.view.metadata.filterparameters)) {
                appliedfilters.push(filter);
            }
            filters.push(filter);
        }
    } else if (type == UI_TYPE_CURRENCY) {
        column.editableCellTemplate = "<app-currency placeholder='" + placeholder + "' border=false model='" + model + "' field='" + column.expression + "' ></app-currency>";
        column.style["text-align"] = "right";
    } else if (type == UNIT_TYPE) {
        column.editableCellTemplate = "<app-unit placeholder='" + placeholder + "' border=false model='" + model + "' field='" + column.expression + "' ></app-unit>";
        column.style["text-align"] = "right";
    } else if (type == UI_TYPE_AUTO_INCREMENT) {
        if (column.seriesautosave) {
            var field = column.expression + ".series";
            var displayExp = false;
            var lookupSource = $scope[COMPONENT_ID] + "_" + AppUtil.getComponentId("lookup-ds");
            $scope[lookupSource] = new $dataModel.getLookupDataSource({componentid:$scope[COMPONENT_ID], ask:$scope.view.ask, osk:$scope.view.osk, table:{id:"series__baas"}, lookupdisplaycolumns:[
                {"expression":"series"}
            ], "filter":{tableid:$scope.view.metadata.table}});
            displayExp = "series";
            var multiple = false;
            column.editableCellTemplate = "<app-lookup placeholder='" + placeholder + "' border=false model='" + model + "' field='" + field + "' datasource='" + lookupSource + "' multiple=false display='" + displayExp + "'></app-lookup>";
        } else {
            column.editableCellTemplate = "<app-text placeholder='" + placeholder + "' model='" + model + "' field='" + column.expression + ".series" + "' border=false></app-text>";
        }
    } else if (type == UI_TYPE_RANGE) {
        var fromField = column.expression + ".from";
        var toField = column.expression + ".to";
        var viewMode = '';
        if (column.month == "On" && column.year == "On") {
            viewMode = 'months';
        } else if (column.year == "On") {
            viewMode = 'years';
        }

        column.editableCellTemplate = "<div class='app-width-full app-height-full'>" +
            "<app-datepicker border=false class='app-width-fifty-percent app-float-left' viewmode='" + viewMode + "' placeholder='From' class='app-float-left' model='" + model + "' field='" + fromField + "'></app-datepicker>" +
            "<app-datepicker border=false class='app-width-fifty-percent app-float-left' viewmode='" + viewMode + "' placeholder='To' class='app-float-left' model='" + model + "' field='" + toField + "'></app-datepicker>" +
            "</div>";
    } else if (type === UI_TYPE_DATE) {
        var format = "dd/mm/yyyy";

        if (!filters && !appliedfilters) {
            column.editableCellTemplate = "<app-datepicker placeholder='" + placeholder + "' border=false model='" + model + "' field='" + column.expression + "' format='" + format + "'></app-datepicker>";
            if (column[FILTERABLE_COLUMN] && column[VISIBLE_EXPRESSION] === undefined && viewType == VIEW_TABLE) {
                column[VISIBLE_EXPRESSION] = "!this." + column.expression;
            }
        }

        if (column[FILTERABLE_COLUMN] && filters && appliedfilters && column.expression.indexOf(".") == -1) {
            column.filterTemplate = "<div style='width:235px;' class='app-filter-view-margin app-float-left'>" +
                "<div class='app-float-left app-blue-text-color app-font-weight-bold app-white-space-nowrap' style='font-size: 13px;height:20px;'>" + column.label + "</div>" +
                "<app-date-filter class='app-float-left' style='width: 235px;height: 30px;' model='view.metadata.filterparameters' field='" + field + "'></app-date-filter>" +
                "</div>";

            column.filterEditCellTemplate = "<app-date-filter style='width:150px;height:24px;' class='app-float-left' editable=true model='view.metadata.filterparameters' field='" + field + "'></app-date-filter>";

            var filter = angular.copy(column);
            filter.type = "date";
            filter.dateFilter = true;
            var expression = filter.expression;
            if ($dataModel.isFilterApplied(expression, $scope.view.metadata.filterparameters)) {
                appliedfilters.push(filter);
            }
            filters.push(filter);
        }
    } else if (type === UI_TYPE_AGGREGATE) {
        if (column[FILTERABLE_COLUMN] && filters && appliedfilters && column.expression.indexOf(".") == -1) {
            var filter = angular.copy(column);
            filter.type = "date";
            filter.dateFilter = true;
            var expression = filter.expression;
            if ($dataModel.isFilterApplied(expression, $scope.view.metadata.filterparameters)) {
                appliedfilters.push(filter);
            }
            filters.push(filter);
        }
    } else if (type == UI_TYPE_BOOLEAN) {
        if (viewType == "panel") {
            column.editableCellTemplate = "<app-checkbox  model='" + model + "' field='" + column.expression + "' ></app-checkbox>";
            column.noBorder = true;
        } else {
            column.editableCellTemplate = "<div class='app-text-align-center app-height-full'><app-checkbox model='" + model + "' field='" + column.expression + "' ></app-checkbox></div>";
        }

    } else if (type == UI_TYPE_FILE || type == UI_TYPE_IMAGE) {
        column.editableCellTemplate = "<app-file-upload multiple=" + column.multiple + " model='" + model + "' field='" + column.expression + "' class='app-float-left app-width-full app-height-full'></app-file-upload>";
        column.noBorder = true;
    } else if (type == UI_TYPE_SCHEDULE) {
        if (!filters && !appliedfilters) {
            column.editableCellTemplate = "<app-datepicker placeholder='" + placeholder + "' border=false model='" + model + "' field='" + column.expression + "' schedule=true></app-datepicker>"
            if (column[FILTERABLE_COLUMN] && column[VISIBLE_EXPRESSION] === undefined && viewType == VIEW_TABLE) {
                column[VISIBLE_EXPRESSION] = "!this." + column.expression;
            }
        }

        if (column[FILTERABLE_COLUMN] && filters && appliedfilters && column.expression.indexOf(".") == -1) {
            column.filterTemplate = "<div style='width:235px;' class='app-filter-view-margin app-float-left'>" +
                "<div class='app-float-left app-blue-text-color app-font-weight-bold app-white-space-nowrap' style='font-size: 13px;height:20px;'>" + column.label + "</div>" +
                "<app-date-filter class='app-float-left' style='width: 235px;height: 30px;' model='view.metadata.filterparameters' field='" + column.expression + ".duedate'></app-date-filter>" +
                "</div>";

            column.filterEditCellTemplate = "<app-date-filter style='width:150px;height:24px;' class='app-float-left' editable=true model='view.metadata.filterparameters' field='" + column.expression + ".duedate'></app-date-filter>";

            var filter = angular.copy(column);

            filter.type = UI_TYPE_SCHEDULE;
            filter.ui = UI_TYPE_SCHEDULE;
            filter.dateFilter = true;
            var expression = filter.expression + ".duedate";
            filter.expression = expression;
            if ($dataModel.isFilterApplied(column.expression, $scope.view.metadata.filterparameters)) {
                appliedfilters.push(filter);
            }
            filters.push(filter);

            // TODO resolve visible expression
        }
    } else if (type == UI_TYPE_TIME) {
        column.editableCellTemplate = "<app-time model='" + model + "' placeholder='" + placeholder + "' field='" + column.expression + "' border=false></app-time>";
    } else if (type == UI_TYPE_TEXT || type == UI_TYPE_AUTO_HEIGHT) {
        column.editableCellTemplate = "<app-text-area border=false model='" + model + "' field='" + column.expression + "'></app-text-area>";
    } else if (type == UI_TYPE_RICHTEXT) {
        column.editableCellTemplate = "<app-rich-text-area border=false model='" + model + "' field='" + column.expression + "'></app-rich-text-area>";
        column.noBorder = true;
    } else if (type == UI_TYPE_INDEX) {
        column.editableCellTemplate = "<app-text placeholder='" + placeholder + "' border=false model='" + model + "' field='" + column.expression + ".index' ></app-text>";
    } else if (type == UI_TYPE_NUMBER || type == UI_TYPE_DECIMAL) {

        if (!filters && !appliedfilters) {
            column.editableCellTemplate = "<app-number placeholder='" + placeholder + "' model='" + model + "' field='" + column.expression + "' border=false></app-number>";
            if (column[FILTERABLE_COLUMN] && column[VISIBLE_EXPRESSION] === undefined && viewType == VIEW_TABLE) {
                column[VISIBLE_EXPRESSION] = "!this." + column.expression;
            }
        }

        if (column[FILTERABLE_COLUMN] && filters && appliedfilters && column.expression.indexOf(".") == -1) {
            column.filterTemplate = "<div style='width:235px;' class='app-filter-view-margin app-float-left'>" +
                "<div class='app-float-left app-blue-text-color app-font-weight-bold app-white-space-nowrap' style='font-size: 13px;height:20px;'>" + column.label + "</div>" +
                "<app-lookup class='app-float-left' style='width: 70px;height:20px;' border=false showaslabel='true' model='view.metadata.filterparameters' field='" + column.expression + "_filteroperator' datasource='numberFilteroperator' dropdownclass='app-filter-operator'></app-lookup>" +
                "<app-number class='app-float-left' style='width: 235px;height: 30px;' placeholder=false model='view.metadata.filterparameters' field='" + field + "' ></app-number>" +
                "</div>";

            column.filterEditCellTemplate = "<app-lookup class='app-float-left' style='background: none repeat scroll 0 0 #FFFFFF;height: 21px;padding-top: 3px;' border=false showaslabel='true' model='view.metadata.filterparameters' field='" + column.expression + "_filteroperator' datasource='numberFilteroperator' dropdownclass='app-filter-operator'></app-lookup>" +
                "<app-number style='width: 50px;' class='app-float-left' border=false model='view.metadata.filterparameters' field='" + field + "' placeholder='" + column.label + "'></app-number>";


            var filter = angular.copy(column);
            filter.type = type;
            var expression = filter.expression;
            if ($dataModel.isFilterApplied(expression, $scope.view.metadata.filterparameters)) {
                appliedfilters.push(filter);
            }
            filters.push(filter);
        }
    } else {
        column.editableCellTemplate = "<app-text placeholder='" + placeholder + "' model='" + model + "' field='" + column.expression + "' border=false></app-text>";
    }
}
AppUtil.handleToolBarHeight = function () {
    setTimeout(function () {
        var height = $('#' + TOOL_BAR_ID).height();
        if (height > 31) { // 31 --> default height of tool bar
            height -= 31;
            var top = 121; // 121 -->  default top of container div
            $(VIEW_CONTAINER).css({top:(top + height) + "px"});
        } else {
            $(VIEW_CONTAINER).css({top:"121px"});
        }
    }, 15);
};


AppUtil.isDate = function (val) {
    if (!val) {
        return false;
    } else {
        if (/(\d{4})-(\d{2})-(\d{2})/.test(val)) {
            return true;
        } else {
            return false;
        }
    }
}
AppUtil.getDate = function (val, format) {
    try {
        if (!val) {
            return val;
        }
        if (!format) {
            format = "dd/mm/yyyy";
        }
        var dd = false;
        if (val instanceof Date) {
            dd = val;
        } else {
            dd = new Date(val);
        }
        return dd.getFormattedDate(format);
    } catch (e) {
        return "Invalid date";
    }
}
AppUtil.hideAlertPopup = function () {
    if (AppUtil.alertPopup) {
        AppUtil.alertPopup.hide();
        delete AppUtil.alertPopup;
    }
}
AppUtil.showShortMessage = function (msg, time) {
    if (!time) {
        time = 5000;
    }
    AppUtil.$rootScope.appData.shortMessage = {"msg":msg, "modal":false, className:'app-background-orange', "time":time};
    if (!AppUtil.$rootScope.$$phase) {
        AppUtil.$rootScope.$apply();
    }
}
AppUtil.handleError = function (error, title) {
    AppUtil.hideAlertPopup();
    if (!title) {
        title = "Attention Required!";
    }
    var message = false;
    var detail = false;
    if (!error) {
        return;
    }
    if (error instanceof Error) {
        message = error.message;
        detail = error.stack;
    } else {
        message = error;
    }
    var html = '<div>' +
        '<div style="padding:10px;margin-bottom: 5px;width:420px;" class="app-width-full app-float-left app-header-background-color app-text-align-center app-font-weight-bold ng-binding">' +
        '<div style="width:400px;">' + title + '</div>' +
        '<div onclick="AppUtil.hideAlertPopup()" class="app-pop-up-cross app-cross app-cursor-pointer"></div></div>' +
        '<div class="app-float-left app-padding-five-px" style="max-height:300px;overflow:auto;word-break: break-all;margin:0px 0px 10px 0px;">' +
        '<div class="app-font-weight-bold app-margin-bottom-five-px">' + message + '</div>';
    if (detail) {
        html += '<div>' + error.stack + '</div>';
    }
    html += '</div>' +
        '</div>';
    AppUtil.alertPopup = new Popup({
        autoHide:false,
        hideOnClick:false,
        escEnabled:true,
        html:html,
        position:"center",
        width:440
    });
    AppUtil.alertPopup.showPopup();
    if (error instanceof Error) {
        throw error;
    }

}
AppUtil.calc = function (first, second, op, type) {
    var numberExp = false;
    var typeExp = false;
    if (type == UI_TYPE_CURRENCY) {
        numberExp = "amount";
        typeExp = "type";
    } else if (type == "unit") {
        numberExp = "quantity";
        typeExp = "unit";
    }
    if (numberExp) {
        var resultType = first && first[typeExp] ? first[typeExp] : second && second[typeExp] ? second[typeExp] : undefined;
        if (resultType) {
            var firstVal = first ? (typeof first) == "object" ? first[numberExp] && first[typeExp] ? Number(first[numberExp]) : 0 : Number(first) : 0;
            var secondVal = second ? (typeof second) == "object" ? second[numberExp] && second[typeExp] ? Number(second[numberExp]) : 0 : Number(second) : 0;
            if (op == "add") {
                return {amount:firstVal + secondVal, type:resultType};
            } else if (op == "subtract") {
                return {amount:firstVal - secondVal, type:resultType};
            } else if (op == "multiply") {
                return {amount:firstVal * secondVal, type:resultType};
            } else if (op == "divide") {
                return {amount:firstVal / secondVal, type:resultType};
            }
        }
    }
};
AppUtil.getIndexFromArray = function (array, key, value) {
    if (!array || !angular.isArray(array) || array.length == 0) {
        return;
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return i;
        }
    }

};
AppUtil.pushIfNotExists = function (column, key, mainColumn, columnKey, remove) {
    var columns = [];
    if (key) {
        if (!mainColumn[key]) {
            mainColumn[key] = [];
        }
        columns = mainColumn[key];
    } else {
        columns = mainColumn;
    }

    var found = false;
    var index = undefined;
    for (var i = 0; i < columns.length; i++) {
        var cExp = false;
        var exp = false;
        if (column instanceof Object) {
            if (!columnKey) {
                columnKey = "expression";
            }
            cExp = columns[i][columnKey];
            exp = column[columnKey];
        } else {
            cExp = columns[i];
            exp = column;
        }
        if (cExp == exp) {
            index = i;
            break;
        }
    }
    if (remove) {
        if (index >= 0) {
            columns.splice(index, 1);
        }
    } else {
        if (index === undefined) {
            columns.push(column);
        }
    }
};
AppUtil.getDisplayExp = function (lookupOption) {
    var exp = lookupOption.expression;
    if (lookupOption.lookupdisplaycolumns && lookupOption.lookupdisplaycolumns.length > 0) {
        exp += "." + AppUtil.getDisplayExp(lookupOption.lookupdisplaycolumns[0]);

    }
    return exp;
};
AppUtil.tempComponents = {"view-component":0, "server-key":0, "lookup-ds":"0"};
AppUtil.getComponentId = function (type) {
    AppUtil.tempComponents[type] = AppUtil.tempComponents[type] + 1;
    return type + AppUtil.tempComponents[type];
};
AppUtil.isTrueOrUndefined = function (obj) {
    return (obj === undefined || obj === null || obj == true);
};
AppUtil.isEmpty = function (obj) {
    return (obj === undefined || obj === null || obj.toString().trim().length == 0 || obj.length == 0 );
};
AppUtil.getRecord = function (data, pKey, primaryColumn) {
    var dataCount = data ? data.length : 0;
    for (var i = 0; i < dataCount; i++) {
        var record = data[i];
        var recordKey = AppUtil.resolve(record, primaryColumn);
        var isEqual = angular.equals(recordKey, pKey);
        if (isEqual) {
            return record;
        }
    }
    return null;
};
AppUtil.rebindFieldExpression = function ($scope, model, field) {

    var dottIndex = field.lastIndexOf(".");
    if (dottIndex >= 0) {
        model = model + "." + field.substring(0, dottIndex);
        field = field.substring(dottIndex + 1);
    }
    $scope.modelexpression = model;
    $scope.fieldexpression = field;
};
AppUtil.removeDottedValue = function (model, expression) {
    if (!model) {
        return;
    }
    var firstDottedIndex = expression.lastIndexOf(".");
    if (firstDottedIndex >= 0) {
        var mainExp = expression.substring(0, firstDottedIndex);
        expression = expression.substring(firstDottedIndex + 1);
        model = AppUtil.resolve(model, mainExp);
    }
    if (!model) {
        return;
    }
    delete model[expression];
};
AppUtil.putDottedValue = function (model, expression, value) {
    if (!model) {
        AppUtil.handleError(new Error("Model does not exits for putting dotted value"), "AppUtil.putDottedValue")
    }
    var lastDottedIndex = expression.lastIndexOf(".");
    if (lastDottedIndex >= 0) {
        var firstExpression = expression.substring(0, lastDottedIndex);
        expression = expression.substring(lastDottedIndex + 1);
        model = AppUtil.resolve(model, firstExpression, true);
    }
    if (model && model instanceof Array) {
        for (var i = 0; i < model.length; i++) {
            model[i][expression] = value;
        }
    } else {
        model[expression] = value;
    }
};
AppUtil.resolve = function (model, expression, confirm, confirmType) {
    if (!model) {
        return;
    }
    while (expression !== undefined) {
        if (model[expression] !== undefined) {
            if (typeof model[expression] == "function") {
                return undefined;
            }
            if (confirm) {
                if (confirmType == "array" && angular.isArray(model[expression])) {
                    return model[expression];
                } else if (angular.isObject(model[expression])) {
                    return model[expression];
                } else {
//we will not return as it need to be confirmed and it is neither array nor object
                }
            } else {
                return model[expression];
            }
        }
        var fieldIndex = expression.toString().indexOf(".");
        var exp = false;
        if (fieldIndex >= 0) {
            exp = expression.substring(0, fieldIndex);
            expression = expression.substring(fieldIndex + 1);
        } else {
            exp = expression;
            expression = undefined;
        }
        var arrayFirstIndex = exp.toString().indexOf("[");
        var arrayEndIndex = exp.toString().indexOf("]");
        if (arrayFirstIndex >= 0 && arrayEndIndex >= 0) {
            var arrayIndex = Number(exp.substring(arrayFirstIndex + 1, arrayEndIndex));
            exp = exp.substring(0, arrayFirstIndex);
            if (expression) {
                expression = arrayIndex + "." + expression;
            } else {
                expression = arrayIndex;
            }
        }
        if (model[exp] == undefined && !confirm) {
            return model[exp];
        }
        if (model[exp] != undefined) {
            model = model[exp];
        } else {
            if (expression) {
                model[exp] = {};
            } else {
                if (confirmType == 'array') {
                    model[exp] = [];
                } else {
                    model[exp] = {};
                }
            }
            model = model[exp];
        }
    }
    return model;
};
AppUtil.getModel = function ($scope, modelExpression, confirm, confirmType) {
    return this.resolve($scope, modelExpression, confirm, confirmType);
};
AppUtil.getDataFromService = function (url, requestBody, callType, dataType, pBusyMessage, callback, errcallback) {

    var dataStartTime = new Date().getTime();
    requestBody.enablelogs = AppUtil.$rootScope.appData.enableLogs;
    requestBody.sessionlogid = AppUtil.$rootScope.appData.sessionlogid;

    requestBody.state = {};
    requestBody.state.timezone = new Date().getTimezoneOffset();


    if (pBusyMessage) {
        AppUtil.$rootScope.appData.shortMessage = {"msg":pBusyMessage, "modal":true, className:'app-background-orange'};
        if (!AppUtil.$rootScope.$$phase) {
            AppUtil.$rootScope.$apply();
        }
    }
    console.log("Sending request " + url + " sarttime " + new Date().getTime());
    $.ajax({
        type:callType,
        url:url,
        data:requestBody,
        crossDomain:true,
        success:function (returnData, status, xhr) {
//            console.log("Request recived " + url + " sarttime " + new Date().getTime());
//            console.log("Request server  time " + returnData.rstime + " endtime " + returnData.retime);

            var dataEndTime = new Date().getTime();
            setTimeout(function () {
                var renderingTime = new Date().getTime();
                if (pBusyMessage && AppUtil.$rootScope.appData.enableLogs) {
                    AppUtil.handleError("Server time>>>" + (dataEndTime - dataStartTime) + "<br>Rendering time>>>" + (renderingTime - dataEndTime), "Time");
                }
            }, 100)
            if (AppUtil.$rootScope && pBusyMessage) {
                AppUtil.$rootScope.appData.shortMessage = {"msg":undefined, "modal":true};
                if (!AppUtil.$rootScope.$$phase) {
                    AppUtil.$rootScope.$apply();
                }
            }
            var responseData = returnData.response !== undefined ? returnData.response : returnData;
            var warnings = returnData.warnings ? returnData.warnings : undefined;
            callback(responseData, warnings);
        },
        error:function (jqXHR, exception) {
            if (AppUtil.$rootScope && pBusyMessage) {
                AppUtil.$rootScope.appData.shortMessage = {"msg":undefined, "modal":true};
                if (!AppUtil.$rootScope.$$phase) {
                    AppUtil.$rootScope.$apply();
                }
            }
            var stack = jqXHR.responseText || "Please check internet connection.";
            try {
                var jsonError = JSON.parse(jqXHR.responseText);
                stack = jsonError.stack;

                if (stack) {
                    stack = stack.split("at eval");
                    if (stack.length > 0) {
                        stack = stack[0];
                    }
                }
            } catch (e) {
            }

            if (errcallback) {
                errcallback(new Error(stack));
            } else {
                AppUtil.handleError(new Error(stack), "Error while calling service>>" + url);
            }
        },
        timeout:1200000,
        dataType:dataType,
        async:true
    });
};
/*************************************User Data Source*******************************************/
appStrapDirectives.factory('$userDataSource', ['$http', '$timeout', '$cacheDataModel', function ($http, $timeout, $cacheDataModel) {
    var $userDataSource = {};
    $userDataSource.init = function () {
    };
    $userDataSource.getAppData = function (state, callBack, errorCallBack) {
        state.keepstructure = true;
        if (false) {
            var usr = {};
            callBack(usr.response);
            return;
        }
        AppUtil.$rootScope.appData.sessionlogid = new Date().getTime().toString();
        AppUtil.getDataFromService(BAAS_SERVER + "/custom/module", {ask:"appsstudio", "module":"lib/UserService", "method":"getUserState", parameters:JSON.stringify({"state":state})}, "POST", "JSON", "Loading...", callBack, errorCallBack);
    };
    $userDataSource.logOut = function (callBack) {
        var url = BAAS_SERVER + "/logout";
        $cacheDataModel.clear();
        AppUtil.getDataFromService(url, {}, "POST", "JSON", "Sign out...", callBack);
    };
    return $userDataSource;
}
]);
/************************************* End of User Data Source*******************************************/
/*************************************User Data Model*******************************************/
appStrapDirectives.factory('$userModel', ['$http', '$timeout', '$parse', '$cacheDataModel', function ($http, $timeout, $parse, $cacheDataModel) {
    var $userModel = {};
    $userModel.getCookie = function (c_name) {
        var c_value = document.cookie;
        var c_start = c_value.indexOf(" " + c_name + "=");
        if (c_start == -1) {
            c_start = c_value.indexOf(c_name + "=");
        }
        if (c_start == -1) {
            c_value = null;
        }
        else {
            c_start = c_value.indexOf("=", c_start) + 1;
            var c_end = c_value.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = c_value.length;
            }
            c_value = unescape(c_value.substring(c_start, c_end));
        }
        return c_value;
    }
    $userModel.init = function ($scope, $dataSource) {
        this.$scope = $scope;
        this.$dataSource = $dataSource;
        $dataSource.init();
        var appData = $scope.appData;
        appData.applications = {label:"", "display":["label"], options:[]};
        appData.organizations = {label:"", "display":["label"], options:[]};
        appData.userActions = {label:"", "display":["label"], options:[]};

        var usk = $userModel.getCookie("usk");
        if (!usk) {
            $scope.appData.userLogin = false;
            return;
        }
        appData.usk = usk;
        var that = this;
        /*apply on change listener on child view group selectedIndex*/
        $scope.$watch("appData.childApplicationIndex", function (newValue, oldValue) {
            if (newValue != undefined && newValue >= 0) {
                var state = {organization:that.$scope.appData.organizations.options[that.$scope.appData.organizations.selectedIndex]._id, application:that.$scope.appData.childApplications[newValue]._id};
                delete that.$scope.appData.currentMenuIndex;
                that.getAppData(state);
            }
        });
        /*pply on change listener on view group selectedIndex*/
        $scope.$watch("appData.applications.selectedIndex", function (newValue, oldValue) {
            if (oldValue !== undefined && newValue != undefined && newValue >= 0) {
                if (angular.equals($scope.appData.applications.selectedapplicationid, $scope.appData.applications.options[newValue]._id)) {
                    console.log("Returning as same application");
                    return;
                }
                var state = {organization:that.$scope.appData.organizations.options[$scope.appData.organizations.selectedIndex]._id, application:$scope.appData.applications.options[newValue]._id};
                that.getAppData(state);
            }
        });
        /*apply on change listener on organization selectedIndex*/
        $scope.$watch("appData.organizations.selectedIndex", function (newValue, oldValue) {
            if (newValue != oldValue && oldValue !== undefined && newValue !== undefined) {
                /*we have to remove selectedIndex otherwise $scope will take it as value change in application*/
                $cacheDataModel.clear();
                delete that.$scope.appData.applications.selectedIndex;
                //clear client cache

                var state = {"organization":that.$scope.appData.organizations.options[newValue]._id};
                that.getAppData(state);
            }
        });
        $scope.onMenuSetting = function () {
            var applicationid = $scope.appData.applications.options[$scope.appData.applications.selectedIndex]._id;
            var parameters = {applications__baas__id:applicationid};
            that.$scope.appData.currentView = {"viewid":"uimenus__appsstudio", "ask":"appsstudio", "osk":$scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk, filter:{"applicationid":$scope.appData.applications.options[$scope.appData.applications.selectedIndex], type:"Menu"}, parameters:parameters};

        };
        this.getAppData();
    };
    $userModel.populateMenus = function (menus, levelIndexObject, levelIndex, selectedId) {
        if (menus && menus.length > 0) {
            for (var i = 0; i < menus.length; i++) {
                var menu = menus[i];
                if (menu.label || menu.applicationid) {
                    /*it is a valid menu*/
                } else if (menu.menus) {
                    /*check if it is obect*/
                    if (menu.menus.label || menu.menus.applicationid) {
                        menu = menu.menus;
                    }
                }
                menu.$index = {};
                Object.keys(levelIndexObject).forEach(function (k) {
                    menu.$index[k] = levelIndexObject[k];
                });
                menu.$index[levelIndex.toString()] = i;
                if (menu._id == selectedId) {
                    this.$scope.appData.selectedMenuPath = menu.$index;
                }

                this.populateMenus(menu.menus, menu.$index, levelIndex + 1, selectedId);
            }
        }
    };

    $userModel.getAppData = function (state) {

        var that = this;
        state = state || {};
        that.$dataSource.getAppData(state, function (user) {

            try {
                that.$scope.appData.userLogin = true;
                that.$scope.appData.username = user.username;
                that.$scope.appData.userid = user.userid;
                that.$scope.appData.emailid = user.emailid;
                var organizations = user.organizations || [];
                that.$scope.appData.organizations.options = organizations;
                if (organizations.length > 0) {
                    for (var i = 0; i < organizations.length; i++) {
                        if (organizations[i]._id == user.selectedorganizationid) {
                            user.organizationindex = i;
                            break;
                        }
                    }
                    that.$scope.appData.organizations.selectedIndex = user.organizationindex;
                    that.$scope.appData.organizations.label = organizations[user.organizationindex].label;
                } else {
                    that.$scope.appData.organizations.label = "Organizations";
                }
                var userActions = user.userActions || [
                    {"label":"Change Password", "template":"<app-change-password></app-change-password>"},
                    {"label":"Enable Logs", visibleexpression:"!appData.enableLogs", enableLogs:true},
                    {"label":"Disable Logs", visibleexpression:"appData.enableLogs", enableLogs:true},
                    {"label":"Show Logs", visibleexpression:"appData.enableLogs", showLogs:true}

                ];
                that.$scope.appData.userActions.options = userActions;
                var applications = user.applications || [];
                for (var i = 0; i < applications.length; i++) {
                    if (applications[i].childapplications) {
                        var applicationMap = {};
                        for (var j = 0; j < applications[i].childapplications.length; j++) {
                            if (applications[i].childapplications[j].childapplications) {
                                var lastApp = false;
                                for (var k = 0; k < applications[i].childapplications[j].childapplications.length; k++) {
                                    var childApp = applications[i].childapplications[j].childapplications[k];
                                    applicationMap[childApp._id] = applicationMap[childApp._id] || childApp;
                                    if (!lastApp) {
                                        lastApp = applicationMap[childApp._id];
                                    } else {
                                        if (lastApp.level >= applicationMap[childApp._id].level) {
                                            AppUtil.pushIfNotExists(lastApp, "childs", applications[i], "_id")
                                        } else {
                                            AppUtil.pushIfNotExists(lastApp, "childs", applicationMap[childApp._id], "_id");
                                        }
                                    }
                                    lastApp = applicationMap[childApp._id]
                                }
                                if (lastApp) {
                                    AppUtil.pushIfNotExists(lastApp, "childs", applications[i], "_id")
                                }
                            }

                        }
                    }
                }
                if (applications) {
                    for (var i = 0; i < applications.length; i++) {
                        if (user.selectedapplicationid == applications[i]._id) {
                            user.applicationindex = i;
                        }
                        if (applications[i]._level === undefined) {
                            applications[i]._level = 0;
                        }
                        if (applications[i].childs && applications[i].childs.length > 0) {
                            applications[i]._mode = 1;
                            for (var j = 0; j < applications[i].childs.length; j++) {
                                applications[i].childs[j]._level = applications[i]._level + 1;
                                applications.splice(i + j + 1, 0, applications[i].childs[j]);
                            }
                        } else {
                            applications[i]._mode = -1;
                        }
                        delete applications[i].childs;
                        delete applications[i].childapplications;
                        delete applications[i].level;

                    }
                }

                that.$scope.appData.applications.options = applications;
                that.$scope.appData.applications.selectedapplicationid = user.selectedapplicationid;
                that.$scope.appData.childApplications = [];
                that.$scope.appData.childApplicationIndex = undefined;
                var developer = true;
                if (applications && applications.length > 0) {
                    that.$scope.appData.applications.selectedIndex = user.applicationindex;
                    that.$scope.appData.applications.label = applications[user.applicationindex].label;

                    /*check child view group*/
                    var selectedApplicationLevel = applications[user.applicationindex]._level;
                    var selectedApplicationMode = applications[user.applicationindex]._mode;
                    if (selectedApplicationMode >= 0) {
                        for (var i = user.applicationindex + 1; i < applications.length; i++) {
                            var obj = applications[i];
                            if (obj._level <= selectedApplicationLevel) {
                                break;
                            } else if (obj._level == selectedApplicationLevel + 1) {
                                that.$scope.appData.childApplications.push(obj);
                            }
                        }
                    }
                } else {
                    that.$scope.appData.applications.label = "Applications";
                    developer = false;
                }


                that.$scope.appData.organizationAdmin = user.organizationadmin;
                if (user.view) {
                    that.$scope.appData.currentView = user.view;
                } else {
                    that.$scope.appData.currentView = "clear";
                }
                if (user.exception) {
                    AppUtil.handleError(user.exception);
                }
                that.$scope.appData.applicationDeveloper = user.developer;
                that.$scope.appData.developer = user.developer;

                if (user.menus && user.menus.length > 0) {
                    for (var i = 0; i < user.menus.length; i++) {
                        var menu = user.menus[i];
                        if (menu._id == user.selectedmenuid) {
                            user.menuindex = i;
                        }
                        if (menu.parentmenuid) {
                            var parentMenuId = menu.parentmenuid._id.toString();
                            for (var j = 0; j < user.menus.length; j++) {
                                if (user.menus[j]._id.toString() == parentMenuId) {
                                    if (!user.menus[j].menus) {
                                        user.menus[j].menus = [];
                                    }
                                    delete menu.parentmenuid;
                                    user.menus[j].menus.push(menu);
                                    user.menus.splice(i, 1);
                                    i = i - 1;
                                    break;
                                }
                            }
                        }
                    }
                    var newMenus = [];
                    for (var i = 0; i < user.menus.length; i++) {
                        var menu = user.menus[i];

                        var visibleExpression = menu[VISIBLE_EXPRESSION];
                        if (visibleExpression !== undefined && visibleExpression.toString().length > 0) {
                            visibleExpression = visibleExpression.replace(/this./g, "appData.");
                            var getter = $parse(visibleExpression);
                            var context = {appData:that.$scope.appData};
                            if ((getter(context) == false || getter(context) == "false") && getter(context) !== undefined) {
                                continue;
                            } else {
                                newMenus.push(menu);
                            }
                        } else {
                            newMenus.push(menu);
                        }
                    }
                    that.populateMenus(newMenus, {}, 0, user.selectedmenuid);
                    that.$scope.appData.menus = newMenus;
                } else {
                    that.$scope.appData.menus = [];
                }
                $timeout(function () {
                    if (that.$scope.appData.menus && that.$scope.appData.menus.length > 0) {
                        var othermenus = [];
                        for (var i = 0; i < that.$scope.appData.menus.length; i++) {
                            var offset = $('#menu_' + i).offset();
                            if (offset.left >= ($(window).width() - 300)) {
                                othermenus.push(that.$scope.appData.menus[i]);
                                that.$scope.appData.menus.splice(i, 1);
                                i -= 1;
                            }
                        }
                        if (othermenus.length > 0) {
                            that.$scope.appData.menus.push({"label":"Others", "menus":othermenus});
                            $userModel.populateMenus(that.$scope.appData.menus, {}, 0, user.selectedmenuid);
                        }
                    }
                }, 0);
                if (!that.$scope.$$phase) {
                    that.$scope.$apply();
                }
            } catch (e) {
                AppUtil.handleError(e, "$userModel.getAppData");
            }
        }, function (error) {
            if (error.code == 1 || error.code == 34) {
                that.$scope.appData.userLogin = false;
                if (!that.$scope.$$phase) {
                    that.$scope.$apply();
                }
            } else {
                AppUtil.handleError(error.stack, "Error in getAppData");
            }
        })
    };
    return $userModel;
}
]);
/*********************************Meta data model********************/
appStrapDirectives.factory('$metaDataSource', ['$http', '$timeout', function ($http, $timeout) {
    var $metaDataSource = {};
    $metaDataSource.init = function () {
    };
    $metaDataSource.getView = function (pView, options, callBack) {
        var url = BAAS_SERVER + "/custom/module";
        var viewParameters = {};
        viewParameters.ask = pView.ask;
        viewParameters.osk = pView.osk;
        viewParameters.viewid = pView.viewid;

        if (options) {
            Object.keys(options).forEach(function (k) {
                viewParameters[k] = options[k];
            });
        }
        if (pView.application) {
            viewParameters.application = pView.application;
        }
        if (pView.source) {
            viewParameters.source = pView.source;
        }
        if (pView.menuid) {
            viewParameters.menuid = pView.menuid;
        }
        if (pView.parameters) {
            viewParameters.parameters = pView.parameters;
        }
        if (pView.parametermappings) {
            viewParameters.parametermappings = pView.parametermappings;
        }
        if (pView.filter) {
            viewParameters.filter = pView.filter;
        }

        if (pView.max_rows !== undefined) {
            viewParameters.max_rows = pView.max_rows;
        }

        var data = {};
        data.ask = "appsstudio";
        data.module = "lib/UiViewService";
        data.method = "getView";
        data.parameters = JSON.stringify(viewParameters);
        AppUtil.getDataFromService(url, data, "POST", "JSON", "Loading...", function (responseView) {
            if (responseView.dataexception) {
                AppUtil.handleError(responseView.dataexception, "Error in $metaDataSource.getView");
            }
            callBack(responseView);
        });
    };
    return $metaDataSource;
}
]);
appStrapDirectives.factory('$metaDataModel', ['$http', '$timeout', '$viewStack', function ($http, $timeout, $viewStack) {
    var $metaDataModel = {};
    $metaDataModel.init = function ($scope, $metaDataSource) {
        this.$scope = $scope;
        this.$metaDataSource = $metaDataSource;
        $metaDataSource.init();
        var appData = $scope.appData;
        var that = this;
        $scope.$watch("appData.currentView", function (newValue, oldValue) {
            if (newValue === "clear") {
                $viewStack.closeAllViews();
            } else if (newValue) {
                if (newValue.metadata) {
                    $viewStack.addView(angular.copy(newValue), $scope.$new());
                } else {
                    that.$metaDataSource.getView(newValue, {organizationadmin:$scope.appData.organizationAdmin, developer:$scope.appData.applicationDeveloper}, function (view) {
                        view.metadata.$parent = newValue.$parent;
                        if (newValue.breadCrumbInfo !== undefined) {
                            view.metadata.breadCrumbInfo = newValue.breadCrumbInfo;
                        }

                        if (newValue.quickviews !== undefined) {
                            view.metadata.quickviews = newValue.quickviews;
                        }
                        if (newValue.toolBarTitle !== undefined) {
                            view.metadata.toolBarTitle = newValue.toolBarTitle;
                        }
                        if (newValue.popUpTitle !== undefined) {
                            view.metadata.popUpTitle = newValue.popUpTitle;
                        }
                        if (newValue.insert !== undefined) {
                            view.metadata.insert = newValue.insert;
                        }
                        if (newValue.delete !== undefined) {
                            view.metadata.delete = newValue.delete;
                        }
                        if (newValue.warning !== undefined) {
                            view.metadata.warning = newValue.warning;
                        }
                        if (newValue.refresh !== undefined) {
                            view.metadata.refresh = newValue.refresh;
                        }
                        if (newValue.navigation !== undefined) {
                            view.metadata.navigation = newValue.navigation;
                        }
                        if (newValue.enablequickviewaction !== undefined) {
                            view.metadata.enablequickviewaction = newValue.enablequickviewaction;
                        }
                        if (newValue.enablemetadataaction !== undefined) {
                            view.metadata.enablemetadataaction = newValue.enablemetadataaction;
                        }
                        if (newValue.closeonsave !== undefined) {
                            view.metadata.closeonsave = newValue.closeonsave;
                        }
                        if (newValue.resize !== undefined) {
                            view.metadata.resize = newValue.resize;
                        }
                        if (newValue.aftersavecallback) {
                            view.metadata.aftersavecallback = newValue.aftersavecallback;
                        }
                        if (newValue.refreshOnSave !== undefined) {
                            view.metadata.refreshOnSave = newValue.refreshOnSave;
                        }
                        if (newValue.type == 'panel') {
                            view.metadata.type = newValue.type;
                        }
                        view[SHOW_AS] = newValue[SHOW_AS];
                        if (newValue[COMPONENT_ID]) {
                            view[COMPONENT_ID] = newValue[COMPONENT_ID];
                        }
                        view[PARENT_COMPONENT_ID] = newValue[PARENT_COMPONENT_ID];
                        $viewStack.addView(view, $scope.$new());
                    });
                }
                $scope.appData.currentView = false;
            }
        }, true);
    };
    return $metaDataModel;
}
]);
/*********************************End of Meta data model********************/
/*********************************Cache data model********************/
appStrapDirectives.factory('$cacheDataModel', ['$http', '$timeout', function ($http, $timeout) {
    var $cacheDataModel = {};
    $cacheDataModel.clear = function () {
        /*clear cache*/
        localStorage.clear();
    };
    $cacheDataModel.getCache = function (table, findQuery, column) {
        if (localStorage && localStorage[table]) {
            var data = JSON.parse(localStorage[table]);
            var newData = [];
            if (!findQuery || findQuery == "") {
                newData = data;
            } else {
                findQuery = findQuery.toString().toLowerCase();
                for (var i = 0; i < data.length; i++) {
                    var item = AppUtil.resolve(data[i], column);
                    if (item && item.toString().toLowerCase().indexOf(findQuery) == 0) {
                        newData.push(data[i]);
                    }
                }
            }
            return newData;
        } else {
            return false;
        }

    };
    $cacheDataModel.getData = function (query, cache, ask, osk, callback, errorCallback) {
        if (typeof(Storage) === "undefined") {
            cache = false;
        }
        var table = query.table;
        if (cache && callback) {
            var newData = $cacheDataModel.getCache(table, cache.query, cache.column);
            if (newData && newData.length > 0) {
                callback({data:newData});
            }
        }
        var urlParams = {ask:ask, osk:osk};
        urlParams.query = JSON.stringify(query);
        AppUtil.getDataFromService(BAAS_SERVER + "/data", urlParams, "POST", "JSON", false, function (data) {
            var newData = data.data;
            var dataCount = newData.length;
            var limit = query.max_rows;
            var callBackRequried = true;
            var fetchAgain = false;
            if (cache) {
                var cacheData = $cacheDataModel.getCache(table, cache.query, cache.column);
                var cacheCount = cacheData ? cacheData.length : 0;
                if (cacheCount > 0 && cacheCount == dataCount && angular.equals(cacheData, newData)) {
                    /*do nothing as cache copy and new copy are same*/
                    callBackRequried = false;
                    callback = undefined;
                    errorCallback = undefined;
                    return;
                }

                if (cache.query == "") {
                    /*data is different, we need to remove cache*/
                    delete localStorage[table];
                    /*cache if data is for blank key*/
                    if (dataCount > 0 && dataCount < limit) {
                        localStorage[table] = JSON.stringify(newData);
                    }
                } else {
                    //fetch data again for cache
                    fetchAgain = true;
                }
            }
            if (callback && callBackRequried) {
                callback(data);
            }
            if (fetchAgain) {
                callback = undefined;
                errorCallback = undefined;
                cache.query = "";
                delete query.filter;
                $cacheDataModel.getData(query, cache, ask, osk);
            }

        }, function (error) {
            if (errorCallback) {
                errorCallback(error);
            } else {
                AppUtil.handleError(error, "$cacheDataModel.getData");
            }
        });
    };
    return $cacheDataModel;
}
]);

appStrapDirectives.directive('ngModelRemove', function () {
    return {
        restrict:'A',
        require:'ngModel',
        link:function (scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;
            elm.unbind('input').unbind('change');
        }
    };
});
appStrapDirectives.directive('appActionCollection', ["$compile", "$viewStack", function ($compile, $viewStack) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='app-cursor-pointer'>" + "<span ng-click='onActionCollectionClick()' class=\"app-action-collection\" ng-bind='action.label'></span>" + "<span class='app-action-collection-down-arrow-parent app-action-collection-down-arrow-image'>" + "<img ng-click='onActionCollectionClick($event)' class='app-action-collection-down-arrow-image' src='images/down_arrow_new.png'/></span>" + "<span ng-show='action.showsettingimage' class='app-action-collection-setting-parent'>" + "<img class='app-setting' ng-src='{{action.settingimage}}' ng-click='onSettingClick()'/></span>" + "</div>",
        compile:function () {
            return {
                pre:function ($scope, iElement) {
                    $scope.onActionCollectionClick = function () {
                        var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' style='overflow-y: scroll;'>" + "<app-action-collection-option ng-repeat=\"option in action.options\" ng-init=\"level=1\" >" + "</app-action-collection-option></div>";
                        var popupScope = $scope.$new();
                        var p = new Popup({
                            autoHide:true,
                            deffered:true,
                            escEnabled:true,
                            hideOnClick:true,
                            html:$compile(optionsHtml)(popupScope),
                            scope:popupScope,
                            element:iElement
                        });
                        p.showPopup();
                    };
                    $scope.onSettingClick = function () {
                        $viewStack.addView($scope.action.settingview, $scope);
                    };
                    $scope.getOptionLabel = function (option) {
                        var lbl = "";
                        if (angular.isObject(option)) {
                            var display = $scope.action.display;
                            lbl = option[display[0]];
                            if (angular.isObject(lbl)) {
                                lbl = lbl[display[1]];
                            }
                        } else {
                            lbl = option;
                        }
                        return lbl;
                    };
                }
            }
        }
    }
}]);
appStrapDirectives.directive('appActionCollectionOption', ["$compile", "$viewStack", function ($compile, $viewStack) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return {
                pre:function ($scope, iElement) {

                    var template = "<div class='app-action-collection-option app-cursor-pointer app-light-gray-backgroud-color app-padding-five-px' ng-class='{\"app-font-weight-bold\":option._mode>=0}' ng-style='{\"padding-left\":5+10*option._level+\"px\"}' ng-bind='getOptionLabel(option)' ng-click='onActionCollectionOptionClick()' g-init='' ";
//                    TODO  handle visibleexpression
                    if ($scope.option.visibleexpression) {
                        template += " ng-show='{{option.visibleexpression}}'";
                    }
                    template += ">" + "</div>";
                    iElement.append(($compile)(template)($scope));


                    $scope.onActionCollectionOptionClick = function () {
                        $scope.action.selectedIndex = ($scope.$index);

                        if ($scope.option.enableLogs) {
                            $scope.appData.enableLogs = !$scope.appData.enableLogs;
                        }

                        if ($scope.option.showLogs) {
                            $scope.appData.currentView = {"viewid":"loginfos__baas", "ask":"baas", "osk":$scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk, filter:{sessionlogid:AppUtil.$rootScope.appData.sessionlogid, usk:$scope.appData.usk}};
                        }

                        if ($scope.option.template) {
                            $(iElement).append(($compile)($scope.option.template)($scope));
                        }
                    }
                }
            }
        }
    }
}]);
appStrapDirectives.directive('appView', ["$compile", "$dataModel", "$viewStack", "$appService", "$timeout", function ($compile, $dataModel, $viewStack, $appService, $timeout) {
    'use strict';
    return {
        restrict:"E",
        scope:true,
        replace:true,
        template:"<div class='app-view'></div>",
        compile:function () {
            return {
                pre:function ($scope, iElement, attrs) {

                    $scope.getColumnValue = function (row, col, asHTML) {
                        var val = "";
                        if (asHTML) {
                            val = "&nbsp;";
                        } else {
                            val = "";
                        }
                        var exp = col.expression;
                        var colValue = AppUtil.resolve(row, exp, false)
                        if (row && exp && colValue !== undefined && colValue !== null) {
                            var type;
                            if (col[SHOW_ON_TABLE]) {
                                type = col[UI];
                            } else if (col[SHOW_ON_PANEL] || col[FILTERABLE_COLUMN]) {
                                type = col[UI_PANEL] || col[UI];
                            }


                            var multiple = col.multiple;
                            if (type == UI_TYPE_LOOK_UP) {
                                if (multiple) {
                                    val = colValue;
                                    var expression = exp;
                                    if (col.lookupdisplaycolumns && col.lookupdisplaycolumns.length > 0) {
                                        expression = AppUtil.getDisplayExp(col.lookupdisplaycolumns[0]);
                                    }
                                    if (angular.isArray(val)) {
                                        if (val && val.length > 0) {
                                            var valTemp = '';
                                            var lastIndex = val.length - 1;
                                            for (var i = 0; i < val.length; i++) {
                                                if (val[i] instanceof Object) {
                                                    valTemp += AppUtil.resolve(val[i], expression);
                                                } else {
                                                    valTemp += val[i]
                                                }
                                                if (i != lastIndex) {
                                                    valTemp += '; ';
                                                }
                                            }
                                            val = valTemp;
                                        } else {
                                            val = '&nbsp;';
                                        }
                                    } else if (angular.isObject(val) && val[expression]) {
                                        val = val[expression];
                                    }
                                } else {
                                    val = colValue;
                                    if (angular.isObject(val)) {
                                        var lookupDisplay = AppUtil.getDisplayExp(col.lookupdisplaycolumns[0]);
                                        val = AppUtil.resolve(val, lookupDisplay);
                                    }
                                }
                            } else if (col.multiple && type !== UI_TYPE_IMAGE && type !== UI_TYPE_FILE) {
                                val = colValue;
                                if (angular.isArray(val)) {
                                    if (val && val.length > 0) {
                                        var valTemp = '';
                                        var lastIndex = val.length - 1;
                                        for (var i = 0; i < val.length; i++) {
                                            valTemp += val[i];
                                            if (i != lastIndex) {
                                                valTemp += ' ; ';
                                            }
                                        }
                                        val = valTemp;
                                    } else {
                                        val = '&nbsp;';
                                    }
                                }
                            } else if (type == UI_TYPE_FILE || type == UI_TYPE_IMAGE) {
                                if (colValue.length > 0) {
                                    var secretKey = "ask=" + $scope.view.ask;
                                    if ($scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk) {
                                        secretKey += "&osk=" + $scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk;
                                    }
                                    if (col.multiple) {
                                        for (var i = 0; i < colValue.length; i++) {
                                            var url = BAAS_SERVER + '/file/download?filekey=' + colValue[i][FILE_KEY] + '&' + secretKey;
                                            val += "<a target='_blank' tabindex='-1' href='" + url + "'>" + colValue[i][FILE_NAME] + "</a>&nbsp;&nbsp;";
                                        }
                                    } else {
                                        var url = BAAS_SERVER + '/file/download?filekey=' + colValue[0][FILE_KEY] + '&' + secretKey;
                                        val = "<a target='_blank' tabindex='-1' href='" + url + "'>" + colValue[0][FILE_NAME] + "</a>";
                                    }
                                }
                            } else if (type == UI_TYPE_DATE) {
                                var format = "dd/mm/yyyy";
                                if (col.time && col.time == "On") {
                                    format = "dd/mm/yyyy hh:mm:ss";
                                }
                                val = colValue;
                                if (typeof val == "object" && col.dateFilter) {
                                    val = val.label;
                                } else {
                                    val = AppUtil.getDate(val, format);
                                }
                            } else if (type == UI_TYPE_TIME || type == UI_TYPE_STRING || type == UI_TYPE_TEXT || type == UI_TYPE_BOOLEAN || type == UI_TYPE_NUMBER || type == UI_TYPE_DECIMAL) {
                                val = colValue;
                                if (multiple && val instanceof Array) {
                                    val = JSON.stringify(val);
                                }
                            } else if (type == 'object') {
                                val = colValue;
                                if (val instanceof Object) {
                                    val = JSON.stringify(val);
                                }
                            } else if (type == 'duration') {
                                if (colValue.time !== undefined || colValue.timeunit !== undefined) {
                                    val = "";
                                    if (colValue.time !== undefined) {
                                        val = colValue.time;
                                    }
                                    if (colValue.timeunit !== undefined) {
                                        val += " " + colValue.timeunit;
                                    }
                                }
                            } else if (type == UI_TYPE_CURRENCY) {
                                if (colValue.amount !== undefined || colValue.type !== undefined) {
                                    val = "";
                                    if (colValue.amount !== undefined && colValue.amount !== null) {
                                        val = colValue.amount;
                                        if (col.decimalplace && col.decimalplace.toString().length > 0) {
                                            val = Number(val).toFixed(col.decimalplace);
                                        }
                                    }
                                    if (val != "" && colValue.type && colValue.type.currency) {
                                        val += " " + colValue.type.currency;
                                    }
                                }
                            } else if (type == UNIT_TYPE) {
                                if (colValue.quantity !== undefined || colValue.unit !== undefined) {
                                    val = "";
                                    if (colValue.quantity !== undefined) {
                                        val = colValue.quantity;
                                    }
                                    if (colValue.unit && colValue.unit.unit) {
                                        val += " " + colValue.unit.unit;
                                    }
                                }
                            } else if (type == UI_TYPE_SCHEDULE) {
                                if (col.dateFilter) {
                                    val = colValue.label;
                                } else if (colValue.duedate) {
                                    val = AppUtil.getDate(colValue.duedate, "dd/mm/yyyy");
                                    if (val && colValue.time) {
                                        val += " " + colValue.time;
                                    }
                                }

                            } else if (type == UI_TYPE_AUTO_INCREMENT) {

                                if (row._insert) {
                                    var autoIncSeries = AppUtil.resolve(row, col.expression);
                                    if (autoIncSeries) {
                                        val = autoIncSeries.series;
                                    }
                                    if (val && val.series) {
                                        val = val.series;
                                    }
                                } else {
                                    val = AppUtil.resolve(row, col.expression);
                                }
                            }
                            else if (type == UI_TYPE_RANGE) {
                                val = "";
                                if (colValue.from) {
                                    val += AppUtil.getDate(colValue.from, "dd/mm/yyyy");
                                }
                                if (colValue.to !== undefined) {
                                    val += " - " + AppUtil.getDate(colValue.to, "dd/mm/yyyy");
                                }
                            } else if (type == UI_TYPE_COMPOSITE_LOOK_UP) {
                                val = "";
                                if (colValue.type) {
                                    val += colValue.type;
                                }
                                if (colValue.value && colValue.value.__value !== undefined) {
                                    val += " - " + colValue.value.__value;
                                }
                            } else if (type == UI_TYPE_JSON) {
                                val = colValue;
                            } else {
                                val = colValue
                            }
                        }
                        if (asHTML && (val == undefined || val == null || val == "")) {
                            val = "&nbsp;";
                        }
                        return val;
                    }
                    var componentId = attrs.componentid;
                    $scope.componentid = componentId;
                    $scope.view = $dataModel.getView(componentId);
                    if ($scope.view.metadata.actions && $scope.view.metadata.actions.length > 0) {
                        $scope.view.metadata.userHeaderActions = [];
                        $scope.view.metadata.userRowActions = [];
                        $scope.view.metadata.userFilters = [];
                        for (var i = 0; i < $scope.view.metadata.actions.length; i++) {
                            var action = angular.copy($scope.view.metadata.actions[i]);
                            if (action.type == "Filter" && action.filterType) {
                                action.type = action.filterType;
                                if (action.displaycolumns) {
                                    action.userFilter = true;
                                    action.lookupdisplaycolumns = [
                                        {expression:action.displaycolumns}
                                    ];
                                }
                                if (action.filterType == "date") {
                                    action.dateFilter = true;
                                }
                                $scope.view.metadata.userFilters.push(action);
                            }
                            if (action.onHeader) {
                                $scope.view.metadata.userHeaderActions.push(action);
                            }
                            if (action.onRow) {
                                $scope.view.metadata.userRowActions.push(action);
                            }
                        }
                    }
                    $scope.invokeMethod = function (index, currentRow, headerAction) {
                        var action = headerAction ? $scope.view.metadata.userHeaderActions[index] : $scope.view.metadata.userRowActions[index];
                        var actionInvokeType = action.invokeType;
                        var param = {};
                        var parameters = {selectedids:[]};
                        param.ask = action.ask || $scope.view.ask;
                        parameters.ask = $scope.view.ask;
                        if ($scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk) {
                            param.osk = $scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk;
                            parameters.osk = param.osk;
                        }
                        if (!actionInvokeType) {
                            AppUtil.handleError("Please define invoke type..", "Alert");
                            return;
                        }
                        var url = "";
                        if (actionInvokeType == 'url') {
                            if (!action.url) {
                                AppUtil.handleError("Please define url..", "Alert");
                                return;
                            }
                            url = action.url;
                        } else if (actionInvokeType == 'method') {
                            if (!action.method || !action.module) {
                                AppUtil.handleError("Module/Method is not defined..", "Alert");
                                return;
                            }
                            param.method = action.method;
                            param.module = action.module;
                            url = '/rest/custom/module'
                        } else if (actionInvokeType == 'job') {
                            if (!action.jobname) {
                                AppUtil.handleError("Job is not defined..", "Alert");
                                return;
                            }
                            url = '/rest/custom/job';
                            param.jobname = action.jobname;
                        }
                        var selectedKeys = false;
                        if (currentRow) {      //  for row action
                            selectedKeys = [currentRow];
                        } else {              // for header action
                            selectedKeys = $scope.view.selectedkeys;
                        }
                        var parameterMapping = action.parametermappings;


                        var actionParameters = action.parameters;


                        if (actionParameters) {
                            for (var k in actionParameters) {
                                parameters[k] = actionParameters[k];
                            }
                        }
                        if (selectedKeys && selectedKeys.length > 0) {
                            for (var i = 0; i < selectedKeys.length; i++) {
                                var row = selectedKeys[i];
                                if (row[KEY]) {
                                    var obj = {"_id":row[KEY]};
                                    if (parameterMapping) {
                                        angular.forEach(parameterMapping, function (value) {
                                            if (row[value]) {
                                                obj[value] = row[value];
                                            }
                                        });
                                    }
                                    parameters.selectedids.push(obj);
                                }
                            }
                        } else if (!action.noSelection) {
                            AppUtil.showShortMessage("No row selected");
                            return;
                        }
                        if (action.columns && action.columns.length > 0) {
                            for (var i = 0; i < action.columns.length; i++) {
                                var column = action.columns[i];
                                column[SHOW_ON_PANEL] = true;
                                if (column.displaycolumns) {
                                    column.lookupdisplaycolumns = [
                                        {expression:column.displaycolumns, type:UI_TYPE_STRING}
                                    ];
                                }
                            }
                            var metadata = {columns:action.columns, type:"panel"};
                            metadata.enablequickviewaction = false;
                            metadata.delete = false;
                            metadata.refresh = false;
                            metadata.enablemetadataaction = false;
                            metadata.enablerowaction = true;
                            metadata.resize = false;
                            metadata.navigation = false;
                            metadata.insert = false;
                            metadata.toolBarTitle = false;
                            metadata.popUpTitle = false;
                            metadata.closeonsave = true;
                            metadata.saveLabel = action.label ? action.label : 'Invoke Method';
                            metadata.ftsSearch = false;
                            metadata.savecallback = function (data) {
                                var dataTemp = data;
                                if (dataTemp) {
                                    if (dataTemp._insert) {
                                        delete dataTemp._insert;
                                    }
                                    angular.forEach(dataTemp, function (key, value) {
                                        if (dataTemp[value]) {
                                            parameters[value] = dataTemp[value];
                                        }
                                    });
                                    param.parameters = JSON.stringify(parameters);
                                    AppUtil.getDataFromService(url, param, "POST", "JSON", action.preMessage ? action.preMessage : 'Invoke Method', function (data) {
                                        if (data && data.showinpopup && data.result) {
                                            AppUtil.handleError(JSON.stringify(data.result), "Result");
                                        }
                                        $scope.appData.shortMessage = {"msg":action.postMessage ? action.postMessage : 'Done', "modal":false, "time":10000, className:'app-background-orange'};
                                        if (!$scope.$$phase) {
                                            $scope.$apply();
                                        }
                                    }, function (errorCallaback) {
                                        if (errorCallaback) {
                                            AppUtil.handleError(errorCallaback, "Problem while " + action.label);
                                        }
                                    });
                                }
                            };
                            var viewInfo = {};
                            viewInfo.data = {};
                            viewInfo.metadata = metadata;
                            viewInfo.metadata.dataExpression = "view.data";
                            viewInfo.showas = 'popup';
                            viewInfo.maxWidth = 500;
                            viewInfo.applicationid = APPLANE_DEVELOPER_APP_ID;
                            viewInfo.ask = $scope.view.ask;
                            if ($scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk) {
                                viewInfo.osk = $scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk;
                            }
                            $viewStack.addView(viewInfo, $scope);
                            $timeout(function () {
                                //for running default value as new value and old value were coming equal in $dataModel.watch
                                viewInfo.data._insert = true;
                            }, 0);
                        } else {
                            param.parameters = JSON.stringify(parameters);
                            AppUtil.getDataFromService(url, param, "POST", "JSON", action.preMessage ? action.preMessage : 'Invoke Method', function (data) {

                                $scope.appData.shortMessage = {"msg":action.postMessage ? action.postMessage : 'Done', "modal":false, "time":10000, className:'app-background-orange'};
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }, function (errorCallaback) {
                                if (errorCallaback) {
                                    $scope.appData.shortMessage = {"msg":errorCallaback, "modal":false, "time":20000, className:'app-background-orange'};
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            });
                        }
                    };
                    $scope.childview = function ($event) {
                        var applicationid = $scope.appData.applications.options[$scope.appData.applications.selectedIndex]._id;
                        var parameters = {applications__baas__id:applicationid};
                        var viewId = $scope.view.metadata.viewid_id;

                        $scope.appData.currentView = {parentcomponentid:$scope.view[COMPONENT_ID], "viewid":"uimenus__appsstudio", "ask":"appsstudio", "osk":$scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk, filter:{type:"Child", "sourceviewid":viewId}, parameters:parameters};
                    };
                    $scope.isValidColumn = function (row, col) {
                        if (!col || !col.expression || !row) {
                            return;
                        }
                        var colExpression = "$valid." + col.expression;
                        var valid = AppUtil.resolve(row, colExpression);
                        if (valid === false) {
                            return {invalid:true};
                        }
                    };
                    $scope.userActions = function ($event) {
                        var expOptions = [];
                        if ($scope.view.metadata.columns && $scope.view.metadata.columns.length > 0) {
                            for (var i = 0; i < $scope.view.metadata.columns.length; i++) {
                                if (!$scope.view.metadata.columns[i].multiple) {
                                    expOptions.push($scope.view.metadata.columns[i].expression);
                                }
                            }
                        }
                        var columns = [
                            {label:"Label", expression:"label", width:150, ui:UI_TYPE_STRING, mandatory:true, showOnTable:true, showOnPanel:true},
                            {label:"Type", expression:"type", ui:UI_TYPE_STRING, width:100, options:["Invoke", "Default Data", "Filter"], showOnPanel:true} ,
                            {label:"Filter Type", expression:"filterType", ui:UI_TYPE_LOOK_UP, width:150, options:["lookup", "date"], showOnPanel:true, visibleExpressionPanel:"this.ui == 'Filter'"} ,
                            {label:"Expression", expression:"expression", showOnPanel:true, width:100, ui:UI_TYPE_STRING, visibleExpressionPanel:"this.type == 'Filter'"},
                            {label:"Table", expression:"table", showOnPanel:true, width:50, ui:UI_TYPE_LOOK_UP, table:{"id":"tables__baas"}, lookupdisplaycolumns:[
                                {expression:"id"}
                            ], visibleExpressionPanel:"this.filterType == 'lookup'"},
                            {label:"Display Column", expression:"displaycolumns", showOnPanel:true, width:100, ui:UI_TYPE_STRING, visibleExpressionPanel:"this.filterType == 'lookup'"},
                            {label:"As parameter", expression:"asParameter", ui:UI_TYPE_BOOLEAN, width:150, showOnPanel:true, visibleExpressionPanel:"this.type == 'Filter'"} ,
                            {label:"Invoke Type", expression:"invokeType", ui:UI_TYPE_LOOK_UP, width:150, options:["url", "method", "job"], showOnPanel:true, visibleExpressionPanel:"this.type == 'Invoke'"} ,
                            {label:"URL", expression:"url", showOnPanel:true, width:150, ui:UI_TYPE_STRING, visibleExpressionPanel:"this.invokeType == 'url'"},
                            {label:"Job Name", expression:"jobname", showOnPanel:true, width:150, ui:UI_TYPE_STRING, visibleExpressionPanel:"this.invokeType == 'job'"},
                            {label:"Method", expression:"method", showOnPanel:true, width:150, ui:UI_TYPE_STRING, visibleExpressionPanel:"this.invokeType == 'method'"},
                            {label:"Module", expression:"module", showOnPanel:true, width:150, ui:UI_TYPE_STRING, visibleExpressionPanel:"this.invokeType == 'method'"},
                            {label:"Header Action", expression:"onHeader", showOnPanel:true, width:100, ui:UI_TYPE_BOOLEAN, visibleExpressionPanel:"this.type != 'Filter'"},
                            {label:"Row Action", expression:"onRow", showOnPanel:true, width:100, ui:UI_TYPE_BOOLEAN, visibleExpressionPanel:"this.type != 'Filter'"},
                            {label:"Pre saving Message", expression:"preMessage", showOnPanel:true, width:150, ui:UI_TYPE_STRING, visibleExpressionPanel:"this.type=='Invoke'"},
                            {label:"Post saving Message", expression:"postMessage", showOnPanel:true, width:150, ui:UI_TYPE_STRING, visibleExpressionPanel:"this.type=='Invoke'"},
                            {label:"Parameter Mapping", expression:"parametermappings", showOnPanel:true, width:150, ui:UI_TYPE_JSON, visibleExpressionPanel:"this.type=='Invoke'"},
                            {label:'Columns', ui:UI_TYPE_TABLE, multiple:true, expression:"columns", showOnPanel:true, visibleExpressionPanel:"this.type=='Invoke'"},
                            {label:"Expression", expression:"columns.expression", showOnPanel:true, showOnTable:false, width:100, ui:UI_TYPE_LOOK_UP, options:expOptions},
                            {label:"Label", expression:"columns.label", showOnTable:false, showOnPanel:true, width:50, ui:UI_TYPE_STRING},
                            {label:"Type", expression:"columns.ui", showOnTable:false, width:50, ui:UI_TYPE_STRING, showOnPanel:true, options:["string", "boolean", "date", "lookup"]},
                            {label:"Default Expression", expression:"columns.defaultexpression", showOnTable:false, showOnPanel:true, width:150, ui:UI_TYPE_STRING},
                            {label:"Table", expression:"columns.table", showOnTable:false, showOnPanel:true, width:50, ui:UI_TYPE_LOOK_UP, table:{id:"tables__baas"}, lookupdisplaycolumns:[
                                {expression:"id"}
                            ]},
                            {label:"Options", expression:"columns.options", showOnTable:false, width:100, ui:UI_TYPE_STRING, multiple:true, showOnPanel:true},
                            {label:"Display Column", expression:"columns.displaycolumns", showOnTable:false, width:150, ui:UI_TYPE_STRING, showOnPanel:true}
                        ];
                        var data = [];
                        if ($scope.view.metadata.actions) {
                            for (var i = 0; i < $scope.view.metadata.actions.length; i++) {
                                if (!$scope.view.metadata.actions[i]["private"]) {
                                    data.push($scope.view.metadata.actions[i]);
                                }

                            }
                        }
                        var metadata = {"label":"User Actions", "columns":columns, "type":"table", popUpTitle:false};
                        metadata.clientDelete = true;
                        metadata.toolBarTitle = true;
                        metadata.headerscroll = true;
                        metadata.delete = true;
                        metadata.refresh = false;
                        metadata.navigation = false;
                        metadata.enablequickviewaction = false;
                        metadata.enablemetadataaction = false;
                        metadata.enablerowaction = true;
                        metadata.closeonsave = true;
                        metadata.resize = false;
                        metadata.savePanelFalse = true;
                        metadata.insertPanelfalse = true;
                        metadata.panelElementId = "actionmetadataviewpanel";
                        metadata.insertMode = "panel";
                        metadata.insertDirection = "down";
                        metadata.ftsSearch = false;
                        metadata.refreshonload = false;
                        metadata.savecallback = function (userActions, actionUpdates) {
                            try {
                                var url = BAAS_SERVER + "/custom/module";
                                var parameters = {"ask":$scope.view.ask, "osk":$scope.view.osk, "actions":actionUpdates, "viewid":$scope.view.viewid};
                                var param = {"ask":"appsstudio", "module":"lib/UiCustomizeViewService", "method":"saveViewCustomization", "parameters":JSON.stringify(parameters)};
                                AppUtil.getDataFromService(url, param, "POST", "JSON", "Loading...", function (data) {
                                    var v = $dataModel.getView($scope[COMPONENT_ID]);
                                    $viewStack.reOpen(v);
                                });
                            } catch (e) {
                                AppUtil.handleError(e, "$scope.userActions.save");
                            }

                        };
                        var viewInfo = {};
                        viewInfo.data = {data:data};
                        viewInfo.metadata = metadata;
                        viewInfo.showas = 'popup';
                        viewInfo.maxWidth = 601;
                        viewInfo.applicationid = APPLANE_DEVELOPER_APP_ID;
                        viewInfo.ask = APPLANE_DEVELOPER_ASK;
                        viewInfo.element = $event.target;
                        viewInfo.width = 660;
                        viewInfo.maxWidth = 660;
                        $scope.childviewinfo = viewInfo;
                        $viewStack.addView(viewInfo, $scope);
                    };
                    $scope.columnGroups = function ($event) {
                        var columns = [
                            {label:"Index", expression:"index", showOnTable:true, width:50, ui:UI_TYPE_INDEX},
                            {label:"Label", expression:"label", showOnTable:true, width:80, ui:UI_TYPE_STRING, editableExpression:"this._insert==true"},
                            {label:"Show Label", expression:"showColumnLabel", showOnTable:true, width:100, ui:UI_TYPE_BOOLEAN},
                            {label:"Show Title", expression:"showTitle", showOnTable:true, width:100, ui:UI_TYPE_BOOLEAN},
                            {label:"Columns Per Row", expression:"columnPerRow", showOnTable:true, width:150, ui:UI_TYPE_STRING},
                            {label:"Separator", expression:"separator", showOnTable:true, width:100, ui:UI_TYPE_BOOLEAN},
                            {label:"Type", expression:"type", showOnTable:true, width:100, ui:UI_TYPE_LOOK_UP, options:["Flow Panel"]},
                            {label:"Column Width", expression:"columnWidth", showOnTable:true, width:150, ui:UI_TYPE_STRING, editableExpression:"this.ui == 'Flow Panel'"}
                        ];
                        var columnGroupData = angular.copy($scope.view.metadata.columngroupsclone);

                        var data = {"data":columnGroupData};
                        var metadata = {"label":"Column Groups", "columns":columns, "type":"table", popUpTitle:false};
                        metadata.clientDelete = true;
                        metadata.toolBarTitle = true;
                        metadata.headerscroll = true;
                        metadata.delete = true;
                        metadata.refresh = false;
                        metadata.navigation = false;
                        metadata.enablequickviewaction = false;
                        metadata.enablemetadataaction = false;
                        metadata.enablerowaction = false;
                        metadata.closeonsave = true;
                        metadata.resize = false;
                        metadata.savePanelFalse = true;
                        metadata.insertPanelfalse = true;
                        metadata.insertMode = "table";
                        metadata.ftsSearch = false;
                        metadata.savecallback = function (columnGroups, columnGroupUpdates) {
                            var url = BAAS_SERVER + "/custom/module";
                            var parameters = {"ask":$scope.view.ask, "osk":$scope.view.osk, "columngroups":columnGroupUpdates, "viewid":$scope.view.viewid};
                            var param = {"ask":"appsstudio", "module":"lib/UiCustomizeViewService", "method":"saveViewCustomization", "parameters":JSON.stringify(parameters)};
                            AppUtil.getDataFromService(url, param, "POST", "JSON", "Loading...", function (data) {
                                var v = $dataModel.getView($scope[COMPONENT_ID]);
                                $viewStack.reOpen(v);
                            });
                        };
                        var viewInfo = {};
                        viewInfo.data = data;
                        viewInfo.metadata = metadata;
                        viewInfo.showas = 'popup';
                        viewInfo.height = 441;
                        viewInfo.applicationid = APPLANE_DEVELOPER_APP_ID;
                        viewInfo.ask = APPLANE_DEVELOPER_ASK;
                        viewInfo.element = $event.target;
                        viewInfo.width = 1000;
                        $scope.childviewinfo = viewInfo;
                        $viewStack.addView(viewInfo, $scope);
                    };
                    $scope.orderby = function ($event) {
                        var columnsClone = $scope.view.metadata.columns;
                        var columnsTemp = [];
                        if (columnsClone && columnsClone.length > 0) {
                            for (var i = 0; i < columnsClone.length; i++) {
                                if (columnsClone[i][SHOW_ON_TABLE]) {
                                    columnsTemp.push(columnsClone[i].label);
                                }
                            }
                        }

                        var columns = [
                            {label:"Index", expression:"index", showOnTable:true, width:50, ui:UI_TYPE_INDEX},
                            {label:"Column", expression:"label", ui:UI_TYPE_STRING, width:150, options:columnsTemp, showOnTable:true},
                            {label:"Order", expression:"$order", ui:UI_TYPE_STRING, width:100, options:["asc", "desc", "none"], showOnTable:true} ,
                            {label:"Group", expression:"$group", ui:UI_TYPE_BOOLEAN, width:100, showOnTable:true} ,
                            {label:"Recursive", expression:"$recursive", ui:UI_TYPE_STRING, width:150, showOnTable:true}
                        ];
                        var orderData = [];
                        if ($scope.view.metadata.orders != null && $scope.view.metadata.orders != undefined) {
                            var orders = $scope.view.metadata.orders;

                            for (var orderExp in $scope.view.metadata.orders) {
                                var order = $scope.view.metadata.orders[orderExp];

                                for (var j = 0; j < columnsClone.length; j++) {
                                    var columnExp = columnsClone[j].expression;
                                    if (orderExp == columnExp) {
                                        var obj = {};
                                        obj.label = columnsClone[j].label;

                                        if (angular.isObject(order)) {
                                            obj.$order = order.$order;
                                            obj.$group = order.$group;
                                            obj.$recursive = order.$recursive;
                                        } else {
                                            obj.$order = order
                                        }
                                        obj._id = j;
                                        orderData.push(obj);
                                        break;
                                    }
                                }
                            }
                        }
                        var data = {data:orderData};
                        var metadata = {label:"Orders", columns:columns, type:"table", popUpTitle:false};
                        metadata.headerscroll = true;
                        metadata.toolBarTitle = true;
                        metadata.refresh = false;
                        metadata.navigation = false;
                        metadata.enablequickviewaction = false;
                        metadata.enablemetadataaction = false;
                        metadata.enablerowaction = false;
                        metadata.closeonsave = true;
                        metadata.resize = false;
                        metadata.savePanelFalse = true;
                        metadata.insertPanelfalse = true;
                        metadata.insertDirection = "bottom";
                        metadata.insertMode = 'table';
                        metadata.ftsSearch = false;
                        metadata.savecallback = function (orders) {
                            var count = orders.length;
                            var populatedOrder = {};
                            var oldRecursive = $scope.view.metadata.$recursivecolumn;
                            for (var i = 0; i < count; i++) {
                                var label = orders[i].label;
                                var order = orders[i].$order;
                                var $group = orders[i].$group;
                                var recursive = orders[i].$recursive;
                                if (!label) {
                                    continue;
                                }
                                columnsClone = $scope.view.metadata.columns;
                                if (!order) {
                                    order = "asc";
                                }
                                var reload = true;
                                for (var k = 0; k < columnsClone.length; k++) {
                                    if (columnsClone[k].label == label) {
                                        var exp = columnsClone[k].expression;
                                        if (order != 'none') {

                                            populatedOrder[exp] = {$order:order};
                                            if ($group) {
                                                /*find all columns where total aggregate is true*/
                                                var $columns = {};
                                                for (var j = 0; j < columnsClone.length; j++) {

                                                    //TODO subvisibility check was here
                                                    if (columnsClone[j].totalaggregates) {
                                                        $columns[columnsClone[j].expression] = {$sum:"$" + columnsClone[j].expression};
                                                    }
                                                }
                                                populatedOrder[exp].$group = $group;
                                                populatedOrder[exp].$columns = $columns;
                                            }
                                            if (recursive) {
                                                populatedOrder[exp].$recursive = recursive;
                                            }
                                            columnsClone[k].order = order;

                                        } else {
                                            delete columnsClone[k].order;
                                        }
                                        break;
                                    }
                                }
                            }
                            if (Object.keys(populatedOrder).length > 0) {
                                $scope.view.metadata.orders = populatedOrder;
                            } else {
                                delete $scope.view.metadata.orders;
                            }
                            var url = BAAS_SERVER + "/custom/module";
                            var parameters = {"ask":$scope.view.ask, "osk":$scope.view.osk, "orders":populatedOrder, "viewid":$scope.view.viewid};
                            var param = {"ask":"appsstudio", "module":"lib/UiCustomizeViewService", "method":"saveViewCustomization", "parameters":JSON.stringify(parameters)};
                            AppUtil.getDataFromService(url, param, "POST", "JSON", "Loading...", function (data) {
                                var v = $dataModel.getView($scope[COMPONENT_ID]);
                                $viewStack.reOpen(v);
                            });
                        };
                        var viewInfo = {};
                        viewInfo.data = data;
                        viewInfo.metadata = metadata;
                        viewInfo.showas = 'popup';
                        viewInfo.height = 441;
                        viewInfo.applicationid = APPLANE_DEVELOPER_APP_ID;
                        viewInfo.ask = APPLANE_DEVELOPER_ASK;
                        viewInfo.element = $event.target;
//                        viewInfo[PARENT_COMPONENT_ID] = $scope.componentid;
                        $scope.childviewinfo = viewInfo;
                        $viewStack.addView(viewInfo, $scope);
                    };
                    $scope.getPanelColumnWithSequence = function (columns, sequencePanel) {
                        var panelColumnWithSequence = columns;

                        if (sequencePanel) {
                            panelColumnWithSequence = [];
                            for (var i = 0; i < sequencePanel.length; i++) {
                                var index = AppUtil.getIndexFromArray(columns, "_id", sequencePanel[i])
                                if (index !== undefined) {
                                    panelColumnWithSequence.push(columns[index]);
                                }
                            }

                        }
                        return panelColumnWithSequence;
                    }
                    $scope.columnview = function ($event) {

                        var uiOptions = ['table', 'duration', 'compositelookup', 'currency', 'date', 'autoincrement', 'number', 'decimal', 'string', 'lookup', 'image', 'file', 'selection', 'sr', 'index', 'boolean', 'range', 'aggregate', 'time', 'text', 'autoheight', 'richtext', 'json', 'schedule'];

                        var columns = [
                            {label:"Index", expression:"index", ui:UI_TYPE_INDEX, "width":40, showOnTable:true},
                            {label:"Width", expression:"width", ui:UI_TYPE_STRING, "width":40, showOnTable:true},
                            {expression:"label", ui:UI_TYPE_STRING, label:"Label", "width":100, showOnTable:true},
                            {label:"UI", expression:UI, ui:UI_TYPE_STRING, "width":50, showOnPanel:true, options:uiOptions },
                            {label:"UI Panel", expression:UI_PANEL, ui:UI_TYPE_STRING, "width":50, showOnPanel:true, options:uiOptions},
                            {expression:"expression", ui:UI_TYPE_STRING, label:"Expression", width:100, showOnTable:true, showOnPanel:true, editableExpressionPanel:"false", editableExpression:"false", primary:true}
                        ];
                        columns.push({label:"Show On Table", expression:"showOnTable", ui:UI_TYPE_BOOLEAN, "width":100, showOnTable:true});
                        columns.push({expression:"showOnPanel", ui:UI_TYPE_BOOLEAN, label:"Show On Panel", width:100, showOnTable:true});

                        if ($scope.appData.applicationDeveloper) {
                            columns.push({expression:"filterDefaultExpression", ui:UI_TYPE_STRING, label:"Filter Default Expression", width:100, showOnPanel:true});
                            columns.push({expression:"filterableColumn", ui:UI_TYPE_BOOLEAN, label:"Filterable", width:100, showOnPanel:true});
                            columns.push({expression:"defaultFilters", ui:UI_TYPE_STRING, label:"Default Filter", width:100, showOnPanel:true});
                            columns.push({expression:"insertDirection", ui:UI_TYPE_STRING, options:["up", "down"], label:"Insert Direction", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'table'"});
                            columns.push({expression:"private", ui:UI_TYPE_BOOLEAN, label:"Private", width:100, showOnPanel:true});
                            columns.push({expression:"date", ui:UI_TYPE_BOOLEAN, label:"Date", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'range'"});
                            columns.push({expression:"month", ui:UI_TYPE_BOOLEAN, label:"Month", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'range'"});
                            columns.push({expression:"year", ui:UI_TYPE_BOOLEAN, label:"Year", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'range'"});
                            columns.push({expression:"time", ui:UI_TYPE_BOOLEAN, label:"Time", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'date'"});
                            columns.push({expression:"universalFilter", ui:UI_TYPE_BOOLEAN, label:"Universal Filter", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'lookup'"});
                            columns.push({expression:"orders", ui:UI_TYPE_JSON, label:"Order By", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'lookup'"});
                            columns.push({expression:"table", ui:UI_TYPE_LOOK_UP, label:"Table", width:100, showOnPanel:true, table:"tables__baas", lookupdisplaycolumns:[
                                {expression:"id", type:UI_TYPE_STRING}
                            ], editableExpressionPanel:"false", visibleExpressionPanel:"this.ui == 'lookup'"});
                            columns.push({label:"Table Visible Exp", expression:"visibleExpression", ui:UI_TYPE_STRING, width:100, showOnPanel:true});  // for table
                            columns.push({label:"Panel Visible Exp", expression:"visibleExpressionPanel", ui:UI_TYPE_STRING, width:100, showOnPanel:true}); // for panel
                            columns.push({label:"Table Editable Exp", expression:"editableExpression", ui:UI_TYPE_STRING, width:100, showOnPanel:true});
                            columns.push({label:"Panel Editable Exp", expression:"editableExpressionPanel", ui:UI_TYPE_STRING, width:100, showOnPanel:true});
                            columns.push({expression:"typeEditableExpression", ui:UI_TYPE_STRING, label:"Type Editable Expression", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'currency' || this.ui == 'duration'"});
                            columns.push({options:['sum'], label:"Aggregate", expression:"totalaggregates", ui:UI_TYPE_STRING, width:50, showOnPanel:true, visibleExpressionPanel:"this.ui == 'duration' || this.ui == 'currency'"});

                            columns.push({label:"Update", expression:"update", ui:UI_TYPE_BOOLEAN, width:50, showOnPanel:true});
                            columns.push({expression:"filter", ui:UI_TYPE_JSON, label:"Filter", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'lookup'"});
                            columns.push({expression:"parametermappings", ui:UI_TYPE_JSON, label:"Parameters", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'lookup'"});
                            columns.push({expression:"filterRequiredColumns", ui:UI_TYPE_STRING, multiple:true, label:"Filter Required Columns", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'lookup'"});
                            columns.push({expression:"max_rows", ui:UI_TYPE_NUMBER, label:"Max Rows", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui== 'Embed'"});
                            columns.push({expression:"mandatory", ui:UI_TYPE_BOOLEAN, label:"Mandatory", width:100, showOnPanel:true});
                            columns.push({expression:"breadcrumb", ui:UI_TYPE_BOOLEAN, label:"Breadcrumb", width:100, showOnPanel:true});
                            columns.push({expression:"visibleRequiredColumns", ui:UI_TYPE_STRING, label:"Visible Required Columns", width:100, showOnPanel:true, multiple:true});
                            columns.push({expression:"lookupquery", ui:UI_TYPE_STRING, label:"Look Up Query", width:100, showOnPanel:true});
                            columns.push({expression:"referredView", ui:UI_TYPE_LOOK_UP, "width":100, showOnPanel:true, label:"Referred View", table:"views__appsstudio", lookupdisplaycolumns:[
                                {expression:"id", ui:UI_TYPE_STRING}
                            ], visibleExpressionPanel:"this.ui == 'lookup'", filter:{"baasviewid.table._id":"{baasviewidtable}", organizationid:null, userid:null}, parametermappings:{baasviewidtable:"table._id"}});
                            columns.push({visibleExpressionPanel:"this.ui == 'lookup'", "label":"Multiple Filter", expression:"multipleFilter", ui:UI_TYPE_BOOLEAN, width:50, showOnPanel:true});
                            columns.push({expression:"noOfDecimal", ui:UI_TYPE_NUMBER, label:"Decimal Place", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'currency'"});
                            columns.push({expression:"remember", ui:UI_TYPE_BOOLEAN, label:"Remember", width:100, showOnPanel:true});
                            var columnGroupOptions = [];

                            if ($scope.view.metadata.columngroups) {
                                columnGroupOptions = [];
                                for (var i = 0; i < $scope.view.metadata.columngroups.length; i++) {
                                    columnGroupOptions.push($scope.view.metadata.columngroups[i].label);
                                }
                            }
                            columns.push({label:"Column group", expression:"columngroup", ui:UI_TYPE_STRING, "width":100, showOnTable:true, options:columnGroupOptions});
                            columns.push({expression:"viewDetail", ui:UI_TYPE_BOOLEAN, label:"View Detail", width:100, showOnPanel:true, visibleExpressionPanel:"this.ui == 'table'"});
                            columns.push({expression:"unwind", ui:UI_TYPE_BOOLEAN, label:"Unwind", width:100, showOnPanel:true, visibleExpressionPanel:"this.multiple == true"});
                            columns.push({expression:"defaultWhen", ui:UI_TYPE_STRING, label:"Default when", showOnPanel:true});
                        }
                        var data = {"data":angular.copy($scope.view.metadata.columns)};
                        var metadata = {"label":"Manage Column", "columns":columns, "type":"table", popUpTitle:false};
                        metadata.enablequickviewaction = false;
                        metadata.toolBarTitle = true;
                        metadata.enablemetadataaction = false;
                        metadata.delete = false;
                        metadata.insert = false;
                        metadata.enableSelection = false;
                        metadata.panelElementId = "columnmetadataviewpanel";
                        metadata.enablerowaction = true;
                        metadata.resize = false;
                        metadata.headerscroll = true;
                        metadata.refreshonload = false;
                        metadata.savePanelFalse = true;
                        metadata.insertPanelfalse = true;
                        metadata.ftsSearch = false;
                        var panelOrderViewColumns = [
                            {label:"Index", expression:"index", ui:UI_TYPE_INDEX, width:40, showOnTable:true},
                            {expression:"label", type:UI_TYPE_STRING, label:"Label", width:200, showOnTable:true, editableExpression:"false"},
                            {label:"Type", expression:"type", type:UI_TYPE_STRING, width:50, showOnPanel:true, editableExpression:"false"},
                            {expression:"expression", type:UI_TYPE_STRING, label:"Expression", width:200, showOnTable:true, showOnPanel:true, editableExpression:"false", primary:true}
                        ];
                        var panelOrderViewMetadata = {label:"Panel columns", columns:panelOrderViewColumns, table:"columns", type:"table"};
                        panelOrderViewMetadata.save = false;
                        panelOrderViewMetadata.ftsSearch = false;
                        panelOrderViewMetadata.refresh = false;
                        panelOrderViewMetadata.delete = false;
                        panelOrderViewMetadata.insert = false;
                        panelOrderViewMetadata.navigation = false;
                        panelOrderViewMetadata.enablemetadataaction = false;
                        panelOrderViewMetadata.toolBarTitle = true;
                        panelOrderViewMetadata.popUpTitle = false;
                        panelOrderViewMetadata.enablerowaction = false;
                        var panelClone = $scope.getPanelColumnWithSequence($scope.view.metadata.columns, $scope.view.metadata.sequencePanel);
                        metadata.views = [
                            {metadata:panelOrderViewMetadata, data:{data:panelClone}, width:$scope.appData.applicationDeveloper ? 730 : 660}
                        ];
                        metadata.savecallback = function (customization, updates) {

                            for (var i = 0; i < updates.length; i++) {
                                if (updates[i].index) {
                                    delete updates[i].index;
                                    var keys = Object.keys(updates[i]);
                                    if (keys && keys.length == 1 && keys[0] == KEY) {
                                        updates.splice(i, 1);
                                        continue;
                                    }
                                }
                                for (var j = 0; j < customization.length; j++) {
                                    if (customization[j][KEY] == updates[i][KEY]) {
                                        updates[i].expression = customization[j].expression;
                                        break;
                                    }
                                }
                            }


                            var sequencePanel = [];
                            var sequence = [];
                            var changeInSequencePanel = false;
                            var changeInSequence = false;
                            if (customization) {

                                for (var i = 0; i < panelClone.length; i++) {
                                    sequencePanel.push(panelClone[i]._id);
                                    if (panelClone[i]._id != $scope.view.metadata.sequencePanelClone[i]) {
                                        changeInSequencePanel = true;
                                    }
                                }

                                for (var i = 0; i < customization.length; i++) {
                                    sequence.push(customization[i]._id);
                                    if (customization[i]._id != $scope.view.metadata.sequenceClone[i]) {
                                        changeInSequence = true;
                                    }
                                }
                            }


                            var url = BAAS_SERVER + "/custom/module";
                            var parameters = {"ask":$scope.view.ask, "osk":$scope.view.osk, viewid:$scope.view.metadata.viewid};

                            if (updates && updates.length > 0) {
                                parameters.columns = updates;
                            }

                            if (changeInSequencePanel) {
                                parameters.sequencePanel = sequencePanel;
                            }

                            if (changeInSequence) {
                                parameters.sequence = sequence;
                            }

                            if ($scope.view.metadata.lastmodifiedtime) {
                                parameters.lastmodifiedtime = $scope.view.metadata.lastmodifiedtime;
                            }

                            var param = {"ask":"appsstudio", "module":"lib/UiCustomizeViewService", "method":"saveViewCustomization", "parameters":JSON.stringify(parameters)};
                            AppUtil.getDataFromService(url, param, "POST", "JSON", "Loading...", function () {
                                var v = $dataModel.getView($scope[COMPONENT_ID]);
                                $viewStack.reOpen(v);
                            });
                        };
                        metadata.closeonsave = true;
                        var viewInfo = {};
                        viewInfo.data = data;
                        viewInfo.metadata = metadata;
                        viewInfo.showas = 'popup';
                        viewInfo.ask = "appsstudio";
                        viewInfo.element = $event.target;
                        viewInfo.width = $scope.appData.applicationDeveloper ? 730 : 660;
                        $viewStack.addView(viewInfo, $scope);
                    };
                    $scope.viewSettings = function ($event) {
                        var columns = [
                            {"label":"Label", "expression":"label", showOnPanel:true, "width":100, ui:UI_TYPE_STRING},
                            {"label":"Max rows", "expression":"max_rows", showOnPanel:true, "width":100, ui:UI_TYPE_NUMBER},
                            {"label":"Remove customization", "expression":"removecustomization", showOnPanel:true, "width":100, ui:UI_TYPE_BOOLEAN}
                        ];

                        if ($scope.appData.developer) {
                            columns.push({label:"Advance Filter", expression:"advancefilter", showOnPanel:true, width:100, ui:UI_TYPE_JSON});
                            columns.push({label:"Insert Mode", expression:"insertMode", showOnPanel:true, width:100, ui:UI_TYPE_LOOK_UP, options:["table", "panel"]});
                            columns.push({label:"Template", "expression":"template", showOnPanel:true, "width":100, ui:UI_TYPE_AUTO_HEIGHT});
                            columns.push({label:"Insert", expression:"insert", showOnPanel:true, width:100, ui:UI_TYPE_BOOLEAN});
                            columns.push({label:"Save", "expression":"save", showOnPanel:true, "width":100, ui:UI_TYPE_BOOLEAN});
                            columns.push({label:"Edit", expression:"edit", showOnPanel:true, width:100, ui:UI_TYPE_BOOLEAN});
                            columns.push({label:"Delete", expression:"delete", showOnPanel:true, width:100, ui:UI_TYPE_BOOLEAN});
                            columns.push({label:"Enable Selection", expression:"enableSelection", showOnPanel:true, width:100, ui:UI_TYPE_BOOLEAN});
                            columns.push({label:"Update type", expression:"updatetype", showOnPanel:true, width:100, ui:UI_TYPE_STRING});
                        }


                        var data = {};
                        data.insert = AppUtil.isTrueOrUndefined($scope.view.metadata.insert);
                        data.save = AppUtil.isTrueOrUndefined($scope.view.metadata.save);
                        data.edit = AppUtil.isTrueOrUndefined($scope.view.metadata.edit);
                        data.delete = AppUtil.isTrueOrUndefined($scope.view.metadata.delete);
                        data.enableSelection = AppUtil.isTrueOrUndefined($scope.view.metadata.enableSelection);
                        data.insertMode = $scope.view.metadata.insertMode ? $scope.view.metadata.insertMode : 'panel';
                        data.advancefilter = $scope.view.metadata.advancefilter;
                        data.max_rows = $scope.view.metadata.max_rows;
                        data.template = $scope.view.metadata.template;
                        data.updatetype = $scope.view.metadata.updatetype;
                        var metadata = {"label":"View Settings", "columns":columns, "type":"panel", popUpTitle:false};
                        metadata.insert = false;
                        metadata.clientDelete = false;
                        metadata.toolBarTitle = true;
                        metadata.delete = false;
                        metadata.refresh = false;
                        metadata.navigation = false;
                        metadata.enablequickviewaction = false;
                        metadata.enablemetadataaction = false;
                        metadata.enablerowaction = false;
                        metadata.closeonsave = true;
                        metadata.resize = false;
                        metadata.savePanelFalse = true;
                        metadata.insertPanelfalse = true;
                        metadata.dataExpression = "view.data";
                        metadata.ftsSearch = false;
                        metadata.savecallback = function (settingdata, updates) {
                            if (updates && updates.length > 0) {
                                updates = updates[0];
                            } else {
                                return;
                            }
                            if (Object.keys(updates).length == 0) {
                                return;
                            }

                            var url = BAAS_SERVER + "/custom/module";
                            var parameters = {"ask":$scope.view.ask, "osk":$scope.view.osk, "viewid":$scope.view.viewid};
                            for (var key in updates) {
                                parameters[key] = updates[key];
                            }
                            if ($scope.view.metadata.lastmodifiedtime) {
                                parameters.lastmodifiedtime = $scope.view.metadata.lastmodifiedtime;
                            }

                            var param = {"ask":"appsstudio", "module":"lib/UiCustomizeViewService", "method":"saveViewCustomization", "parameters":JSON.stringify(parameters)};
                            AppUtil.getDataFromService(url, param, "POST", "JSON", "Loading...", function () {
                                var v = $dataModel.getView($scope[COMPONENT_ID]);
                                $viewStack.reOpen(v);
                            });
                        };
                        var viewInfo = {};
                        viewInfo.data = data;
                        viewInfo.metadata = metadata;
                        viewInfo.showas = 'popup';
                        viewInfo.height = 441;
                        viewInfo.applicationid = APPLANE_DEVELOPER_APP_ID;
                        viewInfo.ask = APPLANE_DEVELOPER_ASK;
//                        viewInfo.element = $event.target;
                        viewInfo.width = 450;
                        $viewStack.addView(viewInfo, $scope);
                    };
                    $scope.scheduleView = function ($event) {
                        var viewId = $scope.view.metadata.viewid_id;
                        var applicationid = $scope.appData.applications.options[$scope.appData.applications.selectedIndex]._id;
                        var filter = {viewid:viewId, applicationid:applicationid};
                        var parameters = {applications__baas__id:applicationid};
                        $scope.appData.currentView = {parentcomponentid:$scope.view[COMPONENT_ID], "viewid":"schedules__baas", "ask":"appsstudio", "osk":$scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk, filter:filter, parameters:parameters};
                    };

                    $scope.resetfilter = function () {
                        Object.keys($scope.view.metadata.filterparameters).forEach(function (key) {
                            delete $scope.view.metadata.filterparameters[key];
                        });
                    };
                    $scope.applyfilter = function () {
                        $timeout(function () {
                            var modelFilters = [];
                            var viewFilters = $scope.view.metadata.viewfilters;
                            var count = viewFilters.length;
                            var appliedFilters = $scope.view.metadata.appliedfilters;
                            var newFilterParams = {};

                            var filterColumnInfo = {};
                            for (var i = 0; i < count; i++) {
                                var viewFilter = viewFilters[i];
                                var type = viewFilter[UI] || viewFilter[UI_PANEL];
                                var expression = viewFilter.expression;
                                var asParameter = viewFilter.asParameter;
                                var paramValue = AppUtil.resolve($scope.view.metadata.filterparameters, expression);
                                if (viewFilter.type == UI_TYPE_COMPOSITE_LOOK_UP && paramValue && paramValue.type.toString().length == 0) {
                                    paramValue = undefined;
                                } else if (paramValue instanceof Object && viewFilter.type != UI_TYPE_COMPOSITE_LOOK_UP) {
                                    if (!paramValue._id && !paramValue[FILTER]) { // _id --> for lookup and filter --> for date filter
                                        paramValue = undefined;
                                    }
                                } else if ((!paramValue) || (paramValue && paramValue.toString().length == 0)) {
                                    paramValue = undefined;
                                }

                                var filterOperator = false;
                                var appliedFilterCount = appliedFilters.length;
                                var appliedFilterIndex = -1;
                                for (var j = 0; j < appliedFilterCount; j++) {
                                    var appliedFilter = appliedFilters[j];
                                    if (appliedFilter.expression == viewFilter.expression) {
                                        appliedFilterIndex = j;
                                        break;
                                    }
                                }

                                var label = false;
                                var paramClone = angular.copy(paramValue);
                                if (paramValue !== undefined) {
                                    /*check multiple filter property if true than make an array of filter*/
                                    if (viewFilter.multiple) {
                                        label = $scope.getColumnValue($scope.view.metadata.filterparameters, viewFilter);
                                        filterOperator = AppUtil.resolve($scope.view.metadata.filterparameters, expression + "_filteroperator");
                                        var multipleFilters = [];
                                        if (paramValue instanceof Array) {
                                            for (var k = 0; k < paramValue.length; k++) {
                                                multipleFilters.push(AppUtil.resolve(paramValue[k], $scope.view.metadata[PRIMARY_COLUMN]));
                                            }
                                        }
                                        if (multipleFilters.length == 0) {
                                            paramValue = undefined;
                                        } else {
                                            if (filterOperator == "$in" || filterOperator == "$eq" || filterOperator == undefined) {
                                                paramValue = {"$in":multipleFilters};
                                            } else if (filterOperator == "$ne" || filterOperator == "$nin") {
                                                paramValue = {"$nin":multipleFilters};
                                                label = "~" + label;
                                            }
                                            newFilterParams[expression] = {"filter":paramValue, "label":label, value:paramClone, op:filterOperator, asParameter:asParameter};
                                            filterColumnInfo[expression] = angular.copy(viewFilter);
                                        }
                                    } else {
                                        label = $scope.getColumnValue($scope.view.metadata.filterparameters, viewFilter);
                                        filterOperator = AppUtil.resolve($scope.view.metadata.filterparameters, expression + "_filteroperator");
                                        if (viewFilter.type == UI_TYPE_COMPOSITE_LOOK_UP) {
                                            for (var j = 0; j < viewFilter.compositeoptions.length; j++) {
                                                if (paramClone.type == viewFilter.compositeoptions[j].label) {
                                                    var typeExp = expression + ".type";
                                                    var idExp = expression + "." + viewFilter.compositeoptions[j].expression + "._id";
                                                    paramValue.filters = [];
                                                    if (!paramClone.type || !paramClone.value) {
                                                        AppUtil.handleError("Select both source and value in [" + viewFilter.label + "]");
                                                        return;
                                                    }
                                                    var typeFilter = {};
                                                    typeFilter[typeExp] = paramClone.type;
                                                    paramValue.filters.push(typeFilter)

                                                    var valueFilter = {};
                                                    valueFilter[idExp] = paramClone.value._id
                                                    paramValue.filters.push(valueFilter)
                                                    break;
                                                }
                                            }
                                        } else if (label && label.toString().indexOf('-') >= 0 && (type == UI_TYPE_NUMBER || type == UI_TYPE_DECIMAL)) {
                                            var splitValue = label.split('-');
                                            paramValue = {$gt:Number(splitValue[0]), $lt:Number(splitValue[1])};
                                        } else if (filterOperator == "$ne" || filterOperator == "$nin") {
                                            label = "~" + label;
                                            if (paramValue._id) {
                                                paramValue = {$ne:paramValue._id};
                                            } else if (type == UI_TYPE_STRING && (viewFilter.lookupquery || (viewFilter.options && viewFilter.options.length > 0))) {
                                                paramValue = {$ne:paramValue};
                                            } else if (type == UI_TYPE_NUMBER || type == UI_TYPE_DECIMAL) {
                                                paramValue = {$ne:Number(paramValue)};
                                            }
                                        } else if ((filterOperator == "$eq" || filterOperator == "$in" || filterOperator == undefined || filterOperator.toString().trim().length == 0)) {
                                            if (paramValue._id) {
                                                paramValue = paramValue._id;
                                            } else if (type == UI_TYPE_NUMBER || type == UI_TYPE_DECIMAL) {
                                                paramValue = Number(paramValue);
                                            }
                                        } else if (filterOperator == "$gte" || filterOperator == "$lte" || filterOperator == "$lt" || filterOperator == "$gt") {
                                            if (filterOperator == "$gte") {
                                                label = " >=" + label;
                                            } else if (filterOperator == "$lte") {
                                                label = " <=" + label;
                                            }
                                            if (filterOperator == "$lt") {
                                                label = " <" + label;
                                            }
                                            if (filterOperator == "$gt") {
                                                label = " >" + label;
                                            }

                                            if (paramValue._id) {
                                                var value = paramValue._id;
                                                paramValue = {};
                                                paramValue[filterOperator] = value;
                                            } else if (viewFilter[UI] == UI_TYPE_STRING && (viewFilter.lookupquery || (viewFilter.options && viewFilter.options.length > 0))) {
                                                var value = paramValue;
                                                paramValue = {};
                                                paramValue[filterOperator] = value;
                                            } else if (type == UI_TYPE_NUMBER || type == UI_TYPE_DECIMAL) {
                                                var value = Number(paramValue);
                                                paramValue = {};
                                                paramValue[filterOperator] = value;
                                            }
                                        }

                                        if (paramValue.filters) {
                                            newFilterParams[expression] = {"filters":paramValue.filters, "label":label, value:paramClone, op:filterOperator, asParameter:asParameter};
                                        } else if (paramValue.filter) {
                                            newFilterParams[expression] = {"filter":paramValue.filter, "label":label, value:paramClone, op:filterOperator, asParameter:asParameter};
                                        } else {
                                            newFilterParams[expression] = {"filter":paramValue, "label":label, value:paramClone, op:filterOperator, asParameter:asParameter};
                                        }
                                        filterColumnInfo[expression] = angular.copy(viewFilter);
                                    }
                                    if (appliedFilterIndex < 0 && paramValue) {
                                        appliedFilters.push(viewFilter);
                                    }
                                    paramValue = angular.copy(paramValue);
                                }
                                if (!paramValue && appliedFilterIndex >= 0) {
                                    appliedFilters.splice(appliedFilterIndex, 1);
                                }
                                var asDefault = false;
                                if ($scope.view.metadata.defaultFilters !== undefined) {
                                    asDefault = true;
                                }
                                if (asDefault) {
                                    var target = AppUtil.resolve($scope, $scope.view.metadata.defaultFilterExpression, true);
                                    var value = angular.copy(paramClone);

                                    if (value && value[FILTER] && angular.isObject(value[FILTER])) {
                                        var filterValue = value[FILTER];
                                        delete value[FILTER];
                                        Object.keys(filterValue).forEach(function (k) {
                                            value[k] = filterValue[k];
                                        });
                                    }

                                    AppUtil.putDottedValue(target, expression, value);
                                } else {
                                    if (paramValue !== undefined) {
                                        if (paramValue.filters) {
                                            for (var j = 0; j < paramValue.filters.length; j++) {
                                                for (var k in paramValue.filters[j]) {
                                                    $dataModel.addFilter($scope[COMPONENT_ID], k, paramValue.filters[j][k], asParameter);
                                                }
                                            }
                                        } else if (paramValue.filter) {
                                            $dataModel.addFilter($scope[COMPONENT_ID], expression, paramValue.filter, asParameter);
                                        } else {
                                            $dataModel.addFilter($scope[COMPONENT_ID], expression, paramValue, asParameter);
                                        }
                                    } else {
                                        $dataModel.removeFilterFromParameters(expression, $scope.view.metadata.filter);
                                        $dataModel.removeFilterFromParameters(expression, $scope.view.metadata.parameters);
                                    }
                                }
                            }
                            if (filterColumnInfo) {
                                Object.keys(filterColumnInfo).forEach(function (k) {
                                    delete  filterColumnInfo[k].editableCellTemplate;
                                    delete  filterColumnInfo[k].columns;
                                    delete  filterColumnInfo[k].lookupdisplaycolumns;
                                    delete  filterColumnInfo[k].displaycolumns;
                                    delete  filterColumnInfo[k].style;
                                    delete  filterColumnInfo[k].ask;
                                    delete  filterColumnInfo[k].osk;
                                    delete  filterColumnInfo[k].ds;
                                    delete  filterColumnInfo[k].width;
                                    delete  filterColumnInfo[k].componentid;
                                    delete  filterColumnInfo[k].id;
                                })
                            }
                            if (!asDefault) {
                                $dataModel.resetDataState($scope[COMPONENT_ID]);
                                $dataModel.refresh($scope[COMPONENT_ID]);
                                $scope.view.metadata.appliedfilterparameters = newFilterParams;

                                $scope.view.metadata.parameters = $scope.view.metadata.parameters || {};

                                Object.keys(newFilterParams).forEach(function (k) {
                                    $scope.view.metadata.parameters[k] = newFilterParams[k];
                                });

                                AppUtil.handleToolBarHeight();
                                var url = BAAS_SERVER + "/custom/module";
                                var parameters = {"ask":$scope.view.ask, "osk":$scope.view.osk, "viewid":$scope.view.viewid};
                                parameters.filter = newFilterParams;
                                parameters.appliedfilterinfo = filterColumnInfo;
                                parameters.source = $scope.view.metadata.source;
                                if ($scope.view.metadata.lastmodifiedtime) {
                                    parameters.lastmodifiedtime = $scope.view.metadata.lastmodifiedtime;
                                }
                                var param = {"ask":"appsstudio", "module":"lib/UiCustomizeViewService", "method":"saveViewCustomization", "parameters":JSON.stringify(parameters)};
                                AppUtil.getDataFromService(url, param, "POST", "JSON", false, function (data) {
                                });
                            }
                            if ($scope.filterPopup) {
                                $scope.filterPopup.hide();
                                delete $scope.filterPopup;
                            }
                        }, 200);
                    };
                    $scope.cancelfilter = function () {
                        if ($scope.filterPopup) {
                            $scope.filterPopup.hide();
                            delete $scope.filterPopup;
                        }
                    };

                    $scope.setLookUpDataSource = function (lookupSource, options) {
                        $scope[lookupSource] = options;
                    }
                    $scope.filterview = function ($event) {
                        $scope.filterOperators = ["AND", "OR"];

                        var label = 'Manage Filters';
                        if ($scope.view.metadata.defaultFilters !== undefined) {
                            if ($scope.view.metadata.defaultFilters instanceof Array) {
                                label = 'Populate Filters';
                            } else {
                                label = $scope.view.metadata.defaultFilters.label;
                            }
                        }
                        var config = {
                            template:"<div class='app-height-thirty-px app-background-threedface app-font-size-sixteen-px app-margin-bottom-five-px app-margin-top-five-px'>" + "<div class='app-float-left app-font-weight-bold app-border-right-white app-blue-text-color app-padding-five-px ng-scope ng-binding'>" + label + "</div>" + "<div class='app-bar-metadata'>" + "<div ng-click='resetfilter()'class='app-reset-button app-bar-button ' title='Reset' ></div>" + "<div title='Apply' ng-click='applyfilter()' class='app-apply-button app-bar-button '></div>" + "<div ng-click='cancelfilter()'class='app-close-button app-bar-button ' title='Cancel'></div>" + "</div>" + "</div>" + "<div class=\"app-popup-body advance-search-parent-div\">" +
                                "<app-filter ng-repeat = 'col in view.metadata.viewfilters'></app-filter>" +
                                "</div>" +
                                "</div>",
                            scope:$scope,
                            autohide:false,
                            element:$event.target,
                            width:520,
                            height:300,
                            overflowY:"auto"
                        };
                        $scope.filterPopup = $viewStack.showPopup(config);
                    };
                    $scope.openPanel = function (insert) {
                        try {
                            $viewStack.closeChildView($scope[COMPONENT_ID]); //  for breadcrumb, close previous view detail.
                            var label = insert ? "New" : "";
                            $scope.populateBreadCrumbInfo($scope.view.metadata.breadCrumbInfo, label);
                            var viewinfo = {};


                            var filter = $scope.view.metadata.filter;
                            if (!filter) {
                                filter = {};
                            } else {
                                filter = angular.copy(filter);
                            }
                            var parameters = $scope.view.metadata.parameters;
                            if (!parameters) {
                                parameters = {};
                            } else {
                                parameters = angular.copy(parameters);
                            }
                            var currentRow = $dataModel.getCurrentRow($scope.componentid);

                            filter[$scope.view.metadata[PRIMARY_COLUMN]] = "{" + $scope.view.metadata[PRIMARY_COLUMN] + "}";
                            parameters[$scope.view.metadata[PRIMARY_COLUMN]] = AppUtil.resolve(currentRow, $scope.view.metadata[PRIMARY_COLUMN]);
                            Object.keys(currentRow).forEach(function (k) {
                                parameters[k] = angular.copy(currentRow[k]);
                            });

                            var panelRowKey = AppUtil.resolve(currentRow, $scope.view.metadata[PRIMARY_COLUMN]);
                            var panelRowClone = AppUtil.getRecord($scope.view.dataclone, panelRowKey, $scope.view.metadata[PRIMARY_COLUMN]);
                            var panelmetadata = {"table":$scope.view.metadata.table, "columns":angular.copy($scope.view.metadata.columns), "type":"panel", "layout":"onecolumns", "filter":filter, "parameters":parameters, label:$scope.view.metadata.label};
                            panelmetadata.nestedColumns = $scope.view.metadata.nestedColumns;
                            var path = $scope.view.metadata.path;
                            if (!path) {
                                path = "panel"
                            } else {
                                path += "panel";
                            }
                            panelmetadata.path = path;
                            panelmetadata[PRIMARY_COLUMN] = $scope.view.metadata[PRIMARY_COLUMN];
                            panelmetadata.save = true;
                            panelmetadata.noWatch = true;
                            panelmetadata.saveParent = true;
                            panelmetadata.insert = true;
                            panelmetadata.delete = true;
                            panelmetadata.refresh = true;
                            panelmetadata.navigation = false;
                            panelmetadata.enablemetadataaction = true;
                            panelmetadata.dataExpression = "view.data";
                            panelmetadata.columngroups = $scope.view.metadata.columngroups;
                            panelmetadata.sequencePanel = $scope.view.metadata.sequencePanel;
                            panelmetadata.toolBarTitle = true;
                            panelmetadata.popUpTitle = false;
                            panelmetadata.openPanel = true;
                            panelmetadata.$parent = $scope.view.metadata.$parent;
                            panelmetadata.resized = $scope.view.metadata.resized;
                            panelmetadata.label = $scope.view.metadata.label || "View Detail";
                            panelmetadata.viewid = $scope.view.metadata.viewid;
                            $scope.view.metadata.panelView = true;
                            if ($scope.view.metadata.insertPanelfalse) {
                                panelmetadata.insert = false;
                            }
                            if ($scope.view.metadata.savePanelFalse) {
                                panelmetadata.save = false;
                            }
                            if (!$dataModel.isTempKey(panelRowKey) && AppUtil.isTrueOrUndefined($scope.view.metadata.refreshonload)) {
                                panelmetadata.refreshonload = true;
                            }
                            if ($scope.view.metadata.embed) {
                                panelmetadata.refreshonload = false;
                            }
                            viewinfo.metadata = panelmetadata;
                            viewinfo.viewid = $scope.view.viewid;
                            viewinfo.data = currentRow;
                            viewinfo.dataclone = panelRowClone;
                            viewinfo.applicationid = $scope.view.applicationid;
                            viewinfo.ask = $scope.view.ask;
                            viewinfo.osk = $scope.view.osk;
                            if ($scope.view.metadata.panelElementId) {
                                $('#innernestedtable_' + $scope[COMPONENT_ID]).width(($(window).width() / 2) - 30);
                                viewinfo.element = $("#" + $scope.view.metadata.panelElementId);
                                viewinfo.metadata.embedPanel = true;
                                var parentId = $scope.view[PARENT_COMPONENT_ID];
                                if (parentId) {
                                    var scope = $dataModel.getScope(parentId);
                                    if (scope) {
                                        $scope.view.metadata.resized = scope.view.metadata.resized;
                                        if (scope.view.metadata.resized) {
                                            var id = $('#nestedTable_' + $scope[COMPONENT_ID]);
                                            id.css({display:"table-cell"});
                                        } else {
                                            var id = $('#nestedTable_' + $scope[COMPONENT_ID]);
                                            id.css({display:"table-row"});
                                        }
                                    }
                                } else {
                                    var id = $('#nestedTable_' + $scope[COMPONENT_ID]);
                                    id.css({display:"table-row"});
                                }

                                viewinfo.metadata.insert = false
                                viewinfo.metadata.label = 'Detail';
                            }
                            viewinfo[PARENT_COMPONENT_ID] = $scope[COMPONENT_ID];
                            $viewStack.addView(viewinfo, $scope);
                        } catch (e) {
                            AppUtil.handleError(e, "openPanel");
                        }
                    };
                    $scope.onParentLabel = function () {
                        var parentInfo = $scope.view.metadata.parentInfo;
                        var parentView = $dataModel.getView(parentInfo.componentid);
                        $viewStack.addView(parentView, $dataModel.getScope(parentInfo.componentid));
                    }
                    $scope.onParallelView = function (viewIndex) {
                        try {
                            if (!$scope.view.metadata.views[viewIndex].clonemetadata) {
                                $scope.view.metadata.views[viewIndex].clonemetadata = angular.copy($scope.view.metadata.views[viewIndex].metadata);
                            }
                            $scope.view.metadata.views[viewIndex].metadata = angular.copy($scope.view.metadata.views[viewIndex].clonemetadata);
                            $scope.view.metadata.views[viewIndex][PARENT_COMPONENT_ID] = $scope[COMPONENT_ID];
                            $scope.view.metadata.views[viewIndex].element = $scope.view.element;
                            $scope.view.metadata.views[viewIndex].showas = "popup";
                            $viewStack.addView($scope.view.metadata.views[viewIndex], $scope);
                        } catch (e) {
                            AppUtil.handleError(e, "$scope.onParallelView");
                        }

                    }
                    $scope.onNestedView = function (nestedIndex) {
                        $viewStack.closeChildView($scope[COMPONENT_ID]);
                        var parentId = $scope.view[PARENT_COMPONENT_ID];    // for panel in nested table
                        if (parentId) {
                            var scope = $dataModel.getScope(parentId);
                            if (scope) {
                                $scope.view.metadata.resized = scope.view.metadata.resized;
                                if (scope.view.metadata.resized) {
                                    $scope.nestedViewWidth = $(window).width() - 17;
                                }
                            }
                        }
                        var breadCrumbInfo = angular.copy($scope.view.metadata.breadCrumbInfo);
                        $scope.populateBreadCrumbInfo(breadCrumbInfo);
                        $scope.view.metadata.panelView = false
                        var currentRow = $scope.view.currentrow;
                        var selectedKeys = $dataModel.getSelectedKeys($scope[COMPONENT_ID]);
                        var selectedKeysCount = selectedKeys ? selectedKeys.length : 0;
                        if (selectedKeysCount > 1) {
                            AppUtil.showShortMessage("More than one row selected !");
                            return;
                        } else if (selectedKeysCount == 1) {
                            currentRow = selectedKeys[0];
                        } else if (!currentRow) {
                            AppUtil.showShortMessage("No row selected");
                            return;
                        }

                        var column = $scope.view.metadata.nestedColumns[nestedIndex];
                        var currentView = $scope.view;
                        var row = currentRow;
                        var nestedColumns = AppUtil.getNestedColumns(currentView.metadata.columns, column.expression);
                        if (nestedColumns) {
                            for (var i = 0; i < nestedColumns.length; i++) {
                                var col = nestedColumns[i]
                                if (col.pexpression && column.expression == col.pexpression) {
                                    col[SHOW_ON_TABLE] = col[SHOW_ON_PANEL];
                                }

                            }
                        }

                        $dataModel.populateFlexField(currentView.metadata, currentRow, nestedColumns, column.expression);
                        var nestedMetaData = {columns:nestedColumns, table:currentView.metadata.table, "type":"table"};
                        nestedMetaData.parentInfo = {label:$scope.view.metadata.label, componentid:$scope.componentid};
                        /*To show main form label on inner nested table*/
                        nestedMetaData.parameters = $scope.row;
                        nestedMetaData.clientDelete = true;
                        nestedMetaData.warning = false;
                        nestedMetaData.navigation = false;
                        nestedMetaData.headerscroll = true;
                        nestedMetaData.noWatch = true;
                        nestedMetaData.embed = true;
                        nestedMetaData.enablequickviewaction = false;
                        nestedMetaData.enablemetadataaction = false;
                        nestedMetaData.delete = true;
                        nestedMetaData.insert = true;
                        nestedMetaData.close = false;
                        nestedMetaData.refresh = false;
                        nestedMetaData.save = false;
                        nestedMetaData.enableSelection = true;
                        nestedMetaData.enablerowaction = false;
                        nestedMetaData.insertMode = 'table';
                        nestedMetaData.resize = false;
                        nestedMetaData.label = column.label;
                        nestedMetaData.toolBarTitle = true;
                        nestedMetaData.popUpTitle = false;
                        nestedMetaData.insertDirection = "down";
                        nestedMetaData.ftsSearch = false;
                        if (breadCrumbInfo && breadCrumbInfo.length > 0) {
                            nestedMetaData.breadCrumbInfo = breadCrumbInfo;
                        }
                        var aggregateExp = "_aggregates." + column.expression;
                        var defaultFilterExp = "_filters." + column.expression;
                        nestedMetaData.dataExpression = "view.data." + column.expression;
                        nestedMetaData.dataAggregateExpression = "view.data." + aggregateExp;
                        nestedMetaData.defaultFilterExpression = "view.data." + defaultFilterExp;
                        var expression = column.expression;
                        AppUtil.resolve(row, expression, true, "array");
                        AppUtil.resolve(row, aggregateExp, true);
                        var view = {"metadata":nestedMetaData, "data":row};
                        view.ask = currentView.ask;
                        view.osk = currentView.osk;
                        view.applicationid = currentView.applicationid;
                        view[PARENT_COMPONENT_ID] = $scope[COMPONENT_ID];
                        view.element = $scope.view.element;
                        $viewStack.addView(view, $scope);
                    }
                    $scope.populateBreadCrumbInfo = function (breadCrumbInfo, breadCrumblabel) {
                        if (breadCrumblabel && breadCrumblabel.length > 0) {
                            breadCrumbInfo.push({title:$scope.view.metadata.label + " (" + breadCrumblabel + ")", label:$scope.view.metadata.label + " (" + AppUtil.breakBreadCrumbLabel(breadCrumblabel) + ")", componentid:$scope[COMPONENT_ID]});
                            return;
                        }
                        var breadCrumbColumn = false;
                        for (var i = 0; i < $scope.view.metadata.columns.length; i++) {
                            if ($scope.view.metadata.columns[i].breadcrumb) {
                                breadCrumbColumn = $scope.view.metadata.columns[i];
                                /*Priority to breadcrumb column*/
                                break;
                            }
                        }

                        if (breadCrumbColumn) {
                            var value = $scope.getColumnValue($scope.view.currentrow, breadCrumbColumn);
                            if (value !== undefined && value.toString().length > 0) {
                                breadCrumbInfo.push({title:$scope.view.metadata.label + " (" + value + ")", label:$scope.view.metadata.label + " (" + AppUtil.breakBreadCrumbLabel(value) + ")", componentid:$scope[COMPONENT_ID]});
                                return;
                            }
                        }

                        var key = AppUtil.resolve($scope.view.currentrow, $scope.view.metadata[PRIMARY_COLUMN]);
                        var index = $dataModel.getIndex(key, $scope[COMPONENT_ID], $scope.view.metadata[PRIMARY_COLUMN]);
                        breadCrumbInfo.push({title:$scope.view.metadata.label + " (" + (index + 1) + ")", label:$scope.view.metadata.label + " (" + (index + 1) + ")", componentid:$scope[COMPONENT_ID]});
                    }

                    $scope.onRowActionClick = function (action) {
                        $scope.view.metadata.lastRowAction = action;
                        $scope.view.metadata.editMode = false;
                        var actionType = action.type;
                        if (actionType == 'detail') {
                            $scope.openPanel(false);
                        } else if (actionType == 'Child') {
                            var currentRow = $dataModel.getCurrentRow($scope[COMPONENT_ID]);
                            var clone = angular.copy(action);
                            var currentRowClone = angular.copy(currentRow);
                            var relatedColumn = clone.relatedcolumn;
                            var v = $scope.view;
                            var viewPrimaryColumn = v.metadata[PRIMARY_COLUMN];
                            var parameterMappings = action.parametermappings || {};
                            var viewParameterMappings = v.metadata.parametermappings;
                            var breadCrumbInfo = angular.copy($scope.view.metadata.breadCrumbInfo);
                            $scope.populateBreadCrumbInfo(breadCrumbInfo);

                            if (viewParameterMappings) {
                                Object.keys(viewParameterMappings).forEach(function (k) {
                                    parameterMappings[k] = k;
                                });
                            }
                            var parameters = v.metadata.parameters || {};
                            var filter = {};
                            if (clone.filter && angular.isObject(clone.filter)) {
                                filter = clone.filter;
                            }
                            Object.keys(parameterMappings).forEach(function (k) {
                                var param = parameterMappings[k];
                                var val = AppUtil.resolve(currentRowClone, param);
                                if (val !== undefined) {
                                    parameters[param] = val;
                                }
                            });
                            Object.keys(currentRowClone).forEach(function (k) {
                                parameters[k] = currentRowClone[k];
                            });
                            if (action.$default) {
                                parameters.$default = action.$default
                                parameterMappings.$default = "$default";
                            } else {
                                delete parameters.$default;
                                delete parameterMappings.$default;
                            }
                            clone[PARENT_COMPONENT_ID] = $scope[COMPONENT_ID];

                            if (breadCrumbInfo && breadCrumbInfo.length > 0) {
                                clone.breadCrumbInfo = breadCrumbInfo;
                            }

                            clone.ask = $scope.view.ask;
                            clone.osk = $scope.view.osk;
                            clone.source = clone._id;


                            var requiredParameters = {};
                            if (parameterMappings) {
                                for (var parameterMappingKey in parameterMappings) {
                                    var parameterMappingVal = parameterMappings[parameterMappingKey];
                                    requiredParameters[parameterMappingKey] = parameters[parameterMappingVal];
                                }
                            }
                            clone.parameters = requiredParameters;
                            clone.$parent = {action:action};    // $default expression it should be managed by child view i.e. once set to true shoukld be applied for ction in next row
                            clone.viewid = clone.baasviewid.id;
                            $viewStack.addView(clone, $scope);
                        } else if ((/invoke/i).test(actionType)) {
                            $scope.invokeMethod(action.$index, $dataModel.getCurrentRow($scope[COMPONENT_ID]), false);
                        } else {
                            AppUtil.handleError("Invalid Row action", "Alert");
                        }
                    };
                    $scope.close = function (action) {
                        $viewStack.closeView($scope.componentid);
                    };
                    $scope.insert = function (action) {
                        var showPanel = true;
                        if (!$scope.view.metadata.panelView && $scope.view.metadata.insertMode && $scope.view.metadata.insertMode == 'table') {
                            showPanel = false;
                        }

//                        if ($scope.view.metadata.openPanel) {
//                            $dataModel.getScope($scope.view[PARENT_COMPONENT_ID]).insert();
//                        } else {
                        var componentId = $scope[COMPONENT_ID];
                        if (showPanel) {
                            $scope.view.metadata.lastRowAction = {type:"detail"};
                            $scope.view.metadata.editMode = false;
                            $dataModel.insert(componentId);
                            $scope.openPanel(true);
                        } else {
                            $dataModel.insert(componentId);
                        }
//                        }
                    };
                    $scope.save = function () {
                        $timeout(function () {
                            var callback = $scope.view.metadata.savecallback;
                            var refreshOnSave = AppUtil.isTrueOrUndefined($scope.view.metadata.refreshOnSave);
                            var closeonsave = $scope.view.metadata.closeonsave;
                            if (callback) {
                                var data = AppUtil.resolve($scope, $scope.view.metadata.dataExpression);
                                var updates = $dataModel.getUpdates($scope[COMPONENT_ID]);
                                if (closeonsave) {
                                    $scope.close();
                                }
                                callback(data, updates);
                                return;
                            }
                            var compId = $scope.componentid;
                            if ($scope.view.metadata.saveParent) {
                                compId = $scope.view[PARENT_COMPONENT_ID];
                            }
                            $dataModel.save(compId, refreshOnSave, function (data) {
                                $viewStack.closeChildView(compId);
                                /* msg= that display as Short Message, Modal: true/false( true= Other options are not clickable,
                                 false=Other options are clickable ), time= visibility time of ShortMessage */
                                $scope.appData.shortMessage = {"msg":'Data Saved', "modal":false, "time":10000, className:'app-background-orange'};
                                if ($scope.view.metadata.aftersavecallback) {
                                    $scope.view.metadata.aftersavecallback(data);
                                }
                                if (closeonsave) {
                                    $scope.close();
                                }
                            });
                        }, 100);
                    };
                    $scope.onDefaultValueClick = function (index) {
                        var action = $scope.view.metadata.userHeaderActions[index];
                        $scope.view.metadata.parameters = $scope.view.metadata.parameters || {};
                        $scope.view.metadata.parameters.$default = !$scope.view.metadata.parameters.$default;
                        if ($scope.view.metadata.$parent && $scope.view.metadata.$parent.action) {
                            $scope.view.metadata.$parent.action.$default = $scope.view.metadata.parameters.$default;
                        }
                        if ($scope.view.metadata.parameters.$default) {
                            action.label = action.label.replace("Enable Default", "Disable Default");
                            $dataModel.refresh($scope.view[COMPONENT_ID]);
                        } else {
                            action.label = action.label.replace("Disable Default", "Enable Default");
                        }
                    };
                    $scope.refresh = function () {
                        var componentId = $scope.view.metadata.openPanel ? $scope.view[PARENT_COMPONENT_ID] : $scope.componentid;
//                        var newInserts = $dataModel.getUpdates($scope.componentid);
                        var newInserts = $dataModel.getUpdates(componentId);
                        var newInsertCount = newInserts.length;
                        if (newInsertCount > 0) {
                            var $confirmationScope = $scope.$new();
                            $confirmationScope.onconfirmation = function (option) {
                                $confirmationScope.confirmationPopUp.hide();
                                if (option == 'Ok') {
//                                    $dataModel.refresh($scope.componentid, function () {
//                                        $viewStack.closeChildView($scope.componentid);
//                                    });
                                    $dataModel.refresh(componentId, function () {
                                        $viewStack.closeChildView(componentId);
                                    });
                                }
                            };
                            var modal = {
                                template:"<app-confirmation onconfirm = 'onconfirmation' ></app-confirmation>",
                                scope:$confirmationScope,
                                autohide:false,
                                width:300,
                                height:150,
                                hideOnClick:false
                            };
                            $confirmationScope.confirmationoptions = {"body":"Your data has been modified. <br/> Abandon changes?", "title":"Confirmation Box", "options":["Ok", "Cancel"]};
                            $confirmationScope.confirmationPopUp = $viewStack.showPopup(modal);
                        } else {
                            $dataModel.refresh($scope.componentid, function () {
                                $viewStack.closeChildView($scope.componentid);
                            });
                        }
                    };
                    $scope.deleteData = function () {
                        var componentId = $scope.view.metadata.openPanel ? $scope.view[PARENT_COMPONENT_ID] : $scope.componentid;
//                        $dataModel.deleteData($scope.componentid);
                        $dataModel.deleteData(componentId);
                    };
                    $scope.viewResize = function () {
                        $viewStack.viewResize($scope.componentid);
                    };
                    $scope.loadView = function (action) {
                        var useCurrentRow = action[USER_CURRENT_ROW];
                        if (useCurrentRow) {
                        } else {
                            var clone = angular.copy(action.view);
                            clone[PARENT_COMPONENT_ID] = $scope[COMPONENT_ID];
                            $viewStack.addView(clone, $scope);
                        }
                    };
                    $scope.update = function () {
                        var selectedKeys = $dataModel.getSelectedKeys($scope[COMPONENT_ID]);
                        var selectedKeyCount = selectedKeys.length;
                        if (selectedKeyCount == 0) {
                            AppUtil.handleError("Please select record to update.", "Alert");
                            return;
                        }
                        var viewinfo = {};
                        var panelColumns = [];
                        var columnCount = $scope.view.metadata.columns.length;
                        for (var i = 0; i < columnCount; i++) {
                            var col = $scope.view.metadata.columns[i];
                            if (col.update) {
                                panelColumns.push(angular.copy(col));
                            }
                        }
                        if (panelColumns.length == 0) {
                            AppUtil.handleError("No column has update property set to true.", "Alert");
                            return;
                        }
                        var data = {};
                        var panelmetadata = {"table":$scope.view.metadata.table, "columns":panelColumns, "type":"panel", "layout":"onecolumns"};
                        panelmetadata.label = "Update";
                        panelmetadata.save = true;
                        panelmetadata.dataExpression = "view.data";
                        panelmetadata.savecallback = function (updates) {
                            if (updates) {
                                Object.keys(updates).forEach(function (k) {
                                    var val = updates[k];
                                    if (val !== undefined && val !== null) {
                                        for (var j = 0; j < selectedKeyCount; j++) {
                                            var selectedKey = selectedKeys[j];
                                            selectedKey[k] = val;
                                        }
                                    }
                                })
                            }
                            $scope.save();
                        };
                        panelmetadata.refresh = false;
                        panelmetadata.ftsSearch = false;
                        panelmetadata.delete = false;
                        panelmetadata.insert = false;
                        panelmetadata.navigation = false;
                        panelmetadata.closeonsave = true;
                        panelmetadata.enablemetadataaction = false;
                        viewinfo.metadata = panelmetadata;
                        viewinfo.data = data;
                        viewinfo.applicationid = $scope.view.applicationid;
                        viewinfo.ask = $scope.view.ask;
                        viewinfo.osk = $scope.view.osk;
                        viewinfo.width = 600;
                        viewinfo[SHOW_AS] = "popup";
//                        viewinfo[PARENT_COMPONENT_ID] = $scope[COMPONENT_ID];
                        $viewStack.addView(viewinfo, $scope);
                    };
                },
                post:function ($scope, iElement) {
                    if ($scope.view.metadata.quickviews && $scope.view.metadata.quickviews.length > 0 && $scope.view.metadata.quickviewindex >= 0) {
                        if (!$scope.view.metadata.label) {
                            $scope.view.metadata.label = $scope.view.metadata.quickviews[$scope.view.metadata.quickviewindex].label;
                        }
                        var quickViewsCollection = {label:$scope.view.metadata.quickviews[$scope.view.metadata.quickviewindex].label, "display":["label"], options:$scope.view.metadata.quickviews, "settingimage":"images/savequickview.png", selectedIndex:$scope.view.metadata.quickviewindex};
                        $scope.view.quickViewsCollection = quickViewsCollection;
                        $scope.$watch("view.quickViewsCollection.selectedIndex", function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue) && oldValue !== undefined && newValue !== undefined && newValue >= 0) {

                                var quickView = $scope.view.quickViewsCollection.options[newValue];
                                var newView = {};
                                newView.source = $scope.view.metadata.source;
                                newView.viewid = quickView.baasviewid.id;
                                newView.ask = $scope.view.ask;
                                newView.osk = $scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk;
                                newView.menuid = $scope.view.metadata.menuid;
                                $scope.appData.currentView = newView;
                            }
                        });
                    }
                    $scope.operator = ["$eq", "$ne", "$in", "$nin"];
                    $scope.numberFilteroperator = ["$gt", "$lt", "$gte", "$lte", "$ne", "$eq"];

                    var viewType = $scope.view.metadata.type;
                    var viewTemplate = "";
                    if (viewType == "table") {
                        viewTemplate = "<app-grid></app-grid>";
                    } else if (viewType == "panel") {
                        viewTemplate = "<app-panel></app-panel>";
                    } else if (viewType == "html") {
                        viewTemplate = "<app-html-view></app-html-view>";
                    } else {
                        AppUtil.handleError("Not valid view type[" + viewType + "]", "Alert");
                    }
                    $dataModel.setScope($scope[COMPONENT_ID], $scope);
                    var viewElement = $compile(viewTemplate)($scope);
                    iElement.append(viewElement);
                }
            }
        }
    }
}])
;
appStrapDirectives.directive("appRowAction", ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:false,
        scope:true,
        template:"<div class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-repeat='action in actions' ng-bind='action.label' ng-click='onRowActionClick(action)'></div>"
    };
}]);
appStrapDirectives.directive("appGrid", ["$parse", "$compile", "$dataModel", "$viewStack", "$timeout", function ($parse, $compile, $dataModel, $viewStack, $timeout) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='app-grid'></div>",
        compile:function () {
            return {
                pre:function ($scope, iElement) {
                    $scope.editMode = false;
                    $scope.__selectall__ = false;
                    $scope.dragDivVisibility = false;
                    $scope.setEditMode = function (editMode) {
                        $scope.editMode = editMode;
                    };
                    $scope.setLeftButtonDown = function (val) {
                        $scope.leftButtonDown = val;
                    };
                    $scope.setCurrentHeaderCell = function (headerCell) {
                        $scope.headerCell = headerCell;
                    };
                    $scope.setDopColumnIndex = function (index) {
                        $scope.dropColumnIndex = index;
                    };
                    $scope.showDragDiv = function () {
                        $scope.dragDivVisibility = true;
                        if ($scope.dropColumnIndex !== undefined) {
                            var columns = $scope.view.metadata.tableColumns;
                            var count = columns ? columns.length : 0;
                            if (count > 0) {
                                var column = columns[$scope.dropColumnIndex];
                                var label = column.label;
                                $scope.dragDivLabel = label;
                            }
                        }
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };
                    $scope.hideDragDiv = function () {
                        $scope.dragDivVisibility = false;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };
                    $scope.getDopColumnIndex = function () {
                        return $scope.dropColumnIndex;
                    };
                    $scope.getCurrentHeaderCell = function () {
                        return $scope.headerCell;
                    };
                    $scope.setCurrentRow = function (row) {
                        $scope.currentRow = row;
                        $dataModel.setCurrentRow($scope[COMPONENT_ID], row);
                    };
                    $scope.rowActionButtonClick = function (row, $event) {
                        $dataModel.setCurrentRow($scope[COMPONENT_ID], row);
                        var rowActionScope = $scope.$new();
                        var modal = {
                            template:"<div><app-row-action ng-init=\"actions=view.metadata.rowactions\"></app-row-action></div>",
                            scope:rowActionScope,
                            hideonclick:true,
                            element:$event.target
                        };
                        $viewStack.showPopup(modal);
                    };
                    $scope.toggleTree = function (row) {
                        $dataModel.toggleTree(row, $scope.componentid);
                    };
                    $scope.addWatch = function () {
                        if ($scope.view.metadata.visibleAffectedColumns && $scope.view.metadata.visibleAffectedColumns.length > 0) {
                            $scope.$watch("view.metadata.parameters", function (newValue, oldValue) {
                                if (angular.equals(oldValue, newValue)) {
                                    return;
                                }
                                //parameters get changed
                                for (var i = 0; i < $scope.view.metadata.visibleAffectedColumns.length; i++) {
                                    var column = $scope.view.metadata.visibleAffectedColumns[i];
                                    var visibleexpression = column[VISIBLE_EXPRESSION];
                                    if (visibleexpression !== undefined && visibleexpression.toString().length > 0) {
                                        try {
                                            var visible = false;
                                            if (visibleexpression === true || visibleexpression === false) {
                                                visible = visibleexpression;
                                            } else if (visibleexpression === "true") {
                                                visible = true;
                                            } else if (visibleexpression === "false") {
                                                visible = false;
                                            } else {
                                                if (visibleexpression.indexOf('this') >= 0) {
                                                    visibleexpression = visibleexpression.replace(/this./g, "row.");
                                                }
                                                var getter = $parse(visibleexpression);
                                                var context = {row:$scope.view.metadata.parameters};
                                                var visbleVal = getter(context);
                                                if (visbleVal == true) {
                                                    visible = true;
                                                }
                                            }


                                            if (column.visible == visible) {
                                                continue;
                                            }
                                            column.visible = visible
                                            var colIndex = -1;


                                            for (var j = 0; j < $scope.view.metadata.tableColumns.length; j++) {
                                                if ($scope.view.metadata.tableColumns[j].expression == column.expression) {
                                                    colIndex = j;
                                                    break;
                                                }
                                            }
                                            var mainIndex = -1;
                                            for (var j = 0; j < $scope.view.metadata.columns.length; j++) {
                                                if ($scope.view.metadata.columns[j].expression == column.expression) {
                                                    mainIndex = j;
                                                    break;
                                                }
                                            }

                                            if (visible) {
                                                if (colIndex < 0 && mainIndex >= 0) {
                                                    /*add one before last, as last column is zero width column*/
//                                                    $scope.view.metadata.columns.splice($scope.view.metadata.columns.length - 1, 0, column);
                                                    var afterColumnIndex = -1;
                                                    for (var j = mainIndex + 1; j < $scope.view.metadata.columns.length; j++) {
                                                        var mainColumnExp = $scope.view.metadata.columns[j].expression;
                                                        afterColumnIndex = AppUtil.getIndexFromArray($scope.view.metadata.tableColumns, "expression", mainColumnExp);
                                                        if (afterColumnIndex !== undefined) {
                                                            break;
                                                        }
                                                    }
                                                    if (afterColumnIndex === undefined || afterColumnIndex < 0) {
                                                        afterColumnIndex = $scope.view.metadata.tableColumns.length - 1;
                                                    }
                                                    if (afterColumnIndex >= 0) {
                                                        $scope.view.metadata.tableColumns.splice(afterColumnIndex, 0, column);
                                                    }


                                                }
                                            } else {
                                                if (colIndex >= 0) {
                                                    $scope.view.metadata.tableColumns.splice(colIndex, 1);
                                                }
                                            }
                                        } catch (e) {
                                            AppUtil.handleError(e, "addWatch in Appgrid");
                                        }
                                    }
                                }

                            }, true);
                        }
                    }
                    $scope.populateMetaData = function () {
                        var metadata = $scope.view.metadata;

                        metadata.edit = AppUtil.isTrueOrUndefined(metadata.edit);


                        var rowactions = [];
                        var groupColumns = [];
                        if (AppUtil.isTrueOrUndefined(metadata.enablerowaction)) {
                            rowactions.push({"type":"detail", "label":"View detail"});
                        }
                        if (metadata.userRowActions) {
                            for (var i = 0; i < metadata.userRowActions.length; i++) {
                                var action = metadata.userRowActions[i];
                                rowactions.push({type:action.type, label:action.label, $index:i});
                            }
                        }

                        if (metadata.childs) {
                            for (var i = 0; i < metadata.childs.length; i++) {
                                metadata.childs[i].type = metadata.childs[i].type || "child";
                                rowactions.push(metadata.childs[i]);
                            }
                        }

                        var columns = metadata.columns;
                        var columnCount = columns ? columns.length : 0;
                        var hasIndex = AppUtil.getIndexFromArray(columns, UI, UI_TYPE_INDEX) !== undefined;

                        metadata.rowactions = rowactions;
                        /*check for group column and tree column*/
                        var groupColumns = [];
                        if (metadata.orders) {
                            for (var orderExp in metadata.orders) {
                                var order = metadata.orders[orderExp];
                                var $group = undefined;
                                var $order = order;
                                if (angular.isObject(order)) {
                                    $group = order.$group;
                                    $order = order.$order;
                                }

                                for (var j = 0; j < columnCount; j++) {
                                    var columnExp = columns[j].expression;

                                    if (orderExp == columnExp) {
                                        columns[j].order = $order;
                                        if (order.$recursive) {
                                            metadata.$recursivecolumn = orderExp;
                                        }
                                        if ($group) {
                                            var groupColumn = angular.copy(columns[j]);
                                            var aggregateColumns = order.$columns;
                                            var newAggColumns = [];
                                            Object.keys(aggregateColumns).forEach(function (k) {
                                                for (var l = 0; l < columnCount; l++) {
                                                    var aggColExp = columns[l].expression;
                                                    if (aggColExp == k) {
                                                        newAggColumns.push(columns[l]);
                                                        break;
                                                    }
                                                }
                                            });
                                            //TODO use AppUtil.getNestedColumns
                                            var groupColumnsTemp = AppUtil.getNestedColumns(columns, groupColumn.expression);
                                            if (groupColumnsTemp) {
                                                for (var k = 0; k < groupColumnsTemp.length; k++) {
                                                    var columnUi = groupColumnsTemp[k][UI];
                                                    if (columnUi == UI_TYPE_AGGREGATE) {
                                                        var clone = angular.copy(groupColumnsTemp[k]);
                                                        clone.expression = groupColumn.expression + "." + clone.expression;
                                                        AppUtil.pushIfNotExists(clone, false, newAggColumns, "expression");
                                                    }

                                                }
                                            }
                                            groupColumn.columns = newAggColumns;
                                            groupColumns.push(groupColumn);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        if (groupColumns.length > 0) {
                            metadata.groupColumns = groupColumns;
                        }
                        var newColumns = [];
                        if (AppUtil.isTrueOrUndefined(metadata.enableSelection)) {
                            var selectionColumn = {"style":{"width":"20px"}, "width":20, enableCellEdit:false, cellTemplate:"<input style='margin-left: 3px;' tabindex='-1' type='checkbox' ng-model='row.__selected__' />", "ui":"selection", "tabindex":-1, 'resizeable':false, 'reorderable':false};
                            selectionColumn[SHOW_ON_TABLE] = true;
                            newColumns.push(selectionColumn);
                        }
                        if (hasIndex) {
                            var rowSerialNumberColumn = {"style":{"width":"30px"}, "width":30, enableCellEdit:false, cellTemplate:'', "ui":"sr", "tabindex":-1, 'resizeable':false, 'reorderable':false};
                            rowSerialNumberColumn[SHOW_ON_TABLE] = true;
                            newColumns.push(rowSerialNumberColumn);
                        }
                        if (rowactions.length > 0) {
                            var rowAction = {"style":{"width":"20px"}, "width":20, enableCellEdit:false, cellTemplate:"<div style=\"width:100%;height:20px;\" ng-click='rowActionButtonClick(row,$event)' class='app-row-action-arrow app-cursor-pointer'></div>", "tabindex":-1, 'resizeable':false, 'reorderable':false};
                            rowAction[SHOW_ON_TABLE] = true;
                            newColumns.push(rowAction);
                        }

                        var filters = [];
                        var appliedfilters = [];
                        var update = false;
                        var hasGroupColumnAdded = false;
                        metadata.nestedColumns = [];
                        metadata.visibleAffectedColumns = [];
                        for (var i = 0; i < columnCount; i++) {
                            /*if fllter is not in filter parameters and has in filter then we have to show its visibility to none*/
                            var column = angular.copy(columns[i]);
                            var filterApplied = $dataModel.handleColumnVisibilityWithFilter(column.expression, $scope.view.metadata.filter);
                            column.visible = !filterApplied;


                            if (column[UI] == UI_TYPE_COMPOSITE_LOOK_UP || column[UI] == UI_TYPE_LOOK_UP || (column[UI] == UI_TYPE_STRING && (column.lookupquery || (column.options && column.options.length > 0))) || column[UI] == UI_TYPE_RANGE || column[UI] == UI_TYPE_DATE || column[UI] == UI_TYPE_SCHEDULE || column[UI] == UI_TYPE_NUMBER || column[UI] == UI_TYPE_DECIMAL) {
                                columns[i][FILTERABLE_COLUMN] = AppUtil.isTrueOrUndefined(columns[i][FILTERABLE_COLUMN]);
                            }

                            if (!column[SHOW_ON_TABLE]) {
                                continue;
                            }

                            if (column[UI] == UI_TYPE_TABLE) {
                                metadata.nestedColumns.push(column);
                                continue;
                            }

                            if (groupColumns.length > 0) {
                                var groupColFound = false;
                                for (var j = 0; j < groupColumns.length; j++) {
                                    var gc = groupColumns[j];
                                    if (column.expression && ((column.expression == gc.expression) || (column.expression.indexOf(gc.expression + ".") == 0))) {
                                        groupColFound = true;
                                        break;
                                    }
                                }
                                if (groupColFound) {
                                    continue
                                }
                            }

                            if (column[UI] == UI_TYPE_INDEX) {
                                continue;
                            }

                            update = update || column.update;

                            column.style = column.style || {};
                            if (groupColumns.length > 0 && !hasGroupColumnAdded) {
                                column.width = 500;
                                column.style.width = 500;
                                hasGroupColumnAdded = true;
                                column.$groupcolumn = true;
                            }
                            if (!column.width) {
                                column.minWidth = 200;
                                column.style["min-width"] = "200px";
                            } else {
                                column.style.width = column.width + "px";
                            }
                            column.id = column.id || $scope[COMPONENT_ID] + "_" + i;


                            AppUtil.populateColumn(column, $scope.view.metadata.type, "row", undefined, undefined, $scope, $dataModel);


                            var visibleexpression = column[VISIBLE_EXPRESSION];
                            if (visibleexpression !== undefined && visibleexpression.toString().length > 0) {
                                try {
                                    if ((visibleexpression === true || visibleexpression === false)) {
                                        column.visible = visibleexpression;
                                    } else if (visibleexpression === "true") {
                                        column.visible = true;
                                    } else if (visibleexpression === "false") {
                                        column.visible = false;
                                    } else {
                                        metadata.visibleAffectedColumns.push(column);
                                        if (visibleexpression.toString().indexOf('this') >= 0) {
                                            visibleexpression = visibleexpression.replace(/this./g, "row.");
                                        }
                                        var getter = $parse(visibleexpression);
                                        var context = {row:$scope.view.metadata.parameters};
                                        var visibleVal = getter(context);
                                        if ((visibleVal == false || visibleVal == "false") && visibleVal !== undefined) {
                                            column.visible = false;
                                        }
                                    }

                                } catch (e) {
                                    AppUtil.handleError("Problem in resolving visible expression>>>" + e.message + "\n" + visibleexpression + "\n" + e.stack, "Error in populateMetaData");
                                }
                            }
                            if (column.visible === undefined || column.visible) {
                                newColumns.push(column);
                            }
                        }
                        metadata.update = update;
                        var zeroWidthColumn = {editable:false, "cellTemplate":"", "tabindex":-1, style:{"padding":"0px"}, id:$scope.componentid + "_zerowidth", 'resizeable':false, 'reorderable':false};
                        newColumns.push(zeroWidthColumn);
                        $scope.addWatch();

                        for (var i = 0; i < columnCount; i++) {
                            AppUtil.populateColumn(columns[i], $scope.view.metadata.type, "row", filters, appliedfilters, $scope, $dataModel);
                        }

                        if (metadata.defaultFilters !== undefined) {
                            filters = [];
                            appliedfilters = [];
                            if (metadata.defaultFilters instanceof Array) {
                                metadata.viewfilters = metadata.defaultFilters;
                            } else {
                                metadata.viewfilters = metadata.defaultFilters.filters;
                            }
                            for (var i = 0; i < metadata.viewfilters.length; i++) {
                                AppUtil.populateColumn(metadata.viewfilters[i], $scope.view.metadata.type, "row", filters, appliedfilters, $scope, $dataModel);
                            }
                            metadata.viewfilters = filters;
                        } else {
                            metadata.viewfilters = filters;
                            if (metadata.userFilters) {
                                for (var i = 0; i < metadata.userFilters.length; i++) {
                                    if ($dataModel.isFilterApplied(metadata.userFilters[i].expression, $scope.view.metadata.filterparameters)) {
                                        appliedfilters.push(metadata.userFilters[i]);
                                    }
                                    metadata.viewfilters.push(metadata.userFilters[i]);
                                }
                            }
                        }
                        metadata.appliedfilters = appliedfilters;
                        metadata.tableColumns = newColumns;
                        var rowActions = metadata.rowactions;
                        if (rowActions) {
                            var rowActionCount = rowActions.length;
                            for (var i = 0; i < rowActionCount; i++) {
                                rowActions[i][USER_CURRENT_ROW] = true;
                            }
                        }
                    }
                },
                post:function ($scope, iElement) {
                    try {
                        $scope.populateMetaData();
                        var id = TOOL_BAR_ID + '_' + $scope.view[COMPONENT_ID];
                        var toolBarTemplate = "<div class='app-tool-bar' ng-class='{\"app-float-left\":!view.metadata.embed}' app-tool-bar id='" + id + "'></div>";
                        var toolBarElement = $compile(toolBarTemplate)($scope);
                        var embedHTML = "";
                        var showAs = $scope.view[SHOW_AS];

                        if ($scope.view.metadata.embed || $scope.view.metadata.panelElementId) {
                            embedHTML = toolBarTemplate;
                        } else if (showAs == 'popup') {
                            iElement.append(toolBarElement);
                        } else {
                            if ($scope.view[PARENT_COMPONENT_ID]) {
                                var parentId = TOOL_BAR_ID + '_' + $scope.view[PARENT_COMPONENT_ID];
                                $('#' + parentId).hide();
                            }
                            $('#' + TOOL_BAR_ID).append(toolBarElement);
                        }
                        var headerscroll = $scope.view.metadata.headerscroll;
                        var dataExpression = $scope.view.metadata.dataExpression;
                        var aggregateExpression = $scope.view.metadata.dataAggregateExpression;
                        var template = "";
                        if (headerscroll) {

                            if ($scope.view[SHOW_AS] != 'popup') {
                                template = "<div id='innernestedtable_{{componentid}}' style='overflow-x:auto;height:calc(100% - 30px);width:{{nestedViewWidth}}px;overflow-y:hidden;'  " +
                                    "ng-show='!view.metadata.panelView || view.metadata.resized'>";
                            } else {
                                template = "<div style='max-height:350px;overflow-y:scroll;width:100%;' ng-show='!view.metadata.panelView'>";
                            }
                            template += "<table style='width: 100%;' cellpadding='0' cellspacing='0'>" +
                                "<thead class='applane-grid-header' id='{{componentid}}_head'>" +
                                "<th applane-grid-header-cell ng-repeat='col in view.metadata.tableColumns' class='draggable'></th>" +
                                "</thead>" +
                                "<tbody class='applane-grid-body'>" +
                                "<tr style='height:25px;' ng-class-even=\"'applane-grid-row-even'\" ng-class-odd=\"'applane-grid-row-odd'\" ng-repeat='row in " + dataExpression + "'>" +
                                "<td applane-grid-cell class='applane-grid-cell draggable'  ng-repeat=' col in view.metadata.tableColumns' tabindex=0 ng-style='col.style' style='max-width:100px;' ng-switch on='col.ui'>" +
                                "<span ng-switch-when='string' ng-bind='row[col.expression]' ></span>" +
                                "<span ng-switch-default ng-bind='col.ui' ></span>" +
                                "</td>" +
                                "</tr>";
                            for (var i = 0; i < $scope.view.metadata.tableColumns.length; i++) {
                                if ($scope.view.metadata.tableColumns[i][TOTAL_AGGREGATES]) {
                                    template += "<tr ng-show='" + aggregateExpression + "' class='app-border-top-black app-border-bottom-black' ng-init='row=" + aggregateExpression + "'>" +
                                        "<td style='border:none;' class='applane-grid-cell draggable' ng-repeat='col in view.metadata.tableColumns' ng-style='col.style'>{{row[col.expression] | json}}</td>" +
                                        "</tr>";
                                    break;
                                }
                            }
                            template += "</tbody>" +
                                "</table>" +
                                "</div>" +

                                "<div class='app-padding-five-px app-width-fifty-px app-position-fixed app-border app-light-gray-backgroud-color app-font-weight-bold app-box-shadow app-text-align-center app-display-none' id='{{componentid}}rowDrag'></div>";

                            if ($scope.view[SHOW_AS] != 'popup') {
                                template += "<div id='{{componentid}}-col-resize' class='app-col-resize app-cursor-col-resize draggable' ></div>" + "<div id='{{componentid}}-col-drag' ng-show='dragDivVisibility' class='dragable_background app-text-align-center draggable app-position-fixed app-top-position-zero app-table-head-background app-blue-text-color app-line-height-twenty-four app-border app-box-shadow' ng-bind='dragDivLabel' style='height:25px;'></div>";
                            }
                        } else {
                            template = "<div class='app-container'>" +
                                "<div class='app-wrapper'><div class='app-wrapper-child'>" +
                                "<div style='display: table;table-layout:fixed;width: 100%;height: 100%;'>" +
                                "<div style='overflow: hidden;display: table-row;'>" +
                                "<div style='position: relative;width: 100%;'>" +
                                "<div style='overflow-x: hidden;left: 0px;right: 0px;' id='{{componentid}}_head' applane-grid-header></div>" + "</div>" + "</div>" +
                                "<div style='display: table-row;height: 100%;'>" +
                                "<div style='position: relative;height: 100%;'>" +
                                "<div style='position: absolute;top:0px;left:0px;right:0px;bottom:0px;' class='grid-scroll' applane-grid-body id='{{componentid}}_body'></div>" +
                                "</div></div></div></div></div></div>";
                        }

                        if ($scope.view.metadata.embed || $scope.view.metadata.panelElementId) {
                            embedHTML += template;

                            var html = "<div id='nestedTable_{{componentid}}'" +
                                "style='height: inherit;vertical-align: top;' ng-class=\"{'app-display-table-cell':!view.metadata.panelView && !view.metadata.resized}\">" + embedHTML + "</div>";
                            html += '<div  style="display: table-cell;box-shadow: 1px 1px 7px #808080;height:inherit;" ' +
                                'ng-show="view.metadata.panelView" ' +
                                ' ng-class=\'{"app-display-table-cell-important":view.metadata.panelView,"app-width-fifty-one-percent":view.metadata.panelView && view.metadata.resized}\' ' +
                                'id="{{view.metadata.panelElementId}}" >' +
                                '</div>';
                            var element = $compile(html)($scope);
                            iElement.append(element);
                        } else {
                            var element = $compile(template)($scope);
                            iElement.append(element);
                        }

                        if ($scope.view.metadata.refreshonload) {
                            $scope.refresh();
                        }
                        $timeout(function () {
                            var tableBodyId = "#" + $scope.componentid + "_body";
                            var tableHeaderId = "#" + $scope.componentid + "_head";
                            $(tableBodyId).scroll(function () {
                                $(tableHeaderId).scrollLeft($(tableBodyId).scrollLeft());
                            });
                            /*check for minWidth*/
                            var newColumns = $scope.view.metadata.tableColumns;
                            var columCount = newColumns ? newColumns.length : 0;
                            for (var i = 0; i < columCount; i++) {
                                var column = newColumns[i];
                                var id = column.id;
                                var width = $("#" + id).width();
                                if (column.minWidth && width < column.minWidth) {
                                    column.style.width = column.minWidth + "px";
                                }
                            }
                        }, 0);
                        if ($scope.view[SHOW_AS] != 'popup') {
                            $timeout(function () {
                                $('#' + $scope.componentid + '-col-resize').bind('mousedown', function (e) {
                                    $('body').addClass('app-cursor-col-resize');
                                    $('body').bind('mouseup', function (e) {
                                        if ($('body').hasClass('app-cursor-col-resize')) {
                                            $('body').removeClass('app-cursor-col-resize');
                                            $("body").unbind('mousemove');
                                            $("body").unbind('mouseup');
                                        }
                                    });
                                    $('body').bind('mousemove', function (e) {
                                        var headerCell = $scope.getCurrentHeaderCell();
                                        if (headerCell) {
                                            var elementLeft = headerCell.element.offset().left;
                                            var width = e.pageX - elementLeft;
                                            $dataModel.columnReSize(headerCell, width, $scope[COMPONENT_ID]);
                                            $('#' + $scope.componentid + '-col-resize').css({'left':(elementLeft + width - 10) + 'px'});
                                            if (!$scope.$$phase) {
                                                $scope.$apply();
                                            }
                                        }
                                    });
                                });
                                $('#' + $scope[COMPONENT_ID] + '_head').bind('mousemove', function (e) {
                                    if ($('#' + $scope[COMPONENT_ID] + 'rowDrag').css('display') == 'block') {
                                        return;
                                    }
                                    if ($scope.leftButtonDown == true && $scope.dragDivVisibility == false) {
                                        $scope.showDragDiv();
                                    }
                                    $('#' + $scope.componentid + '-col-drag').css({'left':(e.pageX + 15) + "px"});
                                });
                                $('#' + $scope.componentid + '-col-drag').bind('mousemove', function (e) {
                                    if ($('#' + $scope[COMPONENT_ID] + 'rowDrag').css('display') == 'block') {
                                        return;
                                    }
                                    if ($scope.leftButtonDown == true && $scope.dragDivVisibility == false) {
                                        $scope.showDragDiv();
                                    }
                                    $('#' + $scope.componentid + '-col-drag').css({'left':(e.pageX + 15) + "px"});
                                });
                            }, 10);
                        }

                        AppUtil.handleToolBarHeight();
                        if ($scope.view.metadata.warnings) {
                            setTimeout(function () {
                                AppUtil.handleError(JSON.stringify($scope.view.metadata.warnings), "Error in opening view");
                                delete $scope.view.metadata.warnings;
                            }, 200)
                        }


                    } catch (e) {
                        AppUtil.handleError(e, "AppGrid");
                    }
                }
            }
        }
    }
}]);
appStrapDirectives.directive('appNestedView', [
    '$compile', '$viewStack', function ($compile, $viewStack) {
        return {
            restrict:'E',
            replace:true,
            scope:true,
            compile:function () {
                return {
                    pre:function ($scope, iElement) {
                    },
                    post:function ($scope, iElement) {
                        var column = $scope.colmetadata;

                        var currentView = $scope.view;
                        var row = $scope.row;
                        var columns = AppUtil.getNestedColumns($scope.view.metadata.columns, column.expression);
                        if (columns) {
                            for (var i = 0; i < columns.length; i++) {
                                var col = columns[i];
                                if (col.pexpression && column.expression == col.pexpression) {
                                    col[SHOW_ON_TABLE] = col[SHOW_ON_PANEL];
                                }

                            }
                        }


                        var nestedMetaData = {columns:columns, table:currentView.metadata.table, "type":"table"};
                        if (column.defaultFilters && (typeof column.defaultFilters == "string") && column.defaultFilters.toString().trim().length > 0) {
                            nestedMetaData.defaultFilters = JSON.parse(column.defaultFilters);
                            var filters = nestedMetaData.defaultFilters.filters;
                            if (filters && filters.length > 0)
                                for (var i = 0; i < filters.length; i++) {
                                    var ui = filters[i][UI] || filters[i][UI_PANEL];
                                    if (!ui && filters[i].type) {
                                        nestedMetaData.defaultFilters.filters[i][UI] = nestedMetaData.defaultFilters.filters[i].type;
                                    }
                                }
                        }
                        nestedMetaData.path = $scope.view.metadata.path + column.expression;
                        nestedMetaData.parameters = $scope.row;
                        nestedMetaData.clientDelete = true;
                        nestedMetaData.warning = false;
                        nestedMetaData.navigation = false;
                        nestedMetaData.headerscroll = true;
                        nestedMetaData.noWatch = true;
                        nestedMetaData.embed = true;
                        nestedMetaData.enablequickviewaction = false;
                        nestedMetaData.enablemetadataaction = false;
                        nestedMetaData.delete = true;
                        nestedMetaData.insert = true;
                        nestedMetaData.close = false;
                        nestedMetaData.refresh = false;
                        nestedMetaData.save = false;
                        nestedMetaData.panelElementId = column.panelElementId;
                        nestedMetaData.enableSelection = true;
                        nestedMetaData.insertDirection = column.insertDirection || "down";
                        nestedMetaData.resize = false;
                        nestedMetaData.ftsSearch = false;

                        if (column.viewDetail) {
                            nestedMetaData.enablerowaction = true;
                        } else {
                            nestedMetaData.insertMode = 'table';
                            nestedMetaData.enablerowaction = false;
                        }

                        nestedMetaData.label = column.label;
                        nestedMetaData.toolBarTitle = true;
                        nestedMetaData.popUpTitle = false;
                        var aggregateExp = "_aggregates." + column.expression;
                        var defaultFilterExp = "_filters." + column.expression;
                        nestedMetaData.dataExpression = "view.data." + column.expression;
                        nestedMetaData.dataAggregateExpression = "view.data." + aggregateExp;
                        nestedMetaData.defaultFilterExpression = "view.data." + defaultFilterExp;
                        var expression = column.expression;
                        AppUtil.resolve(row, expression, true, "array");
                        AppUtil.resolve(row, aggregateExp, true, "object");
                        var view = {"metadata":nestedMetaData, "data":row};
                        view.ask = currentView.ask;
                        view.osk = currentView.osk;
                        view.applicationid = currentView.applicationid;
                        view[PARENT_COMPONENT_ID] = $scope[COMPONENT_ID];
                        view.element = iElement;
                        $viewStack.addView(view, $scope);
                    }
                };
            }
        };
    }
]);
/**
 * App Services
 */
appStrapServices.factory('$appService', [
    function () {
        var $appService = {};
        $appService.getData = function (query, ask, osk, bussyMessage, callBack, errorCallBack) {
            if (!ask) {
                throw new Error("No ask found for saving");
            }
            var data = {"query":JSON.stringify(query), "ask":ask, "osk":osk};
            var that = this;
            var url = BAAS_SERVER + "/data";
            AppUtil.getDataFromService(url, data, "POST", "JSON", bussyMessage, function (callBackData) {
                callBack(callBackData);
            }, errorCallBack);
        };
        $appService.save = function (data, ask, osk, callBack) {
            if (!ask) {
                throw new Error("No ask found for saving in $appService.save");
            }
            var params = {"updates":JSON.stringify(data), "ask":ask, "osk":osk};
            var that = this;
            var url = BAAS_SERVER + "/data";
            AppUtil.getDataFromService(url, params, "POST", "JSON", "Saving...", function (callBackData, warnings) {
                callBack(callBackData, warnings);
            });
        };
        return $appService;
    }
]);
/**
 * DOM Services
 */
appStrapServices.factory('$viewStack', [
    '$rootScope', '$compile', '$http', '$timeout', '$dataModel', function ($rootScope, $compile, $http, $timeout, $dataModel) {
        var $viewStack = {
            "views":{},
            "popupviews":{}
        };
        $viewStack.showPopup = function (config) {
            var autoHide = config.autohide != undefined ? config.autohide : true;
            var deffered = config.deffered != undefined ? config.deffered : true;
            var modal = !autoHide;
            var escape = autoHide;
            var callBack = config.callBack;
            var position = config.position ? config.position : "center";
            var hideOnClick = config.hideonclick != undefined ? config.hideonclick : false;
            var p = new Popup({
                autoHide:autoHide,
                deffered:deffered,
                escEnabled:escape,
                hideOnClick:hideOnClick,
                html:$compile(config.template)(config.scope),
                scope:config.scope,
                element:config.element,
                position:position,
                width:config.width,
                height:config.height,
                callBack:callBack,
                maxHeight:config.maxHeight,
                minHeight:config.minHeight,
                overflowY:config.overflowY,
                width:config.width,
                removeOtherAutoHidePopup:config.removeOtherAutoHidePopup,
                maxWidth:config.maxWidth !== undefined ? config.maxWidth : $(window).width() - 100
            });
            p.showPopup();
            return p;
        };
        $viewStack.reOpen = function (v) {
            var newV = {};
            newV.viewid = v.viewid;
            newV.ask = v.ask;
            newV.osk = v.osk;
            newV.parameters = v.metadata.parameters;
            newV.filter = v.metadata.filter;
            newV[PARENT_COMPONENT_ID] = v[PARENT_COMPONENT_ID];
            newV.source = v.metadata.source;
            newV.menuid = v.metadata.menuid;
            var vScope = $dataModel.getScope(v[COMPONENT_ID]);
            this.addView(newV, vScope.$parent);
        };
        $viewStack.addView = function (view, $scope) {
            var componentId = undefined;
            if (view.metadata) {
                var parameters = view.metadata.parameters;
                if (!parameters) {
                    view.metadata.parameters = view.parameters;
                }
                if (!view[COMPONENT_ID]) {
                    componentId = AppUtil.getComponentId(COMPONENT_ID_KEY);
                } else {
                    componentId = view[COMPONENT_ID];
                }
                $viewStack.addViewToDom(view, componentId, $scope);
            } else {
                $scope.appData.currentView = view;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        };
        $viewStack.addViewToDom = function (view, componentId, $parentScope) {
            view[COMPONENT_ID] = componentId;
            if (view[CHILD_COMPONENT_ID]) {
                for (var i = 0; i < view[CHILD_COMPONENT_ID].length; i++) {
                    this.closeViewFromDom(view[CHILD_COMPONENT_ID][i]);
                }
            }
            view[CHILD_COMPONENT_ID] = [];
            var viewInfo = {};
            viewInfo[COMPONENT_ID] = componentId;
            /*datamodel and view will share same reference of child*/
            viewInfo[CHILD_COMPONENT_ID] = view[CHILD_COMPONENT_ID];
            var parentComponentId = view[PARENT_COMPONENT_ID];
            if (parentComponentId) {
                viewInfo[PARENT_COMPONENT_ID] = parentComponentId;
                var parentViewInfo = this.views[parentComponentId];
                if (parentViewInfo[SHOW_AS] === 'popup' && !view.element) {
                    view[SHOW_AS] = parentViewInfo[SHOW_AS];
                }
                /*check if parent has already some child or not, if yes then remove all child*/
                if (parentViewInfo[CHILD_COMPONENT_ID].length > 0 && !view.metadata.embed) {
                    for (var i = 0; i < parentViewInfo[CHILD_COMPONENT_ID].length; i++) {
                        this.closeViewFromDom(parentViewInfo[CHILD_COMPONENT_ID][i]);
                    }
                }
                AppUtil.pushIfNotExists(componentId, CHILD_COMPONENT_ID, parentViewInfo);
            }
            viewInfo[SHOW_AS] = view[SHOW_AS];
            var showInPopup = view[SHOW_AS] && view[SHOW_AS] === 'popup';
            if (!parentComponentId && !showInPopup) {
                this.closeAllViews();
            }
            this.views[componentId] = viewInfo;
            $dataModel.putView(componentId, view);
            var showInPopup = view[SHOW_AS] && view[SHOW_AS] === 'popup';
            if (showInPopup) {
                var scope = $parentScope.$new();
                view.metadata.resize = false;
                view.metadata.headerscroll = true;
                if (scope.view && scope.view.maxWidth) {
                    view.maxWidth = scope.view.maxWidth;
                }
                var template = "<div style='display: table;height: 100%;width: 100%'>";
                if (AppUtil.isTrueOrUndefined(view.metadata.popUpTitle)) {
                    template += "<div style='display: table-row;width: 100%' class='app-popup-title'>" + view.metadata.label + "</div>";
                }
                template += "<div style='display: table-row; height: 100%;width: 100%;margin-top: 0px;'><app-view componentId='" + view[COMPONENT_ID] + "'></app-view></div></div>";
                var modal = {
                    template:template,
                    scope:scope,
                    autohide:false,
                    element:view.element,
                    maxHeight:500,
                    minHeight:150,
                    maxWidth:view.maxWidth ? view.maxWidth : $(window).width() - 400,
                    overflowY:"auto",
                    width:view.width || $(window).width() / 2
                };
                var popup = this.showPopup(modal);
                this.popupviews[view[COMPONENT_ID]] = popup;
            } else if (view.element) {
                var viewHtml = "<app-view componentId='" + view[COMPONENT_ID] + "'></app-view>";
                var viewElement = $compile(viewHtml)($parentScope);
                view.element.html("");
                view.element.append(viewElement);
            } else if (parentComponentId) {
                view.metadata.fullMode = false;
                var parentViewInfo = this.views[parentComponentId];
                var superParentId = parentViewInfo[PARENT_COMPONENT_ID];
                if (superParentId) {
                    $("#" + superParentId).css({left:0, top:'0px', right:'100%', 'display':'none'});
                }
                if (view.metadata.resized) {
                    $("#" + parentComponentId).css({left:0, top:'0px', right:'0', display:"none"});
                } else {
                    $("#" + parentComponentId).css({left:0, top:'0px', right:'50%'});
                }
                var style = "position:absolute;left:50%; top:0; bottom: 0; right:0; overflow: hidden;";
                if (view.metadata.resized) {
                    style = "position:absolute;left:0; top:0; bottom: 0; right:0; overflow: hidden;";
                }
                var template = "<div id='" + view[COMPONENT_ID] + "' class='app-view-wrapper' style='" + style + "'><app-view componentId='" + view[COMPONENT_ID] + "'></app-view></div>";
                var templateElement = $compile(template)($parentScope);
                var viewContainer = $("#view-container");
                viewContainer.append(templateElement);
                $("#" + parentComponentId).resize();
            } else {
                /*it is a root, we will not show close action here*/
//                view.metadata.close = true;
//                view.metadata.resize = false;
                var style = "position:absolute;left:0; top:0; bottom: 0; right:0; overflow: hidden;";
                var template = "<div id='" + view[COMPONENT_ID] + "' class='app-view-wrapper' style='" + style + "'><app-view componentId='" + view[COMPONENT_ID] + "'></app-view></div>";
                var templateElement = $compile(template)($parentScope);
                var viewContainer = $("#view-container");
                viewContainer.html("");
                viewContainer.append(templateElement);
                setTimeout(function () {
                    $("#" + view[COMPONENT_ID]).resize();
                }, 0);
            }
            if (!$parentScope.$$phase) {
                $parentScope.$apply();
            }
        };
        $viewStack.viewResize = function (componentid) {
            var view = $viewStack.views[componentid];
            if (!view) {
                AppUtil.handleError(new Error("viewResize:: View not found while closing for Id- " + componentId), "$viewStack.viewResize");
            }

            var childComponentId = view[CHILD_COMPONENT_ID];
            if (childComponentId && childComponentId.length > 0) {
                for (var i = 0; i < childComponentId.length; i++) {
                    var childModelView = $dataModel.getView(childComponentId[i]);
                    var metadata = childModelView ? childModelView.metadata : undefined;
                    var openPanel = metadata && metadata.openPanel ? metadata.openPanel : false;
                    if (openPanel) {      // panelElementId : for table cross in case of view detail in popup
                        $viewStack.viewResize(childComponentId[i]);
                        return;
                    }

                }
            }
            var parentComponentId = view[PARENT_COMPONENT_ID];
            var childComponentId = view[CHILD_COMPONENT_ID];
            if (childComponentId && childComponentId.length > 0) {
                childComponentId = childComponentId[0];
            }
            var componentId = view[COMPONENT_ID];
            if (childComponentId && childComponentId.length > 0) {
                var childModelView = $dataModel.getView(childComponentId);
                var metadata = childModelView ? childModelView.metadata : undefined;
                var openPanel = metadata && metadata.openPanel ? metadata.openPanel : false;
                componentId = openPanel ? $viewStack.views[childComponentId][COMPONENT_ID] : componentId;
            }
            if (!parentComponentId && !childComponentId) {
                return;
            }
            var componentElement = $('#' + componentId);
            var childElement = $('#' + childComponentId);
            var parentElement = $('#' + parentComponentId);
            var componentRight = parseInt(componentElement.css('right'));
            var componentLeft = parseInt(componentElement.css('left'));
            if (componentLeft > 0) {
                componentElement.css({left:'0'});
                parentElement.css({left:'100%', right:'0', 'display':'none'});
            } else if (componentRight > 0) {
                componentElement.css({right:'0', left:'0'});
                childElement.css({left:'0', right:'100%', 'display':'none'});
            }
            if (componentLeft == 0 && componentRight == 0) {
                if (childComponentId && childElement.length > 0) {
                    componentElement.css({right:'50%', left:'0'});
                    childElement.css({left:'50%', right:'0', 'display':'block'});
                } else if (parentComponentId) {
                    componentElement.css({right:'0', left:'50%'});
                    parentElement.css({left:'0', right:'50%', 'display':'block'});
                }
            }
            var scope = $dataModel.getScope(componentid);
            if (scope) {
                scope.view.metadata.resized = !scope.view.metadata.resized;
                if (scope.view.metadata.openPanel) {
                    var parentScope = $dataModel.getScope(scope.view[PARENT_COMPONENT_ID]);
                    parentScope.view.metadata.resized = scope.view.metadata.resized;
                }
                $viewStack.resizeChild(componentid, scope.view.metadata.resized);
                var url = BAAS_SERVER + "/custom/module";
                var parameters = {"ask":scope.view.ask, "osk":scope.view.osk, "customization":JSON.stringify({"view":{"resized":scope.view.metadata.resized}, "callback":false}), "viewid":scope.view.viewid};
                if (scope.view.metadata.lastmodifiedtime) {
                    parameters.lastmodifiedtime = $scope.view.metadata.lastmodifiedtime;
                }
                var param = {"ask":"appsstudio", "module":"lib/CustomizeViewService", "method":"saveViewCustomization", "parameters":JSON.stringify(parameters)};
//                AppUtil.getDataFromService(url, param, "POST", "JSON", undefined, function (data) {
                //do nothing here
//                });
            }
        };
        $viewStack.resizeChild = function (componentid, resized) {
            var view = $viewStack.views[componentid];
            if (view && view[CHILD_COMPONENT_ID]) {
                for (var i = 0; i < view[CHILD_COMPONENT_ID].length; i++) {
                    var childId = view[CHILD_COMPONENT_ID][i];
                    var scope = $dataModel.getScope(childId);
                    if (scope) {
                        scope.view.metadata.resized = resized;
                        $viewStack.resizeChild(childId, resized);
                    }
                }
            }
        }
        $viewStack.hidePopupView = function (componentId) {
            var popup = this.popupviews[componentId];
            if (!popup) {
                throw 'Popup not found for Id:' + componentId;
            }
            popup.hide();
        };
        $viewStack.closeAllViews = function () {
            var views = $viewStack.views;
            $(VIEW_CONTAINER).html("");
            for (var componentId in views) {
                if (views.hasOwnProperty(componentId)) {
                    var view = $viewStack.views[componentId];
                    if (!view) {
                        AppUtil.handleError(new Error("closeAllViews:: View not found while closing for Id- " + componentId), "Error in closeAllView");
                    }
                    var showInPopup = view[SHOW_AS] && view[SHOW_AS] === 'popup';
                    if (showInPopup) {
                        this.hidePopupView(componentId);
                    }
                    $dataModel.removeView(componentId);
                    view = undefined;
                }
            }
            $viewStack.views = {};
            $('#' + TOOL_BAR_ID).html('');
        };
        $viewStack.closeViewFromDom = function (componentId) {
            var view = $viewStack.views[componentId];
            if (!view) {
                AppUtil.handleError(new Error("closeViewFromDom:: View not found while closing for Id- " + componentId), "Error in closeViewFromDom");
            }

            var dataModelView = $dataModel.getView(componentId);
            if (dataModelView.metadata.openPanel) {
                var panelParentComponentId = dataModelView[PARENT_COMPONENT_ID];
                if (panelParentComponentId) {
                    var panelParentView = $dataModel.getView(panelParentComponentId);
                    if (panelParentView) {
                        var breadCrumbInfo = panelParentView.metadata.breadCrumbInfo;
                        if (breadCrumbInfo && breadCrumbInfo.length > 0) {
                            breadCrumbInfo.splice(breadCrumbInfo.length - 1, 1);
                        }
                    }
                }
            }

            if (view[CHILD_COMPONENT_ID]) {
                for (var i = 0; i < view[CHILD_COMPONENT_ID].length; i++) {
                    $viewStack.closeViewFromDom(view[CHILD_COMPONENT_ID][i]);
                }
            }
            var showInPopup = view[SHOW_AS] && view[SHOW_AS] === 'popup';
            if (showInPopup) {
                this.hidePopupView(componentId);
            } else {
                $("#" + componentId).remove();
                $("#" + TOOL_BAR_ID + '_' + componentId).remove();
            }
            var parentComponentId = view[PARENT_COMPONENT_ID];
            if (parentComponentId) {
                var parentChilds = $viewStack.views[parentComponentId][CHILD_COMPONENT_ID];
                if (parentChilds) {
                    for (var i = 0; i < parentChilds.length; i++) {
                        if (parentChilds[i] == componentId) {
                            parentChilds.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            $dataModel.removeView(componentId);
            delete $viewStack.views[componentId];
            view = undefined;
        };
        $viewStack.closeView = function (componentId) {
            var view = $viewStack.views[componentId];

            if (!view) {
                AppUtil.handleError(new Error("closeView:: View not found while closing for Id- " + componentId, "Error in $viewStack.closeView"));
            }
            var dataModelView = $dataModel.getView(componentId);
            var scope = $dataModel.getScope(componentId);
            var childComponentId = view[CHILD_COMPONENT_ID];
            if (childComponentId && childComponentId.length > 0) {
                for (var i = 0; i < childComponentId.length; i++) {
                    var childModelView = $dataModel.getView(childComponentId[i]);
                    var metadata = childModelView ? childModelView.metadata : undefined;
                    var openPanel = metadata && metadata.openPanel ? metadata.openPanel : false;
                    if (openPanel) {
                        $viewStack.closeView(childComponentId[i]);
                        if (dataModelView.metadata.panelView) {
                            if (dataModelView.metadata.resized) {
                                scope.nestedViewWidth = ($(window).width()) - 30;
                                $('#innernestedtable_' + componentId).width(scope.nestedViewWidth);
                            } else {
                                scope.nestedViewWidth = ($(window).width() / 2) - 30;
                                $('#innernestedtable_' + componentId).width(scope.nestedViewWidth);
                            }
                            dataModelView.metadata.panelView = false;
                            dataModelView.metadata.editMode = true;
                            dataModelView.metadata.lastRowAction = undefined;
                        }
                        return;
                    }
                }
            } else if (scope.view.metadata.parentInfo) {
                var parentInfo = scope.view.metadata.parentInfo;
                var parentView = $dataModel.getView(parentInfo.componentid);
                if (parentView.metadata) {
                    parentView.metadata.columns = angular.copy(parentView.metadata.columns)
                }
                $viewStack.addView(parentView, $dataModel.getScope(parentInfo.componentid));
                return;
            }
            $viewStack.closeViewFromDom(componentId);
            var showInPopup = view[SHOW_AS] && view[SHOW_AS] === 'popup';
            if (showInPopup || scope.view.metadata.embedPanel) {
                return;
            } else if (view[PARENT_COMPONENT_ID]) {
                var parentViewComponentId = view[PARENT_COMPONENT_ID];
                var parentView = $viewStack.views[parentViewComponentId];
                var superParentComponentId = parentView[PARENT_COMPONENT_ID];
                if (superParentComponentId) {

                    if (!dataModelView.metadata.fullMode) {
                        $("#" + superParentComponentId).css({left:0, right:'50%', 'display':"block"});
                        $("#" + parentViewComponentId).css({left:'50%', right:0, 'display':"block"});
                    } else {
                        $("#" + superParentComponentId).css({left:0, right:'0', 'display':"block"});
                        $("#" + parentViewComponentId).css({left:'0', right:0, 'display':"block"});
                    }
                    $("#" + superParentComponentId).resize();
                    $("#" + parentViewComponentId).resize();
                } else {
                    $("#" + parentViewComponentId).css({left:0, right:0, 'display':"block"});
                    $("#" + parentViewComponentId).resize();
                }
                $("#" + TOOL_BAR_ID + '_' + parentViewComponentId).show();
            }

            AppUtil.handleToolBarHeight();

        };
        $viewStack.closeChildView = function (componentId) {
            var parentViewInfo = this.views[componentId];
            /*check if parent has already some child or not, if yes then remove all child*/
            if (parentViewInfo && parentViewInfo[CHILD_COMPONENT_ID].length > 0) {
                for (var i = 0; i < parentViewInfo[CHILD_COMPONENT_ID].length; i++) {
                    this.closeView(parentViewInfo[CHILD_COMPONENT_ID][i]);
                }
            }
        };
        return $viewStack;
    }
]);
/**
 * Data Model
 */
appStrapServices.factory('$dataModel', [
    '$http', '$timeout', '$rootScope', '$appService', '$cacheDataModel', function ($http, $timeout, $rootScope, $appService, $cacheDataModel) {
        var $dataModel = {};
        $dataModel.tempKey = 0;
        $dataModel.getLookupDataSource = function (lookupOptions) {
            function getDisplayValue(lookupOption, value) {
                if (!value) {
                    return "";
                }
                var displayValue = "";
                var exp = lookupOption.expression;
                var expValue = AppUtil.resolve(value, exp);
                if (expValue) {
                    displayValue = expValue;
                }
                if (lookupOption.lookupdisplaycolumns && lookupOption.lookupdisplaycolumns.length > 0) {
                    if (displayValue[lookupOption.lookupdisplaycolumns[0].expression]) {
                        displayValue = displayValue[lookupOption.lookupdisplaycolumns[0].expression]
                    }
                }
                return displayValue;
            }

            this.lookupOptions = lookupOptions;
            this.getData = function (query, scope, callBack, errorCallBack) {
                var that = this;
                var componentId = this.lookupOptions["componentid"];
                var currentRow = false;
                if (scope && this.lookupOptions.model) {
                    currentRow = AppUtil.resolve(scope, this.lookupOptions.model);
                }

                if (this.lookupOptions.ui == UI_TYPE_COMPOSITE_LOOK_UP) {
                    var val = AppUtil.resolve(currentRow, this.lookupOptions.expression);
                    if (val && val.toString().length > 0 && this.lookupOptions.compositeoptions && this.lookupOptions.compositeoptions.length > 0) {
                        var requiredCompositeOptionIndex = AppUtil.getIndexFromArray(this.lookupOptions.compositeoptions, "label", val.type);
                        if (requiredCompositeOptionIndex !== undefined && requiredCompositeOptionIndex >= 0) {
                            this.lookupOptions.table = this.lookupOptions.compositeoptions[requiredCompositeOptionIndex].table;
                            this.lookupOptions.lookupdisplaycolumns = this.lookupOptions.compositeoptions[requiredCompositeOptionIndex].lookupdisplaycolumns;
                        }
                    } else {
                        return;
                    }
                }


                var resourceTable = this.lookupOptions.table;
                if (angular.isObject(resourceTable)) {
                    resourceTable = resourceTable.id;
                }
                var queryColumns = angular.copy(this.lookupOptions.lookupdisplaycolumns);
                var resourceQuery = {"table":resourceTable, columns:queryColumns};
                if (this.lookupOptions.dependentColumns) {
                    for (var i = 0; i < this.lookupOptions.dependentColumns.length; i++) {
                        AppUtil.pushIfNotExists({expression:this.lookupOptions.dependentColumns[i]}, "columns", resourceQuery, "expression");
                    }
                }
                //TODO need to pass columns here
                if (this.lookupOptions.columns) {
                    for (var i = 0; i < this.lookupOptions.columns.length; i++) {
                        AppUtil.pushIfNotExists(this.lookupOptions.columns[i], "columns", resourceQuery, "expression");
                    }
                }
                var filter = this.lookupOptions.filter || {};
                var cache = false;
                if (this.lookupOptions.lookupdisplaycolumns.length == 1) {
                    filter[AppUtil.getDisplayExp(this.lookupOptions.lookupdisplaycolumns[0])] = {"$regex":"^(" + query + ")", "$options":"-i"};
                    if (!this.lookupOptions.filter) {
                        cache = {column:AppUtil.getDisplayExp(this.lookupOptions.lookupdisplaycolumns[0]), query:query};
                    }
                } else {
                    var orFilter = [];
                    for (var i = 0; i < this.lookupOptions.lookupdisplaycolumns.length; i++) {
                        var displayFilter = {};
                        displayFilter[AppUtil.getDisplayExp(this.lookupOptions.lookupdisplaycolumns[i])] = {"$regex":"^(" + query + ")", "$options":"-i"};
                        orFilter.push(displayFilter);
                    }
                    filter.$or = orFilter;
                }
                if (currentRow) {
                    currentRow = angular.copy(currentRow);
                } else {
                    currentRow = {};
                }
                var currentView = false;
                try {
                    currentView = $dataModel.getView(componentId);
                    if (currentView) {
                        var currentViewParameters = currentView.metadata.parameters;
                        if (currentViewParameters) {
                            Object.keys(currentViewParameters).forEach(function (k) {
                                if (currentRow[k] === undefined) {
                                    currentRow[k] = currentViewParameters[k];
                                }
                            });
                        }
                    }
                } catch (e) {
                }
                var parameters = {};
                if (this.lookupOptions.parametermappings) {
                    Object.keys(that.lookupOptions.parametermappings).forEach(function (k) {
                        var param = that.lookupOptions.parametermappings[k];
                        if (parameters[k] === undefined) {
                            parameters[k] = AppUtil.resolve(currentRow, param);
                        }
                    });
                }
                if (this.lookupOptions.filterRequiredColumns && this.lookupOptions.filterRequiredColumns.length > 0) {
                    for (var i = 0; i < this.lookupOptions.filterRequiredColumns.length; i++) {
                        var obj = this.lookupOptions.filterRequiredColumns[i];
                        parameters[obj] = AppUtil.resolve(currentRow, obj);
                    }
                }
                resourceQuery.filter = filter;
                resourceQuery.parameters = parameters;
                if (this.lookupOptions.orders) {
                    if (typeof this.lookupOptions.orders == "string") {
                        resourceQuery.orders = JSON.parse(this.lookupOptions.orders);
                    } else if (typeof this.lookupOptions.orders == "object") {
                        resourceQuery.orders = this.lookupOptions.orders;
                    }
                }
                if (this.lookupOptions.max_rows) {
                    resourceQuery.max_rows = this.lookupOptions.max_rows;
                } else {
                    resourceQuery.max_rows = 100;
                }

                $cacheDataModel.getData(resourceQuery, cache, this.lookupOptions.ask, this.lookupOptions.osk, function (data) {
                    if (data && data.data && data.data.length > 0) {
                        if (that.lookupOptions.ui == UI_TYPE_COMPOSITE_LOOK_UP) {
                            for (var i = 0; i < data.data.length; i++) {
                                var record = data.data[i];
                                var $value = getDisplayValue(that.lookupOptions.lookupdisplaycolumns[0], record);
                                record.__value = $value;
                            }
                        } else if (that.lookupOptions.lookupdisplaycolumns.length > 1) {
                            for (var i = 0; i < data.data.length; i++) {
                                var record = data.data[i];
                                var $value = getDisplayValue(that.lookupOptions.lookupdisplaycolumns[0], record);
                                for (var j = 1; j < that.lookupOptions.lookupdisplaycolumns.length; j++) {
                                    $value += " | " + getDisplayValue(that.lookupOptions.lookupdisplaycolumns[j], record);
                                }
                                record.$value = $value;
                            }
                        } else if (that.lookupOptions.bindtype && that.lookupOptions.bindtype == UI_TYPE_STRING) {
                            for (var i = 0; i < data.data.length; i++) {
                                data.data[i] = (getDisplayValue(that.lookupOptions.lookupdisplaycolumns[0], data.data[i]));
                            }
                        }

                    }
                    callBack(data);
                }, errorCallBack);
            }
        };

        $dataModel.columnReOrdering = function (srcIndex, targetIndex, id) {
            var model = this.getModel(id);
            var metadata = model.view.metadata;
            var srcColumn = metadata.tableColumns[srcIndex];
            var targetColumn = metadata.tableColumns[targetIndex];

            metadata.tableColumns.splice(srcIndex, 1);
            metadata.tableColumns.splice(targetIndex, 0, srcColumn);

            var cloneSrcIndex = -1;
            var cloneTargetIndex = -1;
            for (var i = 0; i < metadata.columns.length; i++) {
                if (metadata.columns[i].expression == srcColumn.expression) {
                    cloneSrcIndex = i;
                } else if (metadata.columns[i].expression == targetColumn.expression) {
                    cloneTargetIndex = i;
                }
            }
            if (cloneSrcIndex >= 0 && cloneTargetIndex >= 0) {
                var cloneSrcColumn = metadata.columns[cloneSrcIndex]
                metadata.columns.splice(cloneSrcIndex, 1);
                metadata.columns.splice(cloneTargetIndex, 0, cloneSrcColumn);
            }
            model.scope.appData.shortMessage = {"msg":'Please save column customiztion.', "modal":false, "time":10000, className:'app-background-orange'};
        };
        $dataModel.rowReorder = function (srcIndexValue, currentIndexValue, id) {
            var model = this.getModel(id);
            var view = model.view;
            var data = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);
            var srcRow = data[srcIndexValue];
            data.splice(srcIndexValue, 1);
            data.splice(currentIndexValue, 0, srcRow);
            var columns = model.view.metadata.columns;
            var columnCount = columns.length;
            var indexColumn = false;
            for (var i = 0; i < columnCount; i++) {
                if (columns[i][UI] == UI_TYPE_INDEX) {
                    indexColumn = columns[i];
                    break;
                }
            }
            if (!indexColumn) {
                AppUtil.handleError(new Error("Index column not found"), "$dataModel.rowReorder");
            }
            var expression = indexColumn.expression;
            var indexExpression = expression + ".index";
            var subIndexExp = expression + ".subindex";
            if (currentIndexValue == 0) {
                var nextIndex = currentIndexValue + 1;
                var nextRowSubIndex = AppUtil.resolve(data[nextIndex], subIndexExp);
                var nextRowIndex = AppUtil.resolve(data[nextIndex], indexExpression);
                AppUtil.putDottedValue(data[currentIndexValue], indexExpression, nextRowIndex);
                if (nextRowSubIndex) {
                    AppUtil.putDottedValue(data[currentIndexValue], subIndexExp, nextRowSubIndex - 100);
                } else {
                    AppUtil.putDottedValue(data[currentIndexValue], subIndexExp, 100);
                }
            } else if (currentIndexValue == (data.length - 1)) {
                var prevIndex = currentIndexValue - 1;
                var prevRowIndex = AppUtil.resolve(data[prevIndex], indexExpression);
                var prevRowSubIndex = AppUtil.resolve(data[prevIndex], subIndexExp);
                AppUtil.putDottedValue(data[currentIndexValue], indexExpression, prevRowIndex);
                if (prevRowSubIndex) {
                    AppUtil.putDottedValue(data[currentIndexValue], subIndexExp, prevRowSubIndex + 100);
                } else {
                    AppUtil.putDottedValue(data[currentIndexValue], subIndexExp, 100);
                }
            } else {
                var nextIndex = currentIndexValue + 1;
                var nextRowSubIndex = AppUtil.resolve(data[nextIndex], subIndexExp);
                var nextRowIndex = AppUtil.resolve(data[nextIndex], indexExpression);
                var prevIndex = currentIndexValue - 1;
                var prevRowSubIndex = AppUtil.resolve(data[prevIndex], subIndexExp);
                var prevRowIndex = AppUtil.resolve(data[prevIndex], indexExpression);
                if (nextRowIndex == prevRowIndex) {
                    AppUtil.putDottedValue(data[currentIndexValue], indexExpression, prevRowIndex);
                    if (nextRowSubIndex && prevRowSubIndex) {
                        var midIndex = Math.floor((nextRowSubIndex + prevRowSubIndex) / 2);
                        AppUtil.putDottedValue(data[currentIndexValue], subIndexExp, midIndex);
                    } else {
                        AppUtil.putDottedValue(data[currentIndexValue], subIndexExp, 100);
                    }
                } else {
                    AppUtil.putDottedValue(data[currentIndexValue], indexExpression, nextRowIndex);
                    if (nextRowSubIndex) {
                        AppUtil.putDottedValue(data[currentIndexValue], subIndexExp, nextRowSubIndex - 100);
                    } else {
                        AppUtil.putDottedValue(data[currentIndexValue], subIndexExp, 100);
                    }
                }

            }
        };
        $dataModel.columnReSize = function (colElement, width, id) {
            colElement.element.width(width);
            colElement.col.style.width = width + 'px';
            var colExp = colElement.col.expression;
            var model = this[id];
            for (var i = 0; i < model.view.metadata.columns.length; i++) {
                if (model.view.metadata.columns[i].expression == colExp) {
                    model.view.metadata.columns[i].width = width;
                    break;
                }
            }
            model.scope.appData.shortMessage = {"msg":'Please save column customiztion.', "modal":false, "time":10000, className:'app-background-orange'};
        };
        $dataModel.removeFilterFromParameters = function (expression, parameters) {
            if (!expression || !parameters) {
                return;
            }
            for (var k in parameters) {
                if (k == expression || k.indexOf(expression + ".") == 0) {
                    delete parameters[k];
                }
            }

        }
        $dataModel.handleColumnVisibilityWithFilter = function (expression, filters) {
            if (!filters) {
                return false;
            }
            for (var k in filters) {
                if (k == expression || k.indexOf(expression + ".") == 0) {
                    if (angular.isObject(filters[k])) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
            return false;
        };
        $dataModel.isFilterApplied = function (expression, filters) {
            if (!filters) {
                return false;
            }
            for (var k in filters) {
                if (k == expression || k.indexOf(expression + ".") == 0) {
                    return true;
                }
            }

            return false;
        };
        $dataModel.toggleTree = function (row, id) {
            var model = this[id];
            var data = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);
            var currentLevel = row._level;
            var currentMode = row._mode;
            var currentId = row._id;
            var visible = false;
            if (row._mode == 0) {
                row._mode = 1;
                visible = true;
            } else {
                row._mode = 0;
            }
            var idFound = false;
            var dataCount = data ? data.length : 0;
            var primaryColumn = model.view.metadata.primarycolumn;
            var key = AppUtil.resolve(row, model.view.metadata[PRIMARY_COLUMN]);
            var index = this.getIndex(key, id, model.view.metadata[PRIMARY_COLUMN]);
            for (var i = index + 1; i < dataCount; i++) {
                var o = data[i];
                if (o._level <= currentLevel) {
                    break;
                } else if (o._level == currentLevel + 1) {
                    if (visible) {
                        o._hidden = false;
                    } else {
                        o._hidden = true;
                        if (o._mode == 1) {
                            o._mode = 0;
                        }
                    }
                } else {
                    if (!visible) {
                        o._hidden = true;
                        if (o._mode == 1) {
                            o._mode = 0;
                        }
                    }
                }
            }
        };
        $dataModel.getIndex = function (key, id, primaryColumn) {
            var model = this.getModel(id);
            var view = model.view;
            var data = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);
            var dataCount = data.length;
            for (var i = 0; i < dataCount; i++) {
                var record = data[i];
                var recordKey = AppUtil.resolve(record, primaryColumn);
                var isEqual = angular.equals(recordKey, key);
                if (isEqual) {
                    return i;
                }
            }
            return -1;
        };
        $dataModel.getTempKey = function (primaryColumn) {
            this.tempKey = this.tempKey + 1;
            var temp = {_insert:true};
            AppUtil.putDottedValue(temp, primaryColumn, this.tempKey + "temp");
            return temp;
        };
        $dataModel.holdWatch = function (componentid, hold) {
            var model = this[componentid];
            model.view.holdWatch = hold;
            if (model.view[PARENT_COMPONENT_ID]) {
                $dataModel.holdWatch(model.view[PARENT_COMPONENT_ID], hold);
            }
        };
        $dataModel.setScope = function (componentid, scope) {
            var model = this[componentid];
            model.scope = scope;
            model.view.metadata.dataExpression = model.view.metadata.dataExpression || "view.data.data";
            model.view.metadata.dataAggregateExpression = model.view.metadata.dataAggregateExpression || "view.data._aggregates";
            model.view.metadata.defaultFilterExpression = model.view.metadata.defaultFilterExpression || "view.data._filters";
            var data = AppUtil.resolve(scope, model.view.metadata.dataExpression);
            $dataModel.modifyDataAsPerColumn(data, model.view.metadata.columns);
            model.view.dataclone = model.view.dataclone || angular.copy(data);
            this.populateDataState(componentid);
            $dataModel.addWatch(componentid, scope);
        };
        $dataModel.getFlexColumns = function (flexColumns, value) {
            if (flexColumns) {
                for (var i = 0; i < flexColumns.length; i++) {
                    if (flexColumns[i]._id == value) {
                        return angular.copy(flexColumns[i].columns);
                        break;
                    }
                }
            }
        }
        $dataModel.populateFlexField = function (metadata, row, targetColumns, targetExpression) {
            var flexColumn = false;
            for (var i = 0; i < metadata.columns.length; i++) {
                if (metadata.columns[i].flexcolumn) {
                    flexColumn = metadata.columns[i];
                    break;
                }
            }
            if (!flexColumn) {
                return;
            }
            $dataModel.clearFlexField(targetColumns);
            var flexColumnValue = row && row[flexColumn.expression] && row[flexColumn.expression]._id ? row[flexColumn.expression]._id : false;
            if (!flexColumnValue) {
                return;
            }
            var flexColumns = $dataModel.getFlexColumns(flexColumn.flexcolumns, flexColumnValue);
            if (!flexColumns) {
                return;
            }
            for (var j = 0; j < flexColumns.length; j++) {
                flexColumns[j].flexible = true;
                flexColumns[j][SHOW_ON_PANEL] = true;
                flexColumns[j][SHOW_ON_TABLE] = true;
                flexColumns[j].ui = flexColumns[j].ui || flexColumns[j].type;
                flexColumns[j].width = 200;
                var exp = flexColumns[j].expression;
                var dottedExp = false;
                var leafExp = exp;
                var dotIndex = exp.indexOf(".");
                if (dotIndex > 0) {
                    dottedExp = exp.substring(0, dotIndex);
                    leafExp = exp.substring(dotIndex + 1);
                }
                if (targetExpression && dottedExp && targetExpression == dottedExp) {
//case of nested expression
                    flexColumns[j].expression = leafExp;
                    targetColumns.splice(0, 0, flexColumns[j]);
                } else if (!targetExpression && !dottedExp) {
//case of panel
                    targetColumns.push(flexColumns[j]);
                }
            }
        }
        $dataModel.clearFlexField = function (columns) {
            if (!columns) {
                return;
            }
            for (var i = columns.length - 1; i >= 0; i--) {
                if (columns[i].flexible) {
                    columns.splice(i, 1);
                }
            }
        }
        $dataModel.handleFlexField = function (options) {
            var flexExpression = options.$expression;
            var viewPath = "panel";
            var startDotIndex = 0;
            var dotIndex = flexExpression.indexOf(".")
            var detailViewPath = viewPath;
            while (dotIndex > 0) {
                viewPath += flexExpression.substring(startDotIndex, dotIndex);
                startDotIndex = dotIndex + 1;
                dotIndex = flexExpression.indexOf(".", startDotIndex);
                detailViewPath = viewPath + "panel";
            }
            var flexTargetView = $dataModel.getViewFromPath(viewPath);
            var flexTargetDetailView;
            if (viewPath != detailViewPath) {
                flexTargetDetailView = $dataModel.getViewFromPath(detailViewPath);
            } else {
                flexTargetDetailView = flexTargetView;
            }
            if (!flexTargetDetailView || !flexTargetView) {
//at run time, we have to add only in detail panel, rest will add automatic when related view get open
                return;
            }
            var newValueId = options.$new && options.$new._id ? options.$new._id : undefined
            /*remove preivous flex columns;*/
            $dataModel.clearFlexField(flexTargetDetailView.metadata.columngroups[0].columns);
            /*end remove preivous flex columns;*/
            var flexColumns = $dataModel.getFlexColumns(options.$flexcolumns, newValueId);
            if (!flexColumns) {
                return;
            }
            var viewScope = $dataModel.getScope(flexTargetDetailView[COMPONENT_ID]);
            for (var j = 0; j < flexColumns.length; j++) {
                AppUtil.populateColumn(flexColumns[j], flexTargetDetailView.metadata.type, "row", false, false, viewScope, $dataModel);
                flexColumns[j].flexible = true
                var exp = flexColumns[j].expression;
                var dottedExp = false;
                var leafExp = exp;
                var dotIndex = exp.indexOf(".");
                if (dotIndex > 0) {
                    dottedExp = exp.substring(0, dotIndex);
                    leafExp = exp.substring(dotIndex + 1);
                }
                if (!dottedExp) {
//dotted exp will add in nested expression view and simple will be added in detail view
                    flexTargetDetailView.metadata.columngroups[0].columns.push(flexColumns[j]);
                }
            }
        }
        $dataModel.getConversionRate = function (type, value) {
            if (type == "currency") {
                if (value) {
                    return 1;
                } else {
                    undefined;
                }
            } else if (type == "duration") {
                if (value) {
                    if (value == "Hrs") {
                        return 1;
                    } else if (value == "Minutes") {
                        return (1 / 60);
                    } else {
                        return undefined;
                    }
                } else {
                    undefined;
                }
            }
        }
        $dataModel.handleAggregateChanges = function (options) {
            if (!options) {
                return;
            }
            var type = options.$type;
            if (type != "currency" && type != "duration") {
                throw new Error("Unhandled typed in aggregate[" + type + "]");
            }
//            var conversionRate = options.$conversionrate[type];
//            if (conversionRate === undefined) {
//                return;
//            }
            var aggregateColumnValue = options._aggregate;
            var oldColumnValue = options.$old;
            var newColumnvalue = options.$new;
            var valExp = "";
            var typeExp = "";
            var mainTypeExp;
            if (type == "duration") {
                valExp = "time";
                typeExp = "timeunit";
                mainTypeExp = "timeunit";
            } else if (type == "currency") {
                valExp = "amount";
                /* typeExp = "type.currency";*/
                typeExp = "type";
                mainTypeExp = "type";
            }
            var oldVal = AppUtil.resolve(oldColumnValue, valExp);
            var oldType = AppUtil.resolve(oldColumnValue, typeExp);
            var newVal = AppUtil.resolve(newColumnvalue, valExp);
            var newType = AppUtil.resolve(newColumnvalue, typeExp);
            var aggregateVal = AppUtil.resolve(aggregateColumnValue, valExp);
            var aggregateType = AppUtil.resolve(aggregateColumnValue, typeExp);

            var oldConversionRate = undefined;
            var newConversionRate = undefined;
            var leafValue = 1;
            if (type == "currency") {
                oldConversionRate = $dataModel.getConversionRate(type, oldType);
                newConversionRate = $dataModel.getConversionRate(type, newType);
                aggregateType = aggregateType || newType || oldType;
            } else if (type == "duration") {
                oldConversionRate = $dataModel.getConversionRate(type, oldType);
                newConversionRate = $dataModel.getConversionRate(type, newType);
                aggregateType = aggregateType || newType || oldType;

            }
            aggregateVal = aggregateVal ? aggregateVal * leafValue : 0;
            oldVal = (oldVal && oldConversionRate) ? (oldVal * leafValue) * oldConversionRate : 0;
            newVal = (newVal && newConversionRate) ? (newVal * leafValue) * newConversionRate : 0;
            aggregateVal = aggregateVal + newVal - oldVal;
            aggregateVal = aggregateVal / leafValue;
            aggregateVal = aggregateVal.toFixed(2);
            var newAggregateVal = {};
            newAggregateVal[mainTypeExp] = aggregateType;
            newAggregateVal[valExp] = aggregateVal;
            return newAggregateVal;
        };
        $dataModel.unwind = function (data, expression, unwindKey, target) {
            if (!data || data.length == 0) {
                if (unwindKey) {
                    var blankRecord = {};
                    blankRecord[KEY] = unwindKey;
                    AppUtil.putDottedValue(target, expression, blankRecord);
                    return target;
                }
                return data;
            }
            var newColumns = [];
            for (var i = 0; i < data.length; i++) {
                var c = data[i];
                if (unwindKey) {
                    if (c[KEY] == unwindKey) {
                        AppUtil.putDottedValue(target, expression, c);
                        return target;
                    }
                } else {
                    var newTarget = false;
                    if (target) {
                        newTarget = angular.copy(target);
                    } else {
                        newTarget = {};
                    }
                    AppUtil.putDottedValue(newTarget, expression, c);
                    newColumns.push(newTarget);
                }
            }
            if (unwindKey) {
                var blankRecord = {};
                blankRecord[KEY] = unwindKey;
                AppUtil.putDottedValue(target, expression, blankRecord);
                return target;
            }
            return newColumns;
        };
        $dataModel.processChange = function (componentId, validations, primaryColumn, currentRow, unwindKey, colUpdates) {
            if (!validations) {
                return;
            }
            currentRow = angular.copy(currentRow);
            if (!currentRow) {
                currentRow = {};
            }
            var model = $dataModel.getModel(componentId);
            for (var j = 0; j < validations.length; j++) {
                var dataParameters = [currentRow];
                var validation = validations[j];
                if (colUpdates && colUpdates.$delete && !validation.$aggregate) {
//if row got deleted then we will process only aggregate changes
                    continue;
                }
                var unwindColumn = false;
                if (validation.unwindcolumns && validation.unwindcolumns.length > 0) {
                    var unwindData = currentRow;
                    for (var i = 0; i < validation.unwindcolumns.length; i++) {
                        var unwindCol = validation.unwindcolumns[i];
                        var unwindKeyValue = false;
                        if (unwindKey) {
                            unwindKeyValue = unwindKey[i]
                        }
                        unwindData = $dataModel.unwind(AppUtil.resolve(unwindData, unwindCol), unwindCol, unwindKeyValue, angular.copy(unwindData));
                    }
                    if (unwindData) {
                        if (unwindData instanceof Array) {
                            dataParameters = unwindData;
                        } else {
                            dataParameters = [unwindData];
                        }
                    }
                }
                for (var k = 0; k < dataParameters.length; k++) {
                    var dataForValidation = dataParameters[k];
                    var requiredColumns = validation.requiredColumns;

                    var responseExpressions = [];
                    var needToResolve = true;

                    if (colUpdates) {
                        Object.keys(colUpdates).forEach(function (k) {
                            dataForValidation[k] = colUpdates[k];
                        })
                    }
                    if (validation.otherRequiredColumns) {
                        for (var l = 0; l < validation.otherRequiredColumns.length; l++) {
                            var requiredColumn = validation.otherRequiredColumns[l];
                            var requiredColumnVal = requiredColumn.expressionvalue;
                            if (requiredColumnVal === undefined) {
                                if (requiredColumn.targetExpression) {
                                    requiredColumnVal = AppUtil.resolve(model.scope, requiredColumn.targetExpression + "." + requiredColumn.expression);
                                } else {
                                    requiredColumnVal = AppUtil.resolve(dataForValidation, requiredColumn.expression);
                                }
                            }
                            dataForValidation[requiredColumn.alias] = requiredColumnVal;
                        }
                    }

                    if (!needToResolve) {
                        continue;
                    }
                    if (validation.column) {
                        var expressionPath = [
                            {key:primaryColumn, keyvalue:AppUtil.resolve(currentRow, primaryColumn)}
                        ];
                        /*for aggregate we do not have pexpression in column*/
                        if (validation.column.pexpression && validation.unwindcolumns && validation.unwindcolumns.length > 0) {

                            for (var i = 0; i < validation.unwindcolumns.length; i++) {
                                var unwindCol = validation.unwindcolumns[i];
                                if (validation.column.pexpression.indexOf(unwindCol) == 0) {
                                    var pExpressionValue = AppUtil.resolve(dataForValidation, unwindCol);
                                    if (pExpressionValue === undefined) {
                                        /*we will not resolve this validation as it has no value*/
                                        needToResolve = false;
                                        break;
                                    }
                                    var pathColumn = unwindCol;
                                    var lastIndexOfDot = pathColumn.lastIndexOf(".");
                                    if (lastIndexOfDot > 0) {
                                        pathColumn = unwindCol.substring(lastIndexOfDot + 1);
                                    }
                                    expressionPath.push({expression:pathColumn, key:KEY, keyvalue:AppUtil.resolve(pExpressionValue, KEY)});
                                }

                            }
                            if (!needToResolve) {
                                break;
                            }


                        }
                        if (validation.column.targetExpression) {
                            expressionPath = [
                                {expression:validation.column.pexpression, targetExpression:validation.column.targetExpression}
                            ];
                        }
                        responseExpressions.push({expression:validation.column.expression, path:expressionPath});
                    }
                    if (!needToResolve) {
                        continue;
                    }
                    var appData = model.scope.appData;
                    dataForValidation.context = {user:{id:appData.userid, username:appData.username, emailid:appData.emailid}};
                    $dataModel.resolveDefaults(componentId, validation.code, validation.services, dataForValidation, responseExpressions, validation.when);
                }
            }
        };
        $dataModel.handleChanges = function (componentId, scope, newvalue, oldvalue, resolveAll, callback) {
            try {
                if (!angular.equals(newvalue, oldvalue)) {
                    var model = $dataModel.getModel(componentId);

                    var primaryColumn = model.view.metadata.primarycolumn;
                    if (resolveAll) {
                        var ResultCallback = function () {
                            this.count = 0;
                            this.processedResult = 0;
                            this.allProcessInitiated = false;
                            this.processInitiated = function () {
                                this.allProcessInitiated = true;
                                this.checkCallBack();
                            };
                            this.process = function () {
                                this.processedResult = this.processedResult + 1;
                                this.checkCallBack();
                            };
                            this.checkCallBack = function () {
                                if (this.allProcessInitiated) {
                                    if (this.count == this.processedResult) {
                                        if (callback) {
                                            if (model.scope.appData.warning.warnings.length > 0) {
                                                callback(true);
                                            } else {
                                                callback(false);
                                            }
                                        }
                                    }
                                }
                            };
                        };
                        var validationCallback = new ResultCallback();
                        var columns = model.view.metadata.columns;
                        var updates = $dataModel.getColumnUpdates(componentId, newvalue, oldvalue, columns, primaryColumn, false, false, true);
                        var updateCount = updates ? updates.length : 0;
                        for (var i = 0; i < updateCount; i++) {
                            var updatedRow = updates[i];
                            var currentRowKey = AppUtil.resolve(updatedRow, primaryColumn);
                            var currentRow = AppUtil.getRecord(newvalue, currentRowKey, primaryColumn);
                            var dottedIndex = model.view.metadata[PRIMARY_COLUMN].lastIndexOf(".");
                            var operationPrefix = "";
                            if (dottedIndex >= 0) {
                                operationPrefix = model.view.metadata[PRIMARY_COLUMN].substring(0, dottedIndex) + ".";
                            }
                            operationPrefix += "__type__";
                            if (AppUtil.resolve(updatedRow, operationPrefix) == "delete") {
                                continue;
                            }
                            $dataModel.processValidations(componentId, currentRow, scope);
                        }
                        validationCallback.allProcessInitiated = true;
                        validationCallback.processInitiated();
                    } else {
                        var columns = model.view.metadata.watchColumns;
                        if (!columns) {
                            return;
                        }
                        var updates = $dataModel.getColumnUpdates(componentId, newvalue, oldvalue, columns, primaryColumn, true, false, false);
                        Object.keys(updates).forEach(function (k) {
                            for (var i = 0; i < updates[k].length; i++) {
                                var key = updates[k][i].key;
                                var currentRow = AppUtil.getRecord(newvalue, key, primaryColumn);
                                var affectedSet = scope.view.metadata.watchSet[k];
                                if (affectedSet) {
                                    $dataModel.processChange(componentId, affectedSet[DEFAULTS_KEY], primaryColumn, currentRow, updates[k][i].unwindkey, updates[k][i]);
                                }
                            }
                        });
                    }
                }
            } catch (e) {
                AppUtil.handleError(e, "handleChanges");
            }
        };


        $dataModel.processValidations = function (componentId, currentRow, $scope) {
            var model = $dataModel.getModel(componentId);
            var index = this.getIndex(currentRow._id, componentId, model.view.metadata[PRIMARY_COLUMN]) + 1;

            for (var i = 0; i < model.view.metadata.validations.length; i++) {
                var column = model.view.metadata.validations[i];
                $dataModel.validateValidations(column.expression, column.label, false, currentRow, ["Index : " + index], $scope);
            }
        };
        $dataModel.validateValidations = function (expression, label, parentExp, data, path, $scope) {
            if (!data) {
                return;
            }

            var filterApplied = $dataModel.handleColumnVisibilityWithFilter(expression, $scope.view.metadata.filter);


            var dotIndex = expression.indexOf(".");
            if (filterApplied) {
                AppUtil.putDottedValue(data, "$valid." + expression, true);
                AppUtil.pushIfNotExists({$id:JSON.stringify(path) + expression, message:label + " is mandatory at " + JSON.stringify(path), type:"validation"}, "warnings", $scope.appData.warning, "$id", true);
            } else if (dotIndex > 0) {
                var firstExp = expression.substring(0, dotIndex);
                var nextExp = expression.substring(dotIndex + 1);
                var newExp = parentExp ? parentExp + "." + firstExp : firstExp;
                var firstExpdata = data[firstExp];
                if (firstExpdata instanceof Array) {
                    for (var i = 0; i < firstExpdata.length; i++) {
                        var newPath = angular.copy(path);
                        newPath.push(newExp + " : " + (i + 1));
                        $dataModel.validateValidations(nextExp, label, newExp, firstExpdata[i], newPath, $scope);
                    }
                } else {
                    var newPath = angular.copy(path);
                    newPath.push(newExp);
                    $dataModel.validateValidations(nextExp, label, newExp, firstExpdata, newPath, $scope);
                }

            } else if ((data[expression] === undefined || data[expression].toString().trim().length == 0) && (!$dataModel.isFilterApplied(expression, $scope.view.metadata.filter))) {
                AppUtil.putDottedValue(data, "$valid." + expression, false);
                AppUtil.pushIfNotExists({$id:JSON.stringify(path) + expression, message:label + " is mandatory at " + JSON.stringify(path), type:"validation"}, "warnings", $scope.appData.warning, "$id", false);
            } else {
                AppUtil.putDottedValue(data, "$valid." + expression, true);
                AppUtil.pushIfNotExists({$id:JSON.stringify(path) + expression, message:label + " is mandatory at " + JSON.stringify(path), type:"validation"}, "warnings", $scope.appData.warning, "$id", true);
            }
        }

        $dataModel.addInWatchSet = function (expression, watch, watchKey, watchSet) {
            watchSet[expression] = watchSet[expression] || {};
            watchSet[expression][watchKey] = watchSet[expression][watchKey] || [];
            watchSet[expression][watchKey].push(watch);
        };
        $dataModel.registerWatch = function (column, watchKey, watchToProcess, watchSet, metaData, columns) {
            try {
                var watchInsert = false;
                if (watchKey == DEFAULTS_KEY) {
                    watchInsert = true;
                }
                if (column && column.pexpression) {
                    /*it sholuld also be dependent on vli._insert*/
                    var pColumn = $dataModel.getColumn(column.pexpression, columns);
                    if (!pColumn) {
                        AppUtil.handleError(new Error("No column found for pexpression[" + column.pexpression + "] while registering defaults"), "$dataModel.registerWatch");
                    }
                    var superPColumn = false;
                    if (pColumn.pexpression) {
                        superPColumn = $dataModel.getColumn(pColumn.pexpression, columns);
                        if (!superPColumn) {
                            AppUtil.handleError(new Error("No column found for pexpression[" + pColumn.pexpression + "] while registering defaults"), "$dataModel.registerWatch");
                        }
                    }
                    if (superPColumn) {
                        AppUtil.pushIfNotExists(superPColumn, "watchColumns", metaData);
                        AppUtil.pushIfNotExists(pColumn.pexpression, "unwindcolumns", watchToProcess);
                    } else {
                        AppUtil.pushIfNotExists(pColumn, "watchColumns", metaData);
                    }
                    AppUtil.pushIfNotExists(column.pexpression, "unwindcolumns", watchToProcess);
                    if (watchInsert) {
                        var insertExp = column.pexpression + "._insert";
                        AppUtil.pushIfNotExists({expression:insertExp, type:UI_TYPE_STRING }, "watchColumns", pColumn);
                        if (superPColumn) {
                            AppUtil.pushIfNotExists(pColumn, "watchColumns", superPColumn);
                        }
                        $dataModel.addInWatchSet(insertExp, watchToProcess, watchKey, watchSet);
                    }
                } else if (!watchToProcess.requiredColumns && watchInsert) {
                    var insertExp = "_insert";
                    AppUtil.pushIfNotExists({expression:insertExp, type:UI_TYPE_STRING}, "watchColumns", metaData);
                    $dataModel.addInWatchSet(insertExp, watchToProcess, watchKey, watchSet);
                }
                if (watchToProcess.requiredColumns) {
                    var newRequiredColumns = [];
                    for (var j = 0; j < watchToProcess.requiredColumns.length; j++) {
                        var requiredColumn = watchToProcess.requiredColumns[j];
                        var requiredColumnInfo = $dataModel.getColumn(requiredColumn, columns);
                        if (!requiredColumnInfo) {
                            var dotIndex = requiredColumn.indexOf(".");
                            var requiredColumnPExpression = undefined;
                            if (dotIndex >= 0) {
                                var dotExp = requiredColumn.substring(0, dotIndex);
                                var dotColumn = $dataModel.getColumn(dotExp, columns);
                                if (dotColumn && dotColumn.multiple) {
                                    requiredColumnPExpression = dotExp;
                                }
                            }
                            requiredColumnInfo = {expression:requiredColumn, type:UI_TYPE_STRING, pexpression:requiredColumnPExpression};
                        }
                        newRequiredColumns.push(requiredColumnInfo);
                        if (requiredColumnInfo.pexpression) {
                            var pColumn = $dataModel.getColumn(requiredColumnInfo.pexpression, columns);
                            if (!pColumn) {
                                AppUtil.handleError(new Error("No column found for pexpression[" + requiredColumnInfo.pexpression + "] while registering [" + watchKey + "]"), "$dataModel.registerWatch");
                            }
                            var superPColumn = false;
                            if (pColumn.pexpression) {
                                superPColumn = $dataModel.getColumn(pColumn.pexpression, columns);
                                if (!superPColumn) {
                                    AppUtil.handleError(new Error("No column found for pexpression[" + pColumn.pexpression + "] while registering defaults"), "$dataModel.registerWatch");
                                }
                            }
                            if (superPColumn) {
                                AppUtil.pushIfNotExists(superPColumn, "watchColumns", metaData);
                                AppUtil.pushIfNotExists(pColumn.pexpression, "unwindcolumns", watchToProcess);
                                AppUtil.pushIfNotExists(pColumn, "watchColumns", superPColumn);
                            } else {
                                AppUtil.pushIfNotExists(pColumn, "watchColumns", metaData);
                            }
                            AppUtil.pushIfNotExists(requiredColumnInfo.pexpression, "unwindcolumns", watchToProcess);
                            AppUtil.pushIfNotExists(requiredColumnInfo, "watchColumns", pColumn);
                        } else {
                            AppUtil.pushIfNotExists(requiredColumnInfo, "watchColumns", metaData);
                        }
                        $dataModel.addInWatchSet(requiredColumnInfo.expression, watchToProcess, watchKey, watchSet);
                    }
                    watchToProcess.requiredColumns = newRequiredColumns;
                }
            } catch (e) {
                AppUtil.handleError(e, "registerWatch");
            }
        };
        $dataModel.handleRememberValue = function (params) {
            if (params && params.$expression && params._remember) {
                return params._remember[params.$expression];
            }
        }

        $dataModel.addWatch = function (componentid, scope) {
            var model = this[componentid];
            if (model.view.metadata.noWatch) {
                /*panel and nested table will not watch*/
                return;
            }
            var watchSet = {};
            var view = model.view;
            var validations = [];
            var columns = view.metadata.columns;
            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];

                if (column.mandatory && (column[SHOW_ON_TABLE] || column[SHOW_ON_PANEL])) {
                    var code = "var valid = !AppUtil.isEmpty(AppUtil.resolve(this,\"" + column.expression + "\")); if(valid){return valid}else{return this.$validation.message}";
                    validations.push(column);
                }
                if (column.remember) {
                    if (column.expression && column.expression.indexOf(".") > 0) {
                        AppUtil.showShortMessage("Remember last value not supported for dotted [" + column.label + "] column.", "");
                        column.remember = false;
                    } else {
                        column.defaultexpression = $dataModel.handleRememberValue;
                        delete column.defaultrequiredcolumns;
                        $dataModel.registerWatch(false, DEFAULTS_KEY, {code:"return this.$new;", requiredColumns:[column.expression], column:{expression:column.expression, targetExpression:"view.remember"}}, watchSet, view.metadata, columns);
                    }
                }

                if ((column[UI] == UI_TYPE_LOOK_UP ) && column.filterRequiredColumns && AppUtil.isEmpty(column.defaultexpression)) {
                    column.defaultexpression = "return undefined";
                    column.defaultrequiredcolumns = column.filterRequiredColumns;
                }
                if (column[TOTAL_AGGREGATES]) {
                    var defaultWatch = {"$aggregate":true, code:$dataModel.handleAggregateChanges, requiredColumns:[column.expression], otherRequiredColumns:[
                        {expressionvalue:column.ui, alias:"$type"}
                    ]};
                    if (column.pexpression) {
                        var pExpColumn = $dataModel.getColumn(column.pexpression, columns);
                        var aggregateExp = false;
                        var columnExp = false;
                        if (pExpColumn.pexpression) {
                            var subExp = column.expression.substring(column.expression.indexOf(pExpColumn.pexpression) + pExpColumn.pexpression.length + 1);
                            aggregateExp = pExpColumn.pexpression + "._aggregates." + subExp;
                            columnExp = "_aggregates." + subExp;
                        } else {
                            aggregateExp = "_aggregates." + column.expression;
                            columnExp = aggregateExp;
                        }
                        defaultWatch.otherRequiredColumns.push({expression:aggregateExp, alias:"_aggregate"});
                        defaultWatch.column = {expression:columnExp, pexpression:pExpColumn.pexpression};
                    } else {
                        defaultWatch.otherRequiredColumns.push({expression:column.expression, alias:"_aggregate", targetExpression:model.view.metadata.dataAggregateExpression});
                        defaultWatch.column = {expression:column.expression, targetExpression:model.view.metadata.dataAggregateExpression};
                    }
                    $dataModel.registerWatch(column, DEFAULTS_KEY, defaultWatch, watchSet, view.metadata, columns);
                }
                if (column.flexcolumn) {
                    var defaultWatch = {"$flexible":true, code:$dataModel.handleFlexField, requiredColumns:[column.expression], otherRequiredColumns:[
                        {expressionvalue:column.expression, alias:"$expression"},
                        {expressionvalue:column.flexcolumns, alias:"$flexcolumns"},
                        {expressionvalue:componentid, alias:"$componentid"}
                    ]};
                    $dataModel.registerWatch(column, DEFAULTS_KEY, defaultWatch, watchSet, view.metadata, columns);
                }
                if (AppUtil.isEmpty(column.defaultexpression)) {
                    delete column.defaultexpression;
                    delete column.defaultrequiredcolumns;
                    delete column.defaultservices;
                } else {
                    if (AppUtil.isEmpty(column.defaultrequiredcolumns)) {
                        delete column.defaultrequiredcolumns;
                    }

                    if (AppUtil.isEmpty(column.defaultservices)) {
                        delete column.defaultservices;
                    } else if (!angular.isObject(column.defaultservices)) {
                        column.defaultservices = JSON.parse(column.defaultservices);
                    }
                    var defaultExp = column.expression;
                    if (column.pexpression) {
                        var pExpIndex = defaultExp.indexOf(column.pexpression + ".");
                        if (pExpIndex >= 0) {
                            defaultExp = defaultExp.substring(pExpIndex + column.pexpression.length + 1);
                        }
                    }
                    var defaultWhen = undefined;
                    if (column.defaultWhen && column.defaultWhen.toString().trim().length > 0) {
                        defaultWhen = column.defaultWhen;
                    }
                    var defaultWatch = {when:defaultWhen, code:column.defaultexpression, requiredColumns:column.defaultrequiredcolumns, services:column.defaultservices, column:{expression:defaultExp, pexpression:column.pexpression}}
                    if (column.remember) {
                        defaultWatch.otherRequiredColumns = [
                            {expressionvalue:column.expression, alias:"$expression"},
                            {expression:"remember", alias:"_remember", targetExpression:"view"}
                        ];
                    }
                    $dataModel.registerWatch(column, DEFAULTS_KEY, defaultWatch, watchSet, view.metadata, columns);
                }
            }
            view.metadata.validations = validations;
            view.metadata.watchSet = watchSet;
            scope.$watch(model.view.metadata.dataExpression, function (newvalue, oldvalue) {
                if (model.view.holdWatch) {
                    return;
                }
                var columns = model.view.metadata.watchColumns;
                if (!columns) {
                    return;
                }
                var primaryColumn = model.view.metadata[PRIMARY_COLUMN];
                $dataModel.handleChanges(componentid, scope, newvalue, oldvalue, false);
            }, true);
        };
        $dataModel.getScope = function (componentid) {
            return this[componentid].scope;
        };
        $dataModel.populateDataState = function (componentid) {
            var model = this.getModel(componentid);
            var data = model.view.data;
            var metadata = model.view.metadata;
            var dataCount = data.data ? data.data.length : 0;
            var maxRow = metadata.max_rows;
            metadata.datastate = metadata.datastate || {fromindex:0, toindex:0, prev:false, next:false, querycursor:metadata.cursor, datacursor:data.cursor};
            var dataState = metadata.datastate;
            var queryCursor = dataState.querycursor || 0;
            var dataCursor = data.cursor || 0;
            var fromIndex = dataState.fromindex;
            var toIndex = dataState.toindex;
            var prev = dataState.prev;
            var next = dataState.next;
            if (dataCount > 0) {
                fromIndex = queryCursor + 1;
                toIndex = fromIndex - 1 + dataCount;
                if (queryCursor == 0) {
                    prev = false;
                } else {
                    prev = true;
                }
                if (dataCursor) {
                    next = true;
                } else {
                    next = false;
                }
            } else {
                prev = false;
                next = false;
            }
            dataState.next = next;
            dataState.prev = prev;
            dataState.fromindex = fromIndex;
            dataState.toindex = toIndex;
            dataState.querycursor = queryCursor;
            dataState.datacursor = dataCursor;
        };
        $dataModel.next = function (componentid) {
            var model = this.getModel(componentid);
            model.view.metadata.datastate.querycursor = model.view.metadata.datastate.querycursor + model.view.metadata.max_rows;
            $dataModel.refresh(componentid);
        };
        $dataModel.prev = function (componentid) {
            var model = this.getModel(componentid);
            model.view.metadata.datastate.querycursor = model.view.metadata.datastate.querycursor - model.view.metadata.max_rows;
            $dataModel.refresh(componentid);
        };
        $dataModel.getColumn = function (expression, columns) {
            for (var k = 0; k < columns.length; k++) {
                if (columns[k].expression == expression) {
                    return columns[k];
                }
            }
        };
        $dataModel.putView = function (id, view) {
            try {
                this[id] = this[id] || {};
                this[id].view = view;
                view.metadata[PRIMARY_COLUMN] = view.metadata[PRIMARY_COLUMN] || KEY;
                if (view.metadata.readonly) {
                    view.metadata.insert = false;
                    view.metadata.delete = false;
                    view.metadata.edit = false;
                    view.metadata.save = false;
                }
                $dataModel.updateColumnClone(id, view.metadata.columns, view.metadata);
                if (view.metadata.quickviews && view.metadata.quickviews.length > 0) {
                    var quickViewIndex = -1;
                    for (var i = 0; i < view.metadata.quickviews.length; i++) {
                        if (view.metadata.quickviews[i].baasviewid.id == view.metadata.viewid) {
                            quickViewIndex = i;
                            break;
                        }
                    }
                    if (quickViewIndex == -1) {
                        throw new Error("Views does not match with quickviews");
                    }
                    view.metadata.quickviewindex = quickViewIndex;

                } else {
                    delete view.metadata.quickviews;
                }


                view.metadata.sequenceClone = view.metadata.sequenceClone || [];

                if (view.metadata.sequenceClone.length == 0) {
                    for (var i = 0; i < view.metadata.columns.length; i++) {
                        view.metadata.sequenceClone.push(view.metadata.columns[i]._id);
                    }
                }


                view.metadata.sequencePanelClone = view.metadata.sequencePanel || view.metadata.sequenceClone;
                view.metadata.columngroupsclone = view.metadata.columngroups ? angular.copy(view.metadata.columngroups) : [];
                view.selectedkeys = view.selectedkeys || [];
                view.metadata.breadCrumbInfo = view.metadata.breadCrumbInfo || [];
                view.metadata.appliedfilterparameters = view.metadata.filterparameters || {};
                view.metadata.filterparameters = {};
                view.remember = {};
                Object.keys(view.metadata.appliedfilterparameters).forEach(function (k) {
                    AppUtil.putDottedValue(view.metadata.filterparameters, k, view.metadata.appliedfilterparameters[k].value);
                    if (view.metadata.appliedfilterparameters[k].op) {
                        AppUtil.putDottedValue(view.metadata.filterparameters, k + "_filteroperator", view.metadata.appliedfilterparameters[k].op);
                    }
                });
                if (view.metadata.filter) {
                    view.metadata.parameters = view.metadata.parameters || {};
                    for (var filterKey in view.metadata.filter) {
                        if (view.metadata.parameters[filterKey] === undefined) {
                            view.metadata.parameters[filterKey] = view.metadata.filter[filterKey];
                        }
                    }
                }


            } catch (e) {
                AppUtil.handleError(e, "putView");
            }
        };
        $dataModel.getView = function (componentid) {
            return this[componentid] ? this[componentid].view : undefined;
        };
        $dataModel.getViewFromPath = function (path) {
            var keys = Object.keys(this);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (key.indexOf("view-component") < 0) {
                    continue;
                }
                if (this[key].view.metadata.path == path) {
                    return this[keys[i]].view;
                }
            }
        };
        $dataModel.removeView = function (componentid) {
            var model = this[componentid];
            delete this[componentid];
            if (model.scope) {
                model.scope.$destroy();
            }
            model = undefined;
        };
        $dataModel.setCurrentRow = function (componentid, row) {
            var model = this[componentid];
            model.view.currentrow = row;
        };
        $dataModel.getCurrentRow = function (componentid) {
            var model = this[componentid];
            return model.view.currentrow;
        };
        $dataModel.getSelectedKeys = function (componentid) {
            var model = this[componentid];
            var selectedKeys = model.view.selectedkeys;
            if (selectedKeys == null || selectedKeys == undefined) {
                AppUtil.handleError("selectedKeys does not exists for componentid [" + componentid + "]", "Alert");
            }
            return selectedKeys;
        };
        $dataModel.getData = function (componentid, query, busyMessage, callback) {
            var model = this[componentid];
            var view = model.view;
            var applicationId = view.applicationid;
            var ask = view.ask;
            var osk = view.osk;
            var params = view.metadata.parameters || {};
            var queryParams = query.parameters || {};
            Object.keys(queryParams).forEach(function (k) {
                params[k] = queryParams[k];
            });
            query.parameters = params;
            $appService.getData(query, ask, osk, busyMessage, callback);
        };
        $dataModel.getModel = function (componentid) {
            var model = this[componentid];
            if (model == null || model == undefined) {
                AppUtil.handleError(new Error("Model does not exists for componentid [" + componentid + "]"), "Alert");
            }
            return model;
        };
        $dataModel.resetDataState = function (componentid) {
            var model = this.getModel(componentid);
            var view = model.view;
            var dataState = view.metadata.datastate;
            if (dataState) {
                dataState.querycursor = 0;
            }
        };

        $dataModel.refresh = function (componentid, refreshCallback) {
            var model = this.getModel(componentid);
            if (model == null || model == undefined) {
                throw "No model found for refresh[" + componentid + "]";
            }
            var view = model.view;
            var ask = view.ask;
            var osk = view.osk;

            var that = this;
            var viewType = view.metadata.type;
            var parameters = view.metadata.parameters;
            var cursor = view.data.cursor;

            var columns = {};
            var refreshRequired = false;
            if ((viewType == 'panel' && view.metadata.columns)) {
                for (var i = 0; i < view.metadata.columns.length; i++) {
                    if ((view.metadata.columns[i][SHOW_ON_PANEL] && !view.metadata.columns[i][SHOW_ON_TABLE])) {
                        refreshRequired = true;
                        columns[view.metadata.columns[i].expression] = 1;
                    }
                }
            } else if ((viewType == 'table' && view.metadata.columns)) {
                refreshRequired = true;
            }
            if (Object.keys(columns).length == 0) {
                columns = undefined;
            }


            var callBack = function (response) {
                try {
                    if (response && response.data) {
                        $dataModel.modifyDataAsPerColumn(response.data, view.metadata.columns);
                    }
                    $dataModel.holdWatch(componentid, true);
                    if (viewType == "panel") {
                        if (response && response.data && response.data.length > 0) {
                            var panelData = response.data[0];
                            var currentData = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);
                            var currentDataClone = model.scope.view.dataclone;
                            Object.keys(panelData).forEach(function (k) {
                                $dataModel.mergeData(k, panelData[k], currentData);
                                $dataModel.mergeData(k, angular.copy(panelData[k]), currentDataClone);
                            });
                        }
                    } else {
                        delete view.data.cursor;
                        Object.keys(response).forEach(function (k) {
                            $dataModel.mergeData(k, response[k], view.data);
                        });
                        view.dataclone = angular.copy(response.data);
                    }
                    that.populateDataState(componentid);
                    if (refreshCallback) {
                        refreshCallback(response.data);
                    }
                    if (!model.scope.$$phase) {
                        model.scope.$apply();
                    }
                    $dataModel.holdWatch(componentid, false);
                } catch (e) {
                    AppUtil.handleError(e, "refreshCallback");
                }
            };
            if (refreshRequired) {
                var query = {"keepstructure":true, "table":view.metadata.table, "fields":columns, "parameters":parameters};
                if (view.metadata.filter) {
                    query.filter = angular.copy(view.metadata.filter);
                } else {
                    query.filter = {};
                }

                if (view.metadata.max_rows !== undefined) {
                    query.max_rows = view.metadata.max_rows;
                }
                if (view.metadata.orders != null && view.metadata.orders != undefined) {
                    query.orders = view.metadata.orders;
                }
                if (view.metadata.ftsfilter && view.metadata.ftsfilter.length > 0) {
                    var splitValue = view.metadata.ftsfilter.split(":");
                    var found = false;
                    for (var i = 0; i < view.metadata.columns.length; i++) {
                        var col = view.metadata.columns[i];
                        var colValue = splitValue[0].trim();
                        if (col && col.label && col.label.trim() == colValue) {
                            var filerExpression = AppUtil.getDisplayExp(col);
                            query.filter[filerExpression] = {"$regex":"\\b" + splitValue[1].trim() + "\\b", "$options":"-i"};
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        AppUtil.showShortMessage("Full text filter column not found [" + splitValue[0] + "]")
                        return;
                    }
                }

                query.cursor = view.metadata.datastate.querycursor;
                query.view = view.metadata.viewid;

                $appService.getData(query, ask, osk, "Loading...", callBack);
            } else {
                callBack();
            }
        }
        ;


        $dataModel.modifyDataAsPerColumn = function (data, columns) {

            if (!data || !angular.isArray(data) || data.length == 0) {
                return;
            }

            var compositeColumnIndex = AppUtil.getIndexFromArray(columns, "ui", UI_TYPE_COMPOSITE_LOOK_UP);
            var jsonColumnIndex = AppUtil.getIndexFromArray(columns, "ui", UI_TYPE_JSON);

            var iterateRequired = false;
            var compositeColumn = undefined;
            var jsonColumn = undefined;

            if (compositeColumnIndex !== undefined && compositeColumnIndex >= 0) {
                iterateRequired = true;
                compositeColumn = columns[compositeColumnIndex];
            }

            if (jsonColumnIndex !== undefined && jsonColumnIndex >= 0) {
                iterateRequired = true;
                jsonColumn = columns[jsonColumnIndex];
            }

            if (!iterateRequired) {
                return;
            }

            for (var i = 0; i < data.length; i++) {
                if (compositeColumn) {
                    var compositeColumnValue = AppUtil.resolve(data[i], compositeColumn.expression);
                    if (compositeColumnValue && angular.isObject(compositeColumnValue) && compositeColumnValue.type) {
                        var requiredCompositeOptionIndex = AppUtil.getIndexFromArray(compositeColumn.compositeoptions, "label", compositeColumnValue.type);
                        if (requiredCompositeOptionIndex != undefined && requiredCompositeOptionIndex >= 0) {
                            var requiredCompositeOptionValue = AppUtil.resolve(compositeColumnValue, compositeColumn.compositeoptions[requiredCompositeOptionIndex].expression);
                            if (requiredCompositeOptionValue) {
                                requiredCompositeOptionValue = angular.copy(requiredCompositeOptionValue);
                                var compositeLookupDisplay = compositeColumn.compositeoptions[requiredCompositeOptionIndex].displaycolumns;
                                if (angular.isArray(compositeLookupDisplay) && compositeLookupDisplay.length > 0) {
                                    compositeLookupDisplay = compositeLookupDisplay[0];
                                }
                                requiredCompositeOptionValue.__value = requiredCompositeOptionValue[compositeLookupDisplay];
                                compositeColumnValue.value = requiredCompositeOptionValue;
                            }
                        }
                    }
                } else if (jsonColumn) {
                    for (var j = 0; j < columns.length; j++) {
                        var obj = columns[j];
                        if (obj.ui == UI_TYPE_JSON) {
                            var jsonColumnColumnValue = AppUtil.resolve(data[i], obj.expression);
                            if (jsonColumnColumnValue && (angular.isArray(jsonColumnColumnValue) || angular.isObject(jsonColumnColumnValue))) {
                                AppUtil.putDottedValue(data[i], obj.expression, JSON.stringify(jsonColumnColumnValue));
                            }
                        }

                    }

                }
            }
        }
        $dataModel.mergeData = function (key, value, record) {
            var recordValue = AppUtil.resolve(record, key);
            if (recordValue === undefined || typeof(recordValue) == UI_TYPE_BOOLEAN) {
                AppUtil.putDottedValue(record, key, value);
            } else if (recordValue && value && (recordValue instanceof Array) && (value instanceof Array)) {
                recordValue.splice(0);
                for (var i = 0; i < value.length; i++) {
                    recordValue.push(value[i]);
                }
            } else if (recordValue && value && (recordValue instanceof Object) && (value instanceof Object)) {
                Object.keys(value).forEach(function (k) {
                    $dataModel.mergeData(k, value[k], recordValue);
                });
            } else {
                AppUtil.putDottedValue(record, key, value);
            }
        };
        $dataModel.insert = function (componentid) {
            var model = this[componentid];
            var tempKey = this.getTempKey(model.view.metadata[PRIMARY_COLUMN]);
            var data = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);
            var direction = model.view.metadata.insertDirection;
            if (!direction || direction == "up") {
                data.splice(0, 0, tempKey);
                model.view.dataclone.splice(0, 0, angular.copy(tempKey));
            } else {
                data.push(tempKey);
                model.view.dataclone.push(angular.copy(tempKey));
            }
            $dataModel.setCurrentRow(componentid, tempKey);
        };
        $dataModel.resolveDefaults = function (componentid, fn, defaultservicesJSON, parameters, dataExpressions, when) {
            try {

                var whenValue = true;

                if (when) {
                    var whenoptions = {};
                    new EvalulateExp(when, whenoptions, parameters);
                    whenValue = whenoptions.result;
                }

                var model = this[componentid];
                var scope = model.scope;
                if (defaultservicesJSON && whenValue) {
                    var defaultservicesJSONKeys = Object.keys(defaultservicesJSON);
                    var queryResultCount = 0;
                    defaultservicesJSONKeys.forEach(function (k) {
                        var defaultService = angular.copy(defaultservicesJSON[k]);
                        var url = "";
                        var urlParameters = {};
                        if (defaultService.table) {
                            /*it is a query*/
                            url = BAAS_SERVER + "/data";
                            defaultService.parameters = defaultService.parameters || {};
                            if (parameters) {
                                Object.keys(parameters).forEach(function (paramName) {
                                    defaultService.parameters[paramName] = parameters[paramName];
                                });
                                urlParameters.query = JSON.stringify(defaultService);
                            }

                        } else if (defaultService.jobname) {
                            /*It is a job*/
                            url = BAAS_SERVER + "/custom/job";
                            urlParameters.jobname = defaultService.jobname;
                            if (parameters) {
                                urlParameters.parameters = JSON.stringify(parameters);
                            } else {
                                urlParameters.parameters = {};
                            }
                        } else {
                            AppUtil.handleError(new Error("Unhandled default service>>" + JSON.stringify(defaultService)), "Resolve defaults");
                        }
                        urlParameters.ask = model.view.ask;
                        urlParameters.osk = model.view.osk;
                        var serverKey = AppUtil.getComponentId(SERVER_KEY);
                        $dataModel.holdServerCalls(componentid, true, serverKey, dataExpressions);
                        AppUtil.getDataFromService(url, urlParameters, "POST", "JSON", false, function (queryResult) {
                            $dataModel.holdServerCalls(componentid, false, serverKey, dataExpressions);
                            queryResultCount = queryResultCount + 1;
                            parameters[k] = queryResult;
                            if (defaultservicesJSONKeys.length == queryResultCount) {
                                $dataModel.evalulateExp(componentid, fn, parameters, dataExpressions, whenValue);
                            }
                        }, function (error) {
                            $dataModel.holdServerCalls(componentid, false, serverKey, dataExpressions);
                            AppUtil.handleError("[" + error.response + "]", "resolveDefaults");
                        });

                    });
                } else {
                    $dataModel.evalulateExp(componentid, fn, parameters, dataExpressions, whenValue);
                }
            } catch (e) {
                AppUtil.handleError("Problem in resolvig default>>>" + e.message + "<br>" + "<br>Services" + JSON.stringify(defaultservicesJSON) + "<br>Function>>>>" + fn + "<br>Columns>>>" + JSON.stringify(dataExpressions));
            }
        };
        $dataModel.holdServerCalls = function (componentid, serverCallInProcess, serverKey, dataExpressions) {
            var model = this[componentid];
            if (dataExpressions && dataExpressions.length > 0 && dataExpressions[0].expression) {
                var currentRow = $dataModel.getCurrentRow(componentid);
                var exp = dataExpressions[0].expression;
                exp = exp.replace(/\./g, '_') + "_showLoading";
                currentRow[exp] = serverCallInProcess;
            }
            if (serverCallInProcess) {
                model.view[SERVER_KEY] = model.view[SERVER_KEY] || {};
                model.view[SERVER_KEY][serverKey] = true;
            } else {
                delete model.view[SERVER_KEY][serverKey];
            }
        };
        $dataModel.evalulateExp = function (componentid, fn, parameters, dataExpressions, whenValue) {
            var result = null;
            if (whenValue) {
                var options = {};
                new EvalulateExp(fn, options, parameters);
                result = options.result;
            }

            if (result && result instanceof Date) {
                result = result.getFormattedDate(SERVER_DATE_FORMAT);
            }
            var model = $dataModel.getModel(componentid);
            var data = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);

            for (var i = 0; i < dataExpressions.length; i++) {
                var expObject = dataExpressions[i];
                var expression = expObject.expression;
                var path = expObject.path;
                var target = undefined;
                for (var j = 0; j < path.length; j++) {
                    var obj = path[j];
                    if (obj.targetExpression) {
                        target = AppUtil.resolve(model.scope, obj.targetExpression, true);
                        continue;
                    }
                    var pathKey = obj.key;
                    var pathKeyValue = obj.keyvalue;
                    var dataForResolve = undefined;
                    if (target && obj.expression) {
                        dataForResolve = AppUtil.resolve(target, obj.expression);
                    } else {
                        dataForResolve = data;
                    }
                    if (dataForResolve instanceof Array && pathKeyValue) {
                        target = AppUtil.getRecord(dataForResolve, pathKeyValue, pathKey);
                    } else if (dataForResolve instanceof Object) {
                        target = dataForResolve;
                    } else {
                        AppUtil.handleError(new Error("No target found for resolving expression[" + fn + "] with data expression [ " + JSON.stringify(dataExpressions)), "Alert");
                    }
                }
                if (!target) {
                    AppUtil.handleError(new Error("No target found for resolving expression[" + fn + "] with data expression [ " + JSON.stringify(dataExpressions)), "Alert");
                }
                $dataModel.mergeData(expression, result, target);
            }

            if (!model.scope.$$phase) {
                model.scope.$apply();
            }

        };
        EvalulateExp = function (code, options, parameters) {
            var that = this;
            if (parameters) {
                Object.keys(parameters).forEach(function (k) {
                    that[k] = parameters[k];
                });
            }
            try {
                var result = undefined;
                if ((typeof code) == "function") {
                    result = code(that);
                } else {
                    result = Function(code).apply(that, []);
                }
                options.result = result;
            } catch (e) {
                AppUtil.handleError("Problem in resolving defaults>>>" + code + ">>>>>" + e, "Alert");
            }
        };
        $dataModel.deleteData = function (componentid) {
            var model = this[componentid];
            var view = model.view;
            var data = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);
            var primaryColumn = view.metadata[PRIMARY_COLUMN];
            var selectedItems = this.getSelectedKeys(componentid);
            var selectedCount = selectedItems.length;
            if (selectedCount > 0) {
                var deletedItems = [];
                for (var i = 0; i < selectedCount; i++) {
                    var selectedItem = selectedItems[i];
                    var key = AppUtil.resolve(selectedItem, primaryColumn);
                    var dataIndex = $dataModel.getIndex(key, componentid, primaryColumn);
                    if (dataIndex < 0) {
                        AppUtil.handleError(new Error("No row exists for delete"), "Alert");
                    }
                    data.splice(dataIndex, 1);
                    var deletedOperation = {};
                    deletedOperation[primaryColumn] = key;
                    var dottedIndex = primaryColumn.lastIndexOf(".");
                    var operationPrefix = "";
                    if (dottedIndex >= 0) {
                        operationPrefix = primaryColumn.substring(0, dottedIndex) + ".";
                    }
                    operationPrefix += "__type__";
                    deletedOperation[operationPrefix] = "delete";
                    deletedItems.push(deletedOperation);
                }
                /*empty selected items*/
                selectedItems.splice(0);
                view.metadata.clientDelete = true;
                model.scope.appData.shortMessage = {"msg":selectedCount + " row deleted. Press save button to persist.", "modal":false, "time":10000, className:'app-background-orange'};
                if (view.metadata.clientDelete) {
                    if (!model.scope.$$phase) {
                        model.scope.$apply();
                    }
                } else {
                    var that = this;
                    var callBack = function (data) {
                        that.refresh(componentid);
                    };
                    $appService.save({"table":view.metadata.table, "filter":view.metadata.filter, "parameters":view.metadata.parameters, "operations":deletedItems}, view.ask, view.osk, callBack);
                }
            } else {
                AppUtil.showShortMessage("No row selected for delete");
            }
        };
        $dataModel.addFilter = function (componentId, pFilterExp, pParamValue, asParameter) {
            var model = this.getModel(componentId);
            var target = false;
            if (asParameter) {
                target = model.view.metadata.parameters = model.view.metadata.parameters || {};
            } else {
                target = model.view.metadata.filter = model.view.metadata.filter || {};
            }
            if (pParamValue === undefined) {
                delete target[pFilterExp];
            } else {
                target[pFilterExp] = pParamValue;
            }

        };
        $dataModel.isTempKey = function (id) {
            var dottedPattern = /.+(temp)$/;
            return (dottedPattern.test(id));
        };
        $dataModel.save = function (componentid, refreshOnSave, saveCallBack) {
            var model = this.getModel(componentid);
            var view = model.view;
            if (model.view[SERVER_KEY] && model.view[SERVER_KEY].length > 0) {
                AppUtil.handleError("Default Value is synching.. Please try when it finished.", "Alert");
                return;

            }
            var ask = view.ask;
            var osk = view.osk;
            var newInserts = $dataModel.getUpdates(componentid);
            var newInsertsCount = newInserts.length;
            if (newInsertsCount > 0) {
                var that = this;
                var callBack = function (data, warnings) {
                    if (warnings && warnings.length > 0) {
                        for (var i = 0; i < warnings.length; i++) {
                            model.scope.appData.warning.warnings.push({message:warnings[i].log.log})
                        }
                        model.scope.appData.warning.showWarningWindow = true;
                    }
                    if (refreshOnSave) {
                        that.refresh(componentid, function (data) {
                            if (saveCallBack) {
                                saveCallBack(data);
                            }
                        });
                    } else {
                        if (saveCallBack) {
                            saveCallBack(data);
                        }
                    }
                };
                var cloneData = view.dataclone;
                var data = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);
                var primaryColumn = view.metadata[PRIMARY_COLUMN];
                var columns = model.view.metadata.columns;
                var validations = view.metadata.validations;

                if (view.metadata.validations && view.metadata.validations.length > 0) {
                    $dataModel.handleChanges(componentid, model.scope, data, cloneData, true, function (holdSave) {
                        if (holdSave) {
                            model.scope.appData.warning.showWarningWindow = true;
                        } else {
                            $appService.save({table:view.metadata.table, filter:view.metadata.filter, parameters:view.metadata.parameters, operations:newInserts, view:view.metadata.viewid}, ask, osk, callBack);
                        }
                    });
                } else {
                    $appService.save({table:view.metadata.table, filter:view.metadata.filter, parameters:view.metadata.parameters, operations:newInserts, view:view.metadata.viewid}, ask, osk, callBack);
                }
            } else {
                AppUtil.showShortMessage("No data found for saving.");

            }
        };
        $dataModel.handleColumnUpdate = function (componentId, column, key, cloneRecord, record, compositeUpdates, updates, requirecompositeUpdates, required, onlyKey, columns) {
            var expression = column.expression;
//            if (!required && !column[SHOW_ON_TABLE] && !column[SHOW_ON_PANEL]) {
//                return;
//            }
            var type = column[UI] || columns[UI_PANEL];
            var multiple = column.multiple;
            var oldValue = AppUtil.resolve(cloneRecord, expression);
            var newValue = AppUtil.resolve(record, expression);
            if (!angular.equals(oldValue, newValue)) {
                if (column.multiple) {
                    if (newValue && newValue instanceof Array && newValue.length == 0) {
                        if (oldValue && angular.isArray(oldValue) && oldValue.length > 0) {
                            newValue = null;
                        } else {
                            newValue = undefined;
                            // we should not check  as old and new are same
                            return;
                        }
                    }
                }
                newValue = angular.copy(newValue);
                /*clone newValue so that changes in this will nt reflect in data*/
                if (type == UI_TYPE_COMPOSITE_LOOK_UP) {
                    var newValueType = undefined;
                    if (newValue && newValue.type) {
                        newValueType = newValue.type;
                        var requiredCompositeOptionIndex = AppUtil.getIndexFromArray(column.compositeoptions, "label", newValue.type);
                        if (requiredCompositeOptionIndex != undefined && requiredCompositeOptionIndex >= 0) {
                            AppUtil.putDottedValue(newValue, column.compositeoptions[requiredCompositeOptionIndex].expression, newValue.value);
                        }
                        delete newValue.value;

                    }
                    if (oldValue && oldValue.type && oldValue.type != newValueType) {
                        var requiredCompositeOptionIndex = AppUtil.getIndexFromArray(column.compositeoptions, "label", oldValue.type);
                        if (requiredCompositeOptionIndex != undefined && requiredCompositeOptionIndex >= 0) {
                            AppUtil.putDottedValue(newValue, column.compositeoptions[requiredCompositeOptionIndex].expression, null);
                        }
                    }

                } else if (type == UI_TYPE_JSON) {
                    if (newValue && (!angular.isArray(newValue) && !angular.isObject(newValue))) {
                        if (newValue.toString().trim().length > 0) {
                            newValue = JSON.parse(newValue)
                        } else {
                            newValue = null;
                        }
                    } else {
                        newValue = null;
                    }
                } else if (type == UI_TYPE_IMAGE || type == UI_TYPE_FILE) {
                    if (newValue) {
                        newValue = {data:angular.copy(newValue), override:true};
                    }
                } else if (type == UI_TYPE_LOOK_UP) {
                    if (multiple && newValue) {
                        if (column.options && column.options.length > 0) {
                            newValue = {"data":angular.copy(newValue), override:true};
                        } else {
                            if (!requirecompositeUpdates) {
                                var columnToPass = AppUtil.getNestedColumns($dataModel.getView(componentId).metadata.columns, column.expression);
                                if (!columnToPass || columnToPass.length == 0) {
                                    columnToPass = column.lookupdisplaycolumns;
                                }
                                if (columnToPass) {
                                    newValue = $dataModel.getColumnUpdates(componentId, newValue, oldValue, columnToPass, KEY, requirecompositeUpdates, true, onlyKey, false);
                                }

                            } else if (requirecompositeUpdates && column.watchColumns) {
                                var nestedUpdates = $dataModel.getColumnUpdates(componentId, $dataModel.unwind(newValue, expression), $dataModel.unwind(oldValue, expression), column.watchColumns, expression + "." + KEY, requirecompositeUpdates, true, onlyKey, false);
                                newValue = undefined;
                                if (nestedUpdates) {
                                    Object.keys(nestedUpdates).forEach(function (k) {
                                        if (!compositeUpdates[k]) {
                                            compositeUpdates[k] = [];
                                        }
                                        for (var l = 0; l < nestedUpdates[k].length; l++) {
                                            var obj = nestedUpdates[k][l];
                                            var oldUnWindKey = obj.unwindkey;
                                            obj.unwindkey = [obj.key];
                                            if (oldUnWindKey) {
                                                for (var m = 0; m < oldUnWindKey.length; m++) {
                                                    obj.unwindkey.push(oldUnWindKey[m]);
                                                }
                                            }
                                            obj.key = key;
                                            compositeUpdates[k].push(obj);
                                        }
                                    });
                                }
                            }
                        }
                    }
                    if (!column.multiple && oldValue && oldValue._id && newValue && newValue._id && oldValue._id == newValue._id && !angular.equals(oldValue, newValue)) {
                        newValue.__type__ = "update";
                    }
                    if ((!column.multiple) && AppUtil.isEmpty(column.options) && newValue && (newValue instanceof Object) && (Object.keys(newValue).length == 0)) {
                        newValue = null;
                    }
                    if (newValue === undefined) {
                        newValue = null;
                    }
                } else if (type == UI_TYPE_STRING && column.multiple) {
                    if (newValue && !(newValue instanceof Array)) {
                        if (newValue.toString().trim().length > 0) {
                            newValue = JSON.parse(newValue.toString().trim());
                        } else {
                            newValue = undefined;
                        }
                    } else if (newValue instanceof Array && newValue.length == 0) {
                        if (oldValue) {
                            newValue = null;
                        } else {
                            newValue = undefined;
                        }
                    }
                } else if (type == 'object' || type == 'table') {
                    if (newValue === null || newValue === undefined || ((typeof newValue != "object") && newValue.toString().trim().length == 0)) {
                        newValue = null;
                    }
                    if (newValue) {
                        if (multiple && angular.isArray(newValue)) {
                            var nestedColumns = AppUtil.getNestedColumns($dataModel.getView(componentId).metadata.columns, column.expression);
                            if (!requirecompositeUpdates && nestedColumns) {
                                newValue = $dataModel.getColumnUpdates(componentId, newValue, oldValue, nestedColumns, KEY, requirecompositeUpdates, true, false);
                            } else if (requirecompositeUpdates && column.watchColumns) {
                                var nestedUpdates = $dataModel.getColumnUpdates(componentId, $dataModel.unwind(newValue, expression), $dataModel.unwind(oldValue, expression), column.watchColumns, expression + "." + KEY, requirecompositeUpdates, true, false);
                                newValue = undefined;
                                if (nestedUpdates) {
                                    Object.keys(nestedUpdates).forEach(function (k) {
                                        if (!compositeUpdates[k]) {
                                            compositeUpdates[k] = [];
                                        }
                                        for (var l = 0; l < nestedUpdates[k].length; l++) {
                                            var obj = nestedUpdates[k][l];
                                            var oldUnWindKey = obj.unwindkey;
                                            obj.unwindkey = [obj.key];
                                            if (oldUnWindKey) {
                                                for (var m = 0; m < oldUnWindKey.length; m++) {
                                                    obj.unwindkey.push(oldUnWindKey[m]);
                                                }
                                            }
                                            obj.key = key;
                                            compositeUpdates[k].push(obj);
                                        }
                                    });
                                }
                            }
                        } else if (!(angular.isArray(newValue) || angular.isObject(newValue)) && newValue.toString().trim().length > 0) {
                            newValue = JSON.parse(newValue);
                        }
                        /*check if newValue and oldValue are same*/
                        if (angular.equals(newValue, oldValue)) {
                            newValue = undefined;
                        }
                    }
                } else if (type == UI_TYPE_CURRENCY) {
                    if (newValue) {
                        var amt = newValue.amount;
                        var currencyType = newValue.type;
                        if (amt === undefined || amt === null || amt.toString().trim().length == 0 || !currencyType) {
                            newValue = null;
                        } else {
                            newValue.amount = Number(amt);
                        }
                        if (angular.equals(newValue, oldValue)) {
                            newValue = undefined;
                        }
                    }
                } else if (type == UNIT_TYPE) {
                    if (newValue) {
                        var quantity = newValue.quantity;
                        var unit = newValue.unit;
                        if (quantity === undefined || quantity === null || quantity.toString().trim().length == 0 || !unit) {
                            newValue = null;
                        } else {
                            newValue.quantity = Number(quantity);
                        }
                        if (angular.equals(newValue, oldValue)) {
                            newValue = undefined;
                        }
                    }
                } else if (type == UI_TYPE_DURATION) {
                    if (newValue) {
                        var time = newValue.time;
                        var timeUnit = newValue.timeunit;
                        if (time === undefined || time === null || time.toString().trim().length == 0 || timeUnit === undefined || timeUnit === null || timeUnit.toString().trim().length == 0) {
                            newValue = null;
                        } else {
                            newValue.time = Number(time);
                        }
                        if (angular.equals(newValue, oldValue)) {
                            newValue = undefined;
                        }
                    }
                }
                if ((oldValue === undefined || oldValue === null) && newValue === null) {
                    newValue = undefined;
                }
                if (newValue !== undefined) {
                    AppUtil.putDottedValue(updates, expression, newValue);
                    if (requirecompositeUpdates) {
                        compositeUpdates[expression] = compositeUpdates[expression] || [];
                        compositeUpdates[expression].push({$new:newValue, $old:oldValue, key:key});
                    }
                    /*check for dotted expression*/
                    var dottexExpression = expression;
                    var dottIndex = dottexExpression.indexOf(".");
                    var dottedConcatExpression = "";
                    while (dottIndex >= 0) {
                        /*we have to send _id value along with updates*/
                        var firstExpression = dottexExpression.substring(0, dottIndex);
                        var firstIndex = dottedConcatExpression + firstExpression + "._id";
                        var updatedFirstIndex = AppUtil.resolve(updates, firstIndex);
                        var oldRecordFirstIndex = AppUtil.resolve(cloneRecord, firstIndex);
                        var currentRecordFirstIndex = AppUtil.resolve(record, firstIndex);
                        if (!updatedFirstIndex) {
                            if (currentRecordFirstIndex) {
                                AppUtil.putDottedValue(firstIndex, currentRecordFirstIndex)
                            } else if (oldRecordFirstIndex) {
                                AppUtil.putDottedValue(firstIndex, oldRecordFirstIndex)
                            }
                        }
                        dottexExpression = dottexExpression.substring(dottIndex + 1);
                        dottIndex = dottexExpression.indexOf(".");
                        dottedConcatExpression = dottedConcatExpression + firstExpression + ".";
                    }
                }
            }
        }
        $dataModel.populateFlexColumnFrorUpdates = function (columns, row) {
            var flexColumn = false;
            for (var i = 0; i < columns.length; i++) {
                if (columns[i].flexcolumn) {
                    flexColumn = columns[i];
                    break;
                }
            }
            if (!flexColumn) {
                return;
            }
            if (flexColumn.expression.indexOf(".") >= 0) {
                return;
            }
            //flex column expression, if it is dotted, then contiue as it will be handled by parent column
            columns = angular.copy(columns);
            var flexColumnValue = row && row[flexColumn.expression] && row[flexColumn.expression]._id ? row[flexColumn.expression]._id : false;
            if (!flexColumnValue) {
                return;
            }
            var flexColumns = $dataModel.getFlexColumns(flexColumn.flexcolumns, flexColumnValue);
            if (!flexColumns) {
                return;
            }
            for (var j = 0; j < flexColumns.length; j++) {
                var exp = flexColumns[j].expression;
                var dottedExp = false;
                var leafExp = exp;
                var dotIndex = exp.indexOf(".");
                if (dotIndex > 0) {
                    dottedExp = exp.substring(0, dotIndex);
                    leafExp = exp.substring(dotIndex + 1);
                }
                if (dottedExp) {
                    /*case of nested expression*/
                    /*find dotted expression*/
                    //TODO handle column.columns case
                    for (var i = 0; i < columns.length; i++) {
                        if (columns[i].expression == dottedExp) {
                            columns[i].columns = columns[i].columns || [];
                            flexColumns[j].expression = leafExp;
                            columns[i].columns.push(flexColumns[j]);
                            break;
                        }
                    }
                } else {
                    /*case of panel*/
                    columns.push(flexColumns[j]);
                }
            }
            return columns;
            /*End check for flex field*/
        }
        $dataModel.getColumnUpdates = function (componentId, data, cloneData, columns, primaryColumn, requirecompositeUpdates, required, onlyKey) {
            try {
                if (data && cloneData && !angular.isArray(data) && !angular.isArray(cloneData)) {
                    data = [angular.copy(data)]
                    cloneData = [angular.copy(cloneData)]
                }
                if (!primaryColumn) {
                    AppUtil.handleError(new Error("Primary column not defined"), "$dataModel.getColumnUpdates");
                }
                var noOfColumns = columns.length;
                var newInserts = [];
                var compositeUpdates = {};
                var noOfDataRecords = data.length;
                for (var i = 0; i < noOfDataRecords; i++) {
                    var record = data[i];
                    var key = AppUtil.resolve(record, primaryColumn);
                    var cloneRecord = AppUtil.getRecord(cloneData, key, primaryColumn);
                    cloneRecord = cloneRecord || {};
                    var updates = {};
                    //check for flexible columns
                    var flexColumnsAfterMerging = $dataModel.populateFlexColumnFrorUpdates(columns, record);
                    if (flexColumnsAfterMerging) {
                        columns = flexColumnsAfterMerging;
                        noOfColumns = columns.length
                    }
                    for (var j = 0; j < noOfColumns; j++) {
                        var column = columns[j];
                        $dataModel.handleColumnUpdate(componentId, column, key, cloneRecord, record, compositeUpdates, updates, requirecompositeUpdates, required, onlyKey, columns);
                    }
                    if (Object.keys(updates).length > 0) {
                        if (key && /.+(temp)$/.test(key) && !requirecompositeUpdates && !onlyKey) {
                            AppUtil.putDottedValue(updates, primaryColumn + "__temp", key)
                            AppUtil.removeDottedValue(updates, primaryColumn);
                            if (componentId) {
                                var view = $dataModel.getView(componentId);
                                if (view && view.metadata && view.metadata.updatetype && !updates.__type__) {
                                    updates.__type__ = view.metadata.updatetype;
                                }
                            }

                        } else {
                            AppUtil.putDottedValue(updates, primaryColumn, key)
                        }
                        newInserts.push(updates);
                    }
                }
                /*check for delete*/
                if (cloneData) {
                    var cloneRecordsCount = cloneData.length;
                    for (var i = 0; i < cloneRecordsCount; i++) {
                        var record = cloneData[i];
                        var key = AppUtil.resolve(record, primaryColumn);
                        var dataRecord = AppUtil.getRecord(data, key, primaryColumn);
                        if (dataRecord == null) {
                            /*case of delete*/
                            var deletedOperation = {};
                            AppUtil.putDottedValue(deletedOperation, primaryColumn, key)
                            var dottedIndex = primaryColumn.lastIndexOf(".");
                            var operationPrefix = "";
                            if (dottedIndex >= 0) {
                                operationPrefix = primaryColumn.substring(0, dottedIndex) + ".";
                            }
                            operationPrefix += "__type__";
                            AppUtil.putDottedValue(deletedOperation, operationPrefix, "delete")
                            if (requirecompositeUpdates) {
                                for (var j = 0; j < noOfColumns; j++) {
                                    var column = columns[j];
                                    var colExp = column.expression;
                                    var oldValue = AppUtil.resolve(record, colExp);
                                    var columnUi = column[UI] || column[UI_PANEL];
                                    if (columnUi == UI_TYPE_CURRENCY || columnUi == UI_TYPE_DURATION) {
                                        compositeUpdates[colExp] = compositeUpdates[colExp] || [];
                                        compositeUpdates[colExp].push({$new:undefined, $old:oldValue, key:key, $delete:true});
                                    }
                                }
                            }
                            if (key && key.toString().indexOf("temp") < 0) {
                                newInserts.push(deletedOperation);
                            }
                        }
                    }
                }
                if (requirecompositeUpdates) {
                    return compositeUpdates;
                } else {
                    return newInserts;
                }
            } catch (e) {
                AppUtil.handleError(e, "getColumnUpdates");
            }
        };
        $dataModel.getUpdates = function (componentid) {
            var model = this.getModel(componentid);
            var view = model.view;
            var cloneData = view.dataclone;
            var data = AppUtil.resolve(model.scope, model.scope.view.metadata.dataExpression);
            var primaryColumn = view.metadata[PRIMARY_COLUMN];
            var columns = model.view.metadata.columns;
            return $dataModel.getColumnUpdates(componentid, data, cloneData, columns, primaryColumn, false, false, false);
        };

        $dataModel.pushDependentColumn = function (requiredColumns, columns) {
            if (!requiredColumns) {
                return;
            }
            for (var j = 0; j < requiredColumns.length; j++) {
                var requiredColumn = requiredColumns[j];
                var displayExp = "";
                if (requiredColumn.indexOf(".") >= 0) {
                    var lookupExp = requiredColumn;
                    while (lookupExp && lookupExp.indexOf(".") >= 0) {
                        var lastIndexofDot = lookupExp.lastIndexOf(".");
                        displayExp = requiredColumn.substring(lastIndexofDot + 1);
                        lookupExp = requiredColumn.substring(0, lastIndexofDot);
                        var lookupExpCol = $dataModel.getColumn(lookupExp, columns);
                        if (lookupExpCol) {
                            AppUtil.pushIfNotExists(displayExp, "dependentColumns", lookupExpCol);
                        }
                    }
                }
            }
        }
        $dataModel.updateColumnClone = function (componentid, columns, metadata) {
            var columnsLength = columns ? columns.length : 0;
            for (var i = 0; i < columnsLength; i++) {
                var column = columns[i];
                delete column.pexpression;
                if (column.readonly) {
                    column.edit = false;
                    column[EDITABLE_EXPRESSION] = false;
                    column[EDITABLE_EXPRESSION_PANEL] = false;
                }

                if (column[UI] == UI_TYPE_TABLE || column[UI_PANEL] == UI_TYPE_TABLE) {
                    if (!column.multiple) {
                        metadata.warnings = metadata.warnings || [];
                        metadata.warnings.push("[" + column.expression + "] is showing as table but it is not multiple");
                        column.showOnTable = false;
                        column.showOnPanel = false;
                    }
                }
                /*check default required columns and populate lookup required columns if any*/
                if (column.defaultrequiredcolumns) {
                    $dataModel.pushDependentColumn(column.defaultrequiredcolumns, columns);
                }
                if (column.visibleRequiredColumns) {
                    $dataModel.pushDependentColumn(column.visibleRequiredColumns, columns);
                }
                var expression = column.expression;
                var dotIndex = expression.indexOf(".");
                if (dotIndex > 0) {
                    var lastDotIndex = expression.lastIndexOf(".");
                    var expressionToCheck = expression.substring(0, lastDotIndex);
                    while (expressionToCheck) {
                        var expressionToCheckColumn = AppUtil.getIndexFromArray(columns, "expression", expressionToCheck);
                        if (expressionToCheckColumn !== undefined) {
                            if (columns[expressionToCheckColumn].multiple) {
                                column.pexpression = expressionToCheck
                                break;
                            }

                        }
                        lastDotIndex = expressionToCheck.lastIndexOf(".");
                        if (lastDotIndex >= 0) {
                            expressionToCheck = expression.substring(0, lastDotIndex);
                        } else {
                            expressionToCheck = undefined;
                        }
                    }
                }

            }


        };


        return $dataModel;
    }
])
;
appStrapDirectives.directive('applaneGridBody', [
    '$compile', function ($compile) {
        return {
            restrict:'A',
            scope:false,
            compile:function () {
                return {
                    post:function ($scope, iElement, iAttr) {
                        var dataExpression = $scope.view.metadata.dataExpression;
                        var template = "<table style='table-layout: fixed;width: 100%;' cellpadding='0' cellspacing='0' class='applane-grid-body'><tbody>";
                        template += '<tr ';
                        template += " style='height:25px;' ng-repeat='row in " + dataExpression + "'>" +
                            "<td class='applane-grid-cell'  ng-repeat='col in view.metadata.tableColumns' tabindex=0 ng-style='col.style' ng-switch on='col.ui'>" +
                            "<span ng-switch-when='string' ng-bind='row[col.expression]'></span>" +
                            "<span ng-switch-default ng-bind='col.ui'></span>" +
                            "</td>" +
                            "</tr>";

                        template += "</tbody></table>";
                        $(iElement).append($compile(template)($scope));
                    }
                }
            }
        };
    }
]);
appStrapDirectives.directive('applaneGridCell', [
    '$compile', '$timeout', '$dataModel', '$viewStack', '$parse', function ($compile, $timeout, $dataModel, $viewStack, $parse) {
        return {
            restrict:'A',
            replace:true,
            scope:true,
            compile:function () {
                return {
                    pre:function ($scope, iElement, iAttr) {
                        $scope.bindKeyDownOnTdElement = function () {
                            iElement.bind('keydown', function (evt) {
                                if (evt.keyCode == 37) {
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    $scope.bindLeftKeyDownEvent();
                                } else if (evt.keyCode == 38) {
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    $scope.bindUpKeyDownEvent();
                                } else if (evt.keyCode == 39) {
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    $scope.bindRightKeyDownEvent();
                                } else if (evt.keyCode == 40) {
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    $scope.bindDownKeyDownEvent();
                                } else if (evt.keyCode == 113) {
                                    $scope.editCell(evt);
                                }
                            });
                        };
                        $scope.bindDownKeyDownEvent = function () {
                            var parentTRElement = iElement.parent();
                            var nextTRElement = $(parentTRElement).next();
                            var length = nextTRElement.length;
                            var currentElementIndex = $(iElement).index();
                            if (length > 0) {
                                var tdElement = $(nextTRElement[0]).find('td');
                                var element = $(tdElement[currentElementIndex]);
                                element.focus();
                            } else {
                                var tBodyElement = $(parentTRElement[0]).parent();
                                var TRElement = $(tBodyElement[0]).find('tr');
                                var allTDElement = $(TRElement[0]).find('td');
                                var TDElement = $(allTDElement[currentElementIndex + 1]);
                                var tabIndex = TDElement.attr("tabindex");
                                if (tabIndex >= 0) {
                                    TDElement.focus();
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            }
                        };
                        $scope.bindUpKeyDownEvent = function () {
                            var parentElement = iElement.parent();
                            var prevTRElement = $(parentElement).prev();
                            var length = prevTRElement.length;
                            var currentElementIndex = $(iElement).index();
                            if (length > 0) {
                                var tdElement = $(prevTRElement[0]).find('td');
                                var element = $(tdElement[currentElementIndex]);
                                element.focus();
                            } else {
                                var tBodyElement = $(parentElement[0]).parent();
                                var TRElement = $(tBodyElement[0]).find('tr');
                                var TRElementLength = TRElement.length;
                                var requiredTRElement = $(TRElement[TRElementLength - 1]);
                                var allTDElement = requiredTRElement.find('td');
                                var TDElement = $(allTDElement[currentElementIndex - 1]);
                                var tabIndex = TDElement.attr("tabindex");
                                if (tabIndex >= 0) {
                                    TDElement.focus();
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            }
                        };
                        $scope.bindRightKeyDownEvent = function () {
                            var nextElement = iElement.next();
                            var length = nextElement.length;
                            if (length > 0) {
                                var nextElementTabIndex = $(nextElement[0]).attr("tabindex");
                                if (nextElementTabIndex >= 0) {
                                    $(nextElement[0]).focus();
                                } else {
                                    var parentTRElement = iElement.parent();
                                    var nextTRElement = parentTRElement.next();
                                    if (nextTRElement.length == 0) {
                                        return;
                                    }
                                    var tdElements = $(nextTRElement[0]).find('td');
                                    var tdLength = tdElements.length;
                                    for (var i = 0; i < tdLength; i++) {
                                        var tdAttr = $(tdElements[i]).attr("tabindex");
                                        if (tdAttr >= 0) {
                                            $(tdElements[i]).focus();
                                            if (!$scope.$$phase) {
                                                $scope.$apply();
                                            }
                                            break;
                                        }
                                    }
                                }
                            } else {
                                AppUtil.handleError("Next Element Length is zero", "Alert");
                            }
                        };
                        $scope.bindLeftKeyDownEvent = function () {
                            var prevElement = iElement.prev();
                            var length = prevElement.length;
                            if (length > 0) {
                                var prevElementTabIndex = $(prevElement[0]).attr("tabindex");
                                if (prevElementTabIndex >= 0) {
                                    $(prevElement[0]).focus();
                                } else {
                                    var parentTRElement = iElement.parent();
                                    var prevTRElement = parentTRElement.prev();
                                    if (prevTRElement.length == 0) {
                                        return;
                                    }
                                    var tdElements = $(prevTRElement[0]).find('td');
                                    var tdLength = tdElements.length;
                                    for (var i = (tdLength - 1); i >= 0; i--) {
                                        var tdAttr = $(tdElements[i]).attr("tabindex");
                                        if (tdAttr >= 0) {
                                            $(tdElements[i]).focus();
                                            if (!$scope.$$phase) {
                                                $scope.$apply();
                                            }
                                            break;
                                        }
                                    }
                                }
                            } else {
                                AppUtil.handleError("Previous Element Length is zero", "Alert");
                            }
                        };
                        $scope.showRenderingCell = function () {

                            var columnCellTemplate = $scope.col.cellTemplate;
                            if ((!columnCellTemplate) && ($scope.col.expression)) {
                                columnCellTemplate = CELL_TEMPLATE;
                            }
                            var cellTemplate;
                            if ($scope.view.metadata.groupColumns && $scope.view.metadata.groupColumns.length > 0 && $scope.row._group !== undefined) {
                                /*if group is enabled, we will not show border to other cells
                                 overflow should not be defined so that it will give a colspan look*/
                                if ($scope.col.$groupcolumn) {
                                    var groupIndex = $scope.row._group;
                                    var groupColumn = $scope.view.metadata.groupColumns[groupIndex];
                                    var groupColumnValue = groupColumn.label + ":" + $scope.getColumnValue($scope.row, groupColumn, false) + "&nbsp;";
                                    var groupInnerColumns = groupColumn.columns;
                                    for (var i = 0; i < groupInnerColumns.length; i++) {
                                        var groupColumnInnerColumn = groupInnerColumns[i];
                                        var gcVal = $scope.getColumnValue($scope.row, groupColumnInnerColumn, false);
                                        if (gcVal !== undefined && gcVal != "") {
                                            groupColumnValue += groupColumnInnerColumn.label + ":" + gcVal + "&nbsp;";
                                        }
                                    }
                                    var treeNodeTemplate = "<span ng-style='{\"padding-left\":row._level * 20+\"px\"}' class='app-float-left app-text-align-center app-cursor-pointer' ng-click='toggleTree(row)' ng-class=\"{'app-minus':row._mode == 1, 'app-plus':row._mode == 0}\" ng-show='row._mode == 0 || row._mode == 1'>&nbsp;</span>";
                                    columnCellTemplate = treeNodeTemplate + groupColumnValue;
                                    cellTemplate = "<div style='white-space: nowrap;' class='applane-grid-cell-inner app-font-weight-bold' >" + columnCellTemplate + "</div>";
                                } else {
                                    if ($scope.col[UI] == UI_TYPE_SELECTION) {
                                        cellTemplate = columnCellTemplate;
                                    }
                                }
                            } else if (!$scope.view.metadata.groupColumns && $scope.col.breadcrumb && $scope.view.metadata.$recursivecolumn) {
                                if ($scope.row._mode == 0 || $scope.row._mode == 1) {
                                    var treeNodeTemplate = "<span ng-style='{\"padding-left\":row._level * 20+\"px\"}' class='app-float-left app-text-align-center app-cursor-pointer' ng-click='toggleTree(row)' ng-class=\"{'app-minus':row._mode == 1, 'app-plus':row._mode == 0}\" >&nbsp;</span>";
                                    columnCellTemplate = treeNodeTemplate + columnCellTemplate;
                                    cellTemplate = "<div style='white-space: nowrap;overflow: hidden;' ng-dblclick='editCell($event)' class='applane-grid-cell-inner'>" + columnCellTemplate + "</div>";
                                } else {
                                    var treeNodeTemplate = "<span ng-style='{\"padding-left\":row._level * 25+\"px\"}' class='app-float-left app-text-align-center app-cursor-pointer' >&nbsp;</span>";
                                    columnCellTemplate = treeNodeTemplate + columnCellTemplate;
                                    cellTemplate = "<div style='white-space: nowrap;overflow: hidden;' ng-dblclick='editCell($event)' class='applane-grid-cell-inner'>" + columnCellTemplate + "</div>";
                                }
                            } else {
                                cellTemplate = "<div ng-dblclick='editCell($event)' class='applane-grid-cell-inner app-overflow-hiiden app-white-space-nowrap' ";
                                if ($scope.row._level && $scope.col.$groupcolumn) {
                                    cellTemplate += " ng-style='{\"padding-left\":row._level * 25+\"px\"}' ";
                                }
                                cellTemplate += ">" + columnCellTemplate + "</div>";
                            }
                            if ($scope.col[UI] == UI_TYPE_SR) {
                                cellTemplate = '<div class="app-text-align-center app-serial-number" ng-bind="$parent.$parent.$index+1"></div>';
                            }
                            if (cellTemplate) {
//                                var cell = $compile(cellTemplate)($scope);
//                                $(iElement).html("");
//                                iElement.append(cell);
                            }
                            if ($scope.col[UI] == UI_TYPE_SELECTION) {
                                $scope.$watch('row.__selected__', function (newValue, oldValue) {
                                    var selectedKeys = $scope.view.selectedkeys;
                                    var selectedRowCount = selectedKeys.length;
                                    var index = -1;
                                    for (var i = 0; i < selectedRowCount; i++) {
                                        var record = selectedKeys[i];
                                        var recordKey = AppUtil.resolve(record, $scope.view.metadata[PRIMARY_COLUMN]);
                                        var isEqual = angular.equals(recordKey, AppUtil.resolve($scope.row, $scope.view.metadata[PRIMARY_COLUMN]));
                                        if (isEqual) {
                                            index = i;
                                            break;
                                        }
                                    }
                                    if (index == -1 && newValue) {
                                        selectedKeys.push($scope.row);
                                    } else if (index > -1 && !newValue) {
                                        selectedKeys.splice(i, 1);
                                    }
                                    if (!newValue) {
                                        $scope.view.__selectall__ = false;
                                    }
                                });
                            }
                            if ($scope.col[UI] == UI_TYPE_SR) {
                                iElement.bind('mouseup', function (e) {
                                    if ($scope.leftButtonDown == false) {
                                        return;
                                    }
                                    $scope.setLeftButtonDown(false);
                                    var src = $scope.getDopColumnIndex();
                                    var key = AppUtil.resolve($scope.row, $scope.view.metadata[PRIMARY_COLUMN]);
                                    var target = $dataModel.getIndex(key, $scope[COMPONENT_ID], $scope.view.metadata[PRIMARY_COLUMN]);
                                    $dataModel.rowReorder(src, target, $scope[COMPONENT_ID]);
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                });
                                iElement.bind('mousedown', function (e) {
                                    var key = AppUtil.resolve($scope.row, $scope.view.metadata[PRIMARY_COLUMN]);
                                    var index = $dataModel.getIndex(key, $scope[COMPONENT_ID], $scope.view.metadata[PRIMARY_COLUMN]);
                                    $scope.setLeftButtonDown(true);
                                    $scope.setDopColumnIndex(index);
                                    $('body').bind('mousemove', function (e) {
                                        var element = $('#' + $scope[COMPONENT_ID] + 'rowDrag');
                                        element.show();
                                        element.html(index + 1);
                                        element.css({left:(e.pageX + 20) + "px", top:(e.pageY) + 'px'});
                                    });
                                    $('body').bind('mouseup', function (e) {
                                        var element = $('#' + $scope[COMPONENT_ID] + 'rowDrag');
                                        element.hide();
                                        $('body').unbind('mouseup');
                                        $('body').unbind('mousemove');
                                    });
                                });
                            }
                            var tabIndex = $scope.col.tabindex;
                            if (tabIndex) {
                                iElement.attr("tabindex", tabIndex);
                            } else {
                                iElement.attr("tabindex", "0");
                            }
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                            $(iElement).focus(function () {
                                var currentRow = $dataModel.getCurrentRow($scope[COMPONENT_ID]);
                                $scope.setCurrentRow($scope.row);
                                if ($scope.view[CHILD_COMPONENT_ID] && $scope.view[CHILD_COMPONENT_ID].length > 0) {
                                    if ($scope.view.metadata.editMode === false && $scope.view.metadata.lastRowAction) {
                                        /*assume click as row action click if child view is open*/
                                        if ((!angular.equals(currentRow, $scope.row))) {
                                            $scope.onRowActionClick($scope.view.metadata.lastRowAction);
                                        }
                                        return;
                                    }
                                } else {
                                    $scope.view.metadata.editMode = true;
                                    $scope.view.metadata.lastRowAction = undefined;
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });
                            $scope.bindKeyDownOnTdElement();
                        };
                        $scope.showEditorCellIfAny = function ($event) { /* Add Listener on td element to show editor if any defined*/
                            if (!$scope.editMode || !$scope.view.metadata.edit) {
                                return;
                            }

                            if ($scope.view.metadata.groupColumns && $scope.view.metadata.groupColumns.length > 0 && $scope.row._group !== undefined) {
                                return false;
                            }
                            var editableExpression = $scope.col[EDITABLE_EXPRESSION];
                            if (editableExpression !== undefined && editableExpression === false) {
                                return false;
                            }
                            if (editableExpression !== undefined && editableExpression.toString().length > 0) {
                                try {
                                    if (editableExpression.toString().indexOf('this') >= 0) {
                                        editableExpression = editableExpression.toString().replace(/this./g, "row.");
                                    }
                                    var getter = $parse(editableExpression);
                                    var context = {row:$scope.row};
                                    if ((getter(context) == false || getter(context) == "false") && getter(context) !== undefined) {
                                        return;
                                    }
                                } catch (e) {
                                    /* ignores special character editableexpression*/
                                }
                            }


                            $scope.setCurrentRow($scope.row);
                            var editableCellTemplate = $scope.col.editableCellTemplate;
                            if (editableCellTemplate !== undefined) {
                                $(iElement).attr("tabIndex", "-1");
                                $(iElement).html("");
                                $(iElement).unbind('keydown');
                                var popup = {
                                    template:editableCellTemplate,
                                    scope:$scope.$new(),
                                    autohide:true,
                                    element:iElement,
                                    position:'onchild',
                                    deffered:false,
                                    callBack:function (open, e) {
                                        if (!open) {
                                            $scope.showRenderingCell();
                                            if (this.scope) {
                                                this.scope.$destroy();
                                            }
                                        }
                                        if (e != null && e != undefined && e.keyCode == 27) {
                                            $scope.setEditMode(false);
                                            $(e.target).blur();
                                            $(iElement).focus();
                                        }
                                    }
                                };
                                $viewStack.showPopup(popup);
                                var focusElement = $(iElement).find("input")[0];
                                if (!focusElement) {
                                    focusElement = $(iElement).find("textarea")[0];
                                }
                                if (focusElement) {
                                    $(focusElement).focus();
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        };
                        $scope.editCell = function ($event) {
                            $scope.setEditMode(true);
                            $scope.showEditorCellIfAny($event);
                        };
                        $scope.showRenderingCell();
//                        $(iElement).focus($scope.showEditorCellIfAny);
                    }
                };
            }
        };
    }
]);
appStrapDirectives.directive('applaneGridHeader', [
    '$compile', '$dataModel', function ($compile, $dataModel) {
        return {
            restrict:'A',
            scope:false,
            template:"<table style='table-layout: fixed;width: 100%;' class='applane-grid-header' cellpadding='0' cellspacing='0' ><thead>" +
                "<th class='draggable' applane-grid-header-cell ng-repeat='col in view.metadata.tableColumns' ng-style='col.style' id='{{col.id}}' ></th>" +
                "<th style='width:7px;border:none;'>&nbsp;</th>" + "</thead></table>" +
                "<div id='{{componentid}}-col-resize' class='app-col-resize app-cursor-col-resize draggable' ></div>" +
                "<div id='{{componentid}}-col-drag' ng-show='dragDivVisibility' class='app-text-align-center draggable dragable_background app-position-fixed app-top-position-zero app-table-head-background app-blue-text-color app-line-height-twenty-four app-border app-box-shadow' ng-bind='dragDivLabel' style='height:25px;'></div>"
        };
    }
]);
appStrapDirectives.directive('applaneGridHeaderCell', [
    '$compile', '$dataModel', function ($compile, $dataModel) {
        return {
            restrict:'A',
            replace:true,
            compile:function () {
                return {
                    pre:function ($scope, iElement, iAttr) {
                        if ($scope.view[SHOW_AS] != 'popup') {
                            var id = $scope.componentid + '-col-resize';
                            var dragDiv = $scope.componentid + '-col-drag';
                            iElement.bind('mouseover mousemove', function (e) {
                                if ($scope.col.reorderable == false || $scope.dragDivVisibility == true || $($scope.componentid + 'rowDrag').css('display') == 'block') {
                                    return;
                                }
                                var mousePosition = e.pageX;
                                var left = iElement.offset().left;
                                var width = iElement.outerWidth();
                                var totalWidth = (left + width);
                                if ((mousePosition >= (totalWidth - 5)) && (mousePosition <= (totalWidth + 5))) {
                                    $('#' + id).show();
                                    $('#' + id).css({'left':(totalWidth - 10) + 'px', 'top':iElement.offset().top + 'px', 'height':iElement.height()});
                                    $scope.setCurrentHeaderCell({element:iElement, col:$scope.col});
                                } else {
                                    $('#' + id).hide();
                                }
                            });
                            iElement.bind('mousedown', function (e) {
                                if ($scope.col.reorderable == false) {
                                    return;
                                }
                                $scope.setLeftButtonDown(true);
                                $scope.setDopColumnIndex($scope.$index);
                                var left = iElement.offset().left;
                                var width = iElement.outerWidth();
                                $('#' + dragDiv).css({'width':width + "px", 'bottom':'0', 'left':(left - 5) + "px", 'top':iElement.offset().top + 'px', 'height':iElement.outerHeight()});
                                /* -5 bcz top div has left 5px*/
                                $('body').bind('mouseup', function (e) {
                                    if ($scope.dragDivVisibility == true) {
                                        $scope.hideDragDiv();
                                        $scope.setLeftButtonDown(false);
                                        $('body').unbind('mouseup');
                                    }
                                });
                            });
                            iElement.bind('mouseup', function (e) {
                                if ($scope.col.reorderable == false || $scope.leftButtonDown == false || $($scope.componentid + 'rowDrag').css('display') == 'block') {
                                    return;
                                }
                                $scope.setLeftButtonDown(false);
                                $scope.hideDragDiv();
                                var src = $scope.getDopColumnIndex();
                                var target = $scope.$index;
                                if (src === undefined || target === undefined || angular.equals(src, target)) {
                                    return;
                                }
                                $dataModel.columnReOrdering(src, target, $scope[COMPONENT_ID]);
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });
                        }
                        var cellTemplate = '<div ng-style="col.style">{{col.label}}' + '&nbsp;';
                        if ($scope.col.order) {
                            cellTemplate += '<img style="margin-left: 10px;" width="11px" height="11px" ng-src="images/{{col.order}}-arrow.png" ng-show="col.order"/>';
                        }
                        cellTemplate += '</div>';
                        if ($scope.col[UI] == UI_TYPE_SELECTION) {
                            cellTemplate = "<div><input type='checkbox' ng-model='view.__selectall__'></div>";
                        }
                        var headerCell = $compile(cellTemplate)($scope);
                        var width = $scope.col.width;
                        if (width) {
                            $(headerCell).width(width);
                            $(iElement).width(width);
                        }
                        iElement.append(headerCell);
                        if ($scope.col[UI] == UI_TYPE_SELECTION) {
                            var selectionElement = angular.element(headerCell).find("input");
                            var rows = AppUtil.resolve($scope, $scope.view.metadata.dataExpression);
                            var checkBoxElement;
                            if (selectionElement.length == 0) {
                                checkBoxElement = selectionElement;
                            } else {
                                checkBoxElement = selectionElement[0];
                            }
                            $(checkBoxElement).change(function () {
                                var selected = $(this).is(":checked");
                                for (var i = 0; i < rows.length; i++) {
                                    rows[i].__selected__ = selected;
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });
                        }
                    }
                };
            }
        };
    }
]);
appStrapDirectives.directive('appChangePassword', ["$compile", "$viewStack", function ($compile, $viewStack) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return {
                post:function ($scope, iElement) {
                    var config = {
                        template:"<div class='app-popup-title'>Change Password</div>" + "<div class=\"app-popup-body app-text-align-center\">" + "<input type='password' placeholder='Old Password' ng-model='oldpwd' class='app-border app-change-password'/>" + "<input type='password' placeholder='New Password' ng-model='newpwd' class='app-border app-change-password'/>" + "<input type='password' placeholder='Confirm Password' ng-model='confirmpwd' class='app-border app-change-password'/>" + "<span class='app-change-password-message' ng-bind='message'></span>" + "</div>" + "<div class=\"app-width-full app-float-left app-text-align-center\" style='margin:0px 0px 15px 0px;'>" + "<input type=\"button\" ng-click='reset()' value='Reset' class=\"app-button app-button-border app-button-margin app-button-shadow app-advance-search-bttn-padding\" />" + "<input type=\"button\" ng-click='cancel()' value='Cancel' class=\"app-button app-button-border app-button-margin app-button-shadow app-advance-search-bttn-padding\"/>" + "</div>" + "</div>",
                        scope:$scope,
                        autohide:false,
                        width:350
                    };
                    $scope.popup = $viewStack.showPopup(config);
                    $scope.cancel = function () {
                        if ($scope.popup) {
                            $scope.popup.hide();
                            delete $scope.popup;
                        }
                    };
                    $scope.reset = function () {
                        var oldPassword = $scope.oldpwd;
                        var newPassword = $scope.newpwd;
                        var confirmPassword = $scope.confirmpwd;
                        if (!oldPassword || oldPassword.trim().length == 0) {
                            $scope.message = 'Old Password cannot be blank';
                            return;
                        }
                        if (!newPassword || newPassword.trim().length == 0) {
                            $scope.message = 'New Password cannot be blank';
                            return;
                        }
                        if (!confirmPassword || confirmPassword.trim().length == 0) {
                            $scope.message = 'Confirm Password cannot be blank';
                            return;
                        }
                        if (!angular.equals(newPassword, confirmPassword)) {
                            $scope.message = 'New Password and Confirm Password are not matched';
                            return;
                        }
                        $scope.message = '';
                        var url = BAAS_SERVER + '/resetpassword';
                        var params = {};
                        params.pwd = newPassword;
                        params.oldpwd = oldPassword;
                        AppUtil.getDataFromService(url, params, "POST", "JSON", "Password Reset..", function () {
                            $scope.cancel();
                        });
                    };
                }
            };
        }
    }
}]);
appStrapDirectives.directive('appMenus', ["$compile", "$viewStack", "$userModel", "$timeout", function ($compile, $viewStack, $userModel, $timeout) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div>" +
            '<app-action-collection style="line-height:35px;" ng-init="action=appData.applications" class="app-float-left app-padding-left-five-px app-padding-right-five-px app-font-weight-bold app-background-seperator app-line-height-thirty-six app-dark-blue-background"></app-action-collection>' +
            "<div ng-click='appData.childApplicationIndex=$index' style='padding:0px 10px;' class='app-menu-label app-menu app-cursor-pointer app-float-left app-font-weight-bold app-line-height-thirty-six' ng-repeat='childApplication in appData.childApplications' ng-bind='childApplication.label'></div>" +
            "<div ng-repeat='menu in appData.menus' id='menu_{{$index}}' class='app-menu' >" +
            "<app-menu ng-class=\"{'selectedmenu':menu.$index['0']==appData.selectedMenuPath['0']}\" ></app-menu>" +
            "</div> " +
            "<div class='app-menu' ng-show='appData.applicationDeveloper' ng-click='onMenuSetting()' title='Menu Setting'><div class='app-menu-setting'></div></div>" +
            "</div>",
        compile:function () {
            return {
                post:function ($scope) {
                    $scope.setMenuPopUp = function (html) {
                        $scope.menuPopUp = $scope.menuPopUp || [];
                        $scope.menuPopUp.push(html);
                    };
                    $scope.hideMenuPopUp = function () {
                        if ($scope.menuPopUp && $scope.menuPopUp.length > 0) {
                            for (var i = 0; i < $scope.menuPopUp.length; i++) {
                                var popup = $scope.menuPopUp[i];
                                popup.hide();
                                popup = undefined;
                            }
                        }
                    };
                }
            };
        }
    }
}]);
appStrapDirectives.directive('appMenu', ["$compile", "$viewStack", function ($compile, $viewStack) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div ng-click='onMenuClick()' class='app-menu-label'>" + "</div>",
        compile:function () {
            return {
                post:function ($scope, iElement) {

                    var html = '';
                    if ($scope.menu.imageurl) {
                        html = '<div><img src="' + $scope.menu.imageurl + '" class="app-menu-setting"></div>';
                    } else if ($scope.menu.label != null && $scope.menu.label != undefined) {
                        html = "<div>" + $scope.menu.label + "</div>";
                    }
                    iElement.append($compile(html)($scope));
                    $scope.onMenuClick = function () {
                        $scope.appData.warning.warnings = [];
                        if ($scope.menu.menus && $scope.menu.menus.length > 0) {
                            var index = $scope.menu.$index;
                            var hasSuperChild = false;
                            Object.keys(index).forEach(function (k) {
                                var menuIndex = parseInt(k);
                                if (menuIndex >= 1) {
                                    hasSuperChild = true;
                                }
                            });
                            var subMenuHtml = "<div class='app-white-space-nowrap app-light-gray-backgroud-color'>" + "<div ng-repeat='menu in menu.menus' class='app-cursor-pointer'>" + "<app-menu class='app-padding-top-bottom-five-px' style='padding:5px 10px;'";
                            if (hasSuperChild) {
                                subMenuHtml += "ng-class=\"{'selectedmenu':menu.$index['0']==appData.selectedMenuPath['0'] && menu.$index['2']==appData.selectedMenuPath['2'] && menu.$index['1']==appData.selectedMenuPath['1']}\"";
                            } else {
                                subMenuHtml += "ng-class=\"{'selectedmenu':menu.$index['0']==appData.selectedMenuPath['0'] && menu.$index['1']==appData.selectedMenuPath['1']}\"";
                            }
                            subMenuHtml += " ></app-menu></div></div>";
                            var modal = {
                                template:$compile(subMenuHtml)($scope),
                                scope:$scope.$new(),
                                element:iElement.parent(),
                                hideonclick:false,
                                autohide:true,
                                removeOtherAutoHidePopup:false
                            };
                            if (hasSuperChild) {
                                modal.position = 'right';
                            }
                            $scope.setMenuPopUp($viewStack.showPopup(modal));
                        } else {
                            $scope.appData.selectedMenuPath = $scope.menu.$index;
                            $scope.appData.currentView = {"application":$scope.appData.applications.options[$scope.appData.applications.selectedIndex].label, "menuid":$scope.menu._id, "viewid":$scope.menu.baasviewid.id, "filter":$scope.menu.filter, "applicationid":$scope.menu.applicationid.id, "ask":$scope.menu.applicationid.ask, "osk":$scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk, "source":$scope.menu._id};
                            $scope.hideMenuPopUp();
                        }
                    };
                }
            };
        }
    }
}]);
appStrapDirectives.directive('ngModelOnblur', function () {
    return {
        restrict:'A',
        require:'ngModel',
        link:function (scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;
            elm.unbind('input').unbind('keydown').unbind('change');
            elm.bind('blur', function () {
                scope.$apply(function () {
                    ngModelCtrl.$setViewValue(elm.val());
                });
            });
        }
    };
});
appStrapDirectives.directive('appWarningMessage', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:false,
        template:"<div id='warningParent' style='right:5px;left:5px;' class='app-background-black app-max-height-one-fifty app-overflow-hiiden app-position-absolute app-bottom-position-zero' ng-show='getWarningStatus()'>" + "<div style='font-size: 14px;padding-top: 7px;' ng-bind='appData.warning.title' class='app-color-red app-padding-left-ten-px app-font-weight-bold app-float-left '></div>" + "<div ng-click='closeWarning()' class='app-warning-close-message app-cursor-pointer'></div>" +
            "<div class='app-warning-body app-width-full app-color-black app-overflow-auto'>" + "<ul class='app-padding-left-twenty-px' style='padding-top:5px;padding-bottom:5px;'><li style='padding-bottom:5px;' ng-repeat='warning in appData.warning.warnings' ng-bind='warning.message'></li>" + "</ul>" + "</div></div>",
        compile:function () {
            return {
                pre:function ($scope) {
                    $scope.closeWarning = function () {
                        $scope.appData.warning.warnings = [];
                        $scope.appData.warning.showWarningWindow = false
                    }
                },
                post:function ($scope, element) {
                    $scope.$watch('appData.warning', function (newvalue, oldvalue) {
                        if (!angular.equals(newvalue, oldvalue)) {
                            if ((newvalue.warnings !== undefined) && (newvalue.title == undefined)) {
                                $scope.appData.warning.title = "Attention Required !";
                            }
                            $scope.getWarningStatus = function () {
                                if ((newvalue.warnings.length !== 0) && (newvalue.showWarningWindow)) {
                                    return true;
                                } else {
                                    return false;
                                }
                            };
                            $scope.getWarningStatus();
                        }
                    }, true);
                }
            };
        }
    }
}]);
appStrapDirectives.directive('appToolBar', [ "$compile", "$dataModel", "$viewStack", "$appService", function ($compile, $dataModel, $viewStack, $appService) {
    'use strict';
    return {
        restrict:'A',
        scope:true,
        compile:function () {
            return {
                post:function ($scope, iElement) {
                    var html = "";
                    if ($scope.view.metadata.embed) {
                        html += '<div ng-show="view.metadata.panelView" ng-click="close()" class="app-close-button app-bar-button app-float-right-important"></div>';
                    }

                    if ($scope.view.metadata.parentInfo && $scope.view.metadata.toolBarTitle) {
                        html += '<div ng-click="onParentLabel()" class="app-cursor-pointer app-font-weight-bold app-border-right-white app-float-left app-blue-text-color app-padding-five-px" ng-bind="view.metadata.parentInfo.label"></div>';
                    }
                    if ($scope.view.metadata.label && $scope.view.metadata.toolBarTitle) {
                        html += '<div class="app-font-weight-bold app-border-right-white app-float-left app-blue-text-color app-padding-five-px" ng-bind="view.metadata.label" style="background-color: #d3d3d3;"></div>';
                    }
                    //check for inner nested table (country -> state -> city, it is for city as label in  state table)
                    if ($scope.view.metadata.nestedColumns) {
                        for (var i = 0; i < $scope.view.metadata.nestedColumns.length; i++) {
                            html += '<div ng-click="onNestedView(' + i + ')" class="app-cursor-pointer app-font-weight-bold app-border-right-white app-float-left app-blue-text-color app-padding-five-px" ng-bind="view.metadata.nestedColumns[' + i + '].label"></div>';
                        }
                    }

                    if ($scope.view.metadata.views) {
                        for (var i = 0; i < $scope.view.metadata.views.length; i++) {
                            html += '<div ng-click="onParallelView(' + i + ')" class="app-cursor-pointer app-font-weight-bold app-border-right-white app-float-left app-blue-text-color app-padding-five-px" ng-bind="view.metadata.views[' + i + '].metadata.label"></div>';
                        }
                    }

                    html += '<div class="app-float-right" style="height:30px;">';
                    html += '<app-bar-close-resize-view ng-show="view.parentcomponentid || view.showas == \'popup\' || view.childcomponentid.length>0"></app-bar-close-resize-view>';
                    if (AppUtil.isTrueOrUndefined($scope.view.metadata.enablemetadataaction)) {
                        html += "<app-bar-metadata></app-bar-metadata>";
                    }
                    if (AppUtil.isTrueOrUndefined($scope.view.metadata.ftsSearch)) {
                        html += "<app-fts-search></app-fts-search>";
                    }
                    html += '</div>';
                    html += '<div class="app-float-left">';
                    if ($scope.view.metadata.quickviews) {

                        var quickviewcollection = $scope.view.quickViewsCollection;
                        quickviewcollection.showsettingimage = false;
                        html += "<app-bar-quickview></app-bar-quickview>";
                    }
                    html += "<app-bar-basic></app-bar-basic>";
                    html += "<app-bread-crumb ng-show='view.metadata.breadCrumbInfo.length > 0'></app-bread-crumb>";

                    if ($scope.view.metadata.defaultFilters !== undefined) {
                        html += "<div ng-show='view.metadata.defaultFilters' ng-click=\"filterview($event)\" ";
                        if ($scope.view.metadata.defaultFilters instanceof Array) {
                            html += "title='Populate filters' class='app-bar-button app-filter-view-button'";
                        } else {
                            html += "ng-bind='view.metadata.defaultFilters.label' class='app-float-left app-cursor-pointer app-populate-default-filter app-font-weight-bold'";
                        }
                        html += "></div>";
                    }
                    html += '<span ng-bind-html-unsafe="toolBarLoading"></span>';
                    html += '</div>';
                    iElement.append($compile(html)($scope));
                }
            }
        }
    };
}
]);

appStrapDirectives.directive('appBarCloseResizeView', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='app-float-right app-height-inherit app-bar-dark-blue-backgroud'></div>",
        compile:function () {
            return{
                pre:function ($scope, iElement) {
                    var actions = [];
                    var metadata = $scope.view.metadata;
                    if (AppUtil.isTrueOrUndefined($scope.view.metadata.close)) {
                        var template = "<div class='app-height-inherit app-close-button-background app-float-left'>" + DEFAULT_ACTION_TEMPLATE + "</div>";
                        actions.push({"method":"close(action)", "label":"Close", "template":template, "class":"app-close-button app-bar-button"});
                    }
                    if (AppUtil.isTrueOrUndefined(metadata.resize)) {
                        var template = "<div class='app-height-inherit app-resize-button-background app-float-left'>" + DEFAULT_ACTION_TEMPLATE + "</div>";
                        actions.push({"method":"viewResize()", "label":"Resize", "template":template, "class":"app-resize-button app-bar-button"});
                    }
                    var actionCount = actions.length;
                    for (var i = 0; i < actionCount; i++) {
                        var action = actions[i];
                        var actionLabel = action.label;
                        var actionMethod = action.method;
                        var html = action.template;
                        var actionClass = action.class;
                        html = html.replace(ACTION_METHOD, actionMethod);
                        html = html.replace(ACTION_LABEL, actionLabel);
                        html = html.replace(ACTION_CLASS, actionClass);
                        var cellElement = $compile(html)($scope);
                        iElement.append(cellElement);
                    }
                }
            }
        }
    }
}]);
appStrapDirectives.directive('appNavigation', ['$dataModel', '$appService' , function ($dataModel, $appService) {
    return {
        restrict:'E',
        replace:true,
        scope:true,
        template:"<div class='app-height-full app-font-weight-bold app-navigation app-border-right-white app-border-left-white app-padding-left-five-px app-padding-right-five-px'>" +
            "<div class='app-height-thirty-px app-left-arrow app-float-left app-width-twenty-px app-cursor-pointer' ng-click='showRecords(false)' ng-show='view.metadata.datastate.prev' ></div>" +
            "<div class='app-float-left'>{{view.metadata.datastate.fromindex +'-' + view.metadata.datastate.toindex}}</div>" +
            "<div class='app-height-thirty-px app-right-arrow app-float-left app-width-twenty-px app-cursor-pointer' ng-click='showRecords(true)' ng-show='view.metadata.datastate.next'></div>" +
            "</div>",
        compile:function () {
            return {
                post:function ($scope, iElement) {
                    $scope.showRecords = function (next) {
                        if (next) {
                            $dataModel.next($scope.componentid);
                        } else {
                            $dataModel.prev($scope.componentid);
                        }
                    }
                }
            };
        }
    }
}]);

appStrapDirectives.directive('appFilter', ["$compile", "$dataModel", function ($compile, $dataModel) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return {
                post:function ($scope, iElement) {
                    var column = $scope.col;
                    var columnType = column[UI] || column[UI_PANEL];

                    if (columnType == UI_TYPE_SCHEDULE || columnType == UI_TYPE_LOOK_UP || columnType == UI_TYPE_DATE || columnType == UI_TYPE_NUMBER || columnType == UI_TYPE_DECIMAL || columnType == UI_TYPE_COMPOSITE_LOOK_UP || (columnType == UI_TYPE_STRING && (column.lookupquery || (column.options && column.options.length > 0)))) {
                        $(iElement).append($compile(column.filterTemplate)($scope));
                    } else {
                        AppUtil.handleError('Un supported filter type[' + columnType + "]", "Alert");
                    }
                }
            };
        }
    }
}]);
appStrapDirectives.directive('appBarQuickview', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='app-bar-quickview app-blue-text-color'>" + "<div class='app-bar-quickview-wrapper'>" + "<app-action-collection ng-init=\"action=view.quickViewsCollection\"></app-action-collection>" + "</div>" + "</div>"
    };
}]);
appStrapDirectives.directive('appBarBasic', [
    '$compile', function ($compile) {
        return {
            restrict:'E',
            replace:true,
            scope:true,
            template:"<div class='app-bar-basic'></div>",
            compile:function () {
                return {
                    pre:function ($scope, iElement) {
                        var actions = [];
                        var metadata = $scope.view.metadata;
                        if (AppUtil.isTrueOrUndefined($scope.view.metadata.insert)) {
                            actions.push({"method":"insert(action)", "label":"Insert", "template":DEFAULT_ACTION_TEMPLATE, "class":"app-insert-button app-bar-button"});
                        }
                        if (AppUtil.isTrueOrUndefined($scope.view.metadata.refresh)) {
                            actions.push({"method":"refresh(action)", "label":"Refresh", "template":DEFAULT_ACTION_TEMPLATE, "class":"app-refresh-button app-bar-button"});
                        }
                        if (AppUtil.isTrueOrUndefined($scope.view.metadata.save)) {
                            if ($scope.view.metadata.saveLabel) {
                                actions.push({closeonsave:$scope.view.metadata.closeonsave, callback:$scope.view.metadata.savecallback, "method":"", "label":"", "template":"<div ng-click='save(action)' class='app-float-left app-cursor-pointer app-populate-default-filter app-font-weight-bold app-blue-text-color app-invoke-method' ng-bind='view.metadata.saveLabel'></div>", "class":"app-save-button app-bar-button app-float-left"});
                            } else {
                                var saveAction = {"method":"save(action)", "label":"Save", "template":DEFAULT_ACTION_TEMPLATE, "class":"app-save-button app-bar-button app-float-left"};
                                saveAction.callback = $scope.view.metadata.savecallback;
                                saveAction.closeonsave = $scope.view.metadata.closeonsave;
                                actions.push(saveAction);
                            }
                        }
                        if (AppUtil.isTrueOrUndefined($scope.view.metadata.delete)) {
                            actions.push({"method":"deleteData(action)", "label":"Delete", "template":DEFAULT_ACTION_TEMPLATE, "class":"app-delete-button app-bar-button"});
                        }
                        if ($scope.view.metadata.update) {
                            actions.push({"method":"update(action)", "label":"Update", "template":DEFAULT_ACTION_TEMPLATE, "class":"app-update-button app-bar-button"});
                        }
                        if ($scope.view.metadata.userHeaderActions && $scope.view.metadata.userHeaderActions.length > 0) {
                            actions.push({"method":"", "label":"", "template":"<app-user-actions></app-user-actions>", "class":""});
                        }
                        if (AppUtil.isTrueOrUndefined($scope.view.metadata.navigation)) {
                            actions.push({"method":"", "label":"", "template":"<app-navigation></app-navigation>", "class":""});
                        }
                        if (AppUtil.isTrueOrUndefined($scope.view.metadata.warning)) {
                            actions.push({"label":"Warning", "template":"<div class='ACTION_CLASS' title='ACTION_LABEL' ng-click='appData.warning.showWarningWindow = true' ng-show='appData.warning.warnings.length>0'></div>", "class":"app-warning-button app-bar-button"});
                        }
                        actions.push({"method":"", "label":"", "template":"<app-applied-filters></app-applied-filters>", "class":""});
                        var actionCount = actions.length;
                        for (var i = 0; i < actionCount; i++) {
                            var action = actions[i];
                            var actionLabel = action.label;
                            var actionMethod = action.method;
                            var html = action.template;
                            var actionClass = action.class;
                            html = html.replace(ACTION_METHOD, actionMethod);
                            html = html.replace(ACTION_LABEL, actionLabel);
                            html = html.replace(ACTION_CLASS, actionClass);
                            var cellElement = $compile(html)($scope);
                            iElement.append(cellElement);
                        }
                    }
                }
            }
        };
    }]);
appStrapDirectives.directive('appUserActions', ["$compile", "$viewStack", function ($compile, $viewStack) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return {
                post:function ($scope, iElement) {
                    $scope.userActions = function (index) {
                        var action = $scope.view.metadata.userHeaderActions[index];
                        if ((/invoke/i).test(action.type)) {
                            $scope.invokeMethod(index, false, true);
                        } else if (action.type == 'Default Data') {
                            $scope.onDefaultValueClick(index);
                        }
                    };
                    var template = "<div ng-repeat='action in view.metadata.userHeaderActions' class='app-float-left'>" +
                        "<div ng-click='userActions($index)' class='app-float-left app-cursor-pointer app-populate-default-filter app-font-weight-bold app-blue-text-color app-invoke-method' ng-bind='action.label'></div>" +
                        "</div>";
                    iElement.append(($compile)(template)($scope));
                },
                pre:function ($scope) {
                    if ($scope.view.metadata.userHeaderActions && $scope.view.metadata.userHeaderActions.length > 0) {
                        for (var i = 0; i < $scope.view.metadata.userHeaderActions.length; i++) {
                            var action = $scope.view.metadata.userHeaderActions[i];
                            if (action.type == 'Default Data') {
                                if ($scope.view.metadata.parameters.$default) {
                                    action.label = 'Disable Default ' + action.label;
                                } else {
                                    action.label = 'Enable Default ' + action.label;
                                }
                            }
                        }
                    }
                }
            };
        }
    }
}]);
appStrapDirectives.directive('appBarMetadata', ["$compile", "$viewStack", function ($compile, $viewStack) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='app-bar-metadata'></div>",
        compile:function () {
            return {
                pre:function ($scope, iElement) {
                    var html = '';
                    html += "<div class='app-bar-button app-view-setting-button ' ng-click=\"viewSettings($event)\" title='View Settings'></div>";
                    html += "<div class='app-bar-button app-user-actions-button' ng-click=\"userActions($event)\" title='User Actions' ng-show='appData.applicationDeveloper'></div>";
                    html += "<div class='app-bar-button app-column-groups-button' ng-click=\"columnGroups($event)\" ng-show='appData.applicationDeveloper' title='Column Groups'></div>";
                    html += "<div class='app-bar-button app-column-schedule-button' ng-click=\"scheduleView($event)\" ng-show='appData.applicationDeveloper' title='Manage schedules'></div>";
                    html += "<div class='app-bar-button app-column-order-by-button' ng-click=\"orderby($event)\" title='Order By'></div>";
                    html += "<div class='app-bar-button app-filter-view-button' ng-show='view.metadata.viewfilters' ng-click=\"filterview($event)\" title='Manage filters'></div>";
                    html += "<div class='app-bar-button app-child-view-button' ng-click=\"childview($event)\" title='Manage child' ng-show='appData.applicationDeveloper'></div>";
                    html += "<div class='app-bar-button app-column-view-button' ng-click=\"columnview($event)\" title='Manage column'></div>";
                    iElement.append($compile(html)($scope));
                }
            };
        }
    }
}]);
appStrapDirectives.directive("appAppliedFilters", ["$compile", "$dataModel", function ($compile, $dataModel) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='applied-filter-parent' ng-repeat='appliedFilter in view.metadata.appliedfilters' ng-show='!view.metadata.embed'>" +
            "<app-applied-filter-label class='app-float-left' style='padding-top:2px;' ng-click='appliedFilterLabelClick(appliedFilter, $event)' ng-show='!templateVisibility'> </app-applied-filter-label>" +
            '<div ng-click=\"removeFilter(appliedFilter)\" class="app-float-right app-cursor-pointer edit-filter-cross"></div>' +
            "<app-column-filter ng-init='colmetadata=appliedFilter' class='app-float-left' style='height:24px;background: none repeat scroll 0 0 #FFFFFF;' ng-show='templateVisibility'></app-column-filter>" +
            '<div ng-click=\"templateVisibility = !templateVisibility;applyfilter()\" ng-show="templateVisibility" class="app-float-left edit-filter-apply app-cursor-pointer"></div>' +
            "</div>",
        compile:function () {
            return {
                pre:function ($scope, iElement) {


                    $scope.removeFilter = function (appliedFilter) {
                        $scope.view.metadata.filter = $scope.view.metadata.filter || {};
                        $scope.view.metadata.parameters = $scope.view.metadata.parameters || {};
                        var exp = appliedFilter.expression;
                        var primaryColumn = $scope.view.metadata[PRIMARY_COLUMN];
                        var appliedFilters = $scope.view.metadata.appliedfilters;
                        var appliedFiltersCount = appliedFilters.length;
                        var applyFilterKey = appliedFilter[primaryColumn];

//                        if ($scope.view.metadata.parameters[exp]) {
//                            delete $scope.view.metadata.parameters[exp];
//                        }

                        if (appliedFiltersCount > 0) {
                            for (var i = 0; i < appliedFiltersCount; i++) {
                                var record = appliedFilters[i];
                                var key = record[primaryColumn];
                                if (key == applyFilterKey) {
                                    $scope.view.metadata.appliedfilters.splice(i, 1);

                                    $dataModel.removeFilterFromParameters(exp, $scope.view.metadata.filter);
                                    $dataModel.removeFilterFromParameters(exp, $scope.view.metadata.parameters);

                                    AppUtil.removeDottedValue($scope.view.metadata.filterparameters, exp);
                                    AppUtil.removeDottedValue($scope.view.metadata.filterparameters, exp + "_filteroperator");
                                    break;
                                }
                            }
                            $scope.applyfilter();
                        }
                    };
                    $scope.onFilterSelection = function (value, action) {
                    };
                    $scope.onFilterBlur = function (value, action) {
                    };
                }
            };
        }
    }
}]);
appStrapDirectives.directive("appAppliedFilterLabel", ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:false,
        compile:function () {
            return {
                pre:function ($scope, iElement) {
                    var toBind = "view.metadata.appliedfilterparameters[appliedFilter.expression].label";
                    var template = "<div ng-bind-template='{{appliedFilter.label + \":\" + " + toBind + " }}' class='app-applied-filter-label' ></div>";
                    $(iElement).append($compile(template)($scope));

                    $scope.appliedFilterLabelClick = function (filter, $event) {
                        if (filter.multiple) {
                            if ($scope.filterPopup) {
                                return;
                            }
                            $scope.filterview($event);
                        } else {
                            $scope.templateVisibility = !$scope.templateVisibility
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    }
                }
            };
        }
    }
}]);
appStrapDirectives.factory('$appShortMessage', function () {
    var $appShortMessage = {};
    var remove = false;
    $appShortMessage.init = function ($scope) {
        $scope.$watch('appData.shortMessage', function (newvalue, oldvalue) {
            if (!angular.equals(newvalue, oldvalue)) {
                if (newvalue.msg !== undefined) {
                    clearTimeout(remove);
                    if (newvalue.time !== undefined) {
                        remove = setTimeout(function () {
                            $scope.appData.shortMessage = {"msg":undefined};
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, newvalue.time);
                    }
                }
            }
        }, true);
    };
    return $appShortMessage;
});
