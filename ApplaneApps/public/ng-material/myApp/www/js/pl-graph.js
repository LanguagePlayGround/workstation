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
    if ($scope.graphOptions.parentSharedOptions && $scope.graphOptions.viewPosition != "right") {
        $scope.graphOptions.resize = $scope.graphOptions.resize || true;
        $scope.graphOptions.fullMode = $scope.graphOptions.fullMode || true;
    }
    var showResizeControl = $scope.graphOptions.resize !== undefined ? $scope.graphOptions.resize : false;
    if (showResizeControl) {
        $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" pl-resize class=\"pl-resize-view app-cursor-pointer pl-transform-180\"><i class=\"icon-double-angle-left\"></i></div>"});
    }
    if ($scope.graphOptions.showLabel) {
        $scope.toolBarOptions.header.center.push({template: '<span class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
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
            $scope[$scope.graphOptions.resizeV]($scope.graphOptions.viewIndex, direction);
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    if ($scope.graphOptions.parentSharedOptions || $scope.graphOptions.close) {
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
                        "                           <div class='pl-header-toolbar' ng-class='{\"left\":graphOptions.sharedOptions.viewPosition == \"left\" || graphOptions.sharedOptions.viewPosition == \"full\",\"top\":graphOptions.sharedOptions.viewPosition == \"right\"}' >" +
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
                        template += "<div style='padding: 10px;'>" +
                            "           <div pie-chart='graphOptions' id='pieChart'></div>" +
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
    $scope.graphOptions.yaxis = {field: $scope.graphOptions.yAxisField, "scale": true};
    $scope.graphOptions.width = $scope.graphOptions.width || angular.element('body').width() - 200 || 800;
    $scope.graphOptions.height = $scope.graphOptions.height || 400;
    $scope.graphOptions.margin = {left: 50};

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
                    var pie = new d3pie("pieChart", {
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
                var xaxis = scope.graphOptions.xaxis.field
                var yaxis = scope.graphOptions.yaxis.field
                var finalData = [];
                scope.getData = function () {
                    try {
                        for (var i = 0; i < data.length; i++) {
                            var coordinate = [];
                            var xAxisValue = Util.resolveDot(data[i], xaxis);
                            coordinate.push(xAxisValue);
                            var yAxisValue = Util.resolveDot(data[i], yaxis)
                            coordinate.push(yAxisValue);
                            finalData.push(coordinate);
                        }
                    } catch (e) {
                        if ($scope.handleClientError) {
                            $scope.handleClientError(e);
                        }
                    }
                }
                scope.getData();

                var margin = {top: 30, right: 30, bottom: 100, left: 30}
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
                if (scope.graphOptions.yaxis.scale != undefined && !scope.graphOptions.yaxis.scale) {
                    margin.left = 0;
                }


                var width = viewBoxWidth - margin.left - margin.right,
                    height = viewBoxHeight - margin.top - margin.bottom;


                var x = d3.scale.ordinal()
                    .rangeRoundBands([0, width], .2)
                    .domain(finalData.map(function (d) {
                        return d[0];

                    }));

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");

                var y0 = Math.max(Math.abs(d3.min(finalData, function (d) {
                    return d[1];
                })), Math.abs(d3.max(finalData, function (d) {
                    return d[1];
                })));

                var y = d3.scale.linear()
                    .range([height, 0])
                    .domain([0, d3.max(finalData, function (d) {
                        return d[1];
                    })]);

                var negativeDataCount = 0;
                for (var i = 0; i < finalData.length; i++) {
                    if (finalData[i][1] < 0) {
                        y.domain([-y0, y0]);
                        negativeDataCount += 1;
//                    break;
                    }
                    if (negativeDataCount == finalData.length) {
                        y.domain([-y0, 0])
                    }
                }


                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");
                var svg = d3.select(element[0]).append("svg")
                    .attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight)
                    .attr("preserveAspectRatio", "xMidYMid meet")
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                var bars = svg.selectAll(".bar")
                    .data(finalData)
                    .enter().append("g")
                    .attr("class", "bar");

                bars.append("rect")
                    .attr("class", function (d) {
                        return d[1] < 0 ? "bar negative" : "bar positive";
                    })
                    .attr("x", function (d, i) {
                        return x(d[0]);
                    })
                    .attr("width", x.rangeBand())
                    .attr("y", function (d) {
                        return y(Math.max(0, d[1]));
                    })
                    .attr("height", function (d) {
                        return Math.abs(y(d[1]) - y(0));
                    });


                bars.append("text")
                    .text(function (d) {
                        return d[1]
                    })
                    .attr("x", function (d) {
                        return x(d[0]) + x.rangeBand() / 2;
                    })
                    .attr("y", function (d) {
                        return d[1] < 0 ? y(d[1]) + 25 : y(d[1]) - 5
                    })
                    .attr("text-anchor", "middle")
                ;


                if (scope.graphOptions.yaxis.scale === undefined || scope.graphOptions.yaxis.scale) {
                    svg.append("g")
                        .attr("class", "y axis")
                        .call(yAxis)

                }


//
//            bars.append("g")
//                .attr("class", "x axis")
//                .attr("transform", "translate(0," + height + ")")
//                .call(xAxis);
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + y(0) + ")")
                    .call(xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", "-.55em")
                    .attr("transform", "rotate(-30)");


//            svg.append("g")
//                .attr("class", "x axis")
//                .attr("transform", "translate(0," + height + ")")
//                .call(xAxis);

            } catch (e) {
                var title = "barChart in pl.Graph";
                var message = 'Error in plGraph barChart >>>>' + e + '\n' + e.stack;
                scope.graphOptions.warningOptions.error = new Error(message + "-" + title);
            }
        }

    };

}
]);
