/***** move to app-models.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

pl.controller('plGraphCtrl', function ($scope) {

    $scope.toolBarOptions = {};
//    $scope.graphOptions.alertMessageOptions = $scope.graphOptions.alertMessageOptions || {};
    var unwatcher = {};
    if (!$scope.graphOptions.warningOptions) {
        $scope.graphOptions.warningOptions = {};
        unwatcher.warningOptions = $scope.$watch("graphOptions.warningOptions.warnings", function (newMess) {
            if ($scope.graphOptions.warningOptions && $scope.graphOptions.warningOptions.warnings && $scope.graphOptions.warningOptions.warnings.length > 0) {
                //open a popup here
                alert($scope.graphOptions.warningOptions.title + "\n" + JSON.stringify($scope.graphOptions.warningOptions.warnings));
            }
        })
    }
    $scope.graphOptions.busyMessageOptions = $scope.graphOptions.busyMessageOptions || {};
    $scope.graphOptions.style = $scope.graphOptions.style || {};
    $scope.graphOptions.style.top = '38px';
    $scope.toolBarOptions.top = {left: [], center: [], right: []};
    $scope.toolBarOptions.bottom = {left: {}, center: [], right: []};
    $scope.toolBarOptions.header = {left: {}, center: [], right: []};
    if ($scope.graphOptions.parentSharedOptions && $scope.graphOptions.sharedOptions && $scope.graphOptions.sharedOptions.resizable != false && $scope.graphOptions.viewPosition != "right") {
        $scope.graphOptions.resize = $scope.graphOptions.resize || true;
        $scope.graphOptions.fullMode = $scope.graphOptions.fullMode || true;
    }
    var showResizeControl = $scope.graphOptions.resize !== undefined ? $scope.graphOptions.resize : false;
    if (showResizeControl) {
        $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" pl-resize class=\"pl-resize-view app-cursor-pointer pl-transform-180\"><i class=\"icon-double-angle-left\"></i></div>"});
    }
    if ($scope.graphOptions.showLabel) {
        $scope.toolBarOptions.header.center.push({template: '<span style="margin-left: 0;" class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
            '   <span  ng-bind="graphOptions.label"></span>' +
            '   <span ng-if="graphOptions.primaryFieldInfo && graphOptions.primaryFieldInfo.label">' +
            '       <span>(<span ng-bind="graphOptions.primaryFieldInfo.label"></span>)</span>' +
            '   </span>' +
            '</span>'});
    }


    if ($scope.graphOptions.parentSharedOptions) {
        $scope.graphOptions.parentSharedOptions.resizable = true;
    }

    if ($scope.graphOptions.quickViewMenuGroup && $scope.graphOptions.quickViewMenuGroup.menus.length > 0) {
        $scope.toolBarOptions.top.left.push({template: "<div pl-menu-group='graphOptions.quickViewMenuGroup' ></div>"});
        $scope.toolBarOptions.header.left = $scope.graphOptions.quickViewMenuGroup;
    } else {
        $scope.toolBarOptions.header.center.push({label: $scope.graphOptions.label, showLabel: true, actionClass: 'app-float-left app-padding-five-px pl-quick-menu app-font-weight-bold'});
    }


    $scope.graphOptions.userPreferenceOptions = $scope.graphOptions.userPreferenceOptions || {};
    $scope.graphOptions.userPreferenceOptions.reload = false;
    if ($scope.graphOptions.filterColumns && $scope.graphOptions.filterColumns.length > 0) {
        $scope.graphOptions.userPreferenceOptions.filterColumns = $scope.graphOptions.filterColumns;
        $scope.graphOptions.userPreferenceOptions.filterInfo = $scope.graphOptions.filterInfo || [];
    }

    if ($scope.graphOptions.filterInfo && $scope.graphOptions.filterInfo.length > 0) {
        $scope.graphOptions.userPreferenceOptions.selectedType = "Filter";
    }
    if (!$scope.graphOptions.userPreferenceOptions.sortInfo && !$scope.graphOptions.userPreferenceOptions.filterInfo && !$scope.graphOptions.userPreferenceOptions.groupInfo) {
        $scope.graphOptions.addUserPreference = false;
    }
    if ($scope.graphOptions.addUserPreference) {
        $scope.graphOptions.style = $scope.graphOptions.style || {};
        $scope.graphOptions.style.top = '80px';
        $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":graphOptions.userPreferenceOptions.filterColumns}' pl-user-preference='graphOptions.userPreferenceOptions'></div>"});
    }

    if ($scope.graphOptions.viewControl) {
        $scope.onViewControlOptionClick = function (option) {
            try {
                if ($scope.graphOptions.onViewControl) {
                    $scope[$scope.graphOptions.onViewControl](option)
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }
        $scope.toolBarOptions.header.center.push({template: "<div pl-menu-group='graphOptions.viewControlOptions' ></div>"});
    }

    if ($scope.graphOptions.headerActions) {
        for (var i = 0; i < $scope.graphOptions.headerActions.length; i++) {
            $scope.toolBarOptions.header.center.push($scope.graphOptions.headerActions[i]);
        }
    }

    $scope.resize = function (direction) {
        try {
            if ($scope.graphOptions.resizeV && $scope.graphOptions.sharedOptions && $scope.graphOptions.sharedOptions.resizable != false) {
                $scope[$scope.graphOptions.resizeV]($scope.graphOptions.viewIndex, direction);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    if (($scope.graphOptions.parentSharedOptions && $scope.graphOptions.sharedOptions && $scope.graphOptions.sharedOptions.close != false) || $scope.graphOptions.close) {
        $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
    }

    if ($scope.graphOptions.parentSharedOptions && $scope.graphOptions.sharedOptions.viewPosition != "right") {
        $scope.resize('left');
    }

    try {
        unwatcher.reload = $scope.$watch("graphOptions.userPreferenceOptions.reload", function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue) && angular.isDefined(oldValue)) {
                $scope.populateUserPreferene($scope.graphOptions.userPreferenceOptions, true);
            }
        });
    } catch (e) {
        var title = "plGraph in pl.graph";
        var message = 'Error in plGraph >>> ' + e + '\n' + e.stack;
        $scope.graphOptions.warningOptions.error = new Error(message + "-" + title);
    }
    $scope.$on('$destroy', function ($event) {
        for (var key in unwatcher) {
            unwatcher[key]();
        }
    });
});

pl.directive('plGraph', ['$compile', function ($compile) {
    return{
        restrict: 'E',
        controller: 'plGraphCtrl',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    var template = "<div>" +
                        "                <div style='position: relative;width: 100%;'>" +
                        "                           <div style='overflow: hidden;' class='pl-header-toolbar' ng-class='{\"left\":graphOptions.sharedOptions.viewPosition == \"left\" || graphOptions.sharedOptions.viewPosition == \"full\",\"top\":graphOptions.sharedOptions.viewPosition == \"right\"}' >" +
                        "                               <pl-tool-bar-header></pl-tool-bar-header>" +
                        "                           </div>" +
                        "                    <div class='pl-toolbar' pl-tool-bar></div>" +
                        "                </div>" +
                        "           </div>" +
                        "           <div class='pl-graph-content pl-clear app-overflow-auto' ng-style='graphOptions.style'>";
                    if ($scope.graphOptions.graphType == 'bar-chart') {
                        template += "<div style='padding: 10px;'>" +
                            "           <div bar-graph='graphOptions'  />" +
                            "       </div>";
                    } else if ($scope.graphOptions.graphType == 'pie-chart') {
                        if (!$scope.graphOptions.uniqueViewId) {
                            $scope.graphOptions.uniqueViewId = 'pieChart';
                        }
                        template += "<div style='padding: 10px;'>" +
                            "           <div class='app-text-align-center' pie-chart='graphOptions' id='{{graphOptions.uniqueViewId}}'></div>" +
                            "       </div>";
                    }
                    template += '</div>';
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.controller('barGraphCtrl', ['$scope', function ($scope) {
    $scope.graphOptions = $scope.graphOptions || {};
    $scope.graphOptions.xaxis = {field: $scope.graphOptions.xAxisField};
    $scope.graphOptions.yaxis = {field: $scope.graphOptions.yAxisField};
    $scope.graphOptions.width = $scope.graphOptions.width || angular.element('body').width() - 200 || 800;
    $scope.graphOptions.height = $scope.graphOptions.height || 400;
}
]);

pl.controller('pieChartCtrl', ['$scope', function ($scope) {
    $scope.graphOptions = $scope.graphOptions || {};
    $scope.graphOptions.textOnPie = $scope.graphOptions.xAxisField;
    $scope.graphOptions.legend = true;
    $scope.graphOptions.showPercentageValue = true;
    $scope.graphOptions.arcValue = $scope.graphOptions.yAxisField;
    $scope.graphOptions.showData = {"insidePie": true, "outsidePie": true};
    $scope.graphOptions.width = $scope.graphOptions.width || angular.element('body').width() - 200 || 800;
    $scope.graphOptions.height = $scope.graphOptions.height || 800;
    $scope.graphOptions.margin = {left: 50};
}
])

pl.directive('pieChart', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        controller: 'pieChartCtrl',
        link: function (scope, element, attrs) {
            try {
                var pieData = scope.graphOptions.data;
                var textOnPie = scope.graphOptions.textOnPie;
                var arcValue = scope.graphOptions.arcValue;
                var viewId = scope.graphOptions.uniqueViewId;
                var data = [];
                scope.getData = function () {
                    try {
                        for (var i = 0; i < pieData.length; i++) {
                            var convertedData = {};
                            var pieText = Util.resolveDot(pieData[i], textOnPie);
                            convertedData.label = pieText;
                            var pieArcValue = Util.resolveDot(pieData[i], arcValue)
                            convertedData.value = pieArcValue;
                            data.push(convertedData);
                        }
                    } catch (e) {
                        if (scope.handleClientError) {
                            scope.handleClientError(e);
                        }
                    }
                }
                scope.getData();
                $timeout(function () {
                    var pie = new d3pie(viewId, {
                        "header": {
                        },
                        "footer": {
                        },
                        "size": {
                            "canvasWidth": scope.graphOptions.width,
                            "canvasHeight": scope.graphOptions.height
                        },
                        "data": {
                            "sortOrder": "value-desc",
                            "content": data
                        },
                        "labels": {
                            "outer": {
                                "pieDistance": 32
                            },
                            "inner": {
                                "hideWhenLessThanPercentage": 1
                            },
                            "mainLabel": {
                                "fontSize": 11
                            },
                            "percentage": {
                                "color": "#ffffff",
                                "decimalPlaces": 0
                            },
                            "value": {
                                "color": "#adadad",
                                "fontSize": 11
                            },
                            "lines": {
                                "enabled": true
                            }
                        },
                        "tooltips": {
                            "enabled": true,
                            "type": "placeholder",
                            "string": "{label}: {value} ({percentage}%)"
                        },
                        "effects": {
                            "pullOutSegmentOnClick": {
                                "effect": "linear",
                                "speed": 400,
                                "size": 8
                            }
                        },
                        "misc": {
                            "gradient": {
                                "enabled": true,
                                "percentage": 100
                            }
                        }
                    });
                }, 0)
            } catch (e) {
                var title = "pieChart in pl.Graph";
                var message = 'Error in plGraph pieChart >>>>' + e + '\n' + e.stack;
                scope.graphOptions.warningOptions.error = new Error(message + "-" + title);
            }
        }
    }
}]);

pl.directive('barGraph', [ function ($scope) {
    return{
        controller: 'barGraphCtrl',
        link: function (scope, element) {
            try {
                var data = scope.graphOptions.data;
                var mainKey = scope.graphOptions.xaxis.field;
                var yaxis = scope.graphOptions.yaxis.field;

                var margin = {top: 30, right: 30, bottom: 100, left: 30};
                var viewBoxWidth = element[0].offsetWidth;
                var viewBoxHeight = element[0].offsetHeight;

                if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.top != undefined) {
                    margin.top = scope.graphOptions.margin.top;
                }
                if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.left != undefined) {
                    margin.left = scope.graphOptions.margin.left;
                }
                if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.right != undefined) {
                    margin.right = scope.graphOptions.margin.right;
                }
                if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.bottom != undefined) {
                    margin.bottom = scope.graphOptions.margin.bottom;
                }
                if (scope.graphOptions.width != undefined) {
                    viewBoxWidth = scope.graphOptions.width;
                }
                if (scope.graphOptions.height != undefined) {
                    viewBoxHeight = scope.graphOptions.height;
                }

                var fontSize = scope.graphOptions.fontSize ? scope.graphOptions.fontSize : '12px';


                var width = viewBoxWidth - margin.left - margin.right,
                    height = viewBoxHeight - margin.top - margin.bottom;


                var legendWidth = undefined;
                var svgWidth = undefined;
                if (scope.graphOptions.showLegend) {
                    if (scope.graphOptions.legendWidth) {
                        svgWidth = (100 - scope.graphOptions.legendWidth) + "%";
                        legendWidth = scope.graphOptions.legendWidth + "%";
                    } else {
                        svgWidth = "70%";
                        legendWidth = "30%";
                    }
                } else {
                    svgWidth = "100%";
                }
                var showToolTip = scope.graphOptions.showToolTip;
                if (showToolTip) {
                    var tip = d3.tip()
                        .attr('class', 'd3-tip')
                        .offset([-10, 0])
                        .html(function (d, i) {
                            var label = d.mainKey ? d.mainKey : d.subKey;
                            return "<strong>" + label + " : </strong> <span style='color:red'>" + d.value + "</span>";
                        })
                }


                var barGraphType = scope.graphOptions.barGraphType;

                var duration = 1500;
                var subKeys = [];
                if (barGraphType === "grouped") {
                    subKeys = d3.keys(data[0]).filter(function (key) {
                        return (key !== mainKey && key != "_id");
                    });
                } else {
                    subKeys = [yaxis];
                }
                var y0 = 0;
                var negativeDataCount = 0;
                var y = d3.scale.linear()
                    .range([height, 0]);

                data.forEach(function (d) {
                    d.mainKeyValues = subKeys.map(function (name) {
                        if (Math.abs(d[name]) > y0) {
                            y0 = Math.abs(d[name]);
                        }
                        if (d[name] < 0) {
                            negativeDataCount += 1;
                        }
                        var valueToReturn = {subKey: name, value: d[name]};
                        if (barGraphType !== "grouped") {
                            valueToReturn.mainKey = d[mainKey];
                        }
                        return valueToReturn;
                    });
                });

                if (negativeDataCount === 0) {
                    y.domain([0, y0]);
                } else {
                    if (negativeDataCount > 0) {
                        y.domain([-y0, y0]);
                    }
                    if (negativeDataCount === data.length) {
                        y.domain([-y0, 0]);
                    }
                }


                var subKeysForColorsAndLegends = undefined;
                if (barGraphType != "grouped") {
                    subKeysForColorsAndLegends = data.map(function (d) {
                        return {mainKey: d[mainKey], value: d[yaxis]};
                    });
                }


                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");
                if (scope.graphOptions.showHorizontalGridLine) {
                    yAxis.tickSize(-width, 0, 0);
                }
//                .tickFormat("")
                yAxis.tickFormat(d3.format(".2s"));


                var tinyMode = true;
                if (scope.graphOptions.tinyMode != undefined) {
                    tinyMode = scope.graphOptions.tinyMode;
                }
                var barWidthForTinyMode = 40;
                if (tinyMode && barGraphType != "grouped" && scope.graphOptions.barWidthForTinyMode != undefined) {
                    barWidthForTinyMode = scope.graphOptions.barWidthForTinyMode;
                }
                var totalItems = data.length;
                var x0 = d3.scale.ordinal()
                    .rangeRoundBands([0, width], .1)
                    .domain(data.map(function (d) {
                        return d[mainKey];
                    }));
                if (tinyMode && barGraphType != "grouped") {
                    x0.rangeRoundBands([1, (totalItems * (barWidthForTinyMode + 10))]);
                } else {
                    x0.rangeRoundBands([0, width], .2);
                }

                var x1 = d3.scale.ordinal().domain(subKeys).rangeRoundBands([0, x0.rangeBand()]);

                var xAxis = d3.svg.axis()
                    .scale(x0)
                    .orient("bottom");


                var color = d3.scale.category20();
                if (scope.graphOptions.colors != undefined && scope.graphOptions.colors.length > 0) {
                    color = d3.scale.ordinal()
                        .range(scope.graphOptions.colors);
                }
                var svg = d3.select(element[0]).append("svg")
                    .attr('width', svgWidth)
                    .attr('style', 'float:left')
                    .attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight)
                    .attr("preserveAspectRatio", "xMidYMid meet")
                    .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                if (showToolTip) {
                    svg.call(tip);
                }

                if (scope.graphOptions.xAxisScale === undefined || scope.graphOptions.xAxisScale) {
                    svg.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(xAxis)
                        .selectAll("text")
                        .style("text-anchor", "end")
                        .style("font-size", fontSize)
                        .attr("dx", "1em")
//                        .attr("dx", "-.8em")
//                        .attr("dy", "-.55em")
//                        .attr("transform", "rotate(-30)");
                }
                if (scope.graphOptions.yAxisScale === undefined || scope.graphOptions.yAxisScale) {
                    svg.append("g")
                        .attr("class", "y axis")
                        .call(yAxis)
//                        .style("stroke-dasharray", ("3, 3"))
                        .selectAll("text")
                        .style("font-size", fontSize)
                }

                var state = svg.selectAll(".state")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "g")
                    .attr("transform", function (d) {
                        return "translate(" + x0(d[mainKey]) + ",0)";
                    });

                var bars = state.selectAll("rect")
                    .data(function (d) {
                        return d.mainKeyValues;
                    }).enter().append("g");

                var index = 0;
                var rect = bars.append("rect")
                    .style("fill", function (d) {
                        if (barGraphType === "grouped") {
                            return color(d.subKey);
                        } else {
                            var val = subKeysForColorsAndLegends[index].mainKey;
                            index += 1;
                            return color(val);
                        }
                    }).attr("y", height)
                    .attr("height", 0);
                if (showToolTip) {
                    rect.on('mouseover', tip.show)
                        .on('mouseout', tip.hide)
                }
                rect.transition()
//                    .ease('elastic')
                    .duration(duration)
                    .attr("width", function (d, i) {
                        if (tinyMode && barGraphType != "grouped") {
                            return barWidthForTinyMode;
                        } else {
                            return x1.rangeBand()
                        }
                    })
                    .attr("x", function (d, i) {
                        if (tinyMode && barGraphType != "grouped") {
                            return 1;
                        } else {
                            return x1(d.subKey);
                        }
                    }).attr("y", function (d) {
                        return y(Math.max(0, d.value));
//                        return y(d.value);
                    }).attr("height", function (d) {
                        if (negativeDataCount === 0) {
                            return height - y(d.value);
                        }
                        if (d.value > 0) {
                            return height - y(d.value) - y(0);
                        } else {
                            return y(d.value) - y(0);
                        }
                    });

                if (scope.graphOptions.showTextOnBar === undefined || scope.graphOptions.showTextOnBar) {
                    bars.append("text")
                        .text(function (d) {
                            return d.value;
                        }).attr("y", height)
                        .attr("height", 0)
                        .transition()
//                        .ease('elastic')
                        .duration(duration)
                        .attr("x", function (d) {
                            return x1(d.subKey) + x1.rangeBand() / 5;
                        }).attr("y", function (d) {
                            return  d.value >= 0 ? y(d.value) - 5 : y(d.value) + 15
                        })
                        .style("font-size", fontSize);
                }

                function legend() {
                    var legend = d3.select(element[0]).append("table").attr('class', 'legend')
                        .attr('width', legendWidth)
                    if (barGraphType === "grouped") {
                        legend.attr("style", "margin-top:" + height / 2 + "px")
                    }
                    // create one row per segment.
                    var tr = legend.append("tbody").selectAll("tr")
                        .data(barGraphType === "grouped" ? subKeys : subKeysForColorsAndLegends)
                        .enter()
                        .append("tr");

                    // create the first column for each segment.
                    tr.append("td").append("svg").attr("width", '15').attr("height", '15').append("rect")
                        .attr("width", '15').attr("height", '15')
                        .attr("fill", function (d) {
                            if (barGraphType === "grouped") {
                                return color(d);
                            } else {
                                return color(d.mainKey);
                            }
                        });

                    // create the second column for each segment.
                    tr.append("td").text(function (d) {
                        if (barGraphType === "grouped") {
                            return d;
                        } else {
                            return d.mainKey;
                        }
                    });

                    if (barGraphType !== "grouped") {
                        tr.append("td").text(function (d) {
                            return d.value;
                        });
                    }
                }

                if (scope.graphOptions.showLegend) {
                    legend();
                }


            }
            catch
                (e) {
                var title = "barChart in pl.Graph";
                var message = 'Error in plGraph barChart >>>>' + e + '\n' + e.stack;
                scope.graphOptions.warningOptions.error = new Error(message + "-" + title);
            }
        }

    };

}
]);
